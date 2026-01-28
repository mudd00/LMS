import React, { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';
import Blackboard from '../education/Blackboard';
import InteractiveObject from '../education/InteractiveObject';

/**
 * EducationZone 컴포넌트
 * - 교육 체험존: 맵 내 빈 공간에 교육 오브젝트 배치
 * - single_desk.glb: 책상+의자 1세트 (Blender에서 추출)
 * - classroom.glb에서 교탁(BASE_PROF) 로드
 * - 칠판은 PlaneGeometry로 직접 생성 (판서 컨트롤러 비율 맞추기 위해)
 *
 * 위치: [84.78, 0.39, -93.63] (빈 공간 정중앙)
 */

// 교육 체험존 중심 좌표
const ZONE_CENTER = [84.78, 0.39, -93.63];

// classroom.glb에서 가져올 오브젝트 (교탁만)
const OBJECTS_TO_LOAD = ['BASE_PROF'];

function EducationZone({ position = ZONE_CENTER, onBlackboardReady, onWhiteboardEnter, onWhiteboardExit, onInteractionChange }) {
  const { scene: classroomScene } = useGLTF('/resources/GameView/classroom.glb');
  const { scene: deskScene } = useGLTF('/resources/GameView/single_desk.glb');
  const loggedRef = useRef(false);

  // classroom.glb에서 교탁 추출
  const extractedObjects = useMemo(() => {
    const objects = [];

    classroomScene.traverse((child) => {
      if (OBJECTS_TO_LOAD.includes(child.name)) {
        const cloned = child.clone();
        cloned.traverse((obj) => {
          if (obj.isMesh) {
            obj.castShadow = true;
            obj.receiveShadow = true;
          }
        });
        objects.push({
          name: child.name,
          object: cloned,
          originalPosition: child.position.clone(),
        });
      }
    });

    return objects;
  }, [classroomScene]);

  // single_desk.glb 복제 (책상+의자 1세트)
  const singleDeskClone = useMemo(() => {
    const cloned = deskScene.clone();
    cloned.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    return cloned;
  }, [deskScene]);

  // 오브젝트 배치 계산
  // 칠판: Z - 28, 교탁: Z - 8, 책상: Z = 0
  const getObjectPosition = (name, originalPos) => {
    const baseX = position[0];
    const baseY = position[1];
    const baseZ = position[2];

    switch (name) {
      case 'BASE_PROF': // 교탁 (2번 위치 - 칠판과 책상 사이)
        return [baseX + 26, 0, baseZ - 8];
      default:
        return [baseX + originalPos.x, baseY + originalPos.y, baseZ + originalPos.z];
    }
  };

  // 책상+의자 위치 (3번 위치)
  const deskPosition = [position[0], position[1], position[2] + 12];

  // 오브젝트 회전
  const getObjectRotation = (name) => {
    switch (name) {
      case 'BASE_PROF': // 교탁 90도 회전
        return [0, Math.PI / 2, 0];
      default:
        return [0, 0, 0];
    }
  };

  // 디버그 로그 (한 번만 실행)
  useEffect(() => {
    if (!loggedRef.current && singleDeskClone) {
      loggedRef.current = true;
      console.log('🎓 교육존 오브젝트 로드 완료');
      console.log('🎓 책상+의자 배치 위치:', deskPosition);
      extractedObjects.forEach(item => {
        const pos = getObjectPosition(item.name, item.originalPosition);
        console.log(`🎓 ${item.name} 배치 위치:`, pos);
      });
    }
  }, [extractedObjects, singleDeskClone]);

  return (
    <group>
      {/* 책상+의자 1세트 (single_desk.glb) */}
      <RigidBody
        type="fixed"
        colliders="trimesh"
        position={deskPosition}
        rotation={[0, Math.PI / 2, 0]}
      >
        <primitive object={singleDeskClone} scale={3} />
      </RigidBody>

      {/* 교탁 (classroom.glb에서 추출) */}
      {extractedObjects.map((item, index) => (
        <RigidBody
          key={item.name}
          type="fixed"
          colliders="trimesh"
          position={getObjectPosition(item.name, item.originalPosition)}
          rotation={getObjectRotation(item.name)}
        >
          <primitive
            object={item.object}
            scale={0.85}
          />
        </RigidBody>
      ))}

      {/* 칠판 - Blackboard 컴포넌트 (판서 기능 포함) */}
      {/* 4:1 비율 (가로 24m, 세로 6m) - 1.5배 확대 */}
      <group position={[position[0], position[1] + 6, position[2] - 28]}>
        <Blackboard onCanvasReady={onBlackboardReady} />
      </group>

      {/* 칠판 프레임 */}
      <mesh
        position={[position[0], position[1] + 6, position[2] - 28.01]}
        rotation={[0, 0, 0]}
      >
        <planeGeometry args={[24.4, 6.4]} />
        <meshStandardMaterial
          color="#4a3728" // 나무색 프레임
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 칠판 트리거 영역 (판서 버튼 표시용) */}
      <RigidBody
        type="fixed"
        colliders={false}
        position={[position[0], position[1] + 3, position[2] - 20]}
        sensor
      >
        <CuboidCollider
          args={[15, 5, 10]} // 가로 30m, 높이 10m, 깊이 20m
          sensor
          onIntersectionEnter={() => {
            console.log('🎨 칠판 영역 진입');
            onWhiteboardEnter && onWhiteboardEnter();
          }}
          onIntersectionExit={() => {
            console.log('🎨 칠판 영역 이탈');
            onWhiteboardExit && onWhiteboardExit();
          }}
        />
      </RigidBody>

      {/* 의자 상호작용 영역 (학생만 앉을 수 있음) */}
      <InteractiveObject
        position={[deskPosition[0], deskPosition[1] + 1, deskPosition[2] + 1]}
        sittingPosition={[deskPosition[0], deskPosition[1] + 2, deskPosition[2] - 0.5]}
        size={[3, 2, 3]}
        objectId="edu-chair-1"
        label="의자에 앉기"
        type="sit"
        allowedRole="student"
        onNearChange={onInteractionChange}
      />

      {/* 교탁 상호작용 영역 (테스트: 모든 역할 허용) */}
      <InteractiveObject
        position={[position[0] + 26, position[1] + 1, position[2] - 8]}
        sittingPosition={[position[0] + 26, position[1] + 1, position[2] - 4]}
        size={[6, 3, 6]}
        objectId="edu-podium"
        label="교탁에 서기"
        type="stand"
        allowedRole="all"
        onNearChange={onInteractionChange}
      />
    </group>
  );
}

// GLB 프리로드
useGLTF.preload('/resources/GameView/classroom.glb');
useGLTF.preload('/resources/GameView/single_desk.glb');

export default EducationZone;
