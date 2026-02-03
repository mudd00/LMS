import { useState, useRef, useCallback, useEffect } from 'react';
import { iceServers, displayMediaConstraints } from '../utils/webrtc';

/**
 * useScreenShare 훅
 * - 강사용 화면 공유 기능
 * - WebRTC를 통해 학생들에게 화면 스트림 전송
 * - STOMP WebSocket을 통한 시그널링
 */
export default function useScreenShare(multiplayerService, userId, isInstructor = false) {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);

  const streamRef = useRef(null);
  const peerConnectionsRef = useRef(new Map()); // studentId -> RTCPeerConnection
  const subscriptionRef = useRef(null);

  // 화면 공유 시작
  const startScreenShare = useCallback(async () => {
    console.log('🖥️ 화면 공유 시작 시도 - isInstructor:', isInstructor);
    if (!isInstructor) {
      setError('강사 또는 개발자만 화면 공유를 시작할 수 있습니다.');
      return false;
    }

    try {
      // 화면 캡처 시작
      const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaConstraints);
      streamRef.current = stream;

      // 트랙 종료 감지 (사용자가 공유 중지 클릭 시)
      stream.getVideoTracks()[0].onended = () => {
        console.log('🖥️ 화면 공유 트랙 종료됨');
        stopScreenShare();
      };

      setIsSharing(true);
      setError(null);

      // 화면 공유 시작을 서버에 알림
      if (multiplayerService.isConnected()) {
        multiplayerService.client.publish({
          destination: '/app/screenshare.start',
          body: JSON.stringify({
            instructorId: userId,
            action: 'start'
          })
        });
        console.log('🖥️ 화면 공유 시작 알림 전송');
      }

      return true;
    } catch (err) {
      console.error('화면 공유 시작 실패:', err);
      if (err.name === 'NotAllowedError') {
        setError('화면 공유가 취소되었습니다.');
      } else {
        setError('화면 공유를 시작할 수 없습니다: ' + err.message);
      }
      return false;
    }
  }, [isInstructor, userId, multiplayerService]);

  // 화면 공유 중지
  const stopScreenShare = useCallback(() => {
    // 모든 peer connection 종료
    peerConnectionsRef.current.forEach((pc, studentId) => {
      pc.close();
      console.log(`🔌 학생 ${studentId} 연결 종료`);
    });
    peerConnectionsRef.current.clear();

    // 스트림 트랙 종료
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setIsSharing(false);
    setViewerCount(0);

    // 화면 공유 종료를 서버에 알림
    if (multiplayerService.isConnected()) {
      multiplayerService.client.publish({
        destination: '/app/screenshare.stop',
        body: JSON.stringify({
          instructorId: userId,
          action: 'stop'
        })
      });
      console.log('🖥️ 화면 공유 종료 알림 전송');
    }
  }, [userId, multiplayerService]);

  // 학생에게 offer 전송 (새 학생이 연결 요청 시)
  const handleStudentJoin = useCallback(async (studentId) => {
    if (!streamRef.current || !isSharing) {
      console.warn('스트림이 없거나 공유 중이 아닙니다.');
      return;
    }

    try {
      // 새 peer connection 생성
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionsRef.current.set(studentId, pc);

      // 스트림 트랙 추가
      streamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, streamRef.current);
      });

      // ICE candidate 수집 및 전송
      pc.onicecandidate = (event) => {
        if (event.candidate && multiplayerService.isConnected()) {
          multiplayerService.client.publish({
            destination: '/app/screenshare.ice',
            body: JSON.stringify({
              from: userId,
              to: studentId,
              candidate: event.candidate
            })
          });
        }
      };

      // 연결 상태 변경 감지
      pc.onconnectionstatechange = () => {
        console.log(`🔌 학생 ${studentId} 연결 상태:`, pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          peerConnectionsRef.current.delete(studentId);
          setViewerCount(prev => Math.max(0, prev - 1));
        } else if (pc.connectionState === 'connected') {
          setViewerCount(peerConnectionsRef.current.size);
        }
      };

      // Offer 생성 및 전송
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (multiplayerService.isConnected()) {
        multiplayerService.client.publish({
          destination: '/app/screenshare.offer',
          body: JSON.stringify({
            from: userId,
            to: studentId,
            offer: pc.localDescription
          })
        });
        console.log(`📤 Offer 전송 -> 학생 ${studentId}`);
      }
    } catch (err) {
      console.error('학생 연결 처리 실패:', err);
    }
  }, [isSharing, userId, multiplayerService]);

  // 학생의 answer 처리
  const handleAnswer = useCallback(async (studentId, answer) => {
    const pc = peerConnectionsRef.current.get(studentId);
    if (!pc) {
      console.warn(`학생 ${studentId}의 peer connection이 없습니다.`);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`📥 Answer 수신 <- 학생 ${studentId}`);
    } catch (err) {
      console.error('Answer 처리 실패:', err);
    }
  }, []);

  // ICE candidate 처리
  const handleIceCandidate = useCallback(async (studentId, candidate) => {
    const pc = peerConnectionsRef.current.get(studentId);
    if (!pc) return;

    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('ICE candidate 추가 실패:', err);
    }
  }, []);

  // STOMP 시그널링 구독
  useEffect(() => {
    if (!multiplayerService.isConnected() || !isInstructor) return;

    // 화면 공유 시그널링 채널 구독
    const sub = multiplayerService.client.subscribe(
      `/topic/screenshare/instructor/${userId}`,
      (message) => {
        try {
          const data = JSON.parse(message.body);

          switch (data.type) {
            case 'join':
              // 학생이 화면 공유 시청 요청
              console.log(`👋 학생 ${data.studentId} 시청 요청`);
              handleStudentJoin(data.studentId);
              break;
            case 'answer':
              // 학생의 answer 수신
              handleAnswer(data.studentId, data.answer);
              break;
            case 'ice':
              // ICE candidate 수신
              handleIceCandidate(data.from, data.candidate);
              break;
            case 'leave':
              // 학생이 시청 종료
              const pc = peerConnectionsRef.current.get(data.studentId);
              if (pc) {
                pc.close();
                peerConnectionsRef.current.delete(data.studentId);
                setViewerCount(prev => Math.max(0, prev - 1));
              }
              break;
            default:
              console.warn('알 수 없는 시그널링 메시지:', data.type);
          }
        } catch (err) {
          console.error('시그널링 메시지 처리 실패:', err);
        }
      }
    );

    subscriptionRef.current = sub;
    console.log('📡 화면 공유 시그널링 구독 완료');

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [multiplayerService, isInstructor, userId, handleStudentJoin, handleAnswer, handleIceCandidate]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (isSharing) {
        stopScreenShare();
      }
    };
  }, [isSharing, stopScreenShare]);

  return {
    isSharing,
    error,
    viewerCount,
    stream: streamRef.current,
    startScreenShare,
    stopScreenShare,
  };
}
