import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 맵 오브젝트 탐색 도구
 * - 필요시 App.js에 추가하여 사용
 * - 콘솔에 맵의 모든 오브젝트 정보 출력
 *
 * 사용법:
 * 1. App.js에서 import: import InspectGLTF from './inspectGLTF';
 * 2. Suspense 안에 추가: <InspectGLTF />
 * 3. 브라우저 콘솔에서 결과 확인
 */
function InspectGLTF({ enabled = false }) {
  const { scene } = useGLTF('/resources/GameView/PublicSquare-v4.glb');

  useEffect(() => {
    if (!enabled) return;

    console.log('========================================');
    console.log('🗺️ 맵 오브젝트 분석 (PublicSquare-v4.glb)');
    console.log('========================================');

    const categories = {
      chairs: [],
      tables: [],
      boards: [],
      screens: [],
    };

    scene.traverse((child) => {
      if (child.name) {
        const nameLower = child.name.toLowerCase();
        const worldPosition = new THREE.Vector3();
        child.getWorldPosition(worldPosition);
        const pos = [
          Math.round(worldPosition.x * 100) / 100,
          Math.round(worldPosition.y * 100) / 100,
          Math.round(worldPosition.z * 100) / 100
        ];

        if (nameLower.includes('chair') || nameLower.includes('seat') || nameLower.includes('bench')) {
          categories.chairs.push({ name: child.name, pos });
        }
        if (nameLower.includes('table') || nameLower.includes('desk') || nameLower.includes('podium')) {
          categories.tables.push({ name: child.name, pos });
        }
        if (nameLower.includes('board') || nameLower.includes('blackboard') || nameLower.includes('whiteboard')) {
          categories.boards.push({ name: child.name, pos });
        }
        if (nameLower.includes('screen') || nameLower.includes('monitor') || nameLower.includes('display')) {
          categories.screens.push({ name: child.name, pos });
        }
      }
    });

    console.log('🪑 의자:', categories.chairs);
    console.log('🪵 테이블:', categories.tables);
    console.log('📋 칠판:', categories.boards);
    console.log('🖥️ 스크린:', categories.screens);

    // 전역에 저장 (개발자 도구에서 접근 가능)
    window.__MAP_OBJECTS__ = categories;

  }, [scene, enabled]);

  return null;
}

useGLTF.preload('/resources/GameView/PublicSquare-v4.glb');

export default InspectGLTF;
