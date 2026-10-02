import React, { useRef, useEffect } from "react";
import { Coordinates, Direction, GameStatus, MoveDecision } from "@/lib/types";
import { GRID_SIZE, getDirectionSpanish } from "@/lib/game";
import { ShieldAlert, AlertTriangle } from "lucide-react";

interface SnakeCanvasProps {
  snake: Coordinates[];
  food: Coordinates;
  currentDirection: Direction;
  lastDecision: MoveDecision | null;
  status: GameStatus;
  safeModeEnabled: boolean;
  onRestart: () => void;
}

export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  snake,
  food,
  currentDirection,
  lastDecision,
  status,
  safeModeEnabled,
  onRestart,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Support High-DPI screens
    const dpr = window.devicePixelRatio || 1;
    const width = 540;
    const height = 540;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);

    const cellSize = width / GRID_SIZE;

    // 1. Draw Board Background
    ctx.fillStyle = "#0c1322";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid lines
    ctx.strokeStyle = "rgba(30, 41, 59, 0.4)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(width, i * cellSize);
      ctx.stroke();
    }

    const head = snake[0] || { x: 8, y: 8 };

    // 2. Confidence Halo around the snake's head
    if (lastDecision) {
      const confidence = Math.max(0.1, Math.min(1.0, lastDecision.confidence));
      const headCenterX = (head.x + 0.5) * cellSize;
      const headCenterY = (head.y + 0.5) * cellSize;
      const haloRadius = cellSize * (1.2 + confidence * 1.5);

      const haloGrad = ctx.createRadialGradient(
        headCenterX,
        headCenterY,
        cellSize * 0.4,
        headCenterX,
        headCenterY,
        haloRadius
      );

      const haloColor = lastDecision.correctedByCode
        ? `rgba(245, 158, 11, ${0.15 + confidence * 0.35})`
        : `rgba(16, 185, 129, ${0.15 + confidence * 0.35})`;

      haloGrad.addColorStop(0, haloColor);
      haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(headCenterX, headCenterY, haloRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Draw Food (pulsing apple)
    const foodCenterX = (food.x + 0.5) * cellSize;
    const foodCenterY = (food.y + 0.5) * cellSize;
    const foodRadius = (cellSize / 2) * 0.75;

    // Food glow
    const foodGlow = ctx.createRadialGradient(
      foodCenterX,
      foodCenterY,
      foodRadius * 0.3,
      foodCenterX,
      foodCenterY,
      foodRadius * 2.2
    );
    foodGlow.addColorStop(0, "rgba(244, 63, 94, 0.6)");
    foodGlow.addColorStop(1, "rgba(244, 63, 94, 0)");
    ctx.fillStyle = foodGlow;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, foodRadius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Food core
    ctx.fillStyle = "#f43f5e";
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    // Food leaf / stem
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.ellipse(
      foodCenterX + 3,
      foodCenterY - foodRadius + 1,
      3,
      1.5,
      Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // 4. Draw Snake Body
    for (let i = snake.length - 1; i >= 1; i--) {
      const segment = snake[i];
      const segX = segment.x * cellSize + 2;
      const segY = segment.y * cellSize + 2;
      const segSize = cellSize - 4;
      const progress = i / snake.length;

      // Color gradation from head to tail
      const r = Math.round(16 + progress * 10);
      const g = Math.round(185 - progress * 40);
      const b = Math.round(129 + progress * 60);

      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      drawRoundedRect(ctx, segX, segY, segSize, segSize, 4);
      ctx.fill();
    }

    // 5. Draw Snake Head
    const headX = head.x * cellSize + 1.5;
    const headY = head.y * cellSize + 1.5;
    const headSize = cellSize - 3;

    ctx.fillStyle = lastDecision?.correctedByCode ? "#f59e0b" : "#10b981";
    drawRoundedRect(ctx, headX, headY, headSize, headSize, 6);
    ctx.fill();

    ctx.strokeStyle = "#34d399";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Eyes on head oriented by direction
    ctx.fillStyle = "#022c22";
    const eyeRadius = cellSize * 0.1;
    let eye1X = headX + headSize * 0.3;
    let eye1Y = headY + headSize * 0.3;
    let eye2X = headX + headSize * 0.7;
    let eye2Y = headY + headSize * 0.3;

    if (currentDirection === "down") {
      eye1Y = headY + headSize * 0.7;
      eye2Y = headY + headSize * 0.7;
    } else if (currentDirection === "left") {
      eye1X = headX + headSize * 0.3;
      eye1Y = headY + headSize * 0.3;
      eye2X = headX + headSize * 0.3;
      eye2Y = headY + headSize * 0.7;
    } else if (currentDirection === "right") {
      eye1X = headX + headSize * 0.7;
      eye1Y = headY + headSize * 0.3;
      eye2X = headX + headSize * 0.7;
      eye2Y = headY + headSize * 0.7;
    }

    ctx.beginPath();
    ctx.arc(eye1X, eye1Y, eyeRadius, 0, Math.PI * 2);
    ctx.arc(eye2X, eye2Y, eyeRadius, 0, Math.PI * 2);
    ctx.fill();

    // 6. Draw the 4 Directional Arrows around the Snake Head
    // Size and opacity reflect the probability of each direction from Jev!
    if (lastDecision) {
      const probs = lastDecision.probabilities;
      const headCenterX = (head.x + 0.5) * cellSize;
      const headCenterY = (head.y + 0.5) * cellSize;

      const directions: { dir: Direction; angle: number; dx: number; dy: number }[] = [
        { dir: "up", angle: -Math.PI / 2, dx: 0, dy: -cellSize * 1.15 },
        { dir: "down", angle: Math.PI / 2, dx: 0, dy: cellSize * 1.15 },
        { dir: "left", angle: Math.PI, dx: -cellSize * 1.15, dy: 0 },
        { dir: "right", angle: 0, dx: cellSize * 1.15, dy: 0 },
      ];

      for (const item of directions) {
        const p = probs[item.dir] ?? 0;
        const isChosen = lastDecision.finalChoice === item.dir;
        const isJevChoice = lastDecision.jevChoice === item.dir;
        const isMortal =
          lastDecision.semanticState.vecinos[
            item.dir === "up"
              ? "arriba"
              : item.dir === "down"
              ? "abajo"
              : item.dir === "left"
              ? "izquierda"
              : "derecha"
          ] !== "libre";

        // Size scale based on probability (min 10px, max 26px)
        const arrowLength = 10 + p * 20;
        const arrowWidth = 7 + p * 12;
        const opacity = Math.max(0.18, Math.min(0.98, 0.2 + p * 0.8));

        const targetX = headCenterX + item.dx;
        const targetY = headCenterY + item.dy;

        // Skip if outside canvas
        if (targetX < 4 || targetX > width - 4 || targetY < 4 || targetY > height - 4) {
          continue;
        }

        ctx.save();
        ctx.translate(targetX, targetY);
        ctx.rotate(item.angle);

        // Color based on status
        let fillColor = `rgba(148, 163, 184, ${opacity})`; // Default slate
        if (isMortal) {
          fillColor = `rgba(239, 68, 68, ${Math.max(0.3, opacity)})`; // Mortal red
        } else if (isChosen) {
          fillColor = `rgba(16, 185, 129, ${Math.max(0.85, opacity)})`; // Active chosen green
        } else if (p > 0.3) {
          fillColor = `rgba(6, 182, 212, ${opacity})`; // High probability cyan
        }

        ctx.fillStyle = fillColor;

        // Draw directional triangle arrow
        ctx.beginPath();
        ctx.moveTo(arrowLength * 0.6, 0);
        ctx.lineTo(-arrowLength * 0.4, -arrowWidth * 0.5);
        ctx.lineTo(-arrowLength * 0.2, 0);
        ctx.lineTo(-arrowLength * 0.4, arrowWidth * 0.5);
        ctx.closePath();
        ctx.fill();

        if (isChosen || (isJevChoice && isMortal)) {
          ctx.strokeStyle = isMortal ? "#f87171" : "#34d399";
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        ctx.restore();

        // Draw percentage text near arrow
        ctx.font = "9px monospace";
        ctx.fillStyle = isChosen ? "#34d399" : isMortal ? "#f87171" : "rgba(148, 163, 184, 0.8)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        const textOffsetX = item.dx !== 0 ? (item.dx > 0 ? 12 : -12) : 0;
        const textOffsetY = item.dy !== 0 ? (item.dy > 0 ? 12 : -12) : 0;
        ctx.fillText(
          `${Math.round(p * 100)}%`,
          targetX + textOffsetX,
          targetY + textOffsetY
        );
      }
    }
  }, [snake, food, currentDirection, lastDecision, status]);

  return (
    <div className="relative flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
      {/* Aviso flotante de Corrección por el Código */}
      {lastDecision?.correctedByCode && (
        <div className="absolute top-5 inset-x-6 z-20 flex items-center justify-between p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs shadow-lg backdrop-blur-md animate-correction-glow">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <strong className="text-amber-300 font-semibold">
                Corregido por el código
              </strong>
              <div className="text-[11px] text-amber-200/90">
                Jev eligió{" "}
                <span className="font-mono underline font-bold">
                  {getDirectionSpanish(lastDecision.jevChoice)}
                </span>{" "}
                (mortal) → Redirigido a{" "}
                <span className="font-mono font-bold text-emerald-400">
                  {getDirectionSpanish(lastDecision.finalChoice)}
                </span>
              </div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] border border-amber-500/30">
            Modo Seguro
          </span>
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="rounded-xl shadow-inner border border-slate-800/80 bg-[#0c1322]"
      />

      {/* Indicador inferior de Modo Seguro */}
      <div className="w-full flex items-center justify-between pt-2.5 px-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              safeModeEnabled ? "bg-emerald-400" : "bg-rose-400"
            }`}
          />
          <span>
            {safeModeEnabled
              ? "Modo seguro activo (código evita decisiones suicidas)"
              : "Modo seguro apagado (Jev tiene control total sin red)"}
          </span>
        </div>
        <span className="font-mono text-slate-500">
          Rejilla {GRID_SIZE}x{GRID_SIZE}
        </span>
      </div>

      {/* Modal de Game Over */}
      {status === "game_over" && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center rounded-2xl bg-black/85 backdrop-blur-sm p-6 text-center animate-in fade-in duration-200">
          <div className="p-3 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 mb-3">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-1">Juego Terminado</h3>
          <p className="text-xs text-slate-400 max-w-xs mb-4">
            La serpiente no pudo evitar colisionar. Puedes volver a intentarlo o ajustar la estrategia.
          </p>
          <button
            onClick={onRestart}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20"
          >
            Jugar de Nuevo
          </button>
        </div>
      )}
    </div>
  );
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
