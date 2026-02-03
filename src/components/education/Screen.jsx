import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Screen 컴포넌트
 * - 3D 공간에 비디오 스트림을 표시하는 스크린
 * - 화면 공유 수신 시 사용
 *
 * @param {MediaStream} stream - 비디오 스트림
 * @param {Array} position - 스크린 위치 [x, y, z]
 * @param {Array} rotation - 스크린 회전 [rx, ry, rz]
 * @param {number} width - 스크린 가로 크기
 * @param {number} height - 스크린 세로 크기
 * @param {boolean} visible - 표시 여부
 */
export default function Screen({
  stream,
  position = [0, 5, 0],
  rotation = [0, 0, 0],
  width = 16,
  height = 9,
  visible = true,
}) {
  const videoRef = useRef(null);
  const textureRef = useRef(null);

  // 비디오 엘리먼트 생성 (DOM에 추가하지 않음)
  const video = useMemo(() => {
    const v = document.createElement('video');
    v.playsInline = true;
    v.autoplay = true;
    v.muted = true; // 오디오는 별도 처리
    return v;
  }, []);

  // 스트림이 변경되면 비디오에 연결
  useEffect(() => {
    if (stream && video) {
      video.srcObject = stream;
      video.play().catch(err => {
        console.warn('비디오 자동 재생 실패:', err);
      });
      console.log('📺 Screen: 비디오 스트림 연결됨');
    }

    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [stream, video]);

  // VideoTexture 생성
  const videoTexture = useMemo(() => {
    const texture = new THREE.VideoTexture(video);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.format = THREE.RGBAFormat;
    texture.colorSpace = THREE.SRGBColorSpace;
    textureRef.current = texture;
    return texture;
  }, [video]);

  // 텍스처 업데이트 (프레임마다)
  useEffect(() => {
    let animationId;

    const updateTexture = () => {
      if (textureRef.current && video.readyState >= video.HAVE_CURRENT_DATA) {
        textureRef.current.needsUpdate = true;
      }
      animationId = requestAnimationFrame(updateTexture);
    };

    if (stream && visible) {
      updateTexture();
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [stream, video, visible]);

  // 스트림이 없거나 비표시 상태면 렌더링하지 않음
  if (!stream || !visible) {
    return null;
  }

  return (
    <group position={position} rotation={rotation}>
      {/* 스크린 본체 */}
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={videoTexture}
          side={THREE.FrontSide}
          toneMapped={false}
        />
      </mesh>

      {/* 스크린 테두리 (프레임) */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[width + 0.4, height + 0.4]} />
        <meshStandardMaterial
          color="#222222"
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 화면 공유 중 표시 인디케이터 */}
      <mesh position={[width / 2 - 0.3, height / 2 - 0.3, 0.1]}>
        <circleGeometry args={[0.15, 16]} />
        <meshBasicMaterial color="#ff3333" />
      </mesh>
    </group>
  );
}
