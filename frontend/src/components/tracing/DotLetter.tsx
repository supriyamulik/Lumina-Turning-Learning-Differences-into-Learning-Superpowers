import React from 'react';
import type { Dot } from '../../data/dotPaths';

interface DotLetterProps {
  dots: Dot[];
  currentTargetId: number;
  completedIds: number[];
  canvasSize: number;
}

const DotLetter: React.FC<DotLetterProps> = ({
  dots,
  currentTargetId,
  completedIds,
  canvasSize,
}) => {
  return (
    <svg
      width={canvasSize}
      height={canvasSize}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ zIndex: 2 }}
    >
      {/* Draw lines between completed dots */}
      {completedIds.map((id, i) => {
        if (i === 0) return null;
        const from = dots[completedIds[i - 1]];
        const to = dots[id];
        return (
          <line
            key={`line-${i}`}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#22C55E"
            strokeWidth={4}
            strokeLinecap="round"
          />
        );
      })}

      {/* Draw dashed guide lines between all dots */}
      {dots.map((dot, i) => {
        if (i === 0) return null;
        const prev = dots[i - 1];
        return (
          <line
            key={`guide-${i}`}
            x1={prev.x}
            y1={prev.y}
            x2={dot.x}
            y2={dot.y}
            stroke="#CBD5E1"
            strokeWidth={2}
            strokeDasharray="6,4"
          />
        );
      })}

      {/* Draw dots */}
      {dots.map((dot) => {
        const isCompleted = completedIds.includes(dot.id);
        const isTarget = dot.id === currentTargetId;
        return (
          <g key={dot.id}>
            <circle
              cx={dot.x}
              cy={dot.y}
              r={isTarget ? 18 : 12}
              fill={
                isCompleted
                  ? '#22C55E'
                  : isTarget
                  ? '#6366F1'
                  : '#E2E8F0'
              }
              stroke={isTarget ? '#4338CA' : '#94A3B8'}
              strokeWidth={2}
            />
            {/* Dot number */}
            <text
              x={dot.x}
              y={dot.y + 5}
              textAnchor="middle"
              fontSize={isTarget ? 13 : 10}
              fill="white"
              fontWeight="bold"
            >
              {dot.id + 1}
            </text>
            {/* Pulse ring on target */}
            {isTarget && (
              <circle
                cx={dot.x}
                cy={dot.y}
                r={24}
                fill="none"
                stroke="#6366F1"
                strokeWidth={2}
                opacity={0.4}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default DotLetter;