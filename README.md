# LX판토스 클레임 관리 시스템

LX판토스의 설치·배송 관련 보험 클레임을 통합 관리하는 웹 애플리케이션입니다.
현장 접수부터 보험사 제출, 보고서 생성, 소송·소비자원 연동까지 클레임 전 과정을 단일 화면에서 처리합니다.

---

## 기술 스택

| 항목 | 내용 |
|---|---|
| 프론트엔드 | Vanilla JS · HTML · CSS (빌드 도구 없음) |
| 백엔드 | Firebase Firestore (키-값 저장) + Firebase Storage (사진) |
| 문서 생성 | docxtemplater + PizZip (Word .docx 자동 생성) |
| 실행 방법 | 브라우저에서 `index.html` 파일을 직접 열면 됩니다 |

> 빌드 과정이 없습니다. npm, 번들러, TypeScript 변환 등을 추가하지 마세요.

---

## 파일 구조

```
lx-claim/
├── index.html              # 전체 UI (HTML + CSS + 인라인 SVG 아이콘)
├── app.js                  # 전체 애플리케이션 로직 (~4,200줄)
├── report_template_b64.js  # Word 보고서 템플릿 (base64 인코딩)
├── docxtemplater.js        # Word 문서 생성 라이브러리
├── imagemodule.js          # 현재 미사용 (이미지 삽입은 내부 OOXML 방식)
└── pizzip.min.js           # ZIP 처리 (docxtemplater 의존성)
```

### app.js 내부 구조

| 위치 (위→아래) | 내용 |
|---|---|
| 상단 | `renderPolicyCards`, `onDashInsChange` |
| `DB` IIFE | Firebase 추상화 레이어 (교체 시 이 블록만 수정) |
| 전역 상태 변수 | `claims`, `clients`, `insCompanies`, `productGroups`, `productCats` 등 |
| `defData()` | 앱 최초 실행 시 사용할 기본 마스터 데이터 |
| `load()` / `persist()` | Firestore 전체 읽기·쓰기 |
| 헬퍼 함수 | `$()`, `fmt만원()`, `uid()`, `genId()` 등 |
| 각 섹션 렌더·핸들러 | 대시보드, 클레임, EP, 보험사, 소액, 소비자원, 소송, 설정 |
| 사진 관련 | `uploadPhoto`, `loadClaimPhotos`, `renderPhotoUploadUI` |
| 보고서 | `downloadReport`, `injectImagesIntoDocx` |
| 초기화 | `DOMContentLoaded` → `DB.init()` → `load()` → `_initHandlers()` |

---

## 주요 기능

### 1. 대시보드
- 기간별(이번 달·분기·연도·전체) 클레임 현황 요약
- 처리 상태별·사고 유형별·제품 대분류별·제품군별 막대 차트
- 물류센터별 발생 현황
- **증권별 손해율 카드**: 보험 증권 한도 대비 지급+추산 합산 비율을 색상(녹색/주황/빨강)으로 표시

### 2. 클레임 목록
- 상태(접수/검토/처리/종결/면책/소송중/보류) 탭 필터
- 검색어·기간·고객사·담당자 복합 필터
- 행 클릭 시 상세 패널 열림

### 3. 클레임 접수 (신규/수정)
- 고객사 선택 → 대분류 → 제품군 연쇄 드롭다운
- 클레임 ID 자동 생성: `연도-대분류코드-제품코드-사고코드-순번` (예: `2026-HA-RF-D-001`)
- EP 시스템 데이터 자동 채우기 (설치일·기사명·기사코드)
- 보험사 자동 매핑 (고객사 → 보험사)
- 사진 업로드 (설치·피해·재방문·교육 슬롯별)
- Word 보고서 다운로드
- AI 분석 (원인·대응·내부검토·법적해석) — OpenAI API Key 필요

### 4. EP 연동
- 엑셀(.xlsx/.xls) 또는 CSV 업로드로 EP 레코드 파싱
- 컬럼 매핑 설정 저장 (고객명·주소·제품·설치일·기사명·기사코드)
- 클레임과 EP 레코드 자동 매칭 (주문번호 → 이름+날짜 순으로 fallback)

### 5. 보험사 관리
- 보험사별 증권 파일 업로드 (엑셀/CSV)
- 파일 파싱 후 미매칭 행 확인
- 신규 클레임 자동 생성 미리보기 → 일괄 등록

### 6. 소비자원 / 소송 / 소액클레임
- 각각 독립된 목록·등록·수정·삭제
- 클레임과 별도로 관리 (연계 없음)

### 7. 설정
| 서브메뉴 | 내용 |
|---|---|
| 고객사 | 이름·메모 등록·수정·삭제 |
| 보험사 | 이름·색상·메모 등록·수정·삭제 |
| 매핑 | 고객사 ↔ 보험사 연결 |
| 담당자 | 이름·직급·담당 영역 |
| 제품 관리 | 고객사 → 대분류 → 제품구분 3단계 트리 |
| 사고 유형 | 화재·누수·파손·대인·기타 등 코드 관리 |
| 주소록 | 물류센터·LM 정보 엑셀 업로드·행별 삭제 |

---

## 데이터 구조

### 전역 상태 변수 (in-memory)

| 변수 | 설명 |
|---|---|
| `clients` | `{id, name, memo}` |
| `insCompanies` | `{id, name, color, memo}` |
| `clientMapping` | `{clientId: insId}` 매핑 객체 |
| `assignees` | `{id, name, rank, area}` |
| `accidentTypes` | `{id, name, code}` |
| `productGroups` | `{id, name, code, desc, clientId}` — 대분류 |
| `productCats` | `{id, name, code, groupId, clientId}` — 제품구분 |
| `claims` | 클레임 전체 (구조는 아래 참고) |
| `epRecs` | EP 연동 레코드 |
| `insFiles` | `{[insId]: [{filename, uploadDate, rows}]}` |
| `addressbook` | `{lineTeam, logistics, bizType, bpName, lmName, lmEmail, teamLeader}` |

### 클레임 오브젝트 주요 필드

```js
{
  id,           // 자동생성: 2026-HA-RF-D-001
  clientId, client,
  pcat, pcatName,         // 제품구분 코드·명
  groupId, groupCode, groupName,  // 대분류
  name, phone, addr,
  product,      // 제품 모델명
  idate,        // 설치일
  tname, tid,   // 기사 이름·코드
  type, typeCode,         // 사고 유형
  assignee,     // 담당자
  amount,       // 추산 보험금
  survey,       // 조사비
  finalPayment, // 지급 보험금
  surveyOS,     // 조사비 OS
  status,       // 접수|검토|처리|종결|면책|소송중|보류
  insCoId,      // 보험사 ID
  insDate, date,
  logistics, lineteam,
  liability,    // 귀책 여부
  history,      // [{date, text}] 이력
  // 보고서 추가 필드
  accDate, career, model, damage, accPlace,
  causeDetail, customerReq, customerAmt,
  customerStmt, action, techStmt, reviewReq,
  eduPlace, eduTarget, eduContent, prevention,
}
```

### Firestore 저장 키 목록

| 키 | 데이터 |
|---|---|
| `cfg_clients` | 고객사 목록 |
| `cfg_ins` | 보험사 목록 |
| `cfg_map` | 고객사-보험사 매핑 |
| `cfg_asgn` | 담당자 목록 |
| `cfg_atypes` | 사고 유형 |
| `cfg_pgroups` | 제품 대분류 |
| `cfg_pcats` | 제품 구분 |
| `cls_v8` | 클레임 전체 |
| `ep_v8` | EP 레코드 |
| `ins_files_v8` | 보험사 파일 메타 |
| `tpl_v8` | 보고서 템플릿 설정 |
| `ca_v1` | 소비자원 사례 |
| `suit_v1` | 소송 목록 |
| `minor_v1` | 소액클레임 |
| `policy_v1` | 보험 증권 설정 |
| `cfg_addressbook` | 주소록 |
| `ep_col_map` | EP 컬럼 매핑 설정 |
| `photos_${claimId}` | 클레임 사진 base64 (보고서용) |

---

## Firebase 설정

`app.js` 상단 `DB` 블록 안의 `FIREBASE_CONFIG`에 프로젝트 정보가 하드코딩되어 있습니다.

```js
const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "lx-claim.firebaseapp.com",
  projectId: "lx-claim",
  storageBucket: "lx-claim.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

Firebase Console에서 **Firestore** 및 **Storage** 를 활성화해야 합니다.
Firestore 보안 규칙은 현재 인증 없이 읽기·쓰기 가능하도록 열려 있습니다. 운영 환경에서는 규칙을 강화하세요.

---

## AI 분석 기능

클레임 상세 화면에서 원인 분석·대응 방안·내부 검토·법적 해석 4가지 AI 리포트를 생성할 수 있습니다.
상단 API Key 입력란에 **OpenAI API Key** (`sk-...`)를 입력하면 활성화됩니다.
Key는 `localStorage`에 저장되며 서버로 전송되지 않습니다.

---

## 이벤트 처리 방식

전역 클릭 이벤트 하나로 모든 버튼을 처리합니다. `onclick` 어트리뷰트는 사용하지 않습니다.

```html
<!-- 버튼에 data-fn 속성 지정 -->
<button data-fn="saveClaim">저장</button>
<button data-fn="openPcatAddModal" data-group-id="pg1">+ 제품구분</button>
```

```js
// _initHandlers() 안의 FN 맵에 함수 등록
const FN = {
  saveClaim,
  openPcatAddModal: (el) => openPcatAddModal(el),
  // ...
};
document.addEventListener('click', e => {
  const fn = e.target.closest('[data-fn]')?.dataset.fn;
  if (fn && FN[fn]) FN[fn](e.target.closest('[data-fn]'));
});
```

새 버튼을 추가할 때는 반드시 `FN` 맵에 함께 등록해야 합니다.

---

## 보고서 생성

Word(.docx) 보고서는 `report_template_b64.js`의 템플릿에 데이터를 주입하는 방식입니다.

- 플레이스홀더 형식: `{{필드명}}`
- 사진은 CORS 문제로 `injectImagesIntoDocx` 함수에서 OOXML에 직접 삽입합니다
- 새 필드를 추가하면 템플릿 파일과 `downloadReport()` 안의 `data` 객체를 함께 수정하세요

### 사진 슬롯 (고정)

| 슬롯 | 개수 |
|---|---|
| 설치사진 | 4장 |
| 피해사진 | 4장 |
| 재방문사진 | 2장 |
| 교육사진 | 2장 |

슬롯을 추가하면 `renderPhotoUploadUI`와 `downloadReport`의 `slots` 배열을 함께 수정해야 합니다.

---

## DB 레이어 교체 방법

`app.js` 103–202행의 `DB` IIFE 본문만 교체하면 백엔드를 내부 서버로 바꿀 수 있습니다.
메서드 이름·시그니처·반환 타입은 반드시 유지해야 합니다.

| 메서드 | 역할 |
|---|---|
| `DB.init()` | 백엔드 초기화 |
| `DB.get(key, defaultVal)` | 키-값 읽기. 없으면 defaultVal 반환 |
| `DB.set(key, value)` | 키-값 쓰기 |
| `DB.uploadFile(claimId, slot, file)` | 사진 업로드 → URL 반환 |
| `DB.listFiles(claimId)` | `[{slot, url}]` 반환 |
| `DB.deleteFile(claimId, slot)` | 사진 삭제 |
| `DB.getPhotoData(claimId)` | base64 맵 반환 |
| `DB.setPhotoData(claimId, slot, data)` | base64 저장 (`data=null`이면 해당 슬롯 삭제) |

---

## 작업 규칙

- `DB` 블록 바깥에서 Firebase 객체(`firebase`, `_db`, `_storage`)를 직접 참조하지 않습니다.
- 상태 변경 후에는 반드시 `persist()`를 호출합니다.
- `persist()` 후에는 관련 렌더 함수를 호출해 화면을 갱신합니다.
- 버튼은 `data-fn` 방식으로 구현하고 `FN` 맵에 등록합니다. `onclick` 어트리뷰트는 사용하지 않습니다.
- 외부 라이브러리는 CDN 또는 로컬 파일로만 추가합니다 (`index.html`의 `<script>` 태그).
