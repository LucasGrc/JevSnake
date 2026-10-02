import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 160,
  height = 36,
  color = "#10b981",
}) => {
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500 font-mono"
        style={{ width, height }}
      >
        Recolectando datos...
      </div>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max === min ? 1 : max - min;
  const padding = 4;
  const drawWidth = width - padding * 2;
  const drawHeight = height - padding * 2;

  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * drawWidth;
    const y = padding + drawHeight - ((val - min) / range) * drawHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(" L ")}`;

  // Area fill
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaD = `M ${firstPoint} L ${points.join(" L ")} L ${
    lastPoint.split(",")[0]
  },${height - padding} L ${padding},${height - padding} Z`;

  return (
    <svg
      width={width}
      height={height}
      className="overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#sparkline-gradient)" />
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current point indicator */}
      {points.length > 0 && (
        <circle
          cx={lastPoint.split(",")[0]}
          cy={lastPoint.split(",")[1]}
          r="2.5"
          fill={color}
        />
      )}
    </svg>
  );
};
