import React from "react";
import { GameStats, MoveDecision } from "@/lib/types";
import { Sparkline } from "./Sparkline";
import { Zap, DollarSign, Trophy, ShieldCheck, FileJson, Activity, Hash } from "lucide-react";

interface StatsPanelProps {
  stats: GameStats;
  lastDecision: MoveDecision | null;
  onOpenJson: () => void;
  isSimulated?: boolean;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  lastDecision,
  onOpenJson,
  isSimulated = false,
}) => {
  return (
    <div className="space-y-3">
      {/* Top Banner if simulated or real */}
      <div
        className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between ${
          isSimulated
            ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              isSimulated ? "bg-amber-400" : "bg-emerald-400 animate-ping"
            }`}
          />
          <span className="font-medium">
            {isSimulated ? "Modo Demo Local (Sin API Key)" : "Conectado a Jev (TypeSafe Live API)"}
          </span>
        </div>
        <button
          onClick={onOpenJson}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-mono border border-slate-700 transition"
        >
          <FileJson className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ver JSON</span>
        </button>
      </div>

      {/* Grid of Key Metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Puntaje */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Puntaje</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-slate-100">
              {stats.score}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Récord: {stats.highScore}
            </span>
          </div>
        </div>

        {/* Costo Acumulado */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>Costo Acumulado</span>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold font-mono text-emerald-400">
              ${stats.totalCostUsd.toFixed(6)}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              $0.043 / 1M tokens ({stats.totalInputTokens} tokens)
            </span>
          </div>
        </div>
      </div>

      {/* Latencia Card con Sparkline */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Latencia del Sistema (por turno)</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-slate-400">
              Último:{" "}
              <strong className="text-cyan-300">
                {stats.currentLatencyMs} ms
              </strong>
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">
              Prom:{" "}
              <strong className="text-slate-200">
                {stats.averageLatencyMs} ms
              </strong>
            </span>
          </div>
        </div>

        {/* Sparkline Visual */}
        <div className="flex items-center justify-between pt-1">
          <Sparkline
            data={stats.latencyHistory}
            width={260}
            height={42}
            color="#06b6d4"
          />
          <div className="text-right font-mono text-[10px] text-slate-500 space-y-0.5">
            <div>Turnos: {stats.totalMoves}</div>
            <div>Velocidad: ~{(1000 / Math.max(stats.currentLatencyMs, 50)).toFixed(1)} tps</div>
          </div>
        </div>
      </div>

      {/* Correcciones del código y Confianza */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
            <span>Modo Seguro</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-rose-400">
              {stats.totalCorrections}
            </span>
            <span className="text-[10px] text-slate-500">
              intervenciones
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span>Confianza Jev</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-violet-300">
              {lastDecision
                ? `${Math.round(lastDecision.confidence * 100)}%`
                : "—"}
            </span>
            <span className="text-[10px] text-slate-500">
              {lastDecision?.confidence && lastDecision.confidence > 0.8
                ? "Alta certeza"
                : lastDecision
                ? "Moderada"
                : "En espera"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
