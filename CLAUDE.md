# LX판토스 클레임 관리 시스템

## 프로젝트 목적

LX판토스의 설치·배송 관련 보험 클레임을 통합 관리하는 웹 애플리케이션이다.
현장 접수부터 보험사 제출, 보고서 생성, 소송·소비자원 연동까지 클레임 전 과정을 단일 화면에서 처리한다.

주요 기능:
- 클레임 목록 조회·필터링·상태 관리
- EP(외부 배송 시스템) 데이터 연동 및 클레임 자동 매핑
- 사고 현장 사진 업로드·관리
- 클레임 보고서 Word 파일 자동 생성 (docxtemplater)
- 보험사 증권별 손해율·지급율 대시보드
- 소액클레임·소비자원·소송 개별 관리

---

## 파일 구조

```
lx-claim/
├── index.html              # 전체 UI (HTML + CSS + SVG 아이콘)
├── app.js                  # 전체 애플리케이션 로직 (~4000줄)
├── report_template_b64.js  # Word 보고서 템플릿 (base64 인코딩)
├── docxtemplater.js        # Word 문서 생성 라이브러리
├── imagemodule.js          # docxtemplater 이미지 확장 (현재 미사용)
└── pizzip.min.js           # ZIP 처리 라이브러리 (docxtemplater 의존)
```

빌드 도구 없음. 브라우저에서 파일을 직접 열어 실행한다.
Firebase SDK는 `index.html`의 `<script>` 태그로 CDN에서 로드한다.

### app.js 내부 구조 (위에서 아래 순서)

| 구역 | 내용 |
|---|---|
| 대시보드 렌더링 함수 | `renderPolicyCards`, `onDashInsChange` 등 |
| **데이터 레이어 `DB`** | Firebase 추상화 IIFE (lines ~103–202) |
| 전역 상태 변수 | `claims`, `clients`, `insCompanies` 등 |
| 기본 데이터 `defData()` | 앱 최초 실행 시 사용할 샘플 데이터 |
| `load()` / `persist()` | DB에서 전체 상태 읽기·쓰기 |
| 헬퍼 함수 | `$()`, `fmt만원()`, `setQuick()` 등 |
| 각 섹션 렌더·핸들러 | 클레임, EP, 보험사, 소액, 소비자원, 소송, 설정 |
| 사진 관련 | `uploadPhoto`, `loadClaimPhotos`, `renderPhotoUploadUI` |
| 보고서 | `downloadReport`, `injectImagesIntoDocx` |
| `DOMContentLoaded` init | `DB.init()` → `load()` → `_initHandlers()` |

---

## 데이터 레이어 (`DB` 객체)

모든 백엔드 I/O는 `app.js` 상단의 `DB` IIFE 하나에 집중되어 있다.
Firebase를 내부 서버로 교체할 때 **이 블록의 메서드 본문만 수정**하면 된다.
메서드 이름·시그니처·반환 타입은 반드시 유지해야 한다.

### 인터페이스

```javascript
DB.init()
// 백엔드 초기화. DOMContentLoaded에서 가장 먼저 호출한다.

DB.get(key: string, defaultVal: any): Promise<any>
// 키-값 읽기. 키가 없으면 defaultVal 반환.

DB.set(key: string, value: any): Promise<void>
// 키-값 쓰기.

DB.uploadFile(claimId: string, slot: string, file: File): Promise<string|null>
// 사진 파일 업로드. 성공 시 다운로드 URL 반환, 실패 시 null.

DB.listFiles(claimId: string): Promise<Array<{slot: string, url: string}>>
// 클레임에 업로드된 사진 목록 반환.

DB.deleteFile(claimId: string, slot: string): Promise<void>
// 사진 파일 삭제.

DB.getPhotoData(claimId: string): Promise<Object>
// 보고서용 사진 base64 맵 반환. { [slot]: {data, extension} }

DB.setPhotoData(claimId: string, slot: string, data: Object|null): Promise<void>
// 보고서용 base64 저장. data=null 이면 해당 슬롯 삭제.
```

### 저장 키 목록 (`DB.get` / `DB.set` 에서 사용)

| 키 | 내용 |
|---|---|
| `cfg_clients` | 고객사 목록 |
| `cfg_ins` | 보험사 목록 |
| `cfg_map` | 고객사-보험사 매핑 |
| `cfg_asgn` | 담당자 목록 |
| `cfg_atypes` | 사고 유형 목록 |
| `cfg_pgroups` | 제품 대분류 |
| `cfg_pcats` | 제품 소분류 |
| `cls_v8` | 클레임 전체 |
| `ep_v8` | EP 연동 레코드 |
| `ins_files_v8` | 보험사 파일 메타 |
| `tpl_v8` | 보고서 템플릿 설정 |
| `ca_v1` | 소비자원 사례 |
| `suit_v1` | 소송 목록 |
| `minor_v1` | 소액클레임 목록 |
| `policy_v1` | 보험 증권 설정 |
| `ep_col_map` | EP 엑셀 컬럼 매핑 설정 |
| `photos_${claimId}` | 클레임별 사진 base64 (보고서용) |

### 내부 서버로 교체하는 방법

`app.js` lines 103–202의 `DB` IIFE 본문만 교체한다.

1. `init()` — Firebase SDK 초기화 코드를 REST 클라이언트 초기화로 대체
2. `get(key, defaultVal)` — `GET /api/data/:key` 호출로 대체
3. `set(key, value)` — `PUT /api/data/:key` 호출로 대체
4. `uploadFile(claimId, slot, file)` — `POST /api/photos/:claimId/:slot` (multipart)로 대체, URL 반환
5. `listFiles(claimId)` — `GET /api/photos/:claimId` → `[{slot, url}]` 반환
6. `deleteFile(claimId, slot)` — `DELETE /api/photos/:claimId/:slot`으로 대체
7. `getPhotoData(claimId)` — `GET /api/photodata/:claimId` → base64 맵 반환
8. `setPhotoData(claimId, slot, data)` — `PATCH /api/photodata/:claimId/:slot`으로 대체

`DB` 외부 코드(`load`, `persist`, `uploadPhoto`, `loadClaimPhotos`, `downloadReport`)는 수정하지 않아도 된다.

---

## 작업 규칙

### 절대 규칙

- **`DB` 외부에서 Firebase API를 직접 호출하지 않는다.** `firebase`, `_db`, `_storage` 등 Firebase 객체를 `DB` 블록 바깥에서 참조하는 코드를 추가하지 않는다.
- **`DB` 인터페이스를 변경할 때는 모든 호출 지점을 함께 수정한다.** 시그니처를 바꾸면 `load`, `persist`, `uploadPhoto`, `loadClaimPhotos`, `downloadReport`를 전부 확인한다.
- **빌드 도구를 도입하지 않는다.** 이 프로젝트는 브라우저에서 파일을 직접 열어 실행하는 구조다. npm, bundler, TypeScript 변환 등을 추가하면 배포 방식이 깨진다.
- **외부 라이브러리를 CDN 또는 로컬 파일로만 추가한다.** `index.html`의 `<script>` 태그나 로컬 `.js` 파일로 추가하고, package.json 의존성은 사용하지 않는다.

### 코드 스타일

- 새 함수는 기존 코드와 동일한 위치(섹션)에 넣는다. 렌더 함수는 렌더 함수끼리, 핸들러는 핸들러끼리.
- UI 문자열은 한국어로 작성한다.
- `persist()`는 상태 변경 직후 호출한다. 변경 후 저장을 누락하면 새로고침 시 데이터가 사라진다.
- 전역 상태(`claims`, `clients` 등)를 직접 변경한 뒤 반드시 관련 렌더 함수를 호출해 화면을 갱신한다.

### 사진 처리

- 사진은 두 곳에 저장된다: 파일 저장소(URL용)와 base64 저장소(보고서 CORS 우회용). 업로드·삭제 시 항상 둘 다 처리해야 한다. `uploadPhoto`와 `loadClaimPhotos`가 이 패턴을 따른다.
- 사진 슬롯 이름은 `설치사진1`~`설치사진4`, `피해사진1`~`피해사진4`, `재방문사진1`~`재방문사진2`, `교육사진1`~`교육사진2`로 고정이다. 슬롯을 추가하면 `renderPhotoUploadUI`, `downloadReport`의 slots 배열도 함께 수정한다.

### 보고서 생성

- 보고서는 `report_template_b64.js`의 Word 템플릿에 docxtemplater로 데이터를 주입한 뒤, `injectImagesIntoDocx`로 사진을 OOXML 직접 삽입하는 방식이다.
- 템플릿 플레이스홀더는 `{{필드명}}` 형식이다. 새 필드를 추가하면 템플릿 파일과 `downloadReport`의 `data` 객체를 함께 수정한다.
- imagemodule.js는 현재 미사용이다. 이미지 삽입은 `injectImagesIntoDocx`가 담당한다.
