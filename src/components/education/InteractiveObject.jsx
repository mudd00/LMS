import { RigidBody, CuboidCollider } from '@react-three/rapier';

/**
 * InteractiveObject 컴포넌트
 * - 의자/교탁 등 상호작용 가능한 오브젝트의 센서 영역
 * - 플레이어가 진입하면 onNearChange 콜백 호출
 *
 * @param {Array} position - 센서 위치 [x, y, z]
 * @param {Array} sittingPosition - 실제 앉는/서는 위치 [x, y, z]
 * @param {Array} size - 센서 크기 [width, height, depth]
 * @param {string} objectId - 고유 ID
 * @param {string} label - UI에 표시할 텍스트
 * @param {string} type - 'sit' (의자) | 'stand' (교탁)
 * @param {string} allowedRole - 허용된 역할 'student' | 'instructor' | 'all'
 * @param {function} onNearChange - 진입/퇴장 콜백
 */
export default function InteractiveObject({
  position = [0, 0, 0],
  sittingPosition,
  size = [1, 1, 1],
  objectId,
  label,
  type, // 'sit' | 'stand'
  allowedRole = 'all', // 'student' | 'instructor' | 'all'
  onNearChange,
}) {
  // 앉는 위치가 지정되어 있으면 사용, 아니면 센서 위치 사용
  const actualSittingPosition = sittingPosition || position;

  return (
    <RigidBody type="fixed" position={position} colliders={false}>
      <CuboidCollider
        args={[size[0] / 2, size[1] / 2, size[2] / 2]}
        sensor
        onIntersectionEnter={() => {
          console.log(`🎯 ${label} 영역 진입`);
          onNearChange?.({
            isNear: true,
            objectId,
            label,
            type,
            position: actualSittingPosition,
            allowedRole,
          });
        }}
        onIntersectionExit={() => {
          console.log(`🎯 ${label} 영역 이탈`);
          onNearChange?.({
            isNear: false,
            objectId: null,
            label: null,
            type: null,
            position: null,
            allowedRole: null,
          });
        }}
      />
    </RigidBody>
  );
}
