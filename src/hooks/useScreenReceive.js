import { useState, useRef, useCallback, useEffect } from 'react';
import { iceServers } from '../utils/webrtc';

/**
 * useScreenReceive 훅
 * - 학생용 화면 수신 기능
 * - WebRTC를 통해 강사의 화면 스트림 수신
 * - STOMP WebSocket을 통한 시그널링
 */
export default function useScreenReceive(multiplayerService, userId) {
  const [isReceiving, setIsReceiving] = useState(false);
  const [stream, setStream] = useState(null);
  const [instructorId, setInstructorId] = useState(null);
  const [isScreenShareAvailable, setIsScreenShareAvailable] = useState(false);
  const [error, setError] = useState(null);

  const peerConnectionRef = useRef(null);
  const subscriptionRef = useRef(null);
  const broadcastSubscriptionRef = useRef(null);

  // 강사의 화면 공유 시청 시작
  const startReceiving = useCallback(async (targetInstructorId) => {
    if (isReceiving) {
      console.warn('이미 화면을 수신 중입니다.');
      return;
    }

    try {
      setInstructorId(targetInstructorId);

      // Peer connection 생성
      const pc = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = pc;

      // 원격 트랙 수신 시 스트림 설정
      pc.ontrack = (event) => {
        console.log('📺 원격 트랙 수신:', event.streams[0]);
        setStream(event.streams[0]);
        setIsReceiving(true);
      };

      // ICE candidate 수집 및 전송
      pc.onicecandidate = (event) => {
        if (event.candidate && multiplayerService.isConnected()) {
          multiplayerService.client.publish({
            destination: '/app/screenshare.ice',
            body: JSON.stringify({
              from: userId,
              to: targetInstructorId,
              candidate: event.candidate
            })
          });
        }
      };

      // 연결 상태 변경 감지
      pc.onconnectionstatechange = () => {
        console.log('🔌 연결 상태:', pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          stopReceiving();
        }
      };

      // 강사에게 시청 요청 전송
      if (multiplayerService.isConnected()) {
        multiplayerService.client.publish({
          destination: '/app/screenshare.join',
          body: JSON.stringify({
            studentId: userId,
            instructorId: targetInstructorId,
            type: 'join'
          })
        });
        console.log(`👋 강사 ${targetInstructorId}에게 시청 요청 전송`);
      }

      setError(null);
    } catch (err) {
      console.error('화면 수신 시작 실패:', err);
      setError('화면 수신을 시작할 수 없습니다: ' + err.message);
    }
  }, [isReceiving, userId, multiplayerService]);

  // 화면 수신 중지
  const stopReceiving = useCallback(() => {
    // 강사에게 시청 종료 알림
    if (instructorId && multiplayerService.isConnected()) {
      multiplayerService.client.publish({
        destination: '/app/screenshare.leave',
        body: JSON.stringify({
          studentId: userId,
          instructorId: instructorId,
          type: 'leave'
        })
      });
    }

    // Peer connection 종료
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setStream(null);
    setIsReceiving(false);
    setInstructorId(null);
    console.log('📺 화면 수신 종료');
  }, [instructorId, userId, multiplayerService]);

  // 강사의 offer 처리
  const handleOffer = useCallback(async (offer) => {
    if (!peerConnectionRef.current) {
      console.warn('Peer connection이 없습니다.');
      return;
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));

      // Answer 생성 및 전송
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      if (multiplayerService.isConnected()) {
        multiplayerService.client.publish({
          destination: '/app/screenshare.answer',
          body: JSON.stringify({
            studentId: userId,
            instructorId: instructorId,
            answer: peerConnectionRef.current.localDescription
          })
        });
        console.log('📤 Answer 전송');
      }
    } catch (err) {
      console.error('Offer 처리 실패:', err);
      setError('연결 설정 실패: ' + err.message);
    }
  }, [userId, instructorId, multiplayerService]);

  // ICE candidate 처리
  const handleIceCandidate = useCallback(async (candidate) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('ICE candidate 추가 실패:', err);
    }
  }, []);

  // STOMP 시그널링 구독 (개인 채널)
  useEffect(() => {
    if (!multiplayerService.isConnected()) return;

    // 학생 개인 시그널링 채널 구독
    const sub = multiplayerService.client.subscribe(
      `/topic/screenshare/student/${userId}`,
      (message) => {
        try {
          const data = JSON.parse(message.body);

          switch (data.type) {
            case 'offer':
              // 강사의 offer 수신
              console.log('📥 Offer 수신');
              handleOffer(data.offer);
              break;
            case 'ice':
              // ICE candidate 수신
              handleIceCandidate(data.candidate);
              break;
            case 'stop':
              // 강사가 화면 공유 종료
              console.log('📺 강사가 화면 공유를 종료했습니다.');
              stopReceiving();
              setIsScreenShareAvailable(false);
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
    console.log('📡 학생 시그널링 채널 구독 완료');

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [multiplayerService, userId, handleOffer, handleIceCandidate, stopReceiving]);

  // 화면 공유 브로드캐스트 구독 (공개 채널)
  useEffect(() => {
    if (!multiplayerService.isConnected()) return;

    // 화면 공유 시작/종료 알림 구독
    const sub = multiplayerService.client.subscribe(
      '/topic/screenshare/broadcast',
      (message) => {
        try {
          const data = JSON.parse(message.body);

          if (data.action === 'start') {
            console.log(`🖥️ 강사 ${data.instructorId}가 화면 공유를 시작했습니다.`);
            setIsScreenShareAvailable(true);
            setInstructorId(data.instructorId);
          } else if (data.action === 'stop') {
            console.log(`🖥️ 강사 ${data.instructorId}가 화면 공유를 종료했습니다.`);
            setIsScreenShareAvailable(false);
            if (isReceiving) {
              stopReceiving();
            }
          }
        } catch (err) {
          console.error('브로드캐스트 메시지 처리 실패:', err);
        }
      }
    );

    broadcastSubscriptionRef.current = sub;
    console.log('📡 화면 공유 브로드캐스트 구독 완료');

    return () => {
      if (broadcastSubscriptionRef.current) {
        broadcastSubscriptionRef.current.unsubscribe();
        broadcastSubscriptionRef.current = null;
      }
    };
  }, [multiplayerService, isReceiving, stopReceiving]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (isReceiving) {
        stopReceiving();
      }
    };
  }, [isReceiving, stopReceiving]);

  return {
    isReceiving,
    stream,
    instructorId,
    isScreenShareAvailable,
    error,
    startReceiving,
    stopReceiving,
  };
}
