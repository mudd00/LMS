import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * 3D 칠판 컴포넌트
 * - Canvas Texture로 판서 내용 표시
 * - 4:1 비율 (가로 16m, 세로 4m)
 * - 외부에서 그리기 데이터를 받아 표시
 */
export default function Blackboard({ blackboardRef, onCanvasReady }) {
  const canvasRef = useRef(null);
  const textureRef = useRef(null);
  const [needsUpdate, setNeedsUpdate] = useState(false);

  // Canvas와 Texture를 useMemo로 생성
  const { canvas, texture, material } = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
      toneMapped: false,
    });

    return { canvas, texture, material };
  }, []);

  // refs 업데이트 및 콜백 호출
  useEffect(() => {
    canvasRef.current = canvas;
    textureRef.current = texture;

    // 부모에게 canvas와 draw 함수 전달
    if (onCanvasReady) {
      onCanvasReady({
        canvas,
        draw: (drawData) => drawOnCanvas(drawData),
        clear: () => clearCanvas(),
      });
    }

    console.log('🎨 [Blackboard] Canvas initialized');

    return () => {
      texture.dispose();
      material.dispose();
    };
  }, [canvas, texture, material]);

  // BroadcastChannel로 다른 창에서 그리기 데이터 수신
  useEffect(() => {
    const channel = new BroadcastChannel('whiteboard-channel');

    channel.onmessage = (event) => {
      const { type, data } = event.data;

      if (type === 'draw') {
        drawOnCanvas(data);
      } else if (type === 'clear') {
        clearCanvas();
      }
    };

    console.log('🎨 [Blackboard] BroadcastChannel connected');

    return () => {
      channel.close();
    };
  }, []);

  // drawOnCanvas와 clearCanvas 함수 정의

  // 캔버스에 그리기
  const drawOnCanvas = (drawData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 좌표 변환 (0~1 비율 → 캔버스 픽셀)
    const fromX = drawData.fromX * canvas.width;
    const fromY = drawData.fromY * canvas.height;
    const toX = drawData.toX * canvas.width;
    const toY = drawData.toY * canvas.height;

    if (drawData.tool === 'eraser') {
      // 지우개: 배경색으로 덮어쓰기
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#1a472a';
      ctx.lineWidth = drawData.lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = drawData.color;
      ctx.lineWidth = drawData.lineWidth;
    }

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    setNeedsUpdate(true);
  };

  // 캔버스 지우기
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    setNeedsUpdate(true);
    console.log('🎨 [Blackboard] Canvas cleared');
  };

  // Texture 업데이트
  useFrame(() => {
    if (needsUpdate && textureRef.current) {
      textureRef.current.needsUpdate = true;
      setNeedsUpdate(false);
    }
  });

  return (
    <mesh ref={blackboardRef}>
      <planeGeometry args={[24, 6]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}
