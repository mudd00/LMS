# VerseUp! 메타버스 교육 기능 상세 문서

이 문서는 VerseUp 프로젝트의 교육 관련 기능들을 다른 프로젝트에 이식할 때 참고할 수 있도록 작성되었습니다.

---

## 🚨 현재 작업 상태 (Claude 세션 인계용)

> **마지막 업데이트**: 2025-01-26

### 프로젝트 개요
- **현재 프로젝트**: MetaPlaza (LMS) - React Three Fiber 기반 3D 메타버스
- **목표**: VerseUp 프로젝트의 교육 기능을 이 프로젝트에 이식
- **작업 위치**: 맵 내 빈 공간에 "교육 체험존" 구성

### 대화 흐름 요약

1. **초기 요청**: 사용자가 FEATURES.md 내용 파악 요청 → VerseUp의 교육 기능들(화면공유, 판서, 음성채팅 등)을 이 프로젝트에 이식하고 싶다고 함

2. **구현 방식 논의**:
   - 사용자 의도: 별도 교실 건물 없이, 맵의 빈 공간에 오브젝트(의자, 교탁, 칠판 등)를 배치해서 교육 기능을 "시연"하는 용도
   - 실제 교육용이 아닌 **기능 데모/체험존** 개념

3. **맵 오브젝트 분석**:
   - 현재 LMS 맵(PublicSquare-v4.glb) 분석 → 교육용 오브젝트 부족 (벤치 1개, 체스판 정도)
   - 사용자가 "VerseUp에서 오브젝트 가져와도 되나?" 질문

4. **VerseUp 분석**:
   - `classroom.glb` 파일에 의자, 책상, 교탁, 칠판 오브젝트 존재 확인
   - 오브젝트가 스페인어로 명명됨 (MESA=책상, SILLA=의자 등)
   - 사용자가 Blender에서 그룹으로 묶어놨음 확인

5. **최종 결정**:
   - 책상+의자, 교탁은 VerseUp에서 가져오기
   - **칠판은 GLB 오브젝트 사용 안함** → 이유는 아래 참조

---

### 교육 체험존 정보

**위치**: `[84.78, 0.39, -93.63]` (빈 공간 정중앙)

**위치 선정 과정**:
- 사용자가 직접 맵을 돌아다니며 빈 공간 탐색
- P키 디버그 기능으로 캐릭터 좌표 확인 후 해당 좌표 제공
- 맵 내에서 오브젝트가 없는 넓은 공터 위치

**컨셉**:
- 별도 건물/실내 공간 없이 야외 오픈 공간
- 교육 기능을 사용자에게 "보여주기만" 하는 체험존
- 실제 수업용이 아닌 기능 시연/데모 목적

---

### 가져올 오브젝트 (VerseUp에서)

**소스 경로**: `C:\Users\bryce\Desktop\3차프로젝트(VerseUp!)\verseUp`
**GLB 파일**: `public/models/classroom.glb`

| 오브젝트 | GLB 내 그룹명 | 용도 | 비고 |
|---------|--------------|------|------|
| 책상+의자 세트 | `MESA1`, `MESA2`, `MESA3`, `MESA4` | 학생 좌석 | 사용자가 Blender에서 책상+의자를 하나로 묶어놓음 |
| 교탁 | `BASE_PROF` | 강사 위치 | BASE_MADERA, BASE_METAL, MADERA_PROF, METAL_PROF 포함 |
| 칠판 | ❌ **사용 안함** | - | 아래 "칠판 구현 방향" 참조 |

**오브젝트 그룹 구조** (classroom.glb 내부):
```
MESAS (전체 책상 그룹)
├── MESA1 → MESA(책상) + SILLA(의자)
├── MESA2 → MESA.001 + SILLA.001
├── MESA3 → MESA.002 + SILLA.002
├── MESA4 → MESA.003 + SILLA.003
└── MESAFINAL → MESAFINAL:MESA + MESAFINAL:SILLA

MUEBLES (가구 그룹)
├── BASE_PROF (교탁)
├── PIZARRONES1 (칠판들) ← 사용 안함
└── 기타 가구...
```

**왜 VerseUp에서 가져오나?**
- 현재 LMS 맵에는 교육용 오브젝트가 거의 없음
- VerseUp은 사용자가 이전에 진행한 메타버스 교육 프로젝트로, 이미 적합한 오브젝트가 준비되어 있음
- 새로 모델링하는 것보다 기존 에셋 재활용이 효율적

---

### 칠판 구현 방향 (중요!)

**왜 GLB 칠판 오브젝트를 사용 안하나?**

사용자가 VerseUp 프로젝트에서 겪은 문제:
> "전에 verseUp 프로젝트에서 판서기능 넣었을 때 판서 컨트롤러 비율이랑 메타버스 내의 칠판 비율이 맞지 않아서 내가 판서하는 영역이랑 메타버스 내에서 실제로 판서가 되는 영역이 달라서 다 짤렸거든"

**문제 원인**:
- GLB 내 칠판 오브젝트의 UV 매핑이 복잡함
- 판서 컨트롤러(태블릿/웹)에서 그리는 영역 비율과 3D 칠판의 텍스처 비율이 불일치
- CanvasTexture를 적용했을 때 그린 내용이 잘리거나 왜곡됨

**해결책 (사용자 제안)**:
1. **1단계**: GLB 오브젝트 대신 Three.js `PlaneGeometry`로 새 메시 생성
2. **2단계**: 판서 컨트롤러와 비율을 정확히 맞춤 (예: 4:1 비율)
3. **3단계**: 비율이 맞으면 그 위에 칠판 텍스처/외관 적용

**구현 예시**:
```javascript
// 칠판 Plane 메시 (4:1 비율)
<mesh position={[교탁X, 교탁Y + 3, 교탁Z - 2]}>
  <planeGeometry args={[8, 2]} />  {/* 가로 8m, 세로 2m */}
  <meshBasicMaterial map={canvasTexture} side={THREE.DoubleSide} />
</mesh>
```

**배치 위치**: 교탁 뒤쪽 공중에 띄움 (실제 칠판이 아닌 디스플레이 개념)

---

### 참고할 VerseUp 컴포넌트

| 파일 | 역할 | 참고 사항 |
|------|------|----------|
| `src/components/metaverse/InteractiveObject.jsx` | 의자/교탁 센서 | Rapier CuboidCollider로 영역 감지, onIntersectionEnter/Exit 사용 |
| `src/components/metaverse/Blackboard.jsx` | 칠판 CanvasTexture | Canvas 6144x1536 (4:1 비율), 270도 회전 적용 |
| `src/pages/WhiteboardController.jsx` | 판서 컨트롤러 UI | 태블릿/폰에서 터치로 그리기, Socket.IO로 실시간 전송 |

---

### 현재 상태

- ✅ FEATURES.md 내용 파악 완료
- ✅ 교육 체험존 위치 확정: `[84.78, 0.39, -93.63]`
- ✅ VerseUp classroom.glb 오브젝트 그룹명 파악 완료
- ✅ 칠판 구현 방향 결정 (Plane 메시 우선)
- ⏸️ **실제 구현 대기 중** - 사용자가 "아직 내 생각이니까 작업은 하지마"라고 함

---

### 다음 작업 (사용자 승인 후 진행)

1. VerseUp `classroom.glb`에서 `MESA1`~`MESA4`, `BASE_PROF` 오브젝트 추출/로드
2. 교육 체험존 위치 `[84.78, 0.39, -93.63]`에 오브젝트 배치
3. `PlaneGeometry`로 칠판 메시 생성
4. 판서 컨트롤러와 칠판 비율 테스트
5. 비율 맞으면 칠판 외관(텍스처) 적용

---

### 주의사항

- **구현 전 반드시 사용자 승인 받을 것** - 사용자가 계획만 세우고 실제 작업은 하지 말라고 명시함
- FEATURES.md는 통합 계획서 역할 - 변경사항은 여기에 기록
- 칠판은 기존 오브젝트 사용 X, 반드시 Plane 메시로 새로 만들 것

---

---

## 목차

### Part 0: 프로젝트 오브젝트 현황
0. [맵 및 오브젝트 분석](#0-맵-및-오브젝트-분석)

### Part 1: 교육 기능
1. [강사 화면 공유 기능](#1-강사-화면-공유-기능)
2. [학생 화면 공유 보기 기능](#2-학생-화면-공유-보기-기능)
3. [학생 화면 캡처/공유 (학부모용)](#3-학생-화면-캡처공유-학부모용)
4. [판서 기능 (칠판)](#4-판서-기능-칠판)
5. [음성 채팅 (마이크)](#5-음성-채팅-마이크)
6. [텍스트 채팅](#6-텍스트-채팅)
7. [CCTV 기능](#7-cctv-기능)

### Part 2: 메타버스 기능
8. [의자/교탁 상호작용](#8-의자교탁-상호작용)
9. [포탈 시스템 (맵 이동)](#9-포탈-시스템-맵-이동)
10. [문 시스템 (강의실 입장)](#10-문-시스템-강의실-입장)
11. [멀티플레이어 동기화](#11-멀티플레이어-동기화)
12. [캐릭터 모델 및 애니메이션](#12-캐릭터-모델-및-애니메이션)
13. [카메라 시스템](#13-카메라-시스템)
14. [키보드 컨트롤](#14-키보드-컨트롤)
15. [플레이어 물리 및 이동](#15-플레이어-물리-및-이동)

### Part 3: 특수 기능
16. [학부모 참관 모드](#16-학부모-참관-모드)
17. [강의실 접근 권한 시스템](#17-강의실-접근-권한-시스템)

### Part 4: 개발 가이드
18. [환경 변수 설정](#18-환경-변수-설정)
19. [WebRTC 설정](#19-webrtc-설정)
20. [소켓 이벤트 전체 목록](#20-소켓-이벤트-전체-목록)
21. [테스트 및 디버깅](#21-테스트-및-디버깅)
22. [이식 시 주의사항](#22-이식-시-주의사항)

---

# Part 0: 프로젝트 오브젝트 현황

---

## 0. 맵 및 오브젝트 분석

교육 기능 구현을 위한 현재 맵 및 오브젝트 현황입니다.

### 사용 중인 맵

| 파일 | 용도 | 경로 |
|------|------|------|
| **PublicSquare-v4.glb** | 메인 맵 | `/resources/GameView/PublicSquare-v4.glb` |
| Level1Map.glb | 레벨1 맵 | `/resources/GameView/Level1Map.glb` |

### 맵 범위 (PublicSquare-v4)

- **X축**: -151 ~ 154 (약 305m)
- **Z축**: -245 ~ 17 (약 262m)
- **시작 지점**: 약 [0, 0, 0] 근처

### 교육용 오브젝트 현황

| 오브젝트 | 현재 개수 | 위치 | 비고 |
|---------|----------|------|------|
| 🪑 의자 (bench) | 2개 | `[46.4, 10.4, -233.9]` (v4), `[8.5, 0, -42.5]` (Level1) | 복제하여 사용 가능 |
| 🪵 테이블/교탁 | **0개** | - | 기본 Box로 생성 필요 |
| 📋 칠판 | **0개** | - | 기본 Plane으로 생성 필요 |
| 🖥️ 스크린/모니터 | **0개** | - | 기본 Plane으로 생성 필요 |
| ♟️ ChessBoard | 1개 | `[22.4, 6.3, -220.5]` | 체스판 (교육용 아님) |

### 교육 체험존 위치 (확정)

**정중앙 좌표**: `[84.78, 0.39, -93.63]`

```
교육 체험존 레이아웃
================================

        [칠판]           ← Z: -98 근처 (공중)
             │
          [교탁]         ← Z: -96 근처
             │
    [의자] [의자] [의자]  ← Z: -90 근처
    [의자] [의자] [의자]  ← Z: -87 근처

    중심 X: 84.78
    바닥 Y: 0.39
================================
```

### 생성 필요 오브젝트

| 오브젝트 | 생성 방식 | 크기 (예상) | 용도 |
|---------|----------|-------------|------|
| 교탁 | Box 메시 | 2 x 1 x 1 | 강사 위치, 화면 공유 트리거 |
| 스크린 | Plane 메시 | 8 x 4.5 | 화면 공유 표시 (VideoTexture) |
| 칠판 | **Plane 메시 (새로 생성)** | 4:1 비율 | 판서 기능 (CanvasTexture) |
| 의자 | bench 복제 | 기존 크기 | 학생 앉기 상호작용 |

### 칠판 구현 방향

**중요**: 기존 GLB 오브젝트(ChessBoard 등)를 사용하지 않고 **새로운 Plane 메시로 생성**해야 합니다.

**이유**:
- VerseUp 프로젝트에서 판서 컨트롤러와 메타버스 내 칠판의 비율이 맞지 않아 판서 내용이 짤리는 문제 발생
- GLB 내 오브젝트는 UV 매핑이 복잡하여 CanvasTexture 적용 시 왜곡 발생
- Plane 메시로 직접 생성하면 비율을 정확히 맞출 수 있음

**구현 방식**:
```javascript
// 칠판 Plane 메시 (4:1 비율)
<mesh position={[교탁X, 교탁Y + 3, 교탁Z - 2]}>
  <planeGeometry args={[8, 2]} />  {/* 가로 8m, 세로 2m (4:1 비율) */}
  <meshBasicMaterial map={canvasTexture} side={THREE.DoubleSide} />
</mesh>
```

**배치 위치**:
- 교탁 뒤쪽 공중에 떠있는 형태
- 강사 머리 위로 보이도록 Y축 오프셋 적용
- 실제 칠판 오브젝트가 아닌 **판서 기능 시연용 디스플레이** 개념

### 캐릭터 모델 (참고)

| 파일 | 용도 |
|------|------|
| OldClassy.glb | 캐릭터 스킨 |
| Suit.glb | 캐릭터 스킨 |
| Worker.glb | 캐릭터 스킨 |
| BaseCharacter.gltf | 기본 캐릭터 |

---

# Part 1: 교육 기능

---

## 1. 강사 화면 공유 기능

강사가 교탁에 서서 자신의 화면을 학생들에게 공유하는 기능입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/hooks/useScreenShare.js` | 화면 공유 시작/중지 로직 (WebRTC) |
| `src/components/metaverse/Screen.jsx` | 3D 씬 내 화면 표시 (VideoTexture) |
| `server/sockets/index.js` | 소켓 이벤트 핸들러 (screenshare:*) |

### 동작 흐름

```
[강사]                          [서버]                          [학생들]
   │                              │                               │
   │ screenshare:start ──────────>│                               │
   │                              │ screenshare:started ────────>│
   │                              │                               │
   │ (WebRTC Offer) ─────────────────────────────────────────────>│
   │                              │                               │
   │<─────────────────────────────────────────────── (WebRTC Answer)│
   │                              │                               │
   │ ICE Candidate 교환 ─────────────────────────────────────────>│
   │                              │                               │
   └────────────── 화면 스트림 전송 (P2P) ────────────────────────>│
```

### useScreenShare 훅

**파일**: `src/hooks/useScreenShare.js`

```javascript
import { useScreenShare } from '../hooks/useScreenShare'

// roomId: 방 ID, students: 학생 목록, enabled: 강사인지 여부
const screenShare = useScreenShare(roomId, students, isInstructor)
```

**반환값:**

| 속성/메서드 | 타입 | 설명 |
|------------|------|------|
| `isSharing` | boolean | 현재 화면 공유 중인지 |
| `error` | string \| null | 에러 메시지 |
| `startSharing()` | function | 화면 공유 시작 (getDisplayMedia 호출) |
| `stopSharing()` | function | 화면 공유 중지 |

**내부 동작:**
1. `getDisplayMedia`로 화면+시스템 오디오 캡처
2. 서버에 `screenshare:start` 이벤트 전송
3. 각 학생에게 WebRTC Offer 전송
4. Answer 수신 후 P2P 스트림 전송

**핵심 코드 (화면 캡처):**
```javascript
const stream = await navigator.mediaDevices.getDisplayMedia({
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    frameRate: { ideal: 30 },
  },
  audio: true, // 시스템 오디오 캡처
})

// 사용자가 브라우저 UI로 공유 중지 시 감지
stream.getVideoTracks()[0].onended = () => {
  stopSharing()
}
```

### 소켓 이벤트

| 이벤트 | 방향 | 데이터 | 설명 |
|--------|------|--------|------|
| `screenshare:start` | Client → Server | `{ roomId }` | 화면 공유 시작 알림 |
| `screenshare:started` | Server → Room | `{ teacherId, teacherSocketId, teacherName }` | 강사 정보 브로드캐스트 |
| `screenshare:stop` | Client → Server | `{ roomId }` | 화면 공유 종료 알림 |
| `screenshare:stopped` | Server → Room | `{}` | 종료 브로드캐스트 |
| `screenshare:offer` | Client → Client | `{ targetSocketId, offer }` | WebRTC Offer |
| `screenshare:answer` | Client → Client | `{ targetSocketId, answer }` | WebRTC Answer |
| `screenshare:ice-candidate` | Client → Client | `{ targetSocketId, candidate }` | ICE Candidate |

### 3D 화면 표시 (Screen.jsx)

**파일**: `src/components/metaverse/Screen.jsx`

```jsx
import Screen from './Screen.jsx'

<Screen
  position={[0, 5, -10]}  // 3D 공간 위치
  size={[8, 4.5]}         // 화면 크기 (가로, 세로)
  videoStream={stream}    // MediaStream 객체
/>
```

**핵심 코드:**
```javascript
// 비디오 엘리먼트 생성
const video = document.createElement('video')
video.srcObject = videoStream
video.muted = true  // 음소거 (오디오는 별도 처리)
video.play()

// 비디오 텍스처 생성
const texture = new THREE.VideoTexture(video)
texture.minFilter = THREE.LinearFilter
texture.magFilter = THREE.LinearFilter

// 3D 평면에 적용
<mesh>
  <planeGeometry args={[size[0], size[1]]} />
  <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
</mesh>
```

**개발 시 겪은 문제:**
- 비디오 자동재생 실패 → `muted` 속성 필수
- 텍스처 업데이트 안 됨 → `VideoTexture` 사용 (자동 업데이트)
- 화면 비율 깨짐 → `preserveAspectRatio` 로직 추가 필요

---

## 2. 학생 화면 공유 보기 기능

학생이 강사의 공유 화면을 오버레이로 시청하는 기능입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/hooks/useScreenReceive.js` | 화면 공유 수신 (WebRTC) |
| `src/components/metaverse/ScreenShareOverlay.jsx` | 드래그/리사이즈 가능한 오버레이 UI |

### useScreenReceive 훅

**파일**: `src/hooks/useScreenReceive.js`

```javascript
import { useScreenReceive } from '../hooks/useScreenReceive'

const screenReceive = useScreenReceive(roomId, !isInstructor)
```

**반환값:**

| 속성 | 타입 | 설명 |
|------|------|------|
| `teacherInfo` | object \| null | `{ teacherId, teacherSocketId, teacherName }` |
| `teacherStream` | MediaStream \| null | 강사 화면 스트림 |
| `isReceiving` | boolean | 스트림 수신 중인지 |

**내부 동작:**
1. `screenshare:started` 수신 → `teacherInfo` 저장
2. `screenshare:offer` 수신 → PeerConnection 생성, Answer 전송
3. `ontrack` 이벤트 → `teacherStream` 저장

### ScreenShareOverlay 컴포넌트

**파일**: `src/components/metaverse/ScreenShareOverlay.jsx`

학생이 "화면 보기" 버튼을 누르면 표시되는 드래그/리사이즈 가능한 오버레이입니다.

```jsx
<ScreenShareOverlay
  stream={screenReceive.teacherStream}
  teacherName={screenReceive.teacherInfo?.teacherName}
  onClose={() => setIsViewingScreen(false)}
/>
```

**주요 기능:**
- 드래그로 위치 이동 (헤더 드래그)
- 모서리/가장자리 드래그로 크기 조절
- 최소화 버튼 (축소)
- 전체화면 버튼
- 닫기 버튼
- 최소 크기 제한 (320x180)

**개발 시 겪은 문제:**
- 드래그 중 텍스트 선택 → `user-select: none` 적용
- 전체화면 API 호환성 → `requestFullscreen` + `webkitRequestFullscreen` 분기
- 비디오 비율 유지 → `object-fit: contain` 사용

---

## 3. 학생 화면 캡처/공유 (학부모용)

학생이 자신의 화면을 캡처하여 책상 위 모니터에 표시하고, 학부모에게 WebRTC로 스트리밍하는 기능입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/hooks/useStudentScreen.js` | 화면 캡처 및 WebRTC 스트리밍 |
| `src/components/metaverse/DeskMonitor.jsx` | 책상 위 3D 모니터 |

### useStudentScreen 훅

**파일**: `src/hooks/useStudentScreen.js`

```javascript
import { useStudentScreen } from '../hooks/useStudentScreen'

const studentScreen = useStudentScreen(!isInstructor, roomId)
```

**반환값:**

| 속성/메서드 | 타입 | 설명 |
|------------|------|------|
| `stream` | MediaStream \| null | 캡처된 화면 스트림 |
| `isSharing` | boolean | 공유 중인지 |
| `error` | string \| null | 에러 메시지 |
| `startCapture()` | function | 화면 캡처 시작 |
| `stopCapture()` | function | 화면 캡처 중지 |

**소켓 이벤트:**

| 이벤트 | 설명 |
|--------|------|
| `student:screen-consent` | 화면 공유 동의 상태 전송 |
| `student:screen-start` | 화면 공유 시작 알림 |
| `student:screen-stop` | 화면 공유 중지 알림 |
| `student:screen-request` | 부모가 화면 요청 시 수신 |
| `student:screen-offer` | 부모에게 WebRTC Offer 전송 |
| `student:screen-answer` | 부모로부터 Answer 수신 |
| `student:screen-ice` | ICE Candidate 교환 |

### DeskMonitor 컴포넌트

**파일**: `src/components/metaverse/DeskMonitor.jsx`

학생이 의자에 앉았을 때 책상 위에 나타나는 3D 모니터입니다.

```jsx
{isSitting && studentScreen.stream && sittingPosition && (
  <DeskMonitor
    stream={studentScreen.stream}
    position={[
      sittingPosition[0] + 0.9,  // 의자 위치 + 오프셋
      sittingPosition[1] + 1.9,
      sittingPosition[2]
    ]}
  />
)}
```

---

## 4. 판서 기능 (칠판)

강사가 태블릿/모바일에서 그림을 그리면 3D 칠판에 실시간으로 표시되는 기능입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/Blackboard.jsx` | 3D 칠판 (Canvas Texture) |
| `src/pages/WhiteboardController.jsx` | 태블릿용 그리기 UI |
| `server/sockets/index.js` | 소켓 이벤트 핸들러 (whiteboard:*) |

### 동작 흐름

```
[태블릿 컨트롤러]                [서버]                     [메타버스 칠판]
        │                          │                            │
        │ whiteboard:draw ────────>│                            │
        │ (fromX, fromY,           │ whiteboard:draw ──────────>│
        │  toX, toY, color,        │                            │
        │  lineWidth, tool)        │                            │
        │                          │                            │
        │                          │            Canvas에 선 그리기
        │                          │            CanvasTexture 업데이트
```

### Blackboard 컴포넌트

**파일**: `src/components/metaverse/Blackboard.jsx`

```jsx
import Blackboard from './Blackboard.jsx'

<Blackboard
  targetMesh={blackboardMeshRef.current}  // 칠판으로 사용할 3D 메시
  roomId={roomId}
/>
```

**핵심 코드:**
```javascript
// 1. 고해상도 Canvas 생성
const canvas = document.createElement('canvas')
canvas.width = 6144   // 2048 * 3 (UV 스케일 대응)
canvas.height = 1536

// 2. CanvasTexture로 변환
const texture = new THREE.CanvasTexture(canvas)
texture.rotation = (Math.PI / 2) + Math.PI  // 270도 회전 (모델 UV에 맞춤)
texture.center.set(0.5, 0.5)

// 3. 기존 메시의 재질을 교체
targetMesh.material = new THREE.MeshBasicMaterial({
  map: texture,
  toneMapped: false,
})

// 4. 소켓으로 그리기 데이터 수신 시
socketService.on('whiteboard:draw', (drawData) => {
  const ctx = canvas.getContext('2d')

  // 좌표 변환 (0~1 비율 → 캔버스 픽셀)
  const fromX = drawData.fromX * canvas.width
  const fromY = drawData.fromY * canvas.height
  const toX = drawData.toX * canvas.width
  const toY = drawData.toY * canvas.height

  ctx.strokeStyle = drawData.tool === 'eraser' ? '#1a1a2e' : drawData.color
  ctx.lineWidth = drawData.lineWidth * (canvas.width / 1024)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(fromX, fromY)
  ctx.lineTo(toX, toY)
  ctx.stroke()

  texture.needsUpdate = true  // 텍스처 업데이트 플래그
})
```

### 소켓 이벤트

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `whiteboard:start` | `{ roomId }` | 판서 세션 시작 |
| `whiteboard:started` | `{}` | 세션 시작 브로드캐스트 |
| `whiteboard:draw` | drawData (아래 참고) | 그리기 데이터 전송/수신 |
| `whiteboard:clear` | `{ roomId }` | 칠판 지우기 |
| `whiteboard:cleared` | `{}` | 지우기 브로드캐스트 |
| `whiteboard:stop` | `{ roomId }` | 판서 세션 종료 |

### drawData 구조

```javascript
{
  fromX: 0.0~1.0,      // 시작점 X (비율)
  fromY: 0.0~1.0,      // 시작점 Y (비율)
  toX: 0.0~1.0,        // 끝점 X (비율)
  toY: 0.0~1.0,        // 끝점 Y (비율)
  color: '#ffffff',    // 색상
  lineWidth: 5,        // 선 굵기
  tool: 'pen' | 'eraser'  // 도구
}
```

### 태블릿 컨트롤러

**URL**: `/whiteboard-controller?room={roomId}`

강사가 태블릿/폰에서 이 URL로 접속하면 터치로 그림을 그릴 수 있습니다.

**개발 시 겪은 문제:**
- 캔버스 좌표와 3D UV 좌표 불일치 → 회전/스케일 조정 필요
- 터치 이벤트 vs 마우스 이벤트 → 둘 다 처리
- 고해상도 캔버스 메모리 → 적절한 크기 타협 (6144x1536)

---

## 5. 음성 채팅 (마이크)

방에 있는 모든 사용자 간 실시간 음성 통화 기능입니다 (Mesh P2P 방식).

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/hooks/useVoiceChat.js` | 음성 채팅 로직 (WebRTC) |
| `src/utils/webrtc.js` | RTCPeerConnection 설정 |
| `server/sockets/index.js` | 소켓 이벤트 핸들러 (voice:*) |

### useVoiceChat 훅

**파일**: `src/hooks/useVoiceChat.js`

```javascript
import { useVoiceChat } from '../hooks/useVoiceChat'

const voiceChat = useVoiceChat(roomId, students, !isParentObserver)
```

**반환값:**

| 속성/메서드 | 타입 | 설명 |
|------------|------|------|
| `isMicOn` | boolean | 마이크 켜짐 여부 |
| `error` | string \| null | 에러 메시지 |
| `connections` | Map | socketId → connectionInfo |
| `turnOnMic()` | function | 마이크 켜기 (권한 요청) |
| `turnOffMic()` | function | 마이크 끄기 |

### 동작 흐름 (Mesh P2P)

```
[사용자 A]                    [사용자 B]                    [사용자 C]
    │                            │                            │
    │ ──── WebRTC 연결 ────────>│                            │
    │<──── WebRTC 연결 ─────────│                            │
    │                            │                            │
    │ ────────────── WebRTC 연결 ───────────────────────────>│
    │<───────────── WebRTC 연결 ────────────────────────────│
    │                            │                            │
    │                            │ ──── WebRTC 연결 ────────>│
    │                            │<──── WebRTC 연결 ─────────│
```

모든 사용자가 서로 직접 P2P 연결을 맺습니다. (N명이면 N*(N-1)/2 연결)

### 소켓 이벤트

| 이벤트 | 데이터 | 설명 |
|--------|--------|------|
| `voice:offer` | `{ targetSocketId, offer }` | WebRTC Offer 전송 |
| `voice:answer` | `{ targetSocketId, answer }` | WebRTC Answer 전송 |
| `voice:ice-candidate` | `{ targetSocketId, candidate }` | ICE Candidate 전송 |

### 오디오 설정

```javascript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,    // 에코 제거
    noiseSuppression: true,    // 노이즈 제거
    autoGainControl: true,     // 자동 게인 조절
  },
  video: false,
})
```

### 원격 오디오 재생

```javascript
// Audio 엘리먼트 생성 및 자동 재생
const audioElement = new Audio()
audioElement.autoplay = true
audioElement.srcObject = remoteStream

// Map에 저장 (관리용)
audioElementsRef.current.set(targetSocketId, audioElement)
```

**개발 시 겪은 문제:**
- 크롬 자동재생 정책 → `autoplay` 속성만으로 충분 (오디오는 허용)
- 연결 끊김 감지 → `onconnectionstatechange` 이벤트 활용
- 새 사용자 입장 시 연결 → `otherUsers` 변경 감지하여 자동 연결

---

## 6. 텍스트 채팅

방에 있는 모든 사용자 간 실시간 텍스트 채팅 기능입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/hooks/useChat.js` | 채팅 로직 |
| `src/components/metaverse/ChatBox.jsx` | 게임 스타일 채팅 UI |
| `server/sockets/index.js` | 소켓 이벤트 핸들러 (chat:*) |

### useChat 훅

**파일**: `src/hooks/useChat.js`

```javascript
import { useChat } from '../hooks/useChat'

const chat = useChat(roomId, !isParentObserver)
```

**반환값:**

| 속성/메서드 | 타입 | 설명 |
|------------|------|------|
| `messages` | array | 메시지 배열 (최근 8개) |
| `isInputActive` | boolean | 입력창 활성화 여부 |
| `inputText` | string | 현재 입력 텍스트 |
| `messagesEndRef` | ref | 자동 스크롤용 ref |
| `sendMessage()` | function | 메시지 전송 |
| `activateInput()` | function | 입력창 활성화 |
| `deactivateInput()` | function | 입력창 비활성화 |
| `handleInputChange(text)` | function | 입력 텍스트 변경 |

### ChatBox 컴포넌트

**파일**: `src/components/metaverse/ChatBox.jsx`

게임 스타일의 채팅 UI입니다.

```jsx
<ChatBox
  messages={chat.messages}
  isInputActive={chat.isInputActive}
  inputText={chat.inputText}
  messagesEndRef={chat.messagesEndRef}
  onInputChange={chat.handleInputChange}
  onSendMessage={chat.sendMessage}
  onActivateInput={chat.activateInput}
  onDeactivateInput={chat.deactivateInput}
/>
```

**주요 기능:**
- Enter 키로 입력창 활성화
- ESC 키로 입력 취소
- 30초 후 메시지 자동 페이드 아웃
- 시스템 메시지 (입장/퇴장 알림)
- 최대 8개 메시지만 표시 (오래된 것부터 삭제)

**메시지 구조:**
```javascript
{
  id: 'timestamp-socketId',
  userId: 'user-id',
  userName: '사용자 이름',
  message: '메시지 내용',
  timestamp: '2025-01-20T12:00:00.000Z',
  type: 'text' | 'system'
}
```

**개발 시 겪은 문제:**
- 채팅 입력 중 WASD 이동 → `isInputActive` 상태로 키 입력 차단
- 메시지 누적으로 메모리 증가 → 최대 8개만 유지
- 페이드 아웃 타이밍 → `setInterval`로 현재 시간 업데이트

---

## 7. CCTV 기능

강사가 CCTV를 켜면 학부모가 강의실 영상을 시청할 수 있는 기능입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/CCTVCamera.jsx` | CCTV 카메라 및 스트리밍 |

### CCTVCamera 컴포넌트

**파일**: `src/components/metaverse/CCTVCamera.jsx`

```jsx
<CCTVCamera
  classroomId={classroomId}
  isEnabled={isCCTVEnabled}
  onStreamReady={(stream) => handleCCTVStream(stream)}
/>
```

**핵심 코드:**
```javascript
// WebGL 캔버스 스트림 캡처
const canvas = gl.domElement
const stream = canvas.captureStream(30) // 30 FPS

// 서버에 CCTV 활성화 알림
socketService.emit('cctv:enable', { classroomId })
```

### CCTVCameraIndicator 컴포넌트

3D 씬에 CCTV 카메라 모델을 표시합니다.

```jsx
<CCTVCameraIndicator
  position={[0, 5, -15]}  // 교실 뒷벽
  isActive={isCCTVEnabled}
/>
```

### 소켓 이벤트

| 이벤트 | 설명 |
|--------|------|
| `cctv:enable` | CCTV 활성화 |
| `cctv:disable` | CCTV 비활성화 |
| `cctv:viewer-joined` | 학부모가 시청 시작 |

---

# Part 2: 메타버스 기능

---

## 8. 의자/교탁 상호작용

3D 공간에서 의자에 앉거나 교탁에 서는 기능입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/InteractiveObject.jsx` | 상호작용 영역 센서 |
| `src/components/metaverse/Player.jsx` | 플레이어 앉기/서기 로직 |
| `src/components/metaverse/MetaverseScene.jsx` | 상호작용 처리 |

### InteractiveObject 컴포넌트

**파일**: `src/components/metaverse/InteractiveObject.jsx`

Rapier 물리 엔진의 센서 콜라이더를 사용합니다.

```jsx
import InteractiveObject from './InteractiveObject.jsx'

<InteractiveObject
  position={[0, 0, 0]}           // 센서 위치
  sittingPosition={[0, 0.5, 0]}  // 실제 앉는 위치
  size={[1, 1, 1]}               // 센서 크기
  objectId="chair-1"             // 고유 ID
  label="의자에 앉기"             // UI 표시 텍스트
  type="sit"                     // 'sit' | 'stand'
  onNearChange={handleNearChange}  // 진입/퇴장 콜백
/>
```

**Props:**

| Prop | 타입 | 설명 |
|------|------|------|
| `position` | [x, y, z] | 센서 콜라이더 위치 |
| `sittingPosition` | [x, y, z] | 실제로 앉는 위치 |
| `size` | [w, h, d] | 센서 크기 |
| `objectId` | string | 고유 식별자 |
| `label` | string | UI에 표시할 텍스트 |
| `type` | 'sit' \| 'stand' | 의자/교탁 구분 |
| `onNearChange` | function | 진입/퇴장 콜백 |

### 동작 흐름

```
1. 플레이어가 InteractiveObject 센서 영역에 진입
   └─> onIntersectionEnter 트리거
   └─> onNearChange({ isNear: true, objectId, label, type, position })

2. UI에 "F 키를 눌러 상호작용" 표시

3. F 키 누름
   └─> handleObjectInteract(objectId, type, position) 호출
   └─> playerRef.current.sit(position, type) 호출

4. Player.jsx에서 앉기 처리
   └─> RigidBody를 kinematic으로 변경 (물리 무시)
   └─> 지정된 위치로 텔레포트
   └─> 방향 설정 (의자: +X, 교탁: -X)
```

### Player 앉기/서기 메서드

```javascript
// Player ref를 통해 접근
const playerRef = useRef(null)

// 앉기
playerRef.current.sit([x, y, z], 'sit')   // 의자 - +X 방향 바라봄
playerRef.current.sit([x, y, z], 'stand') // 교탁 - -X 방향 바라봄

// 일어서기
playerRef.current.stand()

// 상태 확인
playerRef.current.isSitting()  // boolean
```

**핵심 코드 (Player.jsx):**
```javascript
sit: (position, type) => {
  // type에 따라 바라보는 방향 설정
  let targetRotation
  if (type === 'sit') {
    // 의자: +X 방향 (90도)
    targetRotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      Math.PI / 2
    )
  } else if (type === 'stand') {
    // 교탁: -X 방향 (-90도)
    targetRotation = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      -Math.PI / 2
    )
  }

  // RigidBody를 kinematic으로 변경 (물리 충돌 무시)
  bodyRef.current.setBodyType(1, true)  // 1 = KinematicPositionBased

  // 앉는 위치로 텔레포트
  bodyRef.current.setTranslation({ x: position[0], y: position[1], z: position[2] }, true)
  bodyRef.current.setRotation({ x, y, z, w }, true)
  bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)  // 속도 초기화
  bodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)  // 각속도 초기화
}

stand: () => {
  // 의자 앞으로 이동 (끼지 않도록)
  const currentPos = bodyRef.current.translation()
  bodyRef.current.setTranslation({
    x: currentPos.x,
    y: currentPos.y,
    z: currentPos.z + 0.8  // 앞으로 0.8 이동
  }, true)

  // RigidBody를 다시 dynamic으로 변경
  bodyRef.current.setBodyType(0, true)  // 0 = Dynamic
}
```

**개발 시 겪은 문제:**
- 앉은 후 물리 충돌로 튕겨나감 → `setBodyType(1)` (kinematic)으로 변경
- 일어설 때 의자에 끼임 → 일어설 때 앞으로 0.8 이동
- 앉은 상태에서 회전 → `setAngvel({ x: 0, y: 0, z: 0 })` 으로 고정

---

## 9. 포탈 시스템 (맵 이동)

맵 간 이동을 위한 포탈 시스템입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/Portal.jsx` | 포탈 컴포넌트 |
| `src/components/metaverse/MapModel.jsx` | 맵 모델 + 포탈 배치 |

### Portal 컴포넌트

**파일**: `src/components/metaverse/Portal.jsx`

```jsx
import Portal from './Portal.jsx'

<Portal
  position={[0, 0, 0]}
  size={[2, 3, 2]}
  targetMap="school"
  label="학교로 이동"
  onNearChange={handlePortalNearChange}
/>
```

**Props:**

| Prop | 타입 | 설명 |
|------|------|------|
| `position` | [x, y, z] | 포탈 위치 |
| `size` | [w, h, d] | 포탈 크기 |
| `targetMap` | string | 이동할 맵 이름 |
| `label` | string | UI에 표시할 텍스트 |
| `onNearChange` | function | 진입/퇴장 콜백 |

**동작:**
1. 센서 콜라이더로 플레이어 진입 감지
2. `onNearChange({ isNear: true, targetMap, label })` 호출
3. F 키 누르면 `handleMapChange(targetMap)` 호출
4. 맵 전환 + 플레이어 위치 리셋

---

## 10. 문 시스템 (강의실 입장)

강의실 입장/퇴장을 위한 문 시스템입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/Door.jsx` | 문 센서 컴포넌트 |
| `src/components/metaverse/MetaverseScene.jsx` | 문 상호작용 처리 |

### Door 컴포넌트

**파일**: `src/components/metaverse/Door.jsx`

```jsx
import Door from './Door.jsx'

<Door
  position={[-52.88, 1.5, -20.5]}
  size={[2, 3, 0.5]}
  doorId="door1_enter"
  label="강의실 A 입장"
  onNearChange={handleDoorNearChange}
/>
```

### 입장/퇴장 구분

- `doorId`가 `_enter`로 끝나면 입장 문
- `doorId`가 `_exit`로 끝나면 퇴장 문

### handleDoorEnter 로직

```javascript
const handleDoorEnter = async (doorId, teleportTo, playAnimation, isOpened) => {
  // 애니메이션 문 처리
  if (playAnimation) {
    playAnimation()
    return
  }

  // 텔레포트 처리
  if (teleportTo) {
    playerBodyRef.current.setTranslation({
      x: teleportTo[0],
      y: teleportTo[1],
      z: teleportTo[2]
    }, true)
    return
  }

  // 입장 처리 (권한 확인)
  if (doorId.endsWith('_enter')) {
    const baseDoorId = doorId.replace('_enter', '')

    // 강의실 A만 권한 확인
    if (baseDoorId === 'door1') {
      const response = await api.get(`/classrooms/${classroomAId}/check-access`)
      if (!response.hasAccess) {
        alert(response.message)
        return
      }
    }

    // 텔레포트
    const destination = enterDestinations[baseDoorId]
    playerBodyRef.current.setTranslation({ x, y, z }, true)
  }

  // 퇴장 처리 (항상 허용)
  if (doorId.endsWith('_exit')) {
    const destination = exitDestinations[baseDoorId]
    playerBodyRef.current.setTranslation({ x, y, z }, true)
  }
}
```

---

## 11. 멀티플레이어 동기화

다른 플레이어들의 위치/회전/애니메이션을 실시간으로 동기화합니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/OtherPlayer.jsx` | 다른 플레이어 렌더링 |
| `src/components/metaverse/MetaverseScene.jsx` | 플레이어 관리 |
| `server/sockets/index.js` | 소켓 이벤트 핸들러 (player:*) |

### 동작 흐름

```
[내 클라이언트]                 [서버]                    [다른 클라이언트]
      │                          │                            │
      │ player:move ────────────>│                            │
      │ (position, rotation,     │ player:moved ────────────>│
      │  animation)              │                            │
      │                          │                            │
      │                          │                            │
      │<───────────────────────── player:moved ──────────────│
      │                          │                            │
```

### 소켓 이벤트

| 이벤트 | 방향 | 데이터 |
|--------|------|--------|
| `player:move` | Client → Server | `{ roomId, position, rotation, animation }` |
| `player:moved` | Server → Room | `{ socketId, userId, user, position, rotation, animation }` |
| `room:users` | Server → Client | 입장 시 기존 사용자 목록 |
| `room:user-joined` | Server → Room | 새 사용자 입장 |
| `room:user-left` | Server → Room | 사용자 퇴장 |

### 위치 전송 최적화

```javascript
// 일정 거리 이상 이동했을 때만 전송 (네트워크 부하 감소)
const distance = Math.sqrt(
  Math.pow(position.x - lastPositionSentRef.current.x, 2) +
  Math.pow(position.y - lastPositionSentRef.current.y, 2) +
  Math.pow(position.z - lastPositionSentRef.current.z, 2)
)

if (distance > 0.1) {  // 0.1 이상 이동 시
  socketService.emit('player:move', {
    roomId,
    position: [position.x, position.y, position.z],
    rotation: rotationY,
    animation: playerRef.current?.isMoving?.() ? 'walk' : 'idle',
  })
  lastPositionSentRef.current = position
}
```

### OtherPlayer 컴포넌트

**파일**: `src/components/metaverse/OtherPlayer.jsx`

```jsx
<OtherPlayer
  key={player.socketId}
  socketId={player.socketId}
  user={player.user}
  position={player.position}      // [x, y, z]
  rotation={player.rotation}      // Y축 회전 (라디안)
  animation={player.animation}    // 'idle' | 'walk'
/>
```

**특징:**
- 위치/회전 보간 (lerp) 적용으로 부드러운 이동
- 이름표 Billboard (항상 카메라를 바라봄)
- CharacterModel 재사용

---

## 12. 캐릭터 모델 및 애니메이션

GLTF 캐릭터 모델 로딩 및 애니메이션 전환 시스템입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/CharacterModel.jsx` | 캐릭터 모델 및 애니메이션 |
| `public/models/BaseCharacter.gltf` | 캐릭터 모델 파일 |

### CharacterModel 컴포넌트

**파일**: `src/components/metaverse/CharacterModel.jsx`

```jsx
import CharacterModel from './CharacterModel.jsx'

<CharacterModel
  isMoving={isMoving}
  isSitting={isSitting}
  scale={0.8}
/>
```

**Props:**

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `isMoving` | boolean | false | 이동 중인지 |
| `isSitting` | boolean | false | 앉아있는지 |
| `scale` | number | 0.8 | 캐릭터 크기 |

### 애니메이션 전환 로직

```javascript
const IDLE = 'Idle'
const WALK = 'Walk'
const RUN = 'Run'
const SITDOWN = 'SitDown'

useEffect(() => {
  const idleAction = actions[IDLE]
  const walkAction = actions[WALK] || actions.Walking
  const runAction = actions[RUN]
  const sitAction = actions[SITDOWN]

  let targetAction
  if (isSitting) {
    targetAction = sitAction
    // SitDown은 한 번만 재생하고 마지막 프레임에서 멈춤
    targetAction.setLoop(THREE.LoopOnce, 1)
    targetAction.clampWhenFinished = true
  } else {
    targetAction = isMoving ? (runAction || walkAction) : idleAction
    targetAction.setLoop(THREE.LoopRepeat)
  }

  // 페이드 인/아웃으로 부드러운 전환
  targetAction.reset().fadeIn(0.3).play()
  others.forEach((act) => {
    if (act !== targetAction) act.fadeOut(0.3)
  })
}, [isMoving, isSitting, actions])
```

### 모델 복제 (멀티플레이어용)

```javascript
import { SkeletonUtils } from 'three-stdlib'

// GLTF 모델을 여러 인스턴스에서 사용할 때는 반드시 복제
const clonedScene = useMemo(() => {
  return SkeletonUtils.clone(scene)
}, [scene])
```

**중요: 애니메이션 액션 찾기**
```javascript
// ❌ 잘못된 방법 (순서 보장 안 됨)
const action = Object.values(actions)[0]

// ✅ 올바른 방법 (이름으로 찾기)
const action = actions['Idle']
const action = actions.Idle
```

---

## 13. 카메라 시스템

포인터 락 기반 3인칭/1인칭 카메라 시스템입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/ThirdPersonCamera.jsx` | 카메라 컴포넌트 |

### ThirdPersonCamera 컴포넌트

**파일**: `src/components/metaverse/ThirdPersonCamera.jsx`

```jsx
<ThirdPersonCamera
  target={playerRef}
  onCameraRotate={handleCameraRotate}
  distance={isFirstPerson ? 0 : 10}
  height={isFirstPerson ? 2.0 : 6}
/>
```

**Props:**

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `target` | ref | 필수 | 따라갈 대상 |
| `onCameraRotate` | function | - | 카메라 회전 각도 콜백 |
| `distance` | number | 10 | 카메라 거리 (0이면 1인칭) |
| `height` | number | 6 | 카메라 높이 |

### 동작 방식

1. **포인터 락**: 캔버스 클릭 시 마우스 커서 잠금
2. **마우스 이동**: 카메라 회전 (azimuth, elevation)
3. **ESC**: 포인터 락 해제
4. **1인칭/3인칭 전환**: V 키 또는 `distance` prop

### 핵심 코드

```javascript
// 포인터 락 설정
useEffect(() => {
  const handleClick = () => {
    canvas.requestPointerLock()
  }

  const handleMouseMove = (e) => {
    if (document.pointerLockElement === canvas) {
      targetAzimuth.current -= e.movementX * MOUSE_SENSITIVITY
      targetElevation.current += e.movementY * MOUSE_SENSITIVITY
      // 수직 각도 제한
      targetElevation.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetElevation.current))
    }
  }

  canvas.addEventListener('click', handleClick)
  document.addEventListener('mousemove', handleMouseMove)
}, [])

// 카메라 위치 계산 (3인칭)
useFrame(() => {
  const horizontalDistance = distance * Math.cos(currentElevation.current)
  const offsetX = horizontalDistance * Math.sin(currentAzimuth.current)
  const offsetZ = horizontalDistance * Math.cos(currentAzimuth.current)
  const offsetY = height + distance * Math.sin(currentElevation.current)

  const desiredPosition = new THREE.Vector3(
    targetPosition.x + offsetX,
    smoothTargetY.current + offsetY,
    targetPosition.z + offsetZ
  )

  // 부드러운 이동
  currentPosition.current.lerp(desiredPosition, xzLerpAlpha)
  camera.position.copy(currentPosition.current)
  camera.lookAt(targetPosition)

  // 플레이어에게 카메라 각도 전달 (이동 방향 계산용)
  onCameraRotate?.(currentAzimuth.current)
})
```

**설정 상수:**
```javascript
const DEFAULT_CAMERA_DISTANCE = 10
const DEFAULT_CAMERA_HEIGHT = 6
const SMOOTH_FACTOR_XZ = 5      // 수평 이동 부드러움
const SMOOTH_FACTOR_Y = 2       // 수직 이동 부드러움
const MOUSE_SENSITIVITY = 0.002
const ROTATION_SMOOTHING = 10   // 회전 스무딩
```

---

## 14. 키보드 컨트롤

WASD 이동, Shift 달리기 등 키보드 입력을 처리하는 커스텀 훅입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/useKeyboardControls.js` | 키보드 입력 훅 |

### useKeyboardControls 훅

**파일**: `src/components/metaverse/useKeyboardControls.js`

```javascript
import { useKeyboardControls } from './useKeyboardControls.js'

const { forward, backward, left, right, shift, jump, log } = useKeyboardControls(isInputDisabled)
```

**반환값:**

| 키 | 타입 | 키 바인딩 |
|----|------|----------|
| `forward` | boolean | W, ArrowUp |
| `backward` | boolean | S, ArrowDown |
| `left` | boolean | A, ArrowLeft |
| `right` | boolean | D, ArrowRight |
| `shift` | boolean | ShiftLeft, ShiftRight |
| `jump` | boolean | Space |
| `log` | boolean | C |

**특징:**
- `isInputDisabled`가 true면 모든 입력 무시 (채팅 입력 중 등)
- `keydown`/`keyup` 이벤트로 상태 관리
- Space 키는 `preventDefault()` 호출 (페이지 스크롤 방지)

---

## 15. 플레이어 물리 및 이동

Rapier 물리 엔진 기반 플레이어 이동 시스템입니다.

### 관련 파일

| 파일 | 역할 |
|------|------|
| `src/components/metaverse/Player.jsx` | 플레이어 컴포넌트 |

### 물리 설정

```jsx
<RigidBody
  ref={bodyRef}
  type="dynamic"
  colliders={false}
  position={START_POS}
  enabledRotations={[false, true, false]}  // Y축만 회전
  mass={1}
  linearDamping={0.5}
>
  <CapsuleCollider
    args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]}
    position={[0, CAPSULE_Y_OFFSET, 0]}
    friction={1}
    restitution={0}
  />
</RigidBody>
```

### 맵별 설정

```javascript
const MAP_SETTINGS = {
  main: {
    startPosition: [-1.91, 2, 32.55],
    characterScale: 0.8,
    capsuleHalfHeight: 0.8,
    capsuleRadius: 0.52,
    capsuleYOffset: 1.28,
  },
  school: {
    startPosition: [-1.32, 2, -14.63],
    characterScale: 0.8,
    capsuleHalfHeight: 0.8,
    capsuleRadius: 0.52,
    capsuleYOffset: 1.28,
  },
}
```

### 이동 속도

```javascript
const WALK_SPEED = 8
const RUN_SPEED = 18
const STEP_UP_SPEED = 4  // 계단 오르기 속도
```

### 이동 로직

```javascript
useFrame(() => {
  // 카메라 기준 방향 벡터
  const direction = new THREE.Vector3()
  if (forward) direction.z -= 1
  if (backward) direction.z += 1
  if (left) direction.x -= 1
  if (right) direction.x += 1

  if (direction.lengthSq() > 0) {
    direction.normalize()

    // 카메라 각도만큼 방향 벡터를 회전
    const cameraAngle = cameraAngleRef.current
    const rotatedDirection = new THREE.Vector3()
    rotatedDirection.x = direction.x * Math.cos(cameraAngle) + direction.z * Math.sin(cameraAngle)
    rotatedDirection.z = direction.z * Math.cos(cameraAngle) - direction.x * Math.sin(cameraAngle)

    // 캐릭터가 이동 방향을 바라보도록
    const targetAngle = Math.atan2(rotatedDirection.x, rotatedDirection.z)
    const targetQuaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), targetAngle)
    currentRotationRef.current.slerp(targetQuaternion, 0.25)

    // 계단 감지 (막혀있으면 위로 밀어줌)
    const speed = shift ? RUN_SPEED : WALK_SPEED
    const actualSpeed = Math.sqrt(linvel.x ** 2 + linvel.z ** 2)
    const isBlocked = actualSpeed < speed * 0.45
    const isGrounded = Math.abs(linvel.y) < 2

    let yVel = linvel.y
    if (isBlocked && isGrounded) {
      yVel = Math.max(linvel.y, STEP_UP_SPEED)
    }

    // 속도 설정
    body.setLinvel({
      x: rotatedDirection.x * speed,
      y: yVel,
      z: rotatedDirection.z * speed,
    }, true)
  }
})
```

### 리스폰 (낙사 방지)

```javascript
// 맵 밑으로 떨어졌을 때 자동 리스폰
if (pos.y < -3) {
  body.setTranslation({ x: START_POS[0], y: START_POS[1], z: START_POS[2] }, true)
  body.setLinvel({ x: 0, y: 0, z: 0 }, true)
}
```

---

# Part 3: 특수 기능

---

## 16. 학부모 참관 모드

학부모가 자녀의 수업을 투명하게 참관하는 기능입니다.

### URL 파라미터

```
/metaverse?mode=observer&studentId=xxx
```

### 참관 모드 특징

| 기능 | 참관자 |
|------|--------|
| 캐릭터 표시 | ❌ (투명) |
| 다른 사용자에게 보임 | ❌ |
| 채팅 전송 | ❌ (읽기만 가능) |
| 마이크 | ❌ |
| 의자/교탁 상호작용 | ❌ |
| 화면 공유 시청 | ✅ |
| 자녀 화면 보기 | ✅ |
| 이동 | ✅ |

### 참관자 감지 로직

```javascript
// URL 파라미터 확인
const isObserverMode = urlParams.get('mode') === 'observer'
const observerStudentId = urlParams.get('studentId')
const isParentObserver = isObserverMode && effectiveUser?.role === 'parent'

// 참관자는 캐릭터를 렌더링하지 않음
<group ref={characterRef} visible={!isFirstPerson && !isInvisible}>
```

### 서버 측 처리

```javascript
// 참관자는 브로드캐스트에서 제외
if (!user.isObserver) {
  io.to(roomId).emit('room:user-joined', { ... })
}

// 참관자는 다른 참관자를 볼 수 없음
const roomUsers = users.filter(u => !u.isObserver)
```

### 학생 위치 추적 (학부모용)

```javascript
// 학생이 위치 변경 시 부모에게 알림
socketService.emit('student:location-update', {
  classroomId: roomId,
  position: [x, y, z],
  locationName,  // '운동장', '복도', '강의실 A' 등
  mapType: currentMap,
  classroom: currentClassroom,
})
```

---

## 17. 강의실 접근 권한 시스템

강의실 입장 시 수강 신청 여부를 확인하는 시스템입니다.

### 동작 흐름

```
1. 문 센서 영역 진입
2. F 키 누름
3. API 호출: GET /classrooms/:id/check-access
4. hasAccess가 true면 입장, false면 alert
```

### API 응답 구조

```javascript
{
  hasAccess: boolean,
  reason: 'instructor' | 'enrolled' | 'admin' | 'not_enrolled',
  message: '접근 허용/거부 메시지'
}
```

### 클라이언트 처리

```javascript
if (baseDoorId === 'door1') {  // 강의실 A
  try {
    const response = await api.get(`/classrooms/${classroomAId}/check-access`)

    if (!response.hasAccess) {
      alert(response.message || '교실에 접근할 수 없습니다.')
      return
    }
  } catch (error) {
    if (error.response?.status === 401) {
      alert('로그인이 필요합니다.')
    }
    return
  }
}
```

---

# Part 4: 개발 가이드

---

## 18. 환경 변수 설정

### 프론트엔드 (.env)

```bash
# Vite 환경변수 (VITE_ 접두사 필수)
VITE_API_URL=http://localhost:3000
VITE_SOCKET_URL=http://localhost:3000
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx

# WebRTC TURN 서버 (선택)
VITE_TURN_SERVER_URL=turn:your-turn-server.com:3478
VITE_TURN_USERNAME=username
VITE_TURN_CREDENTIAL=password
```

### 백엔드 (.env)

```bash
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx

# JWT
JWT_SECRET=your-jwt-secret
```

---

## 19. WebRTC 설정

### ICE 서버 설정

**파일**: `src/utils/webrtc.js`

```javascript
export function getIceServers() {
  const iceServers = [
    // STUN 서버 (NAT 통과용)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]

  // TURN 서버 (Symmetric NAT 통과용)
  const turnUrl = import.meta.env.VITE_TURN_SERVER_URL
  if (turnUrl) {
    iceServers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    })
  } else {
    // 무료 공개 TURN 서버 (테스트/소규모용)
    iceServers.push(
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      }
    )
  }

  return iceServers
}

export function getRTCConfiguration() {
  return {
    iceServers: getIceServers(),
    iceCandidatePoolSize: 10,
  }
}
```

### TURN 서버 필요 상황

- 대칭 NAT (Symmetric NAT) 뒤에 있는 사용자
- 기업 방화벽 뒤에 있는 사용자
- 모바일 네트워크 (LTE/5G)

### 추천 TURN 서버 서비스

- Twilio STUN/TURN
- Xirsys
- Metered.ca (무료 플랜 있음)
- 자체 coturn 서버

---

## 20. 소켓 이벤트 전체 목록

### 방 관리

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `user:join` | C→S | 사용자 입장 |
| `user:joined` | S→C | 입장 확인 |
| `room:users` | S→C | 방 사용자 목록 |
| `room:user-joined` | S→Room | 새 사용자 입장 브로드캐스트 |
| `room:user-left` | S→Room | 사용자 퇴장 브로드캐스트 |
| `room:leave` | C→S | 방 퇴장 |

### 플레이어 동기화

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `player:move` | C→S | 위치/회전/애니메이션 전송 |
| `player:moved` | S→Room | 다른 플레이어에게 브로드캐스트 |
| `location:change` | C→S | 위치 변경 (학교/강의실) |
| `location:entered` | S→Room | 입장 알림 브로드캐스트 |

### 화면 공유 (강사)

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `screenshare:start` | C→S | 공유 시작 |
| `screenshare:started` | S→Room | 강사 정보 브로드캐스트 |
| `screenshare:stop` | C→S | 공유 중지 |
| `screenshare:stopped` | S→Room | 중지 브로드캐스트 |
| `screenshare:offer` | C→C | WebRTC Offer |
| `screenshare:answer` | C→C | WebRTC Answer |
| `screenshare:ice-candidate` | C→C | ICE Candidate |

### 음성 채팅

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `voice:offer` | C→C | WebRTC Offer |
| `voice:answer` | C→C | WebRTC Answer |
| `voice:ice-candidate` | C→C | ICE Candidate |

### 텍스트 채팅

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `chat:message` | C→S | 메시지 전송 |
| `chat:message` | S→Room | 메시지 브로드캐스트 |

### 판서

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `whiteboard:start` | C→S | 판서 시작 |
| `whiteboard:started` | S→Room | 시작 브로드캐스트 |
| `whiteboard:draw` | C→S→Room | 그리기 데이터 |
| `whiteboard:clear` | C→S | 지우기 |
| `whiteboard:cleared` | S→Room | 지우기 브로드캐스트 |
| `whiteboard:stop` | C→S | 판서 종료 |

### 학생 화면 (학부모용)

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `student:screen-consent` | C→S | 공유 동의 |
| `student:screen-start` | C→S | 공유 시작 |
| `student:screen-stop` | C→S | 공유 중지 |
| `student:screen-request` | S→C | 부모가 화면 요청 |
| `student:screen-offer` | C→C | WebRTC Offer |
| `student:screen-answer` | C→C | WebRTC Answer |
| `student:screen-ice` | C→C | ICE Candidate |
| `student:location-update` | C→S | 학생 위치 업데이트 |

### CCTV

| 이벤트 | 방향 | 설명 |
|--------|------|------|
| `cctv:enable` | C→S | CCTV 활성화 |
| `cctv:disable` | C→S | CCTV 비활성화 |
| `cctv:viewer-joined` | S→C | 시청자 입장 |

---

## 21. 테스트 및 디버깅

### URL 파라미터 테스트

```bash
# 강사 테스트 (개발 환경에서만 동작)
http://localhost:5173/metaverse?role=instructor

# 학생 테스트
http://localhost:5173/metaverse?role=student

# 학부모 참관 모드
http://localhost:5173/metaverse?mode=observer&studentId=xxx
```

### Debug Info UI

메타버스 화면에서 "Debug 켜기" 버튼으로 다음 정보 확인:
- 플레이어 위치 (X, Y, Z)
- 현재 맵
- 앉기 상태
- 화면 공유 상태
- 마이크 상태
- 방 사용자 목록

### 콘솔 로그 프리픽스

| 프리픽스 | 영역 |
|---------|------|
| 🎤 | 음성 채팅 |
| 📺 | 화면 공유 |
| 💬 | 텍스트 채팅 |
| 🎨 | 판서 |
| 🖥️ | 학생 화면 |
| 👥 | 멀티플레이어 |
| 🔌 | 소켓 연결 |
| 📍 | 위치/맵 |
| 🚪 | 문/포탈 |
| 💺 | 앉기/서기 |

---

## 22. 이식 시 주의사항

### 필수 의존성

**프론트엔드:**
```json
{
  "dependencies": {
    "react": "^19.x",
    "three": "^0.x",
    "@react-three/fiber": "^8.x",
    "@react-three/drei": "^9.x",
    "@react-three/rapier": "^1.x",
    "three-stdlib": "^2.x",
    "socket.io-client": "^4.x",
    "zustand": "^4.x"
  }
}
```

**백엔드:**
```json
{
  "dependencies": {
    "express": "^5.x",
    "socket.io": "^4.x",
    "@supabase/supabase-js": "^2.x"
  }
}
```

### 모델 파일 경로

```
public/
└── models/
    └── BaseCharacter.gltf  # 캐릭터 모델 (애니메이션 포함)
```

### 애니메이션 이름 규칙

GLTF 모델에 다음 이름의 애니메이션이 있어야 합니다:
- `Idle` - 대기
- `Walk` 또는 `Walking` - 걷기
- `Run` - 달리기 (선택)
- `SitDown` - 앉기 (선택)

### 물리 설정 주의사항

```javascript
// Physics gravity 설정
<Physics gravity={[0, -20, 0]}>

// 맵 로딩 전 물리 일시정지
<Physics paused={!isMapLoaded}>
```

### 포인터 락 주의사항

- 캔버스 클릭 시에만 포인터 락 요청 가능
- 사용자 제스처 없이는 자동 락 불가
- ESC 키로 해제됨 (브라우저 기본 동작)
- 메뉴 열 때도 해제 필요

### 소켓 연결 주의사항

```javascript
// 연결 대기 후 emit
await socketService.waitForConnection()
socketService.emit('event', data)

// 연결 상태 확인
const socket = socketService.getSocket()
if (socket?.connected) { ... }
```

### WebRTC 주의사항

- HTTPS 필수 (localhost 제외)
- 마이크/카메라 권한 요청 필요
- TURN 서버 없으면 일부 환경에서 연결 실패
- ICE Candidate 교환 완료 후에만 스트림 전송 가능

---

## 부록: 프로젝트 구조 요약

```
src/
├── components/
│   └── metaverse/
│       ├── MetaverseScene.jsx    # 메인 씬 (모든 것을 조합)
│       ├── Player.jsx            # 내 캐릭터
│       ├── OtherPlayer.jsx       # 다른 플레이어
│       ├── CharacterModel.jsx    # 캐릭터 모델/애니메이션
│       ├── ThirdPersonCamera.jsx # 카메라
│       ├── MapModel.jsx          # 맵 로딩/콜라이더
│       ├── Portal.jsx            # 포탈
│       ├── Door.jsx              # 문
│       ├── InteractiveObject.jsx # 의자/교탁
│       ├── Screen.jsx            # 화면 공유 3D 화면
│       ├── ScreenShareOverlay.jsx# 화면 공유 오버레이
│       ├── DeskMonitor.jsx       # 책상 위 모니터
│       ├── Blackboard.jsx        # 칠판
│       ├── ChatBox.jsx           # 채팅 UI
│       ├── MetaverseUI.jsx       # 메뉴 UI
│       ├── CCTVCamera.jsx        # CCTV
│       └── useKeyboardControls.js# 키보드 입력
│
├── hooks/
│   ├── useScreenShare.js         # 강사 화면 공유
│   ├── useScreenReceive.js       # 학생 화면 수신
│   ├── useStudentScreen.js       # 학생 화면 캡처
│   ├── useVoiceChat.js           # 음성 채팅
│   └── useChat.js                # 텍스트 채팅
│
├── services/
│   ├── socket.js                 # Socket.IO 클라이언트
│   └── api.js                    # REST API 클라이언트
│
├── utils/
│   └── webrtc.js                 # WebRTC 설정
│
└── stores/
    └── authStore.js              # 인증 상태 (Zustand)

server/
├── sockets/
│   └── index.js                  # 소켓 이벤트 핸들러
└── routes/
    └── classrooms.js             # 교실 API (접근 권한 등)
```
