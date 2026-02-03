/**
 * WebRTC 설정
 * - ICE 서버 (STUN/TURN) 설정
 * - WebRTC 연결에 필요한 기본 설정
 */

// ICE 서버 설정 (NAT 통과용)
export const iceServers = {
  iceServers: [
    // Google STUN 서버 (무료)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // 추가 STUN 서버
    { urls: 'stun:stun.stunprotocol.org:3478' },
    // TURN 서버가 필요한 경우 아래 형식으로 추가
    // {
    //   urls: 'turn:your-turn-server.com:3478',
    //   username: 'username',
    //   credential: 'password'
    // }
  ],
  iceCandidatePoolSize: 10,
};

// 미디어 제약 조건
export const displayMediaConstraints = {
  video: {
    cursor: 'always', // 커서 항상 표시
    displaySurface: 'monitor', // 전체 화면 우선
  },
  audio: false, // 오디오 미포함 (필요시 true)
};

// RTCPeerConnection 생성 헬퍼
export function createPeerConnection() {
  return new RTCPeerConnection(iceServers);
}

export default {
  iceServers,
  displayMediaConstraints,
  createPeerConnection,
};
