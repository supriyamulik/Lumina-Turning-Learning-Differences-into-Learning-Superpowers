import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Hands, type Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import type { Dot } from '../../data/dotPaths';
import DotLetter from './DotLetter';
import { playPop, playSuccess } from '../../utils/soundHelper';

interface CameraCanvasProps {
    dots: Dot[];
    onComplete: (accuracy: number) => void;
    canvasSize?: number;
}

const TOUCH_RADIUS = 35;

const CameraCanvas: React.FC<CameraCanvasProps> = ({
    dots, onComplete, canvasSize = 480,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [currentTargetId, setCurrentTargetId] = useState(0);
    const [completedIds, setCompletedIds] = useState<number[]>([]);
    const [fingerPos, setFingerPos] = useState<{ x: number; y: number } | null>(null);
    const completedRef = useRef<number[]>([]);
    const targetRef = useRef(0);
    const totalFrames = useRef(0);
    const onPathFrames = useRef(0);
    const completedFired = useRef(false);
    const [isReady, setIsReady] = useState(false);
    const isReadyRef = useRef(false); // ✅ ref so handleResults doesn't recreate

    // Keep latest dots/onComplete in refs so handleResults never needs them as deps
    const dotsRef = useRef(dots);
    const onCompleteRef = useRef(onComplete);
    useEffect(() => { dotsRef.current = dots; }, [dots]);
    useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

    const handleResults = useCallback((results: Results) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // ✅ Mark ready only once using ref — no re-render trigger in hot path
        if (!isReadyRef.current) {
            isReadyRef.current = true;
            setIsReady(true);
        }

        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvasSize, canvasSize);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, -canvasSize, 0, canvasSize, canvasSize);
        ctx.restore();

        if (results.multiHandLandmarks?.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const indexTip = landmarks[8];
            const fx = (1 - indexTip.x) * canvasSize;
            const fy = indexTip.y * canvasSize;

            setFingerPos({ x: fx, y: fy });
            totalFrames.current += 1;

            // Draw finger dot
            ctx.beginPath();
            ctx.arc(fx, fy, 14, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(99,102,241,0.7)';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            const currentDots = dotsRef.current;
            const currentTarget = currentDots[targetRef.current];

            if (currentTarget) {
                const dist = Math.hypot(fx - currentTarget.x, fy - currentTarget.y);

                const nearAnyDot = currentDots.some(
                    (d) => Math.hypot(fx - d.x, fy - d.y) < TOUCH_RADIUS * 1.5
                );
                if (nearAnyDot) onPathFrames.current += 1;

                if (dist < TOUCH_RADIUS) {
                    const newCompleted = [...completedRef.current, currentTarget.id];
                    completedRef.current = newCompleted;
                    setCompletedIds([...newCompleted]);

                    if (targetRef.current < currentDots.length - 1) {
                        targetRef.current += 1;
                        setCurrentTargetId(targetRef.current);
                        playPop();
                    } else {
                        if (!completedFired.current) {
                            completedFired.current = true;
                            playSuccess();
                            const accuracy = totalFrames.current > 0
                                ? Math.round((onPathFrames.current / totalFrames.current) * 100)
                                : 100;
                            onCompleteRef.current(Math.min(accuracy, 100));
                        }
                    }
                }
            }
        } else {
            setFingerPos(null);
        }
    }, [canvasSize]); // ✅ only canvasSize — never recreates due to dots/onComplete/isReady

    // Reset on new letter
    useEffect(() => {
        completedRef.current = [];
        targetRef.current = 0;
        totalFrames.current = 0;
        onPathFrames.current = 0;
        completedFired.current = false;
        setCompletedIds([]);
        setCurrentTargetId(0);
    }, [dots]);

    // ✅ Camera + MediaPipe setup runs ONCE only
    useEffect(() => {
        if (!videoRef.current) return;

        const hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5,
        });

        hands.onResults(handleResults);

        const camera = new Camera(videoRef.current, {
            onFrame: async () => {
                if (videoRef.current) await hands.send({ image: videoRef.current });
            },
            width: canvasSize,
            height: canvasSize,
        });

        camera.start();

        return () => { camera.stop(); };
    }, []); // ✅ empty deps — runs once, never restarts

    return (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-indigo-300"
            style={{ width: canvasSize, height: canvasSize }}>

            <video ref={videoRef} className="hidden" playsInline muted />

            <canvas ref={canvasRef} width={canvasSize} height={canvasSize}
                className="absolute top-0 left-0" style={{ zIndex: 1 }} />

            <DotLetter dots={dots} currentTargetId={currentTargetId}
                completedIds={completedIds} canvasSize={canvasSize} />

            {/* Status message */}
            {!isReady ? (
                <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-semibold bg-black/30 py-2"
                    style={{ zIndex: 3 }}>
                    ⏳ Loading camera...
                </div>
            ) : !fingerPos ? (
                <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-semibold bg-black/30 py-2"
                    style={{ zIndex: 3 }}>
                    ✋ Show your hand to the camera
                </div>
            ) : (
                <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-semibold bg-black/30 py-2"
                    style={{ zIndex: 3 }}>
                    👆 Move your finger to dot {currentTargetId + 1}!
                </div>
            )}
        </div>
    );
};

export default CameraCanvas;