"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Coordinates,
  Direction,
  GameMode,
  GameStats,
  GameStatus,
  MoveDecision,
} from "@/lib/types";
import {
  GRID_SIZE,
  buildSemanticState,
  buildChoiceQuestion,
  evaluateSafetyAndCorrect,
  isOppositeDirection,
} from "@/lib/game";
import { SnakeCanvas } from "@/components/SnakeCanvas";
import { StatsPanel } from "@/components/StatsPanel";
import { ControlPanel } from "@/components/ControlPanel";
import { DecisionLog } from "@/components/DecisionLog";
import { JsonModal } from "@/components/JsonModal";
import { Brain, Cpu, ExternalLink, AlertCircle } from "lucide-react";

export default function JevSnakePage() {
  // Game Board State
  const [snake, setSnake] = useState<Coordinates[]>([
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 6, y: 8 },
  ]);
  const [food, setFood] = useState<Coordinates>({ x: 12, y: 8 });
  const [currentDirection, setCurrentDirection] = useState<Direction>("right");

  // Lifecycle & Mode
  const [status, setStatus] = useState<GameStatus>("idle");
  const [mode, setMode] = useState<GameMode>("auto");
  const [safeModeEnabled, setSafeModeEnabled] = useState<boolean>(true);
  const [speedDelay, setSpeedDelay] = useState<number>(50);

  // Decision & Metrics
  const [lastDecision, setLastDecision] = useState<MoveDecision | null>(null);
  const [decisions, setDecisions] = useState<MoveDecision[]>([]);
  const [selectedDecisionForJson, setSelectedDecisionForJson] =
    useState<MoveDecision | null>(null);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState<boolean>(false);
  const [turnCounter, setTurnCounter] = useState<number>(0);
  const [isSimulatedMode, setIsSimulatedMode] = useState<boolean>(false);
  const [apiErrorNotice, setApiErrorNotice] = useState<string | null>(null);

  // Overall Statistics
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    highScore: 0,
    applesEaten: 0,
    totalMoves: 0,
    totalCorrections: 0,
    currentLatencyMs: 0,
    averageLatencyMs: 0,
    latencyHistory: [],
    totalInputTokens: 0,
    totalCostUsd: 0,
  });

  // Turn execution lock and refs to prevent stale closures
  const isExecutingRef = useRef<boolean>(false);
  const statusRef = useRef<GameStatus>(status);
  statusRef.current = status;

  const modeRef = useRef<GameMode>(mode);
  modeRef.current = mode;

  const safeModeRef = useRef<boolean>(safeModeEnabled);
  safeModeRef.current = safeModeEnabled;

  const snakeRef = useRef<Coordinates[]>(snake);
  snakeRef.current = snake;

  const foodRef = useRef<Coordinates>(food);
  foodRef.current = food;

  const currentDirectionRef = useRef<Direction>(currentDirection);
  currentDirectionRef.current = currentDirection;

  const speedDelayRef = useRef<number>(speedDelay);
  speedDelayRef.current = speedDelay;

  const turnCounterRef = useRef<number>(turnCounter);
  turnCounterRef.current = turnCounter;

  // Helper to generate a random food location not on snake
  const spawnFood = useCallback((currentSnake: Coordinates[]): Coordinates => {
    let newFood: Coordinates;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      currentSnake.some((s) => s.x === newFood.x && s.y === newFood.y) &&
      attempts < 100
    );
    return newFood;
  }, []);

  // Main turn-based execution
  const executeTick = useCallback(
    async (manualDir?: Direction) => {
      if (isExecutingRef.current) return;
      if (statusRef.current === "game_over") return;

      isExecutingRef.current = true;

      try {
        const curSnake = snakeRef.current;
        const curHead = curSnake[0];
        const curFood = foodRef.current;
        const curDir = currentDirectionRef.current;

        let nextDirection: Direction = curDir;
        let decisionRecord: MoveDecision | null = null;

        if (modeRef.current === "auto") {
          // 1. Calcular estado semántico en código (sin coordenadas crudas)
          const semanticState = buildSemanticState(
            curHead,
            curSnake,
            curFood,
            curDir,
            GRID_SIZE
          );

          // 2. Construir la pregunta Choice para TypeSafe
          const choiceQuestion = buildChoiceQuestion(
            semanticState,
            curHead,
            curFood,
            curDir
          );

          // 3. Consultar Route Handler server-side (app/api/move)
          const startTime = performance.now();
          const response = await fetch("/api/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              state: semanticState,
              questions: {
                move: choiceQuestion,
              },
            }),
          });

          const latencyMs = Math.round(performance.now() - startTime);

          if (!response.ok) {
            const errBody = await response.text();
            console.error("Error al consultar /api/move:", errBody);
            setApiErrorNotice(`Error en servidor (${response.status}): ${errBody}`);
            isExecutingRef.current = false;
            return;
          }

          const data = await response.json();

          if (data.apiError) {
            setApiErrorNotice(
              `Aviso TypeSafe (${data.apiError.status}): ${data.apiError.message}. Modo fallback semántico activado.`
            );
            setIsSimulatedMode(true);
          } else if (data.isSimulated) {
            setIsSimulatedMode(true);
          }

          const jevChoice: Direction = data.chosenDirection;
          const probs: Record<Direction, number> = data.probabilities;
          const confidence: number = data.confidence;

          // 4. Modo Seguro: El código tiene la última palabra
          let finalChoice = jevChoice;
          let corrected = false;
          let correctionReason = "";

          if (safeModeRef.current) {
            const safety = evaluateSafetyAndCorrect(
              jevChoice,
              probs,
              semanticState.vecinos,
              curDir
            );
            finalChoice = safety.finalChoice;
            corrected = safety.correctedByCode;
            correctionReason = safety.correctionReason || "";
          }

          nextDirection = finalChoice;

          const nextTurn = turnCounterRef.current + 1;
          turnCounterRef.current = nextTurn;
          setTurnCounter(nextTurn);

          decisionRecord = {
            turn: nextTurn,
            timestamp: Date.now(),
            semanticState,
            jevChoice,
            finalChoice,
            correctedByCode: corrected,
            correctionReason,
            probabilities: probs,
            confidence,
            latencyMs: data.latencyMs || latencyMs,
            inputTokens: data.usage?.input_tokens ?? 140,
            outputTokens: data.usage?.output_tokens ?? 25,
            costUsd: data.costUsd ?? 0.000006,
            requestPayload: data.requestPayload,
            rawResponse: data.rawResponse,
            isSimulated: data.isSimulated,
          };

          setLastDecision(decisionRecord);
          setDecisions((prev) => [decisionRecord!, ...prev.slice(0, 49)]);

          // Actualizar estadísticas del sistema
          setStats((prev) => {
            const newTotalMoves = prev.totalMoves + 1;
            const newCorrections = corrected
              ? prev.totalCorrections + 1
              : prev.totalCorrections;
            const history = [
              ...prev.latencyHistory,
              decisionRecord!.latencyMs,
            ].slice(-30);
            const avg = Math.round(
              history.reduce((a, b) => a + b, 0) / history.length
            );

            return {
              ...prev,
              totalMoves: newTotalMoves,
              totalCorrections: newCorrections,
              currentLatencyMs: decisionRecord!.latencyMs,
              averageLatencyMs: avg,
              latencyHistory: history,
              totalInputTokens:
                prev.totalInputTokens + decisionRecord!.inputTokens,
              totalCostUsd: prev.totalCostUsd + decisionRecord!.costUsd,
            };
          });
        } else {
          // Modo Manual (control humano)
          if (manualDir && !isOppositeDirection(manualDir, curDir)) {
            nextDirection = manualDir;
          } else {
            nextDirection = curDir;
          }

          setStats((prev) => ({
            ...prev,
            totalMoves: prev.totalMoves + 1,
          }));
        }

        // 5. Aplicar el movimiento en la rejilla
        setCurrentDirection(nextDirection);
        currentDirectionRef.current = nextDirection;

        const newHead: Coordinates = {
          x:
            nextDirection === "left"
              ? curHead.x - 1
              : nextDirection === "right"
              ? curHead.x + 1
              : curHead.x,
          y:
            nextDirection === "up"
              ? curHead.y - 1
              : nextDirection === "down"
              ? curHead.y + 1
              : curHead.y,
        };

        // 6. Verificar colisión con paredes
        const hitsWall =
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE;

        // Verificar colisión con el cuerpo (excluyendo la cola que se moverá a menos que coma manzana)
        const willEat = newHead.x === curFood.x && newHead.y === curFood.y;
        const bodyToCheck = willEat ? curSnake : curSnake.slice(0, -1);
        const hitsBody = bodyToCheck.some(
          (seg) => seg.x === newHead.x && seg.y === newHead.y
        );

        if (hitsWall || hitsBody) {
          setStatus("game_over");
          statusRef.current = "game_over";
          isExecutingRef.current = false;
          return;
        }

        // 7. Avanzar cuerpo
        const newSnake = [newHead, ...curSnake];

        if (willEat) {
          const spawned = spawnFood(newSnake);
          setFood(spawned);
          foodRef.current = spawned;

          setStats((prev) => {
            const newScore = prev.score + 10;
            return {
              ...prev,
              score: newScore,
              highScore: Math.max(prev.highScore, newScore),
              applesEaten: prev.applesEaten + 1,
            };
          });
        } else {
          newSnake.pop();
        }

        setSnake(newSnake);
        snakeRef.current = newSnake;

        // 8. Si sigue en modo "playing", encadenar el siguiente turno
        if (statusRef.current === "playing") {
          const delay =
            modeRef.current === "auto"
              ? speedDelayRef.current
              : Math.max(160, 160 + speedDelayRef.current);

          setTimeout(() => {
            isExecutingRef.current = false;
            if (statusRef.current === "playing") {
              executeTick();
            }
          }, delay);
        } else {
          isExecutingRef.current = false;
        }
      } catch (err) {
        console.error("Error en tick:", err);
        isExecutingRef.current = false;
      }
    },
    [spawnFood]
  );

  // Manejo de Play / Pause
  const handlePlay = useCallback(() => {
    if (statusRef.current === "game_over") return;
    setStatus("playing");
    statusRef.current = "playing";
    if (!isExecutingRef.current) {
      executeTick();
    }
  }, [executeTick]);

  const handlePause = useCallback(() => {
    setStatus("paused");
    statusRef.current = "paused";
  }, []);

  const handleStep = useCallback(() => {
    if (statusRef.current !== "playing") {
      executeTick();
    }
  }, [executeTick]);

  const handleReset = useCallback(() => {
    setStatus("idle");
    statusRef.current = "idle";
    const initialSnake: Coordinates[] = [
      { x: 8, y: 8 },
      { x: 7, y: 8 },
      { x: 6, y: 8 },
    ];
    setSnake(initialSnake);
    snakeRef.current = initialSnake;
    setCurrentDirection("right");
    currentDirectionRef.current = "right";

    const newFood = spawnFood(initialSnake);
    setFood(newFood);
    foodRef.current = newFood;

    setLastDecision(null);
    setDecisions([]);
    setTurnCounter(0);
    turnCounterRef.current = 0;
    isExecutingRef.current = false;

    setStats((prev) => ({
      ...prev,
      score: 0,
      applesEaten: 0,
      totalMoves: 0,
      totalCorrections: 0,
      currentLatencyMs: 0,
      latencyHistory: [],
    }));
  }, [spawnFood]);

  // Control manual con teclado (Flechas o WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let requestedDir: Direction | null = null;
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") requestedDir = "up";
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") requestedDir = "down";
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") requestedDir = "left";
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") requestedDir = "right";

      if (e.key === " " && statusRef.current !== "game_over") {
        e.preventDefault();
        if (statusRef.current === "playing") handlePause();
        else handlePlay();
        return;
      }

      if (requestedDir) {
        e.preventDefault();
        if (modeRef.current === "manual") {
          // Ignorar reversa directa de 180°
          if (isOppositeDirection(requestedDir, currentDirectionRef.current)) {
            return;
          }
          currentDirectionRef.current = requestedDir;
          setCurrentDirection(requestedDir);

          // Si está en pausa o idle, avanzar 1 tick manualmente con la tecla presionada
          if (statusRef.current !== "playing") {
            executeTick(requestedDir);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [executeTick, handlePause, handlePlay]);

  return (
    <main className="min-h-screen p-4 md:p-8 flex flex-col max-w-7xl mx-auto">
      {/* Navbar Superior */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-400 text-slate-950 shadow-lg shadow-emerald-500/20">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Jev Snake
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-normal">
                  TypeSafe System One
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Snake autónomo donde el modelo <strong className="text-slate-200">Jev</strong> evalúa el estado semántico en cada turno.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modelo:</span>
            <strong className="text-slate-200 font-mono">jev-latest</strong>
          </div>
          <a
            href="https://docs.typesafe.ai"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition"
          >
            <span>TypeSafe Docs</span>
            <ExternalLink className="w-3 h-3 text-slate-500" />
          </a>
        </div>
      </header>

      {/* Banner de Aviso de API / Créditos si aplica */}
      {apiErrorNotice && (
        <div className="mb-4 flex items-center justify-between p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{apiErrorNotice}</span>
          </div>
          <button
            onClick={() => setApiErrorNotice(null)}
            className="px-2 py-0.5 rounded text-[11px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 transition"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Grid Principal del Juego */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Columna Izquierda: Canvas del Juego y Controles */}
        <div className="lg:col-span-7 space-y-4">
          <SnakeCanvas
            snake={snake}
            food={food}
            currentDirection={currentDirection}
            lastDecision={lastDecision}
            status={status}
            safeModeEnabled={safeModeEnabled}
            onRestart={handleReset}
          />

          <ControlPanel
            status={status}
            mode={mode}
            safeModeEnabled={safeModeEnabled}
            onPlay={handlePlay}
            onPause={handlePause}
            onStep={handleStep}
            onReset={handleReset}
            onToggleMode={(newMode) => {
              setMode(newMode);
              modeRef.current = newMode;
              if (status === "playing") {
                handlePause();
              }
            }}
            onToggleSafeMode={() => setSafeModeEnabled(!safeModeEnabled)}
            speedDelay={speedDelay}
            onSpeedDelayChange={setSpeedDelay}
          />
        </div>

        {/* Columna Derecha: Panel de Estadísticas y Log de Decisiones */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-full">
          <StatsPanel
            stats={stats}
            lastDecision={lastDecision}
            onOpenJson={() => {
              setSelectedDecisionForJson(lastDecision);
              setIsJsonModalOpen(true);
            }}
            isSimulated={isSimulatedMode}
          />

          <div className="h-[430px]">
            <DecisionLog
              decisions={decisions}
              onSelectDecision={(dec) => {
                setSelectedDecisionForJson(dec);
                setIsJsonModalOpen(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal de Inspección JSON */}
      <JsonModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        requestPayload={selectedDecisionForJson?.requestPayload ?? null}
        rawResponse={selectedDecisionForJson?.rawResponse ?? null}
        latencyMs={selectedDecisionForJson?.latencyMs ?? 0}
      />
    </main>
  );
}
