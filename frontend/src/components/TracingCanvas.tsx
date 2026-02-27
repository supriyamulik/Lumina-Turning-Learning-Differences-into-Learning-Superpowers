import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { LetterPath } from '../data/letterPaths';

interface TracingCanvasProps {
  letterData: LetterPath;
  onComplete: (accuracy: number) => void;
  canvasSize?: number;
}

interface Point {
  x: number;
  y: number;
}

const TOLERANCE = 28;        // px — how close the mouse must be to the path
const CANVAS_SIZE = 400;

// Convert SVG path commands to array of points for hit-testing
function samplePathPoints(pathData: string, numPoints = 300): Point[] {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '200');
  svg.setAttribute('height', '200');
  document.body.appendChild(svg);

  const path = document.createElementNS(svgNS, 'path');
  path.setAttribute('d', pathData);
  svg.appendChild(path);

  const totalLength = path.getTotalLength();
  const points: Point[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const pt = path.getPointAtLength((i / numPoints) * totalLength);
    points.push({ x: pt.x, y: pt.y });
  }

  document.body.removeChild(svg);
  return points;
}

function distToSegment(p: Point, pathPoints: Point[]): number {
  let minDist = Infinity;
  for (const pp of pathPoints) {
    const d = Math.hypot(p.x - pp.x, p.y - pp.y);
    if (d < minDist) minDist = d;
  }
  return minDist;
}

const TracingCanvas: React.FC<TracingCanvasProps> = ({
  letterData,
  onComplete,
  canvasSize = CANVAS_SIZE,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pathPoints, setPathPoints] = useState<Point[]>([]);
  const [correctPoints, setCorrectPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [tracePoints, setTracePoints] = useState<{ point: Point; correct: boolean }[]>([]);
  const [completed, setCompleted] = useState(false);
  const scale = canvasSize / 200;

  useEffect(() => {
    const pts = samplePathPoints(letterData.pathData);
    setPathPoints(pts);
    setTracePoints([]);
    setCorrectPoints(0);
    setTotalPoints(0);
    setCompleted(false);
  }, [letterData]);

  // Draw guide path
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || pathPoints.length === 0) return;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Background
    ctx.fillStyle = '#FFF8F0';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw dashed guide path
    ctx.save();
    ctx.scale(scale, scale);
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    const svgPath = new Path2D(letterData.pathData);
    ctx.stroke(svgPath);
    ctx.restore();

    // Draw start indicator
    const start = letterData.startPoint;
    ctx.beginPath();
    ctx.arc(start.x * scale, start.y * scale, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#22C55E';
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('▶', start.x * scale, start.y * scale);

    // Draw the user's trace
    for (const { point, correct } of tracePoints) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = correct ? 'rgba(34,197,94,0.8)' : 'rgba(239,68,68,0.7)';
      ctx.fill();
    }
  }, [pathPoints, tracePoints, canvasSize, scale, letterData]);

  const getCanvasPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvasSize / rect.width),
      y: (clientY - rect.top) * (canvasSize / rect.height),
    };
  };

  const handleMove = useCallback(
    (point: Point) => {
      if (!isDrawing || completed) return;

      // Convert to SVG coordinate space for hit test
      const svgPoint: Point = { x: point.x / scale, y: point.y / scale };
      const dist = distToSegment(svgPoint, pathPoints);
      const correct = dist < TOLERANCE;

      setTracePoints((prev) => [...prev, { point, correct }]);
      setTotalPoints((prev) => prev + 1);
      if (correct) setCorrectPoints((prev) => prev + 1);
    },
    [isDrawing, completed, pathPoints, scale]
  );

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (totalPoints > 20) {
      const accuracy = Math.round((correctPoints / totalPoints) * 100);
      setCompleted(true);
      onComplete(accuracy);
    }
  }, [isDrawing, totalPoints, correctPoints, onComplete]);

  return (
    <div className="relative inline-block">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="rounded-2xl shadow-lg cursor-crosshair border-4 border-indigo-200 touch-none"
        onMouseDown={(e) => { setIsDrawing(true); handleMove(getCanvasPoint(e)); }}
        onMouseMove={(e) => handleMove(getCanvasPoint(e))}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={(e) => { e.preventDefault(); setIsDrawing(true); handleMove(getCanvasPoint(e)); }}
        onTouchMove={(e) => { e.preventDefault(); handleMove(getCanvasPoint(e)); }}
        onTouchEnd={handleEnd}
      />
      {completed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
          <div className="bg-white rounded-xl p-6 text-center shadow-xl">
            <div className="text-5xl mb-2">🎉</div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((correctPoints / totalPoints) * 100)}% Accuracy!
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TracingCanvas;