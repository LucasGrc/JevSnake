import React from "react";
import { MoveDecision, Direction } from "@/lib/types";
import { ShieldAlert, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Eye } from "lucide-react";
import { getDirectionSpanish } from "@/lib/game";

interface DecisionLogProps {
  decisions: MoveDecision[];
  onSelectDecision: (decision: MoveDecision) => void;
}

export const DecisionLog: React.FC<DecisionLogProps> = ({
  decisions,
  onSelectDecision,
}) => {
  const getDirIcon = (dir: Direction) => {
    switch (dir) {
      case "up":
        return <ArrowUp className="w-3.5 h-3.5" />;
      case "down":
        return <ArrowDown className="w-3.5 h-3.5" />;
      case "left":
        return <ArrowLeft className="w-3.5 h-3.5" />;
      case "right":
        return <ArrowRight className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Log de Decisiones de Jev
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-500">
          {decisions.length} decisiones
        </span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-2 space-y-2">
        {decisions.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            Sin decisiones aún. Presiona <strong className="text-emerald-400">Jugar</strong> o <strong className="text-emerald-400">Paso a Paso</strong> para que Jev comience a decidir.
          </div>
        ) : (
          decisions.map((dec) => {
            const isCorrected = dec.correctedByCode;
            const topProb = Math.round((dec.probabilities[dec.jevChoice] ?? 0) * 100);

            return (
              <div
                key={dec.turn}
                className={`p-3 rounded-xl transition border text-xs ${
                  isCorrected
                    ? "bg-amber-950/20 border-amber-500/30 hover:bg-amber-950/30"
                    : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40"
                }`}
              >
                {/* Header de la decisión */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-slate-400 border border-slate-700">
                      #{dec.turn}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {dec.latencyMs} ms
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400/90">
                      Conf: {Math.round(dec.confidence * 100)}%
                    </span>
                  </div>

                  <button
                    onClick={() => onSelectDecision(dec)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[10px] transition border border-slate-700"
                    title="Ver JSON de esta decisión"
                  >
                    <Eye className="w-3 h-3" />
                    <span>JSON</span>
                  </button>
                </div>

                {/* Banner de corrección si aplica */}
                {isCorrected && (
                  <div className="flex items-start gap-1.5 mb-2 p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <span className="font-semibold text-rose-400">
                        ¡Corregido por el código!
                      </span>{" "}
                      {dec.correctionReason ||
                        `Jev eligió '${getDirectionSpanish(dec.jevChoice)}' (mortal). El código desvió hacia '${getDirectionSpanish(dec.finalChoice)}'.`}
                    </div>
                  </div>
                )}

                {/* Resumen semántico evaluado */}
                <div className="mb-2 text-[11px] text-slate-400 font-sans leading-snug">
                  <span className="text-slate-500">Estado:</span> {dec.semanticState.resumen_situacion}
                </div>

                {/* Elección y Probabilidades de Jev */}
                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      Elección Jev:
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-medium">
                        {getDirIcon(dec.jevChoice)}
                        {getDirectionSpanish(dec.jevChoice)} ({topProb}%)
                      </span>
                    </span>

                    {isCorrected && (
                      <span className="text-amber-400 flex items-center gap-1 font-medium font-mono text-[10px]">
                        Ejecutado: {getDirectionSpanish(dec.finalChoice)}
                      </span>
                    )}
                  </div>

                  {/* Barras de distribución de probabilidades */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1.5">
                    {(["up", "down", "left", "right"] as Direction[]).map((d) => {
                      const prob = Math.round((dec.probabilities[d] ?? 0) * 100);
                      const isChosen = dec.finalChoice === d;
                      const isJevChosen = dec.jevChoice === d;
                      return (
                        <div
                          key={d}
                          className={`p-1 rounded text-center font-mono text-[10px] border ${
                            isChosen
                              ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-bold"
                              : isJevChosen && isCorrected
                              ? "bg-rose-500/15 border-rose-500/30 text-rose-300 line-through"
                              : "bg-slate-900 border-slate-800 text-slate-400"
                          }`}
                        >
                          <div className="flex items-center justify-center gap-0.5">
                            {getDirIcon(d)}
                            <span>{prob}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
