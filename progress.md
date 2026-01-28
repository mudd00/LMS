# 교육 LMS 프로젝트 진행 상황

## 작업 날짜: 2025-01-27

---

## 완료된 작업

### 0. 의자/교탁 상호작용 기능 (2025-01-28 추가)

**구현 파일:**
- `src/components/education/InteractiveObject.jsx` - 상호작용 센서 컴포넌트
- `src/components/character/Character.jsx` - `sit()`, `stand()`, `isSitting()` 메서드 추가
- `src/components/map/EducationZone.jsx` - 의자/교탁에 InteractiveObject 배치
- `src/App.js` - F키 핸들러, 역할 기반 제한
- `src/App.css` - 상호작용 프롬프트 UI

**기능:**
- 의자 근처 접근 시: `[F] 의자에 앉기 (학생 전용)` UI 표시
- 교탁 근처 접근 시: `[F] 교탁에 서기 (강사 전용)` UI 표시
- F키로 앉기/서기 실행
- 앉은 상태에서 F키로 일어서기
- 역할 기반 제한 (`userRole`: 'student' | 'instructor')
- 앉은 상태에서는 이동 불가 (물리 kinematic 전환)

**InteractiveObject Props:**
| Prop | 타입 | 설명 |
|------|------|------|
| position | [x,y,z] | 센서 위치 |
| sittingPosition | [x,y,z] | 실제 앉는 위치 |
| size | [w,h,d] | 센서 크기 |
| objectId | string | 고유 ID |
| label | string | UI 텍스트 |
| type | 'sit' \| 'stand' | 의자/교탁 구분 |
| allowedRole | 'student' \| 'instructor' \| 'all' | 허용 역할 |

---

### 1. 교육 체험존 (Education Zone) 구축

**위치**: `[84.78, 0.39, -93.63]` (맵 내 빈 공간)

#### 오브젝트 배치
| 오브젝트 | 파일 | 스케일 | 위치 (상대) | 회전 |
|---------|------|--------|------------|------|
| 책상+의자 | `single_desk.glb` | 3 | Z +12 | 90도 |
| 교탁 | `classroom.glb` (BASE_PROF) | 0.85 | X +26, Z -8 | 90도 |
| 칠판 | Blackboard 컴포넌트 | 24x6 | Y +6, Z -28 | - |
| 칠판 프레임 | PlaneGeometry | 24.4x6.4 | Y +6, Z -28.01 | - |

#### 생성된 파일
- `public/resources/GameView/single_desk.glb` - Blender MCP로 classroom.glb에서 책상 1세트 추출
- `src/components/map/EducationZone.jsx` - 교육존 컴포넌트

---

### 2. 판서 기능 (Whiteboard/Drawing) 구현

#### 구성 요소

**Blackboard.jsx** (`src/components/education/Blackboard.jsx`)
- Canvas Texture 기반 3D 칠판
- 해상도: 2048x512 픽셀 (4:1 비율)
- BroadcastChannel로 그리기 데이터 수신
- useFrame으로 텍스처 실시간 업데이트

**WhiteboardController.jsx** (`src/pages/WhiteboardController.jsx`)
- 태블릿/스마트폰용 터치 최적화 판서 컨트롤러
- 기능:
  - 펜/지우개 도구
  - 7가지 색상 선택
  - 4단계 굵기 조절 (2, 5, 10, 15px)
  - 전체 지우기
- BroadcastChannel로 그리기 데이터 전송

**라우트**: `/whiteboard`

#### 동기화 방식
```
WhiteboardController ─── BroadcastChannel ───> Blackboard
     (전송)           'whiteboard-channel'       (수신)
```

- 좌표는 0~1 비율로 정규화하여 전송
- 수신 측에서 캔버스 크기에 맞게 변환

---

### 3. 판서 UI 버튼

#### 트리거 영역
- 위치: 칠판 앞 (Z -20)
- 크기: 30m x 10m x 20m
- 진입 시 "판서" 버튼 표시

#### 버튼 기능
- 클릭 시 팝업 표시
- 팝업 내용:
  - 판서 컨트롤러 URL 표시
  - 링크 복사 버튼
  - 새 창에서 열기 버튼

---

## 파일 구조

```
src/
├── components/
│   ├── education/
│   │   └── Blackboard.jsx          # 3D 칠판 컴포넌트 (NEW)
│   └── map/
│       ├── EducationZone.jsx       # 교육 체험존 (NEW)
│       └── Level1.jsx              # 칠판 트리거 콜백 추가
├── pages/
│   └── WhiteboardController.jsx    # 판서 컨트롤러 페이지 (NEW)
├── App.js                          # 판서 버튼/팝업 UI 추가
├── App.css                         # 판서 관련 스타일 추가
└── AppRouter.jsx                   # /whiteboard 라우트 추가

public/resources/GameView/
├── classroom.glb                   # 원본 교실 모델
└── single_desk.glb                 # 추출된 책상+의자 1세트 (NEW)
```

---

## 앞으로 해야 할 작업

### 우선순위 높음

1. **WebSocket 동기화 (선택사항)**
   - 현재: BroadcastChannel (같은 브라우저 내에서만 동작)
   - 개선: WebSocket으로 다른 기기 간 동기화 지원
   - multiplayerService 활용 가능

2. **판서 데이터 저장/불러오기**
   - 서버에 판서 내용 저장
   - 수업 재개 시 이전 내용 불러오기

3. **교육존 추가 기능**
   - 학생 좌석 추가 (여러 책상 배치)
   - 발표자 모드 (교탁 위치 표시)
   - 수업 시작/종료 시스템

### 우선순위 중간

4. **VerseUp 추가 기능 이식**
   - ~~의자/교탁 상호작용~~ ✅ (2025-01-28 완료)
   - 화면 공유 기능 (강사 → 학생)
   - 음성 채팅 기능
   - 포탈 시스템 (맵 이동)
   - 문 시스템 (강의실 입장/권한)

5. **판서 컨트롤러 개선**
   - 그리기 취소/다시하기 (Undo/Redo)
   - 도형 그리기 (직선, 사각형, 원)
   - 텍스트 입력

6. **UI/UX 개선**
   - 판서 버튼 아이콘 디자인
   - 컨트롤러 반응형 레이아웃 개선
   - 로딩 상태 표시

### 우선순위 낮음

7. **성능 최적화**
   - Canvas Texture 업데이트 최적화
   - 그리기 데이터 배치 전송

8. **접근성**
   - 키보드 단축키
   - 스크린 리더 지원

---

## 기술 스택 참고

| 기술 | 용도 |
|-----|------|
| React Three Fiber | 3D 렌더링 |
| Three.js CanvasTexture | 동적 텍스처 |
| BroadcastChannel API | 탭 간 통신 |
| Rapier Physics | 트리거 영역 감지 |
| Blender MCP | 3D 모델 편집 |

---

## 테스트 방법

1. `npm start`로 개발 서버 실행
2. 메인 페이지에서 로그인
3. 캐릭터를 교육존 (칠판 근처)으로 이동
4. 우측에 "판서" 버튼 확인
5. 버튼 클릭 → 팝업에서 "새 창에서 열기" 클릭
6. 판서 컨트롤러에서 그리기
7. 3D 칠판에 실시간 반영 확인

---

## 참고 사항

- 칠판 크기: 24m x 6m (1.5배 확대)
- 칠판 위치: Y +6 (지면에서 6m 높이)
- 트리거 영역은 칠판 앞쪽에 배치되어 있음
- BroadcastChannel은 같은 브라우저 내에서만 동작 (다른 기기 동기화는 WebSocket 필요)
