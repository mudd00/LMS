import { useEffect, useRef, useState } from 'react';

/**
 * 태블릿/폰용 판서 컨트롤러
 * - 터치 최적화
 * - 4:1 비율 캔버스 (칠판과 동일)
 * - BroadcastChannel로 메타버스 칠판과 실시간 동기화
 */
export default function WhiteboardController() {
  const channelRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#ffffff');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState('pen'); // 'pen' | 'eraser'
  const lastPointRef = useRef(null);

  // BroadcastChannel 초기화
  useEffect(() => {
    channelRef.current = new BroadcastChannel('whiteboard-channel');
    console.log('🎨 [WhiteboardController] BroadcastChannel connected');

    return () => {
      if (channelRef.current) {
        channelRef.current.close();
      }
    };
  }, []);

  // Canvas 초기화
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // 캔버스 크기 설정
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    // 4:1 비율 강제 (칠판 메시에 맞춤)
    const canvasWidth = rect.width * dpr;
    const canvasHeight = (rect.width / 4) * dpr;

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    ctx.scale(dpr, dpr);

    // 배경 칠판 녹색
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 그리기 설정
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  // 그리기 함수
  const draw = (x, y, isStart = false) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();

    // 캔버스 좌표로 변환
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = '#1a472a';
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    if (isStart || !lastPointRef.current) {
      ctx.beginPath();
      ctx.moveTo(canvasX, canvasY);
      lastPointRef.current = { x: canvasX, y: canvasY };
    } else {
      ctx.beginPath();
      ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
      ctx.lineTo(canvasX, canvasY);
      ctx.stroke();

      // 그리기 데이터 전송 (BroadcastChannel)
      const drawData = {
        tool,
        color,
        lineWidth,
        fromX: lastPointRef.current.x / rect.width,
        fromY: lastPointRef.current.y / rect.height,
        toX: canvasX / rect.width,
        toY: canvasY / rect.height,
      };

      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'draw', data: drawData });
      }

      lastPointRef.current = { x: canvasX, y: canvasY };
    }
  };

  // 마우스 이벤트
  const handleMouseDown = (e) => {
    setIsDrawing(true);
    draw(e.clientX, e.clientY, true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    draw(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  // 터치 이벤트
  const handleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsDrawing(true);
    draw(touch.clientX, touch.clientY, true);
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const touch = e.touches[0];
    draw(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  // 전체 지우기
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // BroadcastChannel로 지우기 이벤트 전송
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'clear' });
    }
  };

  const colors = ['#ffffff', '#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
  const widths = [2, 5, 10, 15];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: '#111827',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: '#1f2937',
        padding: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>
          🎨 판서 컨트롤러
        </h1>
      </div>

      {/* 캔버스 */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <div style={{ width: '100%', maxWidth: '800px', aspectRatio: '4 / 1' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              touchAction: 'none',
              border: '2px solid #4a3728',
              borderRadius: '4px'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        </div>
      </div>

      {/* 도구 바 */}
      <div style={{
        backgroundColor: '#1f2937',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {/* 도구 선택 */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setTool('pen')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: tool === 'pen' ? '#3b82f6' : '#374151',
              color: tool === 'pen' ? 'white' : '#d1d5db'
            }}
          >
            🖊️ 펜
          </button>
          <button
            onClick={() => setTool('eraser')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: tool === 'eraser' ? '#3b82f6' : '#374151',
              color: tool === 'eraser' ? 'white' : '#d1d5db'
            }}
          >
            🧹 지우개
          </button>
        </div>

        {/* 색상 선택 */}
        {tool === 'pen' && (
          <div>
            <label style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 'bold' }}>색상</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    border: color === c ? '3px solid #3b82f6' : 'none',
                    cursor: 'pointer',
                    backgroundColor: c,
                    transform: color === c ? 'scale(1.1)' : 'scale(1)'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 굵기 선택 */}
        <div>
          <label style={{ fontSize: '14px', color: '#9ca3af', fontWeight: 'bold' }}>
            굵기: {lineWidth}px
          </label>
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            {widths.map((w) => (
              <button
                key={w}
                onClick={() => setLineWidth(w)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: lineWidth === w ? '#3b82f6' : '#374151',
                  color: lineWidth === w ? 'white' : '#d1d5db'
                }}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* 전체 지우기 */}
        <button
          onClick={clearCanvas}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '8px',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          🗑️ 전체 지우기
        </button>
      </div>
    </div>
  );
}
