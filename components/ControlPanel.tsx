import React from "react";
import { GameMode, GameStatus } from "@/lib/types";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  Bot,
  Keyboard,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

interface ControlPanelProps {
  status: GameStatus;
  mode: GameMode;
  safeModeEnabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStep: () => void;
  onReset: () => void;
  onToggleMode: (mode: GameMode) => void;
  onToggleSafeMode: () => void;
  speedDelay: number;
  onSpeedDelayChange: (delay: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  mode,
  safeModeEnabled,
  onPlay,
  onPause,
  onStep,
  onReset,
  onToggleMode,
  onToggleSafeMode,
  speedDelay,
  onSpeedDelayChange,
}) => {
  const isPlaying = status === "playing";

  return (
    <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur-sm space-y-3">
      {/* Botones principales de acción */}
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <button
            onClick={onPause}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-amber-500/20 active:scale-[0.98]"
          >
            <Pause className="w-4 h-4 fill-current" />
            <span>Pausar</span>
          </button>
        ) : (
          <button
            onClick={onPlay}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{status === "idle" ? "Iniciar Juego" : "Reanudar"}</span>
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isPlaying}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl border text-sm font-medium transition ${
            isPlaying
              ? "opacity-40 cursor-not-allowed bg-slate-800/40 border-slate-800 text-slate-500"
              : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 active:scale-[0.98]"
          }`}
          title="Ejecutar un solo tick (Paso a paso)"
        >
          <StepForward className="w-4 h-4 text-cyan-400" />
          <span>Paso</span>
        </button>

        <button
          onClick={onReset}
          className="flex items-center justify-center p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-rose-400 transition active:scale-[0.98]"
          title="Reiniciar partida"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Modo de Juego (IA Jev vs Manual Humano) */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleMode("auto")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === "auto"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Jev (Auto)</span>
          </button>

          <button
            onClick={() => onToggleMode("manual")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === "manual"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Manual (Teclado)</span>
          </button>
        </div>

        {/* Toggle Modo Seguro */}
        <button
          onClick={onToggleSafeMode}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
            safeModeEnabled
              ? "bg-emerald-950/30 text-emerald-300 border-emerald-500/30"
              : "bg-rose-950/30 text-rose-300 border-rose-500/30"
          }`}
          title="Modo Seguro: si Jev elige una opción mortal, el código interviene"
        >
          {safeModeEnabled ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Modo Seguro: Activo</span>
            </>
          ) : (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Modo Seguro: Desactivado</span>
            </>
          )}
        </button>
      </div>

      {/* Delay adicional de tick */}
      <div className="flex items-center justify-between px-1 text-xs text-slate-400">
        <label htmlFor="speed-slider" className="text-[11px]">
          Pausa extra entre ticks: <span className="font-mono text-slate-200">{speedDelay} ms</span>
        </label>
        <span className="text-[10px] text-slate-500">
          (La latencia de Jev ya marca el ritmo)
        </span>
      </div>
      <input
        id="speed-slider"
        type="range"
        min={0}
        max={600}
        step={25}
        value={speedDelay}
        onChange={(e) => onSpeedDelayChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );
};
