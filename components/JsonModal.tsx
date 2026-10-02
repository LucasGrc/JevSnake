import React, { useState } from "react";
import { Copy, Check, X, Code2, Server } from "lucide-react";
import { TypeSafeSystemOneRequest, TypeSafeSystemOneResponse } from "@/lib/types";

interface JsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestPayload: TypeSafeSystemOneRequest | null;
  rawResponse: TypeSafeSystemOneResponse | null;
  latencyMs: number;
}

export const JsonModal: React.FC<JsonModalProps> = ({
  isOpen,
  onClose,
  requestPayload,
  rawResponse,
  latencyMs,
}) => {
  const [activeTab, setActiveTab] = useState<"request" | "response">("request");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const contentToDisplay =
    activeTab === "request"
      ? JSON.stringify(requestPayload, null, 2)
      : JSON.stringify(rawResponse, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(contentToDisplay);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Inspección de Carga JSON TypeSafe
                {latencyMs > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700">
                    {latencyMs} ms
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Petición exacta y respuesta del endpoint TypeSafe System One
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs & Copy Action */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("request")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "request"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              Request Payload (Estado y Pregunta Choice)
            </button>
            <button
              onClick={() => setActiveTab("response")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === "response"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Response Payload (Decisión y Probabilidades)
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar JSON</span>
              </>
            )}
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-auto p-5 font-mono text-xs bg-slate-950/90 text-slate-300 leading-relaxed">
          {contentToDisplay ? (
            <pre className="whitespace-pre-wrap break-all">{contentToDisplay}</pre>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">
              Aún no se ha realizado ninguna petición a TypeSafe. Inicia el juego o avanza un turno.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/50 text-[11px] text-slate-400">
          <span>Endpoint: https://api.typesafe.ai/v1/systemone (modelo: jev-latest)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
