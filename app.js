
/* ══════════════════════════════════════════════
   FIREBASE 초기화
══════════════════════════════════════════════ */
const firebaseConfig = {
  apiKey: "AIzaSyAy6HPR4oihXAZq_1oLdlfH_Ol2LRfwzAo",
  authDomain: "lx-claim.firebaseapp.com",
  projectId: "lx-claim",
  storageBucket: "lx-claim.firebasestorage.app",
  messagingSenderId: "64279299234",
  appId: "1:64279299234:web:67237c233f372e99f043fb"
};

let db;
function initFirebase(){
  try{
    firebase.initializeApp(firebaseConfig);
    db=firebase.firestore();
  }catch(e){console.error('Firebase 초기화 오류:',e);}
}

async function fsGet(docId,def){
  try{
    const snap=await db.collection('lx-claim').doc(docId).get();
    return snap.exists?snap.data().value:def;
  }catch(e){return def;}
}
async function fsSet(docId,value){
  try{await db.collection('lx-claim').doc(docId).set({value});}
  catch(e){console.error('Firestore 저장 오류:',e);}
}


const COLORS=['#185FA5','#3B6D11','#BA7517','#A32D2D','#534AB7','#888780','#0E7C7B','#7D3C98'];
function $(id){return document.getElementById(id);}
function uid(p){return (p||'x')+Date.now().toString(36)+Math.random().toString(36).slice(2,5);}
function fmt만원(v){if(!v&&v!==0)return '-';if(!v)return '-';return Number(v).toLocaleString('ko-KR')+'원';}

let apiKey=localStorage.getItem('api_key')||'';
function saveApiKey(v){apiKey=v;localStorage.setItem('api_key',v);$('api-key-status').textContent=v?'저장됨 ✓':'';}

/* 마스터 데이터 */
let clients, insCompanies, clientMapping, assignees, accidentTypes, productGroups, productCats, claims, epRecs, insFiles, templates, curInsCoId;
let consumerCases=[], lawsuits=[], minorClaims=[];
let editId=null, curDetail=null;
let selInsColor=COLORS[0];

function defData(){
  clients=[{id:'c1',name:'비렉스테크',memo:''},{id:'c2',name:'코웨이',memo:''},{id:'c3',name:'하츠',memo:''},{id:'c4',name:'경동',memo:''}];
  insCompanies=[{id:'i1',name:'삼성화재',color:'#185FA5',memo:'1588-5114'},{id:'i2',name:'DB손해보험',color:'#3B6D11',memo:'1588-0100'},{id:'i3',name:'현대해상',color:'#BA7517',memo:'1588-5656'},{id:'i4',name:'KB손해보험',color:'#A32D2D',memo:'1544-0014'}];
  clientMapping={c1:'i1',c2:'i2',c3:'i3',c4:'i2'};
  assignees=[{id:'a1',name:'설용환',rank:'팀장',area:'전체'},{id:'a2',name:'동글',rank:'선임',area:'에어컨·냉장고'},{id:'a3',name:'이민준',rank:'주임',area:'세탁기·식기세척기'},{id:'a4',name:'박서연',rank:'사원',area:'기타'}];
  accidentTypes=[{id:'at1',name:'화재',code:'F'},{id:'at2',name:'누수',code:'W'},{id:'at3',name:'파손',code:'D'},{id:'at4',name:'대인',code:'P'},{id:'at5',name:'기타',code:'E'}];
  productGroups=[
    {id:'pg1',name:'가정설치',code:'HA',desc:'Home Appliance'},
    {id:'pg2',name:'정수기/빌트인',code:'WB',desc:'Water purifier & Built-in'},
    {id:'pg3',name:'에어컨 신규',code:'ARN',desc:'Air conditioner New'},
    {id:'pg4',name:'에어컨 이전',code:'ARR',desc:'Air conditioner Relocation'},
  ];
  productCats=[
    {id:'pc1',name:'에어컨',code:'AC',groupId:'pg3'},
    {id:'pc2',name:'바스에어',code:'BA',groupId:'pg3'},
    {id:'pc3',name:'냉장고',code:'RF',groupId:'pg1'},
    {id:'pc4',name:'세탁기',code:'WM',groupId:'pg1'},
    {id:'pc5',name:'건조기',code:'DR',groupId:'pg1'},
    {id:'pc6',name:'식기세척기',code:'DW',groupId:'pg2'},
    {id:'pc7',name:'정수기',code:'WP',groupId:'pg2'},
    {id:'pc8',name:'로봇청소기',code:'RC',groupId:'pg2'},
    {id:'pc9',name:'빌트인',code:'BI',groupId:'pg2'},
    {id:'pc10',name:'기타',code:'ETC',groupId:'pg1'},
  ];
  claims=[
    {id:'2026-AIR-AC-F-001',clientId:'c1',client:'비렉스테크',pcat:'AC',pcatName:'에어컨',groupId:'pg3',groupCode:'AIR',groupName:'에어컨',name:'김민수',phone:'010-1234-5678',addr:'서울 강남구 역삼동 123',product:'LG DUALCOOL FQ18VDWSA2',type:'화재',typeCode:'F',status:'검토',assignee:'동글',amount:1500000,date:'2026-06-10',idate:'2026-06-08',tname:'홍준표',tid:'T20341',insDate:'2026-06-10',insCoId:'i1',desc:'에어컨 설치 후 실외기 배선 과부하로 스파크 발생.',note:'PL 보험 검토 필요.',history:[{date:'2026-06-10',text:'클레임 접수'},{date:'2026-06-11',text:'현장 확인 요청'}]},
    {id:'2026-WB-DW-W-001',clientId:'c2',client:'코웨이',pcat:'DW',pcatName:'식기세척기',groupId:'pg2',groupCode:'WB',groupName:'정수기/빌트인',name:'이정현',phone:'010-9876-5432',addr:'경기 성남시 분당구 야탑동 45',product:'LG DIOS DFB22PT',type:'누수',typeCode:'W',status:'처리',assignee:'이민준',amount:320000,date:'2026-06-08',idate:'2026-06-06',tname:'박재현',tid:'T20187',insDate:'2026-06-08',insCoId:'i2',desc:'식기세척기 배수호스 불량 누수.',note:'',history:[{date:'2026-06-08',text:'클레임 접수'},{date:'2026-06-10',text:'수리 완료'}]},
    {id:'2026-HA-RF-D-001',clientId:'c1',client:'비렉스테크',pcat:'RF',pcatName:'냉장고',groupId:'pg1',groupCode:'HA',groupName:'가정설치',name:'박지훈',phone:'010-5555-1234',addr:'서울 마포구 합정동 87-3',product:'LG DIOS R-H814HTBS',type:'파손',typeCode:'D',status:'접수',assignee:'동글',amount:0,date:'2026-06-14',idate:'2026-06-13',tname:'최민호',tid:'T19922',insDate:'2026-06-14',insCoId:'i1',desc:'운반 중 냉장고 측면 패널 찍힘.',note:'',history:[{date:'2026-06-14',text:'클레임 접수'}]},
    {id:'2026-HA-WM-W-001',clientId:'c4',client:'경동',pcat:'WM',pcatName:'세탁기',groupId:'pg1',groupCode:'HA',groupName:'가정설치',name:'최수진',phone:'010-8888-4567',addr:'부산 해운대구 좌동',product:'LG 트롬 F24VD',type:'누수',typeCode:'W',status:'종결',assignee:'이민준',amount:180000,date:'2026-05-28',idate:'2026-05-26',tname:'김태영',tid:'T20056',insDate:'2026-05-28',insCoId:'i2',desc:'세탁기 급수 연결부 누수.',note:'',history:[{date:'2026-05-28',text:'접수'},{date:'2026-06-03',text:'종결'}]},
    {id:'2026-AIR-AC-P-001',clientId:'c3',client:'하츠',pcat:'AC',pcatName:'에어컨',groupId:'pg3',groupCode:'AIR',groupName:'에어컨',name:'정우성',phone:'010-3333-8899',addr:'인천 부평구 부평동',product:'LG DUALCOOL FQ18VDWSA2',type:'대인',typeCode:'P',status:'보류',assignee:'박서연',amount:500000,date:'2026-06-12',idate:'2026-06-11',tname:'이재원',tid:'T20412',insDate:'2026-06-12',insCoId:'i3',desc:'실외기 설치 중 고객 가족 경상.',note:'치료비 청구 예정',history:[{date:'2026-06-12',text:'클레임 접수'},{date:'2026-06-13',text:'보험사 접수 완료'}]},
    {id:'2026-AIR-AC-F-002',clientId:'c1',client:'비렉스테크',pcat:'AC',pcatName:'에어컨',groupId:'pg3',groupCode:'AIR',groupName:'에어컨',name:'강지영',phone:'010-7777-2233',addr:'서울 송파구 잠실동 100',product:'LG DUALCOOL FQ09VDWSA',type:'화재',typeCode:'F',status:'접수',assignee:'동글',amount:800000,date:'2026-06-15',idate:'2026-06-14',tname:'홍준표',tid:'T20341',insDate:'2026-06-15',insCoId:'i1',desc:'에어컨 배선 과열로 냄새 및 그을음.',note:'',history:[{date:'2026-06-15',text:'클레임 접수'}]},
  ];
  epRecs=[];insFiles={};templates=[];consumerCases=[];lawsuits=[];minorClaims=[];
}
const defInsRows=[
  {접수번호:'20260610084512',고객명:'김민수',주소:'서울 강남구 역삼동 123',피해내용:'에어컨 배선 과부하 스파크',제품구분:'에어컨',설치일:'2026-06-08',지급보험금:0,조사비:0,추산보험금OS:1500000,조사비OS:150000,처리구분:'조사중',협력업체:'LX판토스',설치기사:'홍준표',원인1:'화재',귀책여부:'확인중'},
  {접수번호:'20260608091234',고객명:'이정현',주소:'경기 성남시 분당구 야탑동 45',피해내용:'식기세척기 배수호스 누수',제품구분:'식기세척기',설치일:'2026-06-06',지급보험금:320000,조사비:50000,추산보험금OS:0,조사비OS:0,처리구분:'종결',협력업체:'LX판토스',설치기사:'박재현',원인1:'누수',귀책여부:'귀책'},
  {접수번호:'20260520031199',고객명:'박재호',주소:'대구 수성구 범어동 201',피해내용:'냉장고 설치 중 바닥재 파손',제품구분:'냉장고',설치일:'2026-05-18',지급보험금:0,조사비:0,추산보험금OS:250000,조사비OS:50000,처리구분:'조사중',협력업체:'경북물류',설치기사:'박상훈',원인1:'파손',귀책여부:'확인중'},
  {접수번호:'20260601055500',고객명:'한미진',주소:'경기 화성시 동탄',피해내용:'정수기 연결 호스 누수',제품구분:'정수기',설치일:'2026-05-30',지급보험금:180000,조사비:30000,추산보험금OS:0,조사비OS:0,처리구분:'종결',협력업체:'경기정수팀',설치기사:'이수현',원인1:'누수',귀책여부:'귀책'},
];
const defEP=[{고객명:'김민수',고객주소:'서울 강남구 역삼동 123',제품모델:'LG DUALCOOL FQ18VDWSA2',통문일자:'2026-06-08',설치기사명:'홍준표',설치기사ID:'T20341'},{고객명:'이정현',고객주소:'경기 성남시 분당구 야탑동 45',제품모델:'LG DIOS DFB22PT',통문일자:'2026-06-06',설치기사명:'박재현',설치기사ID:'T20187'},{고객명:'박지훈',고객주소:'서울 마포구 합정동 87-3',제품모델:'LG DIOS R-H814HTBS',통문일자:'2026-06-13',설치기사명:'최민호',설치기사ID:'T19922'}];

async function load(){
  try{
    defData();
    // Firestore에서 로드 (없으면 기본값 사용)
    clients      = await fsGet('cfg_clients', clients);
    insCompanies = await fsGet('cfg_ins', insCompanies);
    clientMapping= await fsGet('cfg_map', clientMapping);
    assignees    = await fsGet('cfg_asgn', assignees);
    accidentTypes= await fsGet('cfg_atypes', accidentTypes);
    productGroups= await fsGet('cfg_pgroups', productGroups);
    productCats  = await fsGet('cfg_pcats', productCats);
    claims       = await fsGet('cls_v8', claims);
    epRecs       = await fsGet('ep_v8', epRecs);
    insFiles     = await fsGet('ins_files_v8', insFiles);
    templates    = await fsGet('tpl_v8', templates);
    consumerCases= await fsGet('ca_v1', consumerCases);
    lawsuits     = await fsGet('suit_v1', lawsuits);
    minorClaims  = await fsGet('minor_v1', minorClaims);
    const m      = await fsGet('ep_col_map', {});
    ['name','addr','prod','idate','tname','tid'].forEach(k=>{if(m[k]&&$('m-'+k))$('m-'+k).value=m[k];});
  }catch(e){console.error('로드 오류:',e);defData();}
}
async function persist(){
  try{
    await Promise.all([
      fsSet('cfg_clients', clients),
      fsSet('cfg_ins', insCompanies),
      fsSet('cfg_map', clientMapping),
      fsSet('cfg_asgn', assignees),
      fsSet('cfg_atypes', accidentTypes),
      fsSet('cfg_pgroups', productGroups),
      fsSet('cfg_pcats', productCats),
      fsSet('cls_v8', claims),
      fsSet('ep_v8', epRecs),
      fsSet('ins_files_v8', insFiles),
      fsSet('tpl_v8', templates),
      fsSet('ca_v1', consumerCases),
      fsSet('suit_v1', lawsuits),
      fsSet('minor_v1', minorClaims),
    ]);
  }catch(e){console.error('저장 오류:',e);}
}


/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
function getInsName(id){return insCompanies.find(x=>x.id===id)?.name||'-';}
function getInsForClient(clientId){const id=clientMapping[clientId];return id?insCompanies.find(x=>x.id===id):null;}
function getPcatCode(name){return productCats.find(x=>x.name===name)?.code||'ETC';}
function getAtypeCode(name){return accidentTypes.find(x=>x.name===name)?.code||'E';}
function getAllInsRows(){const rows=[];Object.entries(insFiles).forEach(([insId,files])=>{files.forEach(f=>{(f.rows||[]).forEach(r=>rows.push({...r,_insId:insId,_fileName:f.filename}));});});return rows;}
function matchInsRow(row){
  // 1) 보험사 접수번호로 먼저 매칭
  if(row.접수번호){
    const byNo=claims.find(c=>c.insNo===row.접수번호);
    if(byNo)return byNo;
  }
  // 2) 고객명+설치일로 매칭
  const name=(row.고객명||'').replace(/\(.*\)/,'').trim();
  return claims.find(c=>{
    const nm=c.name&&c.name.includes(name)&&name.length>1;
    const dm=c.idate&&row.설치일&&(c.idate===row.설치일||c.idate.replace(/-/g,'')===row.설치일.replace(/-/g,''));
    return nm&&dm;
  });
}
function genId(year,groupCode,pcat,tc){
  const prefix=`${year}-${groupCode}-${pcat}-${tc}`;let max=0;
  claims.forEach(c=>{if(c.id&&c.id.startsWith(prefix+'-')){const n=parseInt(c.id.split('-').pop(),10);if(!isNaN(n)&&n>max)max=n;}});
  return `${prefix}-${String(max+1).padStart(3,'0')}`;
}
function getGroupByPcat(pcatCode){
  const pc=productCats.find(x=>x.code===pcatCode);
  if(!pc||!pc.groupId)return {code:'XX',name:'미지정',id:''};
  return productGroups.find(x=>x.id===pc.groupId)||{code:'XX',name:'미지정',id:''};
}
function updateIdPreview(){
  if(!editId){
    const pcode=($('f-pcat')||{}).value||'';
    const tcode=($('f-type')||{}).value||'';
    const el=$('id-preview-code');
    if(el&&pcode&&tcode){
      const grp=getGroupByPcat(pcode);
      el.textContent=genId(new Date().getFullYear(),grp.code,pcode,tcode);
    }else if(el){el.textContent='제품군·유형 선택 후 자동 생성';}
  }
}
/* 엑셀 대구분 → 앱 대분류 매핑 */
function mapDaeguBun(raw){
  if(!raw)return null;
  const s=String(raw).trim().replace(/\s/g,'');
  if(s.includes('에어컨')&&(s.includes('신규')||s.includes('(신규)')||s.includes('N)')))return productGroups.find(x=>x.code==='ARN')||null;
  if(s.includes('에어컨')&&(s.includes('이전')||s.includes('(이전)')||s.includes('R)')))return productGroups.find(x=>x.code==='ARR')||null;
  if(s.includes('에어컨'))return productGroups.find(x=>x.code==='ARN')||null;
  if(s.includes('가정설치')||s==='가정')return productGroups.find(x=>x.code==='HA')||null;
  if(s.includes('정수기')||s.includes('빌트인'))return productGroups.find(x=>x.code==='WB')||null;
  return null;
}
/* 엑셀 제품구분 → 앱 제품군 코드 매핑 */
function mapJeumunGubun(raw){
  if(!raw)return null;
  const s=raw.trim();
  return productCats.find(x=>s.includes(x.name)||x.name.includes(s))||null;
}
/* 날짜 정규화 YYYYMMDD / YYYY.MM.DD → YYYY-MM-DD */
/* 엑셀 시리얼 날짜 → YYYY-MM-DD 변환 */
function excelDateToStr(v){
  if(!v&&v!==0)return '';
  const s=String(v).trim();
  // 이미 날짜 형식이면 그대로
  if(/^\d{4}-\d{2}-\d{2}$/.test(s))return s;
  if(/^\d{4}\.\d{2}\.\d{2}$/.test(s))return s.replace(/\./g,'-');
  if(/^\d{4}\/\d{2}\/\d{2}$/.test(s))return s.replace(/\//g,'-');
  if(/^\d{8}$/.test(s))return `${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}`;
  // 엑셀 시리얼 숫자 변환 (1900년 기준)
  const n=Number(s);
  if(!isNaN(n)&&n>40000&&n<60000){
    const d=new Date(Date.UTC(1899,11,30)+n*86400000);
    return d.toISOString().slice(0,10);
  }
  return s;
}
function normalizeDate(raw){return excelDateToStr(raw);}
function normalizeNum(v){if(!v&&v!==0)return 0;if(typeof v==='number')return v;return parseFloat(String(v).replace(/[,\s원]/g,''))||0;}
function parseInsRow(row){
  const rowKeys=Object.keys(row);
  const g=(...candidates)=>{
    for(const c of candidates){
      if(row[c]!==undefined&&row[c]!==null&&row[c]!=='')return String(row[c]).trim();
      const norm=c.replace(/[\s\n\r()（）]/g,'');
      const found=rowKeys.find(k=>k.replace(/[\s\n\r()（）]/g,'')===norm);
      if(found&&row[found]!==undefined&&row[found]!==null&&row[found]!=='')return String(row[found]).trim();
    }
    return '';
  };
  // 고객명 - 키에 "고객명" 포함된 컬럼 찾기
  const nameKey=rowKeys.find(k=>k.includes('고객명'))||'';
  const rawName=nameKey?String(row[nameKey]||'').trim():'';
  const cleanName=rawName.replace(/\(.*?\)/g,'').replace(/\n.*/g,'').trim();
  // 손해사정 담당자 파싱
  const adjRaw=g('손해사정 담당자','담당자');
  const adjLines=adjRaw.split(/[\n\r]/).map(s=>s.trim()).filter(Boolean);
  return {
    접수번호:g('접수번호','PL접수번호'),
    고객명:cleanName,
    주소:g('주소','설치주소','고객주소'),
    피해내용:g('피해내용','손해내용'),
    대구분:g('대구분','대분류'),
    제품구분:g('제품구분','제품'),
    설치일:excelDateToStr(row['설치일']||row['설치일자']||row['통문일자']||''),
    사고일:excelDateToStr(row['사고일']||''),
    접수일:excelDateToStr(row['접수일']||row['사고접수일']||''),
    지급보험금:normalizeNum(row[' 지급보험금 ']||row['지급보험금']||0),
    조사비:normalizeNum(row[' 조사비 ']||row['조사비']||0),
    추산보험금OS:normalizeNum(row[' 추산보험금(O/S) ']||row['추산보험금(O/S)']||0),
    조사비OS:normalizeNum(row[' 조사비(O/S) ']||row['조사비(O/S)']||0),
    처리구분:g('처리구분'),
    협력업체:g('협력업체'),
    설치기사:g('설치기사','설치기사/차량번호'),
    원인1:g('원인1'),
    원인2:g('원인2'),
    귀책여부:g('설치 귀책 여부','귀책여부'),
    평가반영:g('협력업체\n평가 반영 여부','협력업체 평가 반영 여부','평가반영여부'),
    손해사정담당자:adjLines[0]||'',
    손해사정연락처:adjLines[1]||'',
    설치주문번호:g('설치 주문번호','설치주문번호'),
    물류센터:g('물류센터'),
  };
}
function updateInsBadge(){
  const u=getAllInsRows().filter(r=>!matchInsRow(r)).length;
  const b=$('ins-badge');if(b){if(u>0){b.style.display='inline';b.textContent=u+'건';}else b.style.display='none';}
  const uc=$('unmatched-cnt');if(uc)uc.textContent=u?`(${u})`:'';
}

/* ══════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════ */
function nav(name,btn){
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  $('s-'+name).classList.add('active');if(btn)btn.classList.add('active');
  if(name==='dashboard')renderDash();
  if(name==='list'){populateListFilters();renderList();}
  if(name==='register'){if(!editId)resetForm();populateRegisterDropdowns();}
  if(name==='eplink'){updateEPBar();renderEPTbl();}
  if(name==='insurance'){renderInsurancePage();updateInsBadge();}
  if(name==='minor'){renderMinor();}
  if(name==='consumer'){renderCA();}
  if(name==='lawsuit'){renderSuit();}
  if(name==='reports'){renderReports();}
  if(name==='settings'){renderAllSettings();}
}
function showSP(name,btn){
  document.querySelectorAll('.sp').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.snb').forEach(b=>b.classList.remove('active'));
  $('sp-'+name).classList.add('active');if(btn)btn.classList.add('active');
  if(name==='clients')renderClientsList();
  if(name==='insurance')renderInsList();
  if(name==='mapping')renderCfgMapping();
  if(name==='assignees')renderAsgnList();
  if(name==='product-groups')renderPgroupList();
  if(name==='accident-types')renderAtypeList();
  if(name==='product-cats')renderPcatList();
}
function showInsTab(name,btn){
  document.querySelectorAll('.stab').forEach(b=>b.classList.remove('active'));if(btn)btn.classList.add('active');
  $('ins-tab-mapping').style.display=name==='mapping'?'block':'none';
  $('ins-tab-files').style.display=name==='files'?'block':'none';
  $('ins-tab-unmatched').style.display=name==='unmatched'?'block':'none';
  if(name==='files'){renderInsSidebar();if(curInsCoId)renderInsDetail(curInsCoId);else if(insCompanies.length)selectInsCo(insCompanies[0].id);}
  if(name==='unmatched')renderUnmatched();
}

/* ══════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════ */
let dashQuick='all';
function setQuick(q){
  dashQuick=q;
  document.querySelectorAll('.quick-btn').forEach(b=>b.classList.remove('active'));
  const idx={month:0,quarter:1,year:2,all:3}[q]??3;
  document.querySelectorAll('.quick-btn')[idx]?.classList.add('active');
  const now=new Date();
  let from='',to=now.toISOString().slice(0,10);
  if(q==='month'){from=new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10);}
  else if(q==='quarter'){const m=now.getMonth();const qStart=Math.floor(m/3)*3;from=new Date(now.getFullYear(),qStart,1).toISOString().slice(0,10);}
  else if(q==='year'){from=`${now.getFullYear()}-01-01`;}
  else{from='';to='';}
  const df=$('d-from'),dt=$('d-to');
  if(df)df.value=from;if(dt)dt.value=to;
  renderDash();
}
function getFilteredClaims(){
  const from=($('d-from')||{}).value||'';
  const to=($('d-to')||{}).value||'';
  const fty=($('d-type')||{}).value||'';
  const fpc=($('d-pcat')||{}).value||'';
  return claims.filter(c=>{
    // 보험접수일 우선, 없으면 클레임 입력일
    const dt=c.insDate||c.date||'';
    if(from&&dt<from)return false;
    if(to&&dt>to)return false;
    if(fty&&c.type!==fty)return false;
    if(fpc&&c.pcat!==fpc)return false;
    return true;
  });
}
function renderDash(){
  // 드롭다운 채우기
  const dty=$('d-type');
  if(dty&&dty.children.length<=1)dty.innerHTML='<option value="">전체</option>'+accidentTypes.map(t=>`<option value="${t.name}">${t.name}</option>`).join('');
  const dpc=$('d-pcat');
  if(dpc&&dpc.children.length<=1)dpc.innerHTML='<option value="">전체</option>'+productCats.map(p=>`<option value="${p.code}">${p.name}</option>`).join('');

  const filtered=getFilteredClaims();
  const tot=filtered.length;
  const byS={접수:0,검토:0,처리:0,종결:0,면책:0,소송중:0,보류:0};
  const byT={};accidentTypes.forEach(t=>byT[t.name]=0);
  const byG={};productGroups.forEach(g=>byG[g.code]=0);
  const byP={};productCats.forEach(p=>byP[p.code]=0);
  let aAmt=0,estAmt=0,paidAmt=0,osAmt=0;
  filtered.forEach(c=>{
    byS[c.status]=(byS[c.status]||0)+1;
    byT[c.type]=(byT[c.type]||0)+1;
    if(c.groupCode)byG[c.groupCode]=(byG[c.groupCode]||0)+1;
    if(c.pcat)byP[c.pcat]=(byP[c.pcat]||0)+1;
    if(c.status!=='종결')aAmt+=c.amount||0;
    estAmt+=c.amount||0;
    paidAmt+=c.finalPayment||0;
    osAmt+=c.survey||0;
  });
  const active=tot-(byS['종결']||0)-(byS['면책']||0)-(byS['소송중']||0);
  $('stat-grid').innerHTML=`
    <div class="sc"><div class="sl">기간 내 접수</div><div class="sv bl">${tot}건</div></div>
    <div class="sc"><div class="sl">진행 중</div><div class="sv am">${active}건</div></div>
    <div class="sc"><div class="sl">종결</div><div class="sv gr">${byS['종결']||0}건</div></div>
    <div class="sc"><div class="sl">진행 중 손해액</div><div class="sv rd">${fmt만원(aAmt)}</div></div>`;

  // 손해액 통계
  const allRows=getAllInsRows();
  const filteredInsRows=allRows.filter(r=>{
    const from=($('d-from')||{}).value||'';
    const to=($('d-to')||{}).value||'';
    if(from&&r.접수일&&r.접수일<from.replace(/-/g,''))return false;
    if(to&&r.접수일&&r.접수일>to.replace(/-/g,''))return false;
    return true;
  });
  const totalPaid=filteredInsRows.reduce((a,r)=>a+(r.지급보험금||0),0);
  const totalOS=filteredInsRows.reduce((a,r)=>a+(r.추산보험금OS||0),0);
  const totalInv=filteredInsRows.reduce((a,r)=>a+(r.조사비||0)+(r.조사비OS||0),0);
  const ratio=estAmt>0?Math.round(totalPaid/estAmt*100):null;
  // 진행중 건 추산O/S, 종결 건 지급보험금 분리
  const claimOS=filtered.filter(c=>c.status!=='종결').reduce((a,c)=>a+(c.amount||0),0);
  const claimPaid=filtered.reduce((a,c)=>a+(c.finalPayment||0),0);
  const claimSurvey=filtered.reduce((a,c)=>a+(c.survey||0),0);
  const lossRatio=claimOS>0?Math.round(claimPaid/claimOS*100):null;
  $('loss-grid').innerHTML=`
    <div class="loss-card os"><div class="loss-label">추산보험금 O/S</div><div class="loss-val">${fmt만원(claimOS)}</div><div class="loss-sub">${tot}건</div></div>
    <div class="loss-card paid"><div class="loss-label">지급보험금</div><div class="loss-val">${fmt만원(claimPaid)}</div><div class="loss-sub">종결 기준</div></div>
    <div class="loss-card inv"><div class="loss-label">조사비 O/S</div><div class="loss-val">${fmt만원(claimSurvey)}</div><div class="loss-sub">합계</div></div>
    <div class="loss-card ${lossRatio===null?'est':lossRatio<=100?'ratio-good':'ratio-bad'}"><div class="loss-label">손해율 (지급/추산)</div><div class="loss-val">${lossRatio!==null?lossRatio+'%':'-'}</div><div class="loss-sub">지급÷추산</div></div>`;

  // 보험사 통계
  if(allRows.length){
    const un=allRows.filter(r=>!matchInsRow(r)).length;
    $('ins-stat-grid').style.display='grid';
    $('ins-stat-grid').innerHTML=`<div class="sc bordered"><div class="sl">보험사 접수건수</div><div class="sv bl">${allRows.length}건</div></div><div class="sc bordered"><div class="sl">지급보험금</div><div class="sv gr">${fmt만원(totalPaid)}</div></div><div class="sc bordered"><div class="sl">추산(O/S)</div><div class="sv am">${fmt만원(totalOS)}</div></div><div class="sc bordered" style="cursor:pointer;" data-fn="navInsurance"><div class="sl">미매칭</div><div class="sv rd">${un}건</div></div>`;
  }else $('ins-stat-grid').style.display='none';

  // 상태별 차트
  const sc={접수:'#378ADD',검토:'#EF9F27',처리:'#7F77DD',종결:'#639922',면책:'#888',소송중:'#C0392B',보류:'#E24B4A'};
  const mx=Math.max(...Object.values(byS),1);
  $('bar-chart').innerHTML=Object.entries(byS).map(([k,v])=>`<div class="bar-r"><span class="bar-lbl">${k}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(v/mx*100)}%;background:${sc[k]};"></div></div><span class="bar-val">${v}</span></div>`).join('');

  // 사고유형별 차트
  const tc=['#E24B4A','#378ADD','#EF9F27','#7F77DD','#888780','#0E7C7B','#7D3C98'];
  const tt=Object.values(byT).reduce((a,v)=>a+v,0)||1;
  $('pie-chart').innerHTML=accidentTypes.map((t,i)=>`<div class="bar-r"><span class="bar-lbl" style="color:${tc[i%7]};font-weight:500;">${t.name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round((byT[t.name]||0)/tt*100)}%;background:${tc[i%7]};"></div></div><span class="bar-val">${byT[t.name]||0}</span></div>`).join('');

  // 대분류별 차트
  const gmax=Math.max(...Object.values(byG),1);
  $('group-chart').innerHTML=productGroups.map((g,i)=>`<div class="bar-r"><span class="bar-lbl" style="font-size:11px;">${g.code}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round((byG[g.code]||0)/gmax*100)}%;background:${tc[i%7]};"></div></div><span class="bar-val">${byG[g.code]||0}</span></div>`).join('');

  // 제품군별 차트
  const pmax=Math.max(...Object.values(byP),1);
  const topP=Object.entries(byP).sort((a,b)=>b[1]-a[1]).slice(0,8);
  $('pcat-chart').innerHTML=topP.map(([code,cnt],i)=>{const p=productCats.find(x=>x.code===code);return`<div class="bar-r"><span class="bar-lbl" style="font-size:11px;">${p?.name||code}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(cnt/pmax*100)}%;background:${tc[i%7]};"></div></div><span class="bar-val">${cnt}</span></div>`;}).join('');

  // 물류별 발생현황 차트
  const byL={};filtered.forEach(c=>{if(c.logistics){byL[c.logistics]=(byL[c.logistics]||0)+1;}});
  const topL=Object.entries(byL).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const lmax=Math.max(...topL.map(x=>x[1]),1);
  const lc=$('logistics-chart');
  if(lc)lc.innerHTML=topL.length?topL.map(([name,cnt],i)=>`<div class="bar-r"><span class="bar-lbl" style="font-size:11px;">${name}</span><div class="bar-track"><div class="bar-fill" style="width:${Math.round(cnt/lmax*100)}%;background:${tc[i%7]};"></div></div><span class="bar-val">${cnt}</span></div>`).join(''):'<div style="font-size:12px;color:var(--tx3);padding:8px 0;">데이터 없음</div>';

  // 기간 내 클레임 목록
  const rec=[...filtered].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,10);
  $('recent-list').innerHTML=rec.length?rec.map(c=>`<div class="tr" style="grid-template-columns:130px 1fr 70px 80px 70px 88px;" data-claim-id="${c.id}"><span style="font-family:var(--mono);font-size:11px;color:var(--blue);">${c.id}</span><span>${c.name} <span style="color:var(--tx2);font-size:12px;">— ${c.desc.slice(0,22)}...</span></span><span>${c.type}</span><span style="font-size:12px;">${c.client||'-'}</span><span><span class="bdg b-${c.status}">${c.status}</span></span><span>${c.insDate||c.date||'-'}</span></div>`).join(''):'<div class="empty">해당 기간 클레임 없음</div>';
}

/* ══════════════════════════════════════════════
   LIST
══════════════════════════════════════════════ */
function populateListFilters(){
  const ty=$('s-ty');if(ty){ty.innerHTML='<option value="">전체 유형</option>'+accidentTypes.map(t=>`<option>${t.name}</option>`).join('');}
  const cs=$('s-cs');if(cs){const cur=cs.value;cs.innerHTML='<option value="">전체 고객사</option>'+clients.map(c=>`<option ${c.name===cur?'selected':''}>${c.name}</option>`).join('');}
}
function renderList(){
  const q=($('s-q')||{}).value||'',st=($('s-st')||{}).value||'',ty=($('s-ty')||{}).value||'',cs=($('s-cs')||{}).value||'';
  const f=claims.filter(c=>{const m=!q||(c.name+c.id+c.desc+(c.tname||'')+(c.client||'')+(c.orderNo||'')+(c.insNo||'')+(c.addr||'')).toLowerCase().includes(q.toLowerCase());return m&&(!st||c.status===st)&&(!ty||c.type===ty)&&(!cs||c.client===cs);});
  $('claim-list').innerHTML=f.length?f.map(c=>{
    const amtStr=c.amount?c.amount.toLocaleString('ko-KR')+'원':'-';
    return `<div class="tr" style="grid-template-columns:120px 45px 60px 100px 1fr 55px 55px 90px 85px;cursor:pointer;" data-claim-id="${c.id}">
      <span style="font-family:var(--mono);font-size:10px;color:var(--blue);">${c.id}</span>
      <span style="font-size:11px;color:var(--tx2);">${c.groupCode||'-'}</span>
      <span style="font-size:11px;">${c.client||'-'}</span>
      <span style="font-family:var(--mono);font-size:10px;color:var(--tx2);">${c.insNo||'-'}</span>
      <span><b style="font-weight:500;">${c.name||'-'}</b> <span style="color:var(--tx2);font-size:12px;">— ${(c.desc||'').slice(0,20)}...</span></span>
      <span style="font-size:11px;">${c.type}</span>
      <span><span class="bdg b-${c.status}">${c.status}</span></span>
      <span style="font-size:11px;">${amtStr}</span>
      <span style="font-size:11px;">${c.insDate||'-'}</span>
    </div>`;
  }).join(''):'<div class="empty">검색 결과 없음</div>';
}

/* ══════════════════════════════════════════════
   REGISTER
══════════════════════════════════════════════ */
function populateRegisterDropdowns(){
  const cs=$('f-cs');if(cs)cs.innerHTML='<option value="">선택</option>'+clients.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
  const pg=$('f-pgroup');if(pg)pg.innerHTML='<option value="">선택</option>'+productGroups.map(g=>`<option value="${g.id}">${g.name} (${g.code})</option>`).join('');
  const pc=$('f-pcat');if(pc)pc.innerHTML='<option value="">선택</option>';
  const ft=$('f-type');if(ft)ft.innerHTML='<option value="">선택</option>'+accidentTypes.map(t=>`<option value="${t.code}">${t.name} (${t.code})</option>`).join('');
  const fa=$('f-asgn');if(fa)fa.innerHTML='<option value="">선택</option>'+assignees.map(a=>`<option>${a.name}</option>`).join('');
  onClientChange();updateIdPreview();
}
function onPgroupChange(){
  const gid=($('f-pgroup')||{}).value||'';
  const pc=$('f-pcat');if(!pc)return;
  const filtered=gid?productCats.filter(p=>p.groupId===gid):productCats;
  pc.innerHTML='<option value="">선택</option>'+filtered.map(p=>`<option value="${p.code}">${p.name} (${p.code})</option>`).join('');
  updateIdPreview();
}
function onClientChange(){
  const cid=($('f-cs')||{}).value||'';
  const ins=getInsForClient(cid);
  const sel=$('f-ins-co'),label=$('f-ins-auto');
  if(!sel)return;
  if(ins){
    sel.innerHTML=`<option value="${ins.id}">${ins.name}</option>`;
    sel.style.background='#EAF3DE';sel.style.color='var(--green)';
    if(label)label.textContent='(자동)';
  }else{
    sel.innerHTML='<option value="">미지정</option>'+insCompanies.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
    sel.style.background='';sel.style.color='';
    if(label)label.textContent='';
  }
}
function resetForm(){
  editId=null;$('form-title').textContent='신규 클레임 접수';
  ['f-name','f-phone','f-addr','f-product','f-tname','f-tid','f-desc','f-note'].forEach(id=>{const e=$(id);if(e)e.value='';});
  const fd=$('f-date');if(fd)fd.value=new Date().toISOString().slice(0,10);
  // prefillFromInsRow 중에는 날짜/손해액 초기화 안 함
  if(!_prefilling)['f-idate','f-amt','f-ins-date','f-survey','f-paid','f-logistics'].forEach(id=>{const e=$(id);if(e)e.value='';});  
  const fc=$('f-cs');if(fc)fc.value='';
  const fpg=$('f-pgroup');if(fpg)fpg.value='';
  const fp=$('f-pcat');if(fp)fp.innerHTML='<option value="">선택</option>';
  const ft=$('f-type');if(ft)ft.value='';
  const fl=$('f-liability');if(fl)fl.value='';
  const fe=$('f-eval');if(fe)fe.value='';
  const ep=$('ep-preview');if(ep)ep.innerHTML='';
  const es=$('ep-s');if(es)es.value='';
  const b=$('autofill-banner');if(b)b.style.display='none';
  onClientChange();updateIdPreview();
}
function clearAutofill(){const b=$('autofill-banner');if(b)b.style.display='none';}
function saveClaim(){
  const name=($('f-name')||{}).value||'홍길동',desc=($('f-desc')||{}).value||'-';
  const pcode=($('f-pcat')||{}).value||'ETC',tcode=($('f-type')||{}).value||'E';
  const pcName=productCats.find(p=>p.code===pcode)?.name||'기타';
  const tName=accidentTypes.find(t=>t.code===tcode)?.name||'기타';
  const cid=($('f-cs')||{}).value||'';
  const cName=clients.find(c=>c.id===cid)?.name||'';
  const insCoId=($('f-ins-co')||{}).value||'';
  const today=new Date().toISOString().slice(0,10);
  const grp=getGroupByPcat(pcode);
  const newId=editId||genId(new Date().getFullYear(),grp.code,pcode,tcode);
  const d={clientId:cid,client:cName,pcat:pcode,pcatName:pcName,groupId:grp.id,groupCode:grp.code,groupName:grp.name,name,phone:$('f-phone').value,addr:$('f-addr').value,product:$('f-product').value,idate:$('f-idate').value,tname:$('f-tname').value,tid:$('f-tid').value,type:tName,typeCode:tcode,assignee:$('f-asgn').value,amount:Number($('f-amt').value)||0,survey:Number($('f-survey')?$('f-survey').value:0)||0,finalPayment:Number($('f-paid')?$('f-paid').value:0)||0,logistics:$('f-logistics')?$('f-logistics').value||'':'',insDate:$('f-ins-date').value||'',date:$('f-date').value||today,desc,note:$('f-note').value,insCoId,liability:$('f-liability').value||'',evalReflect:$('f-eval').value||''};
  if(editId){const c=claims.find(x=>x.id===editId);if(c){Object.assign(c,d);c.history=c.history||[];c.history.push({date:today,text:'정보 수정'});}editId=null;}
  else{claims.unshift({id:newId,...d,status:'접수',history:[{date:today,text:'클레임 접수'}]});}
  persist();nav('list',document.querySelector('.nb:nth-child(2)'));
}

/* ══════════════════════════════════════════════
   EP
══════════════════════════════════════════════ */
function updateEPBar(){const dot=$('ep-dot'),txt=$('ep-txt');if(!dot||!txt)return;if(epRecs.length){dot.style.background='#639922';txt.textContent=`설치이력 ${epRecs.length}건 연동됨`;}else{dot.style.background='#888780';txt.textContent='설치이력 미연동';}}
function renderEPTbl(){const w=$('ep-tbl-wrap');if(!w)return;if(!epRecs.length){w.innerHTML='<div class="empty">설치이력 없음</div>';return;}w.innerHTML=`<div class="tbl"><div class="th" style="grid-template-columns:1fr 80px 1fr 90px 100px 75px;"><span>고객명</span><span>통문일자</span><span>주소</span><span>제품모델</span><span>설치기사</span><span>기사ID</span></div>`+epRecs.map(r=>`<div class="tr" style="grid-template-columns:1fr 80px 1fr 90px 100px 75px;cursor:default;"><span style="font-weight:500;">${r.고객명||'-'}</span><span>${r.통문일자||'-'}</span><span style="font-size:12px;color:var(--tx2);">${r.고객주소||'-'}</span><span style="font-size:12px;">${r.제품모델||'-'}</span><span>${r.설치기사명||'-'}</span><span style="font-family:var(--mono);font-size:12px;">${r.설치기사ID||'-'}</span></div>`).join('')+'</div>';}
function saveEPMapping(){localStorage.setItem('ep_col_map',JSON.stringify({name:$('m-name').value,addr:$('m-addr').value,prod:$('m-prod').value,idate:$('m-idate').value,tname:$('m-tname').value,tid:$('m-tid').value}));}
function loadSampleEP(){epRecs=defEP;persist();updateEPBar();renderEPTbl();}
function loadEPFile(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const lines=e.target.result.split('\n').filter(l=>l.trim());if(lines.length<2)return;const m={name:$('m-name').value||'고객명',addr:$('m-addr').value||'고객주소',prod:$('m-prod').value||'제품모델',idate:$('m-idate').value||'통문일자',tname:$('m-tname').value||'설치기사명',tid:$('m-tid').value||'설치기사ID'};const hdr=lines[0].split(',').map(h=>h.replace(/"/g,'').trim());const idx={name:hdr.indexOf(m.name),addr:hdr.indexOf(m.addr),prod:hdr.indexOf(m.prod),idate:hdr.indexOf(m.idate),tname:hdr.indexOf(m.tname),tid:hdr.indexOf(m.tid)};epRecs=lines.slice(1).map(line=>{const c=line.split(',').map(v=>v.replace(/"/g,'').trim());return{고객명:idx.name>=0?c[idx.name]:'',고객주소:idx.addr>=0?c[idx.addr]:'',제품모델:idx.prod>=0?c[idx.prod]:'',통문일자:idx.idate>=0?c[idx.idate]:'',설치기사명:idx.tname>=0?c[idx.tname]:'',설치기사ID:idx.tid>=0?c[idx.tid]:''};}).filter(r=>r.고객명);persist();updateEPBar();renderEPTbl();}catch(err){console.error('오류:', err.message);}};r.readAsText(f,'utf-8');input.value='';}
let acT=null;
function searchEP(v){clearTimeout(acT);const l=$('ac-list');if(!v){l.style.display='none';return;}acT=setTimeout(()=>{const q=v.toLowerCase();const res=epRecs.filter(r=>(r.고객명||'').toLowerCase().includes(q)||(r.고객주소||'').toLowerCase().includes(q)).slice(0,8);if(!res.length){l.style.display='none';return;}window._acR=res;l.innerHTML=res.map((r,i)=>`<div class="aci" data-fill-ep="${i}"><div class="aci-n">${r.고객명} <span style="font-size:11px;font-weight:400;color:var(--tx2);">${r.통문일자}</span></div><div class="aci-s">${r.제품모델} · ${r.고객주소}</div></div>`).join('');l.style.display='block';},140);}
function fillEP(i){
  const r=window._acR[i];if(!r)return;
  $('f-name').value=r.고객명||'';
  $('f-addr').value=r.고객주소||'';
  $('f-product').value=r.제품모델||'';
  // 통문일자 포맷 정규화
  const rawDate=String(r.통문일자||'').trim();
  const normDate=rawDate.replace(/^(\d{4})(\d{2})(\d{2})$/,'$1-$2-$3').replace(/^(\d{4})\.(\d{2})\.(\d{2})$/,'$1-$2-$3').replace(/^(\d{4})\/(\d{2})\/(\d{2})$/,'$1-$2-$3');
  $('f-idate').value=normDate||rawDate;
  $('f-tname').value=r.설치기사명||'';
  $('f-tid').value=r.설치기사ID||'';
  $('ac-list').style.display='none';$('ep-s').value='';
  $('ep-preview').innerHTML=`<div class="ep-match"><div class="em-title"><svg class="ico ico-md"><use href="#ico-circle-check"/></svg> EP 연동됨</div><div class="em-grid"><div><div class="em-l">고객명</div><div class="em-v">${r.고객명}</div></div><div><div class="em-l">통문일자</div><div class="em-v">${normDate||rawDate}</div></div><div><div class="em-l">제품</div><div class="em-v" style="font-size:12px;">${r.제품모델}</div></div><div><div class="em-l">기사</div><div class="em-v">${r.설치기사명}</div></div><div><div class="em-l">기사ID</div><div class="em-v">${r.설치기사ID}</div></div><div><div class="em-l">주소</div><div class="em-v" style="font-size:12px;">${r.고객주소}</div></div></div></div>`;
  updateIdPreview();
}
/* ── 전역 함수 맵 & 이벤트 위임 ── */
function _initHandlers(){
  const FM={
    epFileClick:()=>$('ep-file').click(),
    impCClick:()=>$('imp-c').click(),
    rptFileClick:()=>$('rpt-file').click(),
    clearAutofill,closeCAModal,closeEM,
    closeIFasgn:()=>closeIF('asgn'),closeIFatype:()=>closeIF('atype'),
    closeIFclient:()=>closeIF('client'),closeIFins:()=>closeIF('ins'),
    closeIFpcat:()=>closeIF('pcat'),closeIFpgroup:()=>closeIF('pgroup'),
    closeSuitModal,deleteClaim,editClaim,exportCSV,genReport,
    importClaims:(el)=>importClaims(el),
    loadEPFile:(el)=>loadEPFile(el),
    loadSampleEP,
    navMinor:(el)=>nav('minor',el),
    navConsumer:(el)=>nav('consumer',el),
    navDashboard:(el)=>nav('dashboard',el),
    navEplink:(el)=>nav('eplink',el),
    navInsurance:(el)=>nav('insurance',el),
    navLawsuit:(el)=>nav('lawsuit',el),
    navList2:()=>nav('list',document.querySelector('.nb:nth-child(2)')),
    navList:(el)=>nav('list',el),
    navRegister3:()=>nav('register',document.querySelector('.nb:nth-child(3)')),
    navRegister:(el)=>nav('register',el),
    navReports:(el)=>nav('reports',el),
    navSettingsIns:()=>{nav('settings',document.querySelector('.nb:nth-child(11)'));setTimeout(()=>showSP('insurance',document.querySelectorAll('.snb')[1]),50);},
    navSettings:(el)=>nav('settings',el),
    onClientChange,onPgroupChange,
    openCAForm,
    openIFasgn:()=>openIF('asgn'),openIFatype:()=>openIF('atype'),
    openIFclient:()=>openIF('client'),openIFins:()=>openIF('ins'),
    openIFpcat:()=>openIF('pcat'),openIFpgroup:()=>openIF('pgroup'),
    openSuitForm,renderCA,renderDash,renderList,renderSuit,resetForm,
    saveApiKey:(el)=>saveApiKey(el.value),
    saveAsgnItem,saveAtypeItem,saveCA,saveCfgMapping,saveClaim,
    saveClientItem,saveEPMapping,saveInsClientMapping,saveInsItem,
    savePcatItem,savePgroupItem,saveSuit,
    searchEP:(el)=>searchEP(el.value),
    setQuickAll:()=>setQuick('all'),setQuickMonth:()=>setQuick('month'),
    setQuickQuarter:()=>setQuick('quarter'),setQuickYear:()=>setQuick('year'),
    showInsTabFiles:(el)=>showInsTab('files',el),
    showInsTabMapping:(el)=>showInsTab('mapping',el),
    showInsTabUnmatched:(el)=>showInsTab('unmatched',el),
    showSPatype:(el)=>showSP('accident-types',el),
    showSPassignees:(el)=>showSP('assignees',el),
    showSPclients:(el)=>showSP('clients',el),
    showSPinsurance:(el)=>showSP('insurance',el),
    showSPmapping:(el)=>showSP('mapping',el),
    showSPpcats:(el)=>showSP('product-cats',el),
    showSPpgroups:(el)=>showSP('product-groups',el),
    updateIdPreview,
    uploadTemplate:(el)=>uploadTemplate(el),
    autoCreateClaims:(el)=>autoCreateClaims(JSON.parse(el.dataset.rows||'[]'),el.dataset.insid||''),
    addHistBtn:()=>addHist(),
    chgStatusBtn:()=>chgStatus(),
    runAIanalyze:()=>runAI('analyze'),
    runAIresponse:()=>runAI('response'),
    runAIinternal:()=>runAI('internal'),
    runAIlegal:()=>runAI('legal'),
  };
  document.addEventListener('click',e=>{
    const l=$('ac-list');
    if(l&&!l.contains(e.target)&&e.target.id!=='ep-s')l.style.display='none';
    let el=e.target;
    while(el&&el!==document.body){
      if(el.dataset){
        const d=el.dataset;
        if(d.fn){const fn=FM[d.fn];if(fn){fn(el);return;}}
        // 소송 연결 버튼
        if(el.id==='btn-link-suit'){
          const cid=el.dataset.claimId;
          openLinkSuitModal(cid);return;
        }
        // 소액클레임 보험접수 연결 버튼
        if(el.dataset.linkMinor){linkMinorToClaim(el.dataset.linkMinor);return;}
        // 소액클레임 수정 버튼
        if(el.dataset.editMinor){openMinorForm(el.dataset.editMinor);return;}
        // 소액클레임 삭제 버튼
        if(el.dataset.deleteMinor){deleteMinor(el.dataset.deleteMinor);return;}
        if(d.delType){delItem(d.delType,d.delId);return;}
        if(d.selectIns){selectInsCo(d.selectIns);return;}
        if(d.triggerUpload){triggerInsUpload(d.triggerUpload);return;}
        if(d.loadSample){loadSampleInsFile(d.loadSample);return;}
        if(d.removeFile){removeInsFile(d.removeFile,Number(d.fileIdx));return;}
        if(d.fillEp!==undefined){fillEP(Number(d.fillEp));return;}
        if(d.removeTpl!==undefined){removeTemplate(Number(d.removeTpl));return;}
        if(d.openCa){openCADetail(d.openCa);return;}
        if(d.openSuit){openSuitForm(d.openSuit);return;}
        if(d.insColor){
          selInsColor=d.insColor;
          document.querySelectorAll('#ins-color-picker .color-dot').forEach(x=>x.classList.remove('selected'));
          el.classList.add('selected');
          return;
        }
        if(d.itemColorIns){item_color(d.itemColorIns,d.itemColor,el);return;}
        if('claimId' in d){
          const cid=d.claimId;
          const insRow=d.insRow;
          if(cid)openDetail(cid);
          else if(insRow){try{prefillFromInsRow(JSON.parse(insRow.replace(/&apos;/g,"'")));}catch(err){console.error(err);}}
          return;
        }
        // 소액클레임 행 클릭
        if(d.minorId){openMinorForm(d.minorId);return;}
      }
      el=el.parentElement;
    }
  });
  document.addEventListener('input',e=>{
    let el=e.target;
    while(el&&el!==document.body){
      if(el.dataset&&el.dataset.fni){const fn=FM[el.dataset.fni];if(fn){fn(el);return;}}
      el=el.parentElement;
    }
  });
  document.addEventListener('change',e=>{
    // 보험사 파일 업로드
    if(e.target.dataset&&e.target.dataset.insUpload){uploadInsFile(e.target,e.target.dataset.insUpload);return;}
    // data-map-id (고객사-보험사 매핑 select)
    if(e.target.dataset&&e.target.dataset.mapId){clientMapping[e.target.dataset.mapId]=e.target.value;return;}
    let el=e.target;
    while(el&&el!==document.body){
      if(el.dataset&&el.dataset.fnc){const fn=FM[el.dataset.fnc];if(fn){fn(el);return;}}
      el=el.parentElement;
    }
  });
  // 상태 재계산 버튼
  const brs=$('btn-recalc-status');
  if(brs)brs.addEventListener('click',()=>{
    let cnt=0;
    claims.forEach(c=>{
      // insFiles에서 해당 클레임의 처리구분 찾기
      const allRows=getAllInsRows();
      const row=allRows.find(r=>r.접수번호&&c.insNo&&r.접수번호===c.insNo);
      if(row&&row.처리구분){
        const proc=row.처리구분;
        let newStatus=c.status;
        if(proc.includes('면책')||proc.includes('부지급'))newStatus='면책';
        else if(proc.includes('종결')||proc.includes('지급완료'))newStatus='종결';
        else if(proc.includes('조사')||proc.includes('검토'))newStatus='검토';
        else if(proc.includes('처리')||proc.includes('진행'))newStatus='처리';
        if(newStatus!==c.status){c.status=newStatus;cnt++;}
        // 지급보험금도 업데이트
        if(newStatus==='종결'&&row.지급보험금){c.finalPayment=row.지급보험금;c.amount=row.지급보험금;}
        else if(row.추산보험금OS){c.amount=row.추산보험금OS;}
      }
    });
    persist();renderDash();renderList();
    const msg=document.createElement('div');
    msg.style.cssText='position:fixed;bottom:24px;right:24px;padding:12px 18px;background:var(--blue);color:#fff;border-radius:10px;font-size:13px;font-weight:500;z-index:400;';
    msg.textContent=`✓ ${cnt}건 상태 업데이트 완료`;
    document.body.appendChild(msg);setTimeout(()=>msg.remove(),3000);
  });
  // 전체 클레임 삭제 버튼 (설정탭 + 목록탭)
  ['btn-clear-claims','btn-clear-claims-list'].forEach(id=>{
    try{
      const bcc=$(id);
      if(bcc)bcc.addEventListener('click',()=>{
        if(claims.length===0)return;
        claims=[];persist();renderDash();renderList();updateInsBadge();
        const msg=document.createElement('div');
        msg.style.cssText='position:fixed;bottom:24px;right:24px;padding:12px 18px;background:var(--red);color:#fff;border-radius:10px;font-size:13px;font-weight:500;z-index:400;';
        msg.textContent='✓ 클레임 전체 삭제 완료';
        document.body.appendChild(msg);setTimeout(()=>msg.remove(),3000);
      });
    }catch(e){console.log('버튼 없음:',id);}
  });

  const amc=$('auto-modal-close');if(amc)amc.addEventListener('click',()=>$('auto-create-modal').classList.remove('open'));
  // 소액클레임 모달 버튼
  const mnc=$('minor-modal-close');if(mnc)mnc.addEventListener('click',()=>$('minor-modal').classList.remove('open'));
  const mnca=$('minor-modal-cancel');if(mnca)mnca.addEventListener('click',()=>$('minor-modal').classList.remove('open'));
  const mncs=$('minor-modal-save');if(mncs)mncs.addEventListener('click',saveMinor);
  const mnnew=$('btn-new-minor');if(mnnew)mnnew.addEventListener('click',()=>openMinorForm());
  const mnq=$('minor-q');if(mnq)mnq.addEventListener('input',renderMinor);
  const mnst=$('minor-status');if(mnst)mnst.addEventListener('change',renderMinor);
  const mnty=$('minor-type');if(mnty)mnty.addEventListener('change',renderMinor);
  const amca=$('auto-modal-cancel');if(amca)amca.addEventListener('click',()=>$('auto-create-modal').classList.remove('open'));
  const amco=$('auto-modal-confirm');if(amco)amco.addEventListener('click',()=>{autoCreateClaims(_pendingAutoRows,_pendingAutoInsId);$('auto-create-modal').classList.remove('open');});
}


/* ══════════════════════════════════════════════
   INSURANCE PAGE
══════════════════════════════════════════════ */
function renderInsurancePage(){
  renderInsMappingRows();renderInsSidebar();renderInsStats2();
}
function renderInsStats2(){
  const allRows=getAllInsRows();
  if(!allRows.length){$('ins-stat-grid2').style.display='none';return;}
  const tp=allRows.reduce((a,r)=>a+(r.지급보험금||0),0),tos=allRows.reduce((a,r)=>a+(r.추산보험금OS||0),0),un=allRows.filter(r=>!matchInsRow(r)).length;
  $('ins-stat-grid2').style.display='grid';
  $('ins-stat-grid2').innerHTML=`<div class="sc bordered"><div class="sl">전체 건수</div><div class="sv bl">${allRows.length}</div></div><div class="sc bordered"><div class="sl">지급보험금</div><div class="sv gr">${fmt만원(tp)}</div></div><div class="sc bordered"><div class="sl">추산(O/S)</div><div class="sv am">${fmt만원(tos)}</div></div><div class="sc bordered" style="cursor:pointer;" data-fn="showInsTabUnmatched"><div class="sl">미매칭</div><div class="sv rd">${un}건</div></div>`;
}
function renderInsMappingRows(){
  const el=$('ins-mapping-rows');if(!el)return;
  el.innerHTML=clients.map(c=>{
    const insId=clientMapping[c.id]||'';
    const ins=insCompanies.find(x=>x.id===insId);
    return `<div class="map-row">
      <div class="map-client">${c.name}</div>
      <span style="color:var(--tx3);font-size:12px;">→</span>
      <select class="map-select" data-map-id="${c.id}">
        <option value="">미지정</option>
        ${insCompanies.map(x=>`<option value="${x.id}" ${insId===x.id?'selected':''}>${x.name}</option>`).join('')}
      </select>
      ${ins?`<div style="width:10px;height:10px;border-radius:50%;background:${ins.color};flex-shrink:0;"></div>`:'<div style="width:10px;"></div>'}
    </div>`;
  }).join('');
  if(!clients.length)el.innerHTML='<div class="empty">고객사를 먼저 설정·관리 탭에서 추가하세요</div>';
}
function saveInsClientMapping(){persist();renderInsMappingRows();}
function renderInsSidebar(){
  const sb=$('ins-sidebar');if(!sb)return;
  sb.innerHTML=insCompanies.length?insCompanies.map(ins=>{
    const files=insFiles[ins.id]||[];const totalRows=files.reduce((a,f)=>a+(f.rows||[]).length,0);
    return `<div class="ins-co-item ${curInsCoId===ins.id?'active':''}" data-select-ins="${ins.id}">
      <div class="ins-co-dot" style="background:${ins.color}22;color:${ins.color};">${ins.name[0]}</div>
      <div style="flex:1;min-width:0;"><div class="ins-co-name">${ins.name}</div><div style="font-size:11px;color:var(--tx2);">${files.length}개 파일 · ${totalRows}건</div></div>
    </div>`;
  }).join(''):'<div class="empty" style="padding:20px;font-size:12px;">설정·관리 탭에서 보험사를 추가하세요</div>';
}
function selectInsCo(id){curInsCoId=id;renderInsSidebar();renderInsDetail(id);}
function renderInsDetail(id){
  const panel=$('ins-detail-panel');if(!panel)return;
  const ins=insCompanies.find(x=>x.id===id);if(!ins){panel.innerHTML='<div class="empty">보험사를 선택하세요</div>';return;}
  const files=insFiles[id]||[];
  const totalRows=files.reduce((a,f)=>a+(f.rows||[]).length,0);
  const tp=files.reduce((a,f)=>(f.rows||[]).reduce((b,r)=>b+(r.지급보험금||0),a),0);
  const tos=files.reduce((a,f)=>(f.rows||[]).reduce((b,r)=>b+(r.추산보험금OS||0),a),0);
  panel.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:13px;">
      <div style="width:36px;height:36px;border-radius:50%;background:${ins.color}22;color:${ins.color};display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:500;">${ins.name[0]}</div>
      <div><div style="font-size:15px;font-weight:500;">${ins.name}</div><div style="font-size:12px;color:var(--tx2);">${ins.memo||''}</div></div>
      <div style="margin-left:auto;display:flex;gap:6px;">
        <button class="btn sm suc" data-trigger-upload="${id}"><svg class="ico ico-md"><use href="#ico-upload"/></svg> Excel 업로드</button>
        <button class="btn sm" data-load-sample="${id}"><svg class="ico ico-md"><use href="#ico-table"/></svg> 샘플</button>
        <input type="file" id="ins-file-${id}" accept=".xlsx,.xls,.csv" style="display:none" data-ins-upload="${id}">
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:9px;margin-bottom:13px;">
      <div class="sc"><div class="sl">전체 건수</div><div class="sv bl">${totalRows}</div></div>
      <div class="sc"><div class="sl">지급보험금</div><div class="sv gr">${fmt만원(tp)}</div></div>
      <div class="sc"><div class="sl">추산(O/S)</div><div class="sv am">${fmt만원(tos)}</div></div>
    </div>
    ${files.length?files.map((f,fi)=>`
      <div class="ins-file-row">
        <svg class="ico ico-md" style="color:var(--green);font-size:18px;"><use href="#ico-file-spreadsheet"/></svg>
        <div style="flex:1;"><div style="font-size:13px;font-weight:500;">${f.filename}</div><div style="font-size:11px;color:var(--tx2);">${f.uploadDate}</div></div>
        <span style="font-size:12px;color:var(--blue);font-weight:500;">${(f.rows||[]).length}건</span>
        <button class="btn sm dng" data-remove-file="${id}" data-file-idx="${fi}"><svg class="ico ico-md"><use href="#ico-trash"/></svg></button>
      </div>
      <div class="tbl" style="margin-bottom:11px;">
        <div class="th ins-preview-row" style="cursor:default;grid-template-columns:120px 1fr 80px 80px 70px 70px;">
          <span>접수번호</span><span>고객명/주소</span><span>지급</span><span>추산(O/S)</span><span>처리</span><span>매칭</span>
        </div>
        ${(f.rows||[]).map(r=>{const m=matchInsRow(r);const insRowStr=JSON.stringify(r).replace(/'/g,"&apos;");return`<div class="ins-preview-row" style="grid-template-columns:120px 1fr 80px 80px 70px 70px;cursor:pointer;" data-claim-id="${m?m.id:''}" data-ins-row="${insRowStr}">
          <span style="font-family:var(--mono);font-size:11px;">${r.접수번호||'-'}</span>
          <span><b style="font-weight:500;">${(r.고객명||'').replace(/\(.*\)/,'')}</b> <span style="font-size:11px;color:var(--tx2);">${(r.주소||'').slice(0,16)}</span></span>
          <span>${fmt만원(r.지급보험금)}</span><span>${fmt만원(r.추산보험금OS)}</span>
          <span>${r.처리구분||'-'}</span>
          <span><span class="bdg ${m?'b-매칭':'b-신규'}">${m?'매칭':'미매칭'}</span></span>
        </div>`}).join('')}
      </div>`).join(''):'<div class="empty">업로드된 파일 없음</div>'}`;
}
function triggerInsUpload(id){const el=$(`ins-file-${id}`);if(el)el.click();}
function uploadInsFile(input,insId){
  const f=input.files[0];if(!f)return;
  const isCSV=f.name.toLowerCase().endsWith('.csv');
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      let rows;
      if(isCSV){const lines=e.target.result.split('\n').filter(l=>l.trim());const hdr=lines[0].split(',').map(h=>h.replace(/"/g,'').trim());rows=lines.slice(1).map(line=>{const cols=line.split(',').map(v=>v.replace(/"/g,'').trim());const obj={};hdr.forEach((h,i)=>obj[h]=cols[i]||'');return obj;});}
      else{const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});const ws=wb.Sheets[wb.SheetNames[0]];rows=XLSX.utils.sheet_to_json(ws,{defval:'',raw:true});
        // 날짜 셀을 YYYY-MM-DD 문자열로 변환
        rows=rows.map(row=>{const r={};Object.keys(row).forEach(k=>{const v=row[k];if(v instanceof Date){r[k]=v.toISOString().slice(0,10);}else{r[k]=v;}});return r;});
      }
      const parsed=rows.map(parseInsRow).filter(r=>r.접수번호||r.고객명);
      console.log('[디버그] 엑셀 첫행 키:', rows[0]?Object.keys(rows[0]):[]);
      console.log('[디버그] 엑셀 첫행 원본:', rows[0]);
      console.log('[디버그] 파싱결과 첫행:', parsed[0]);
      console.log('[디버그] 전체건수:', rows.length, '→ 파싱:', parsed.length);
      if(!insFiles[insId])insFiles[insId]=[];
      // 기존 파일에서 같은 파일명 있으면 교체, 없으면 추가
      const existIdx=insFiles[insId].findIndex(x=>x.filename===f.name);
      if(existIdx>=0)insFiles[insId][existIdx]={filename:f.name,uploadDate:new Date().toISOString().slice(0,10),rows:parsed};
      else insFiles[insId].unshift({filename:f.name,uploadDate:new Date().toISOString().slice(0,10),rows:parsed});
      persist();renderInsDetail(insId);renderInsSidebar();renderInsStats2();updateInsBadge();
      // 새로 생성할 건 미리보기
      showAutoCreatePreview(parsed, insId);
    }catch(err){console.error('파싱 오류:', err.message);}
  };
  if(isCSV)reader.readAsText(f,'utf-8');else reader.readAsArrayBuffer(f);
  input.value='';
}

/* 자동 클레임 생성 미리보기 */
let _pendingAutoRows=[], _pendingAutoInsId='';
function showAutoCreatePreview(parsed, insId){
  // 기존 클레임에 없는 건만 필터
  // 1) 보험사 접수번호가 있고 이미 등록된 건 제외
  // 2) 고객명+설치일로 매칭되는 건 제외
  const existingNos=new Set(claims.map(c=>c.insNo).filter(Boolean));
  const newRows=parsed.filter(r=>{
    // 보험사 접수번호로 중복 체크
    if(r.접수번호&&existingNos.has(r.접수번호))return false;
    // 고객명+설치일로 매칭 체크
    if(matchInsRow(r))return false;
    return true;
  });
  if(!newRows.length){
    const panel=$('ins-detail-panel');
    if(panel){
      const notice=document.createElement('div');
      notice.style.cssText='margin-top:10px;padding:9px 13px;background:#EAF3DE;border:0.5px solid #C0DD97;border-radius:8px;font-size:13px;color:#3B6D11;';
      notice.textContent=`✓ 새로 생성할 클레임 없음 — 전체 ${parsed.length}건 중 기존 매칭 ${parsed.length-newRows.length}건`;
      panel.prepend(notice);
      setTimeout(()=>notice.remove(),4000);
    }
    return;
  }
  _pendingAutoRows=newRows;
  _pendingAutoInsId=insId;
  // 모달 내용 채우기
  $('auto-modal-desc').innerHTML=`아래 <b style="color:#185FA5;">${newRows.length}건</b>이 새로 생성됩니다. 확인 후 등록해주세요.`;
  $('auto-modal-confirm').textContent=`${newRows.length}건 클레임 등록`;
  $('auto-modal-list').innerHTML=newRows.map(r=>`
    <div class="tr" style="grid-template-columns:130px 80px 80px 160px 80px 80px 130px;cursor:default;">
      <span style="font-family:var(--mono);font-size:11px;color:var(--blue);">${r.접수번호||'-'}</span>
      <span style="font-size:12px;">${r.대구분||'-'}</span>
      <span style="font-size:12px;">${r.제품구분||'-'}</span>
      <span><b style="font-weight:500;">${(r.고객명||'').replace(/\(.*\)/,'')}</b><br><span style="color:var(--tx2);font-size:11px;">${(r.주소||'').slice(0,20)}</span></span>
      <span style="font-size:12px;">${r.설치일||'-'}</span>
      <span style="font-size:12px;">${r.접수일||'-'}</span>
      <span style="font-size:11px;">${r.손해사정담당자||'-'}${r.손해사정연락처?`<br><span style="color:var(--tx2);">${r.손해사정연락처}</span>`:''}</span>
    </div>`).join('');
  $('auto-create-modal').classList.add('open');
}

/* 자동 클레임 생성 실행 */
function autoCreateClaims(newRows, insId){
  if(typeof newRows==='string')newRows=JSON.parse(newRows);
  const today=new Date().toISOString().slice(0,10);
  let created=0;
  newRows.forEach(r=>{
    // 대구분 → 대분류
    const grp=mapDaeguBun(r.대구분)||{id:'',code:'XX',name:'미지정'};
    // 제품구분 → 제품군
    const pcat=mapJeumunGubun(r.제품구분);
    const pcatCode=pcat?.code||'ETC';
    const pcatName=pcat?.name||r.제품구분||'기타';
    const t=(r.원인1||'')+(r.원인2||'');
    const atype=accidentTypes.find(x=>t.includes(x.name));
    const typeCode=atype?.code||'E';
    const typeName=atype?.name||'기타';
    const cEntry=Object.entries(clientMapping).find(([k,v])=>v===insId);
    const clientId=cEntry?.[0]||'';
    const clientName=clients.find(c=>c.id===clientId)?.name||'';
    // 접수번호 연도 = 보험접수일 연도 기준
    const insYear=r.접수일?parseInt(r.접수일.slice(0,4)):new Date().getFullYear();
    const year=isNaN(insYear)?new Date().getFullYear():insYear;
    const newId=genId(year,grp.code,pcatCode,typeCode);
    const lv=(r.귀책여부||'').trim();
    const liability=['귀책','비귀책','확인중','분쟁중'].includes(lv)?lv:(lv?'확인중':'');
    let evalReflect='';
    if(r.평가반영){const ev=r.평가반영.trim();if(ev.includes('미반영'))evalReflect='미반영';else if(ev.includes('반영'))evalReflect='반영';else if(ev.includes('검토'))evalReflect='검토중';}
    // 처리구분 → 상태 매핑
    const proc=r.처리구분||'';
    let claimStatus='접수';
    if(proc.includes('면책')||proc.includes('부지급'))claimStatus='면책';
    else if(proc.includes('종결')||proc.includes('지급완료'))claimStatus='종결';
    else if(proc.includes('조사')||proc.includes('검토'))claimStatus='검토';
    else if(proc.includes('처리')||proc.includes('진행'))claimStatus='처리';
    // 종결이면 지급보험금, 진행중이면 추산O/S
    const mainAmt=claimStatus==='종결'?(r.지급보험금||0):(r.추산보험금OS||r.지급보험금||0);
    claims.unshift({
      id:newId,clientId,client:clientName,
      pcat:pcatCode,pcatName,
      groupId:grp.id,groupCode:grp.code,groupName:grp.name,
      name:(r.고객명||'').replace(/\(.*\)/,'').trim(),
      phone:'',addr:r.주소||'',product:r.설치주문번호||r.제품구분||'',
      idate:r.설치일||'',tname:r.설치기사||'',tid:'',
      type:typeName,typeCode,assignee:'',
      amount:mainAmt,
      insDate:r.접수일||'',date:today,
      desc:r.피해내용||'-',
      note:`보험사 접수번호: ${r.접수번호} / 손해사정: ${r.손해사정담당자||'-'} ${r.손해사정연락처||''}`.trim(),
      survey:r.조사비OS||0,finalPayment:r.지급보험금||0,
      logistics:r.물류센터||'',orderNo:r.설치주문번호||'',
      insCoId:insId,insNo:r.접수번호,
      liability,evalReflect,status:claimStatus,
      history:[{date:today,text:`보험사 파일에서 자동 생성 (${r.접수번호}) / 처리구분: ${proc||'-'}`}],
    });
    created++;
  });
  persist();
  document.getElementById('auto-create-modal')?.remove();
  // 완료 메시지
  const msg=document.createElement('div');
  msg.style.cssText='position:fixed;bottom:24px;right:24px;padding:12px 18px;background:#185FA5;color:#fff;border-radius:10px;font-size:13px;font-weight:500;z-index:400;box-shadow:0 4px 16px rgba(0,0,0,0.2);';
  msg.textContent=`✓ ${created}건 클레임 자동 생성 완료`;
  document.body.appendChild(msg);
  setTimeout(()=>msg.remove(),3000);
  renderInsDetail(insId);updateInsBadge();
}
function loadSampleInsFile(insId){
  if(!insFiles[insId])insFiles[insId]=[];
  insFiles[insId].unshift({filename:`샘플_${new Date().toISOString().slice(0,10)}.xlsx`,uploadDate:new Date().toISOString().slice(0,10),rows:JSON.parse(JSON.stringify(defInsRows))});
  persist();renderInsDetail(insId);renderInsSidebar();renderInsStats2();updateInsBadge();
  
}
function removeInsFile(insId,fi){if(insFiles[insId])insFiles[insId].splice(fi,1);persist();renderInsDetail(insId);renderInsSidebar();renderInsStats2();updateInsBadge();}
function renderUnmatched(){
  const unmatched=getAllInsRows().filter(r=>!matchInsRow(r));
  $('ins-unmatched-list').innerHTML=unmatched.length?unmatched.map(r=>`
    <div class="tr" style="grid-template-columns:130px 1fr 90px 90px 80px 80px;" data-claim-id="" data-ins-row='${JSON.stringify(r).replace(/'/g,"&#39;")}'>
      <span style="font-family:var(--mono);font-size:11px;">${r.접수번호||'-'}</span>
      <span><b style="font-weight:500;">${(r.고객명||'').replace(/\(.*\)/,'')}</b> <span style="font-size:11px;color:var(--tx2);">${(r.주소||'').slice(0,20)}</span></span>
      <span style="font-size:12px;">${fmt만원(r.지급보험금)}</span><span style="font-size:12px;">${fmt만원(r.추산보험금OS)}</span>
      <span style="font-size:12px;">${r.처리구분||'-'}</span>
      <span><span class="bdg b-신규">등록 →</span></span>
    </div>`).join(''):'<div class="empty">미매칭 없음 🎉</div>';
}
let _prefilling=false;
function prefillFromInsRow(r){
  if(typeof r==='string')r=JSON.parse(r);

  // 1) 탭 전환
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  $('s-register').classList.add('active');
  const regBtn=document.querySelector('.nb:nth-child(3)');
  if(regBtn)regBtn.classList.add('active');

  // 2) 드롭다운 초기화
  editId=null;
  $('form-title').textContent='신규 클레임 접수';
  $('f-date').value=new Date().toISOString().slice(0,10);
  populateRegisterDropdowns();

  // 3) 값 세팅 — populateRegisterDropdowns 완료 후 실행
  setTimeout(()=>{
    $('f-name').value=(r.고객명||'').replace(/\(.*\)/,'').trim();
    $('f-addr').value=r.주소||'';
    $('f-tname').value=r.설치기사||'';
    $('f-desc').value=r.피해내용||'';
    $('f-note').value=`보험사 접수번호: ${r.접수번호||'-'}`;
    // 설치 주문번호
    const fprod=$('f-product');if(fprod)fprod.value=r.설치주문번호||'';
    // 물류센터
    const flog=$('f-logistics');if(flog)flog.value=r.물류센터||'';
    // 추산보험금 O/S
    const famt=$('f-amt');if(famt&&r.추산보험금OS)famt.value=r.추산보험금OS;
    // 조사비 O/S
    const fsurv=$('f-survey');if(fsurv&&r.조사비OS)fsurv.value=r.조사비OS;
    // 지급보험금
    const fpaid=$('f-paid');if(fpaid&&r.지급보험금)fpaid.value=r.지급보험금;

    // 통문일자 ← 설치일
    if(r.설치일){
      const nd=normalizeDate(String(r.설치일));
      const el=$('f-idate');
      if(el)el.value=nd||String(r.설치일).trim();
    }
    // 보험 접수일 ← 엑셀 접수일
    if(r.접수일){
      const nd=normalizeDate(String(r.접수일));
      const el=$('f-ins-date');if(el)el.value=nd||String(r.접수일).trim();
    }
    // 손해액
    const amt=(r.지급보험금||0)||(r.추산보험금OS||0);
    if(amt){const el=$('f-amt');if(el)el.value=amt;}
    // 귀책여부
    const liabEl=$('f-liability');
    if(liabEl&&r.귀책여부){
      const lv=r.귀책여부.trim();
      liabEl.value=['귀책','비귀책','확인중','분쟁중'].includes(lv)?lv:'확인중';
    }
    // 평가반영여부
    const evalEl=$('f-eval');
    if(evalEl&&r.평가반영){
      const ev=r.평가반영.trim();
      if(ev.includes('미반영'))evalEl.value='미반영';
      else if(ev.includes('반영'))evalEl.value='반영';
      else if(ev.includes('검토'))evalEl.value='검토중';
    }
    // 대구분 → 대분류
    const grp=mapDaeguBun(r.대구분);
    const pgEl=$('f-pgroup');
    if(pgEl){
      pgEl.innerHTML='<option value="">선택</option>'+productGroups.map(g=>`<option value="${g.id}">${g.name} (${g.code})</option>`).join('');
      if(grp){pgEl.value=grp.id;onPgroupChange();}
    }
    // 사고유형
    const t=(r.원인1||'')+(r.원인2||'');
    const atype=accidentTypes.find(x=>t.includes(x.name));
    if(atype&&$('f-type'))$('f-type').value=atype.code;
    // 고객사 역매핑
    const insId=r._insId;
    if(insId){
      const cEntry=Object.entries(clientMapping).find(([k,v])=>v===insId);
      if(cEntry&&$('f-cs')){$('f-cs').value=cEntry[0];onClientChange();}
    }
    // 제품군
    setTimeout(()=>{
      const pcat=mapJeumunGubun(r.제품구분);
      const pcEl=$('f-pcat');
      if(pcEl&&pcat){
        const opt=[...pcEl.options].find(o=>o.value===pcat.code);
        if(opt)pcEl.value=pcat.code;
        else{const no=document.createElement('option');no.value=pcat.code;no.textContent=`${pcat.name} (${pcat.code})`;pcEl.appendChild(no);pcEl.value=pcat.code;}
      }
      updateIdPreview();

      // 설치일자/보험접수일 — 맨 마지막에 강제 세팅 (어떤 초기화도 덮어씀)
      if(r.설치일){
        const nd=excelDateToStr(String(r.설치일));
        const el=$('f-idate');
        if(el){el.value=nd||String(r.설치일).trim();}
      }
      if(r.접수일){
        const nd=excelDateToStr(String(r.접수일));
        const el=$('f-ins-date');
        if(el){el.value=nd||String(r.접수일).trim();}
      }
    },200);

    // 자동입력 배너
    const banner=$('autofill-banner');
    if(banner){banner.style.display='flex';$('autofill-msg').textContent=`보험사 데이터 자동 입력 — ${r.접수번호||r.피해내용||''}`;}
  },50);
}
function deleteClaim(){if(!curDetail)return;claims=claims.filter(c=>c.id!==curDetail.id);persist();nav('list',document.querySelector('.nb:nth-child(2)'));}

/* ══════════════════════════════════════════════
   DETAIL
══════════════════════════════════════════════ */
function openDetail(id){
  curDetail=claims.find(c=>c.id===id);if(!curDetail)return;
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  $('s-detail').classList.add('active');
  $('detail-title').textContent=`상세 — ${curDetail.id}`;
  const c=curDetail,steps=['접수','검토','처리','종결'],si=steps.indexOf(c.status);
  const insName=c.insCoId?getInsName(c.insCoId):(c.clientId?getInsForClient(c.clientId)?.name||'-':'-');
  const allRows=getAllInsRows();
  const insRow=allRows.find(r=>{const nm=(r.고객명||'').replace(/\(.*\)/,'').trim();return c.name&&c.name.includes(nm)&&nm.length>1&&c.idate&&r.설치일&&(c.idate===r.설치일||c.idate.replace(/-/g,'')===r.설치일.replace(/-/g,''));});
  const insHtml=insRow?`<div class="card" style="background:#EAF3DE;border-color:#C0DD97;margin-bottom:13px;">
    <h3 style="color:var(--green);">보험사 연동 정보</h3>
    <div class="dr"><span class="dk" style="color:var(--green);">보험사</span><span style="font-weight:500;">${insName}</span></div>
    <div class="dr"><span class="dk" style="color:var(--green);">보험사 접수번호</span><span style="font-family:var(--mono);font-size:12px;">${insRow.접수번호||'-'}</span></div>
    <div class="dr"><span class="dk" style="color:var(--green);">지급보험금</span><span style="font-weight:500;color:var(--green);">${fmt만원(insRow.지급보험금)}</span></div>
    <div class="dr"><span class="dk" style="color:var(--green);">추산(O/S)</span><span>${fmt만원(insRow.추산보험금OS)}</span></div>
    <div class="dr"><span class="dk" style="color:var(--green);">처리구분</span><span>${insRow.처리구분||'-'}</span></div>
    <div class="dr"><span class="dk" style="color:var(--green);">귀책여부</span><span>${insRow.귀책여부||'-'}</span></div>
  </div>`:'';
  $('detail-content').innerHTML=`
    <div class="ps">${steps.map((s,i)=>`<div class="pst ${i<si?'done':i===si?'active':''}"><div class="pc">${i<si?'<svg class="ico ico-md"><use href="#ico-check"/></svg>':i+1}</div><div class="pl">${s}</div></div>`).join('')}</div>
    <div style="background:#E6F1FB;border:0.5px solid #B5D4F4;border-radius:var(--r-md);padding:9px 13px;margin-bottom:13px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <svg class="ico ico-md" style="color:var(--blue);font-size:16px;"><use href="#ico-hash"/></svg>
      <span style="font-family:var(--mono);font-size:16px;font-weight:500;color:var(--blue);letter-spacing:1px;">${c.id}</span>
      <span style="font-size:12px;color:#378ADD;">${c.groupName||'-'} › ${c.pcatName||'-'} · ${c.type} · ${c.client||'-'} · 담당보험사: ${insName}</span>
      ${insRow?'<span class="bdg b-매칭" style="margin-left:auto;">보험사 연동됨</span>':''}
    </div>
    ${insHtml}
    <div class="dg">
      <div class="card"><h3>기본 정보</h3>
        <div class="dr"><span class="dk">고객사</span><span style="font-weight:500;">${c.client||'-'}</span></div>
        <div class="dr"><span class="dk">담당 보험사</span><span>${insName}</span></div>
        <div class="dr"><span class="dk">고객명</span><span>${c.name}</span></div>
        <div class="dr"><span class="dk">연락처</span><span>${c.phone||'-'}</span></div>
        <div class="dr"><span class="dk">주소</span><span style="font-size:12px;">${c.addr||'-'}</span></div>
        <div class="dr"><span class="dk">제품모델</span><span style="font-size:12px;">${c.product||'-'}</span></div>
        <div class="dr"><span class="dk">사고유형</span><span>${c.type}</span></div>
        <div class="dr"><span class="dk">귀책여부</span><span style="font-weight:500;color:${c.liability==='귀책'?'var(--red)':c.liability==='비귀책'?'var(--green)':'var(--amber)'};">${c.liability||'-'}</span></div>
        <div class="dr"><span class="dk">평가반영</span><span>${c.evalReflect||'-'}</span></div>
        <div class="dr"><span class="dk">추산보험금 O/S</span><span>${c.amount?c.amount.toLocaleString()+'원':'-'}</span></div>
        ${c.survey?`<div class="dr"><span class="dk">조사비 O/S</span><span>${c.survey.toLocaleString()}원</span></div>`:''}
        ${c.finalPayment?`<div class="dr"><span class="dk">지급보험금</span><span style="font-weight:500;color:var(--green);">${c.finalPayment.toLocaleString()}원</span></div>`:''}
        ${c.logistics?`<div class="dr"><span class="dk">물류센터</span><span>${c.logistics}</span></div>`:''}
        ${c.orderNo?`<div class="dr"><span class="dk">설치 주문번호</span><span style="font-family:var(--mono);font-size:12px;">${c.orderNo}</span></div>`:''}
        <div class="dr"><span class="dk">담당자</span><span>${c.assignee||'-'}</span></div>
        <div class="dr"><span class="dk">클레임 입력일</span><span>${c.date}</span></div>
        ${c.insDate?`<div class="dr"><span class="dk">보험 접수일</span><span style="color:var(--blue);">${c.insDate}</span></div>`:''}
      </div>
      <div class="card"><h3>EP 설치이력</h3>
        <div class="dr"><span class="dk">설치일자</span><span>${c.idate||'-'}</span></div>
        <div class="dr"><span class="dk">설치기사</span><span>${c.tname||'-'}</span></div>
        <div class="dr"><span class="dk">기사ID</span><span style="font-family:var(--mono);font-size:12px;">${c.tid||'-'}</span></div>
        <div style="border-top:0.5px solid var(--bd3);margin:9px 0;"></div>
        <h3>처리 이력</h3>
        <div>${(c.history||[]).map(h=>`<div class="tl-i"><div class="tl-d"></div><div class="tl-ln"></div><div><div>${h.text}</div><div class="tl-dt">${h.date}</div></div></div>`).join('')}</div>
        <div style="display:flex;gap:7px;margin-top:9px;">
          <input type="text" id="hist-inp" placeholder="처리 내용..." style="flex:1;padding:5px 8px;font-size:12px;border:0.5px solid var(--bd2);border-radius:var(--r-md);background:var(--bg1);color:var(--tx1);font-family:var(--font);">
          <button class="btn sm" data-fn="addHistBtn">추가</button>
        </div>
        <div style="margin-top:9px;display:flex;gap:5px;align-items:center;">
          <span style="font-size:12px;color:var(--tx2);">상태:</span>
          <select id="st-sel" style="padding:4px 7px;font-size:12px;border:0.5px solid var(--bd2);border-radius:var(--r-md);background:var(--bg1);color:var(--tx1);font-family:var(--font);">
            ${['접수','검토','처리','종결','면책','소송중','보류'].map(s=>`<option ${c.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="btn sm pri" data-fn="chgStatusBtn">적용</button>
        </div>
      </div>
    </div>
    <div class="card" style="margin-bottom:13px;"><h3>클레임 내용</h3>
      <p style="font-size:13px;line-height:1.7;">${c.desc}</p>
      ${c.note?`<div style="margin-top:7px;padding:7px 9px;background:var(--bg2);border-radius:var(--r-md);font-size:12px;color:var(--tx2);"><b style="font-weight:500;">비고:</b> ${c.note}</div>`:''}
    </div>
    ${(()=>{
      const linked=lawsuits.filter(s=>s.claimRef===c.id);
      return `<div class="card" style="margin-bottom:13px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;">
          <h3 style="margin:0;flex:1;"><svg class="ico ico-md" style="color:var(--red);"><use href="#ico-scale"/></svg> 소송 연결</h3>
          <button class="btn sm pri" id="btn-link-suit" data-claim-id="${c.id}">+ 소송 연결/등록</button>
        </div>
        ${linked.length?linked.map(s=>`
          <div style="padding:9px 11px;background:#FCEBEB;border:0.5px solid #F7C1C1;border-radius:var(--r-md);margin-bottom:7px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-family:var(--mono);font-size:12px;font-weight:500;color:#922B21;">${s.no||'-'}</span>
              <span class="suit-${s.status||'소장접수'}">${s.status||'-'}</span>
              <span style="font-size:12px;color:var(--tx2);flex:1;">${s.court||'-'} · ${s.instance||''}</span>
              <span style="font-size:12px;font-weight:500;">${s.amount?s.amount.toLocaleString()+'원':'-'}</span>
            </div>
            <div style="font-size:11px;color:var(--tx2);margin-top:4px;">${s.plaintiff||'-'} → ${s.defendant||'-'} ${s.nextDate?`· 다음기일: ${s.nextDate}`:''}</div>
            ${s.result?`<div style="font-size:11px;color:#922B21;margin-top:3px;">결과: ${s.result} ${s.resultAmount?'/ '+s.resultAmount.toLocaleString()+'원':''}</div>`:''}
          </div>`).join('')
        :'<div style="font-size:13px;color:var(--tx3);padding:8px 0;">연결된 소송 없음</div>'}
      </div>`;
    })()}
    <div class="aib"><h3><svg class="ico ico-md" style="color:var(--blue);"><use href="#ico-robot"/></svg> AI 분석 · 초안 생성</h3>
      <div style="display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px;">
        <button class="btn sm" data-fn="runAIanalyze"><svg class="ico ico-md"><use href="#ico-search"/></svg> 클레임 분석</button>
        <button class="btn sm" data-fn="runAIresponse"><svg class="ico ico-md"><use href="#ico-file-text"/></svg> 고객 회신 초안</button>
        <button class="btn sm" data-fn="runAIinternal"><svg class="ico ico-md"><use href="#ico-building"/></svg> 내부 보고 초안</button>
        <button class="btn sm" data-fn="runAIlegal"><svg class="ico ico-md"><use href="#ico-scale"/></svg> 법적 리스크</button>
      </div>
      <div id="ai-out"><p style="font-size:13px;color:var(--tx3);">버튼을 클릭하면 AI가 분석합니다. (상단 API Key 필요)</p></div>
    </div>`;
}
function addHist(){
  const inp=$('hist-inp');if(!inp||!inp.value.trim())return;
  if(!curDetail.history)curDetail.history=[];
  curDetail.history.push({date:new Date().toISOString().slice(0,10),text:inp.value.trim()});
  persist();openDetail(curDetail.id);
}
function chgStatus(){
  const sel=$('st-sel');if(!sel)return;
  const old=curDetail.status;curDetail.status=sel.value;
  if(old!==sel.value){
    if(!curDetail.history)curDetail.history=[];
    curDetail.history.push({date:new Date().toISOString().slice(0,10),text:`상태 변경: ${old} → ${sel.value}`});
  }
  persist();openDetail(curDetail.id);
}
function editClaim(){
  if(!curDetail)return;
  const c=curDetail;editId=c.id;
  // 탭 전환 (resetForm 없이 직접)
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  $('s-register').classList.add('active');
  const regBtn=document.querySelector('.nb:nth-child(3)');if(regBtn)regBtn.classList.add('active');
  $('form-title').textContent='클레임 수정';
  populateRegisterDropdowns();
  // 값 복원
  setTimeout(()=>{
    $('f-cs').value=c.clientId||'';onClientChange();
    const pg=$('f-pgroup');
    if(pg&&c.groupId){
      pg.innerHTML='<option value="">선택</option>'+productGroups.map(g=>`<option value="${g.id}">${g.name} (${g.code})</option>`).join('');
      pg.value=c.groupId;onPgroupChange();
    }
    setTimeout(()=>{
      const pc=$('f-pcat');if(pc)pc.value=c.pcat||'';
      $('f-name').value=c.name||'';
      $('f-phone').value=c.phone||'';
      $('f-addr').value=c.addr||'';
      $('f-product').value=c.product||'';
      $('f-idate').value=c.idate||'';
      $('f-tname').value=c.tname||'';
      $('f-tid').value=c.tid||'';
      $('f-type').value=c.typeCode||'';
      if($('f-ins-co')&&c.insCoId)$('f-ins-co').value=c.insCoId;
      $('f-asgn').value=c.assignee||'';
      $('f-amt').value=c.amount||'';
      $('f-date').value=c.date||'';
      $('f-ins-date').value=c.insDate||'';
      $('f-desc').value=c.desc||'';
      $('f-note').value=c.note||'';
      const fl=$('f-liability');if(fl)fl.value=c.liability||'';
      const fe=$('f-eval');if(fe)fe.value=c.evalReflect||'';
      const fs=$('f-survey');if(fs)fs.value=c.survey||'';
      const fp=$('f-paid');if(fp)fp.value=c.finalPayment||'';
      const flog=$('f-logistics');if(flog)flog.value=c.logistics||'';
      const el=$('id-preview-code');if(el)el.textContent=c.id+' (수정 중)';
      updateIdPreview();
    },80);
  },30);
}

/* ══════════════════════════════════════════════
   AI
══════════════════════════════════════════════ */
async function runAI(mode){
  const c=curDetail,out=$('ai-out');
  if(!apiKey){out.innerHTML='<p style="font-size:13px;color:var(--red);">상단 API Key 입력란에 Anthropic API Key를 입력해 주세요.</p>';return;}
  out.innerHTML='<p style="font-size:13px;color:var(--tx3);">AI 분석 중...</p>';
  const ep=c.tname?`통문일자: ${c.idate||'-'}, 설치기사: ${c.tname} (${c.tid||'-'})`:'설치이력 미연동';
  const insName=c.insCoId?getInsName(c.insCoId):getInsForClient(c.clientId)?.name||'-';
  const pm={
    analyze:`클레임 분석 — 책임소재, 처리우선순위, 기사 과실 여부.\n\n접수번호: ${c.id}\n고객사: ${c.client||'-'}\n담당보험사: ${insName}\n고객: ${c.name} / ${c.addr}\n제품: ${c.product}\n사고유형: ${c.type}\n${ep}\n내용: ${c.desc}\n비고: ${c.note||'-'}`,
    response:`고객 회신 이메일 초안 — LX판토스 설치품질팀 명의.\n\n접수번호: ${c.id}\n고객: ${c.name}\n사고유형: ${c.type}\n내용: ${c.desc}`,
    internal:`내부 보고 요약.\n\n접수번호: ${c.id}\n고객사: ${c.client||'-'}\n담당보험사: ${insName}\n고객: ${c.name}\n유형: ${c.type}\n손해액: ${c.amount?c.amount.toLocaleString()+'원':'미산정'}\n${ep}\n내용: ${c.desc}\n현황: ${c.status}`,
    legal:`법적 리스크 검토 — 민법 750조, PL책임, 보험.${c.type==='대인'?' 대인 포함.':''}\n\n유형: ${c.type}\n담당보험사: ${insName}\n${ep}\n내용: ${c.desc}`
  };
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':apiKey,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:1000,messages:[{role:'user',content:pm[mode]}]})});
    const data=await res.json();
    if(data.error){out.innerHTML=`<p style="color:var(--red);font-size:13px;">API 오류: ${data.error.message}</p>`;return;}
    const txt=data.content?.map(i=>i.text||'').join('')||'응답 없음';
    out.innerHTML=`<div style="font-size:13px;line-height:1.7;color:var(--tx2);">${txt.replace(/\n/g,'<br>')}</div>`;
  }catch(e){out.innerHTML=`<p style="color:var(--red);font-size:13px;">오류: ${e.message}</p>`;}
}

/* ══════════════════════════════════════════════
   REPORTS
══════════════════════════════════════════════ */
function renderReports(){
  // 코드 테이블
  const ptbl=$('pcat-code-tbl');if(ptbl)ptbl.innerHTML=`<table class="code-tbl"><tr><th>제품군</th><th>코드</th></tr>${productCats.map(p=>`<tr><td>${p.name}</td><td>${p.code}</td></tr>`).join('')}</table>`;
  const atbl=$('atype-code-tbl');if(atbl)atbl.innerHTML=`<table class="code-tbl"><tr><th>사고유형</th><th>코드</th></tr>${accidentTypes.map(t=>`<tr><td>${t.name}</td><td>${t.code}</td></tr>`).join('')}</table>`;
  const cs=$('counter-stats');if(cs){const year=new Date().getFullYear();const map={};claims.filter(c=>c.id&&c.id.startsWith(year+'-')).forEach(c=>{const parts=c.id.split('-');if(parts.length>=4){const key=`${parts[0]}-${parts[1]}-${parts[2]}`;map[key]=(map[key]||0)+1;}});cs.innerHTML=Object.keys(map).length?`<div style="display:flex;flex-wrap:wrap;gap:7px;">`+Object.entries(map).sort().map(([k,v])=>`<div style="display:inline-flex;align-items:center;gap:6px;padding:5px 10px;background:var(--bg2);border-radius:var(--r-md);font-size:13px;"><span style="font-family:var(--mono);color:var(--blue);font-weight:500;">${k}</span><span style="color:var(--tx2);font-size:12px;">${v}건 / 다음: <b style="font-weight:500;color:var(--green);">${String(v+1).padStart(3,'0')}</b></span></div>`).join('')+'</div>':'<div style="font-size:13px;color:var(--tx3);">올해 접수 없음</div>';}
  renderTemplates();
}
function uploadTemplate(input){const f=input.files[0];if(!f)return;const t={id:Date.now(),name:f.name,size:(f.size/1024).toFixed(0)+'KB',date:new Date().toISOString().slice(0,10)};templates=templates.filter(x=>x.name!==f.name);templates.unshift(t);persist();renderTemplates();input.value='';}
function renderTemplates(){const l=$('template-list');if(!l)return;l.innerHTML=templates.map(t=>`<div class="pptx-item"><svg class="ico ico-md" style="font-size:20px;color:#C0504D;"><use href="#ico-file-powerpoint"/></svg><div style="flex:1;"><div style="font-size:13px;font-weight:500;">${t.name}</div><div style="font-size:11px;color:var(--tx2);">${t.date} · ${t.size}</div></div><button class="btn sm dng" data-remove-tpl="${t.id}"><svg class="ico ico-md"><use href="#ico-trash"/></svg></button></div>`).join('');}
function removeTemplate(id){templates=templates.filter(t=>t.id!==id);persist();renderTemplates();}
function genReport(){
  const c=curDetail;if(!c)return;if(!templates.length){alert('보고서 탭에서 PPTX를 먼저 업로드하세요.');return;}
  const insName=c.insCoId?getInsName(c.insCoId):getInsForClient(c.clientId)?.name||'-';
  const allRows=getAllInsRows();
  const insRow=allRows.find(r=>{const nm=(r.고객명||'').replace(/\(.*\)/,'').trim();return c.name.includes(nm)&&nm.length>1&&c.idate&&r.설치일&&(c.idate===r.설치일||c.idate.replace(/-/g,'')===r.설치일.replace(/-/g,''));});
  const lines=[`[PL 사고 보고서]`,``,`접수번호: ${c.id}`,`고객사: ${c.client||'-'}`,`담당보험사: ${insName}`,`고객명: ${c.name}`,`연락처: ${c.phone||'-'}`,`주소: ${c.addr||'-'}`,`제품/모델: ${c.product||'-'}`,`사고유형: ${c.type}`,`통문일자: ${c.idate||'-'}`,`설치기사: ${c.tname||'-'} (${c.tid||'-'})`,`접수일: ${c.date}`,`손해액: ${c.amount?c.amount.toLocaleString()+'원':'미산정'}`,`담당자: ${c.assignee}`,``,...(insRow?[`[보험사 연동]`,`보험사 접수번호: ${insRow.접수번호}`,`지급보험금: ${fmt만원(insRow.지급보험금)}`,`추산(O/S): ${fmt만원(insRow.추산보험금OS)}`,`귀책여부: ${insRow.귀책여부||'-'}`,``]:[]),`[사고 내용]`,c.desc,``,`[비고]`,c.note||'-',``,`[처리 이력]`,...(c.history||[]).map(h=>`${h.date}: ${h.text}`),``,`사용 양식: ${templates[0].name}`];
  const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/plain;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`사고조사서_${c.id}.txt`;a.click();URL.revokeObjectURL(url);
}

/* ══════════════════════════════════════════════
   SETTINGS
══════════════════════════════════════════════ */
function renderAllSettings(){renderClientsList();renderInsList();renderCfgMapping();renderAsgnList();renderPgroupList();renderAtypeList();renderPcatList();}

/* 고객사 */
function renderClientsList(){
  const el=$('client-list');if(!el)return;
  el.innerHTML=clients.length?clients.map(c=>`
    <div class="edit-item">
      <div class="ei-main">
        <span class="ei-name">${c.name}</span>
        ${c.memo?`<span class="ei-sub">${c.memo}</span>`:''}
        <span class="ei-badge">${(()=>{const ins=getInsForClient(c.id);return ins?`담당: ${ins.name}`:'보험사 미지정';})()}</span>
      </div>
      <div style="display:flex;gap:4px;">
        <button class="btn sm icon" data-em-type="client" data-em-id="${c.id}"><svg class="ico ico-md"><use href="#ico-pencil"/></svg></button>
        <button class="btn sm icon dng" data-del-type="client" data-del-id="${c.id}"><svg class="ico ico-md"><use href="#ico-trash"/></svg></button>
      </div>
    </div>`).join(''):'<div class="empty" style="padding:20px;">고객사가 없습니다</div>';
}
function saveClientItem(){
  const name=($('client-f-name')||{}).value||'';if(!name.trim()){alert('고객사명 입력');return;}
  clients.push({id:uid('c'),name:name.trim(),memo:($('client-f-memo')||{}).value||''});
  persist();closeIF('client');renderClientsList();renderCfgMapping();renderInsMappingRows();populateListFilters();
}

/* 보험사 */
function renderInsList(){
  const el=$('ins-list');if(!el)return;
  el.innerHTML=insCompanies.length?insCompanies.map(ins=>`
    <div class="edit-item">
      <div style="width:14px;height:14px;border-radius:50%;background:${ins.color};flex-shrink:0;"></div>
      <div class="ei-main">
        <span class="ei-name">${ins.name}</span>
        ${ins.memo?`<span class="ei-sub">${ins.memo}</span>`:''}
        <span class="ei-badge">${clients.filter(c=>clientMapping[c.id]===ins.id).length}개 고객사 담당</span>
      </div>
      <div style="display:flex;gap:4px;">
        <button class="btn sm icon" data-em-type="ins" data-em-id="${ins.id}"><svg class="ico ico-md"><use href="#ico-pencil"/></svg></button>
        <button class="btn sm icon dng" data-del-type="ins" data-del-id="${ins.id}"><svg class="ico ico-md"><use href="#ico-trash"/></svg></button>
      </div>
    </div>`).join(''):'<div class="empty" style="padding:20px;">보험사가 없습니다</div>';
}
function saveInsItem(){
  const name=($('ins-f-name')||{}).value||'';if(!name.trim()){alert('보험사명 입력');return;}
  insCompanies.push({id:uid('i'),name:name.trim(),color:selInsColor,memo:($('ins-f-memo')||{}).value||''});
  persist();closeIF('ins');renderInsList();renderCfgMapping();renderInsSidebar();updateInsBadge();
}

/* 매핑 */
function renderCfgMapping(){
  const el=$('cfg-mapping-rows');if(!el)return;
  el.innerHTML=clients.map(c=>{
    const insId=clientMapping[c.id]||'';const ins=insCompanies.find(x=>x.id===insId);
    return `<div class="map-row">
      <div class="map-client">${c.name}</div>
      <span style="color:var(--tx3);font-size:12px;">→</span>
      <select class="map-select" data-map-id="${c.id}">
        <option value="">미지정</option>
        ${insCompanies.map(x=>`<option value="${x.id}" ${insId===x.id?'selected':''}>${x.name}</option>`).join('')}
      </select>
      ${ins?`<div style="width:10px;height:10px;border-radius:50%;background:${ins.color};flex-shrink:0;"></div>`:'<div style="width:10px;"></div>'}
    </div>`;
  }).join('');
  if(!clients.length)el.innerHTML='<div class="empty" style="padding:20px;">고객사를 먼저 추가하세요</div>';
}
function saveCfgMapping(){persist();renderCfgMapping();renderInsMappingRows();}

/* 담당자 */
function renderAsgnList(){
  const el=$('asgn-list');if(!el)return;
  el.innerHTML=assignees.length?assignees.map(a=>`
    <div class="edit-item">
      <div class="asgn-avatar">${a.name[0]}</div>
      <div class="ei-main">
        <span class="ei-name">${a.name}</span>
        <span class="ei-badge">${a.rank||'-'}</span>
        <span class="ei-sub">${a.area||''}</span>
      </div>
      <div style="display:flex;gap:4px;">
        <button class="btn sm icon" data-em-type="asgn" data-em-id="${a.id}"><svg class="ico ico-md"><use href="#ico-pencil"/></svg></button>
        <button class="btn sm icon dng" data-del-type="asgn" data-del-id="${a.id}"><svg class="ico ico-md"><use href="#ico-trash"/></svg></button>
      </div>
    </div>`).join(''):'<div class="empty" style="padding:20px;">담당자가 없습니다</div>';
}
function saveAsgnItem(){
  const name=($('asgn-f-name')||{}).value||'';if(!name.trim()){alert('이름 입력');return;}
  assignees.push({id:uid('a'),name:name.trim(),rank:($('asgn-f-rank')||{}).value||'',area:($('asgn-f-area')||{}).value||''});
  persist();closeIF('asgn');renderAsgnList();
}

/* 사고유형 */
function renderAtypeList(){
  const el=$('atype-list');if(!el)return;
  el.innerHTML=accidentTypes.map(t=>`
    <div class="code-edit-row">
      <span class="code-name">${t.name}</span>
      <span class="code-badge">${t.code}</span>
      <div style="display:flex;gap:4px;">
        <button class="btn sm icon" data-em-type="atype" data-em-id="${t.id}"><svg class="ico ico-md"><use href="#ico-pencil"/></svg></button>
        <button class="btn sm icon dng" data-del-type="atype" data-del-id="${t.id}"><svg class="ico ico-md"><use href="#ico-trash"/></svg></button>
      </div>
    </div>`).join('');
}
function saveAtypeItem(){
  const name=($('atype-f-name')||{}).value||'',code=($('atype-f-code')||{}).value.toUpperCase()||'';
  if(!name||!code){alert('유형명과 코드 입력');return;}
  if(accidentTypes.find(x=>x.code===code)){alert('중복 코드');return;}
  accidentTypes.push({id:uid('at'),name,code});
  persist();closeIF('atype');renderAtypeList();populateListFilters();
}

/* 대분류 */
function renderPgroupList(){
  const el=$('pgroup-list');if(!el)return;
  el.innerHTML=productGroups.length?productGroups.map(g=>`
    <div class="code-edit-row">
      <span class="code-name">${g.name}</span>
      <span class="code-badge">${g.code}</span>
      <span style="font-size:11px;color:var(--tx2);flex:1;padding-left:8px;">${g.desc||''}</span>
      <div style="display:flex;gap:4px;">
        <button class="btn sm icon" data-em-type="pgroup" data-em-id="${g.id}"><svg class="ico ico-md"><use href="#ico-pencil"/></svg></button>
        <button class="btn sm icon dng" data-del-type="pgroup" data-del-id="${g.id}"><svg class="ico ico-md"><use href="#ico-trash"/></svg></button>
      </div>
    </div>`).join(''):'<div class="empty" style="padding:20px;">대분류가 없습니다</div>';
}
function savePgroupItem(){
  const name=($('pgroup-f-name')||{}).value||'',code=($('pgroup-f-code')||{}).value.toUpperCase()||'';
  if(!name||!code){alert('대분류명과 코드를 입력하세요.');return;}
  if(productGroups.find(x=>x.code===code)){alert('중복 코드');return;}
  productGroups.push({id:uid('pg'),name,code,desc:($('pgroup-f-desc')||{}).value||''});
  persist();closeIF('pgroup');renderPgroupList();
  // 제품군 인라인폼의 대분류 드롭다운도 갱신
  const sel=$('pcat-f-group');if(sel)sel.innerHTML='<option value="">선택</option>'+productGroups.map(g=>`<option value="${g.id}">${g.name} (${g.code})</option>`).join('');
}

/* 제품군 */
function renderPcatList(){
  const el=$('pcat-list');if(!el)return;
  el.innerHTML=productCats.map(p=>`
    <div class="code-edit-row">
      <span class="code-name">${p.name}</span>
      <span class="code-badge">${p.code}</span>
      <div style="display:flex;gap:4px;">
        <button class="btn sm icon" data-em-type="pcat" data-em-id="${p.id}"><svg class="ico ico-md"><use href="#ico-pencil"/></svg></button>
        <button class="btn sm icon dng" data-del-type="pcat" data-del-id="${p.id}"><svg class="ico ico-md"><use href="#ico-trash"/></svg></button>
      </div>
    </div>`).join('');
}
function savePcatItem(){
  const name=($('pcat-f-name')||{}).value||'',code=($('pcat-f-code')||{}).value.toUpperCase()||'';
  if(!name||!code){alert('제품군명과 코드 입력');return;}
  if(productCats.find(x=>x.code===code)){alert('중복 코드');return;}
  const pgId=($('pcat-f-group')||{}).value||'';
  productCats.push({id:uid('pc'),name,code,groupId:pgId});
  persist();closeIF('pcat');renderPcatList();
}

/* 삭제 */
function delItem(type,id){
  const lbl={client:'고객사',ins:'보험사',asgn:'담당자',atype:'사고유형',pcat:'제품군'};
  if(type==='client'){clients=clients.filter(x=>x.id!==id);delete clientMapping[id];}
  else if(type==='ins'){insCompanies=insCompanies.filter(x=>x.id!==id);Object.keys(clientMapping).forEach(k=>{if(clientMapping[k]===id)delete clientMapping[k];});}
  else if(type==='asgn')assignees=assignees.filter(x=>x.id!==id);
  else if(type==='atype')accidentTypes=accidentTypes.filter(x=>x.id!==id);
  else if(type==='pcat')productCats=productCats.filter(x=>x.id!==id);
  persist();renderAllSettings();populateListFilters();
}

/* ── 인라인 폼 ── */
function openIF(type){
  ['client','ins','asgn','atype','pcat','pgroup'].forEach(t=>{const e=$(t+'-if');if(e)e.style.display='none';});
  const el=$(type+'-if');if(el)el.style.display='block';
  if(type==='pcat'){const sel=$('pcat-f-group');if(sel)sel.innerHTML='<option value="">선택</option>'+productGroups.map(g=>`<option value="${g.id}">${g.name} (${g.code})</option>`).join('');}
  if(type==='ins'){
    selInsColor=COLORS[0];
    const picker=$('ins-color-picker');
    if(picker)picker.innerHTML=COLORS.map(c=>`<div class="color-dot ${c===selInsColor?'selected':''}" style="background:${c};" data-ins-color="${c}"></div>`).join('');
  }
}
function closeIF(type){
  const el=$(type+'-if');if(el)el.style.display='none';
  ['f-name','f-memo','f-rank','f-area','f-code','f-desc'].forEach(f=>{const inp=$(type+'-'+f);if(inp)inp.value='';});
}

/* ── 수정 모달 ── */
function openEM(type,id){
  const title=$('em-title'),body=$('em-body'),saveBtn=$('em-save');
  const inp=(id,val,ph,ex)=>`<div class="fi"><label>${id}</label><input type="text" id="em-${id}" value="${val||''}" placeholder="${ph||''}" ${ex||''} style="padding:6px 9px;border:0.5px solid var(--bd2);border-radius:var(--r-md);background:var(--bg1);color:var(--tx1);font-size:13px;font-family:var(--font);width:100%;"></div>`;
  if(type==='client'){
    const item=clients.find(x=>x.id===id);if(!item)return;
    title.textContent='고객사 수정';
    body.innerHTML=inp('고객사명',item.name,'예: 포스코건설')+inp('메모',item.memo,'비고');
    saveBtn.onclick=()=>{const n=($('em-고객사명')||{}).value||'';if(!n.trim()){alert('필수');return;}item.name=n.trim();item.memo=($('em-메모')||{}).value||'';persist();closeEM();renderClientsList();renderCfgMapping();renderInsMappingRows();};
  }else if(type==='ins'){
    const item=insCompanies.find(x=>x.id===id);if(!item)return;
    title.textContent='보험사 수정';
    body.innerHTML=inp('보험사명',item.name)+inp('연락처/메모',item.memo)+`<div class="fi"><label>색상</label><div class="color-picker">${COLORS.map(c=>`<div class="color-dot ${item.color===c?'selected':''}" style="background:${c};" data-item-color-ins="${id}" data-item-color="${c}"></div>`).join('')}</div></div>`;
    saveBtn.onclick=()=>{const n=($('em-보험사명')||{}).value||'';if(!n.trim()){alert('필수');return;}item.name=n.trim();item.memo=($('em-연락처/메모')||{}).value||'';persist();closeEM();renderInsList();renderCfgMapping();renderInsSidebar();};
  }else if(type==='asgn'){
    const item=assignees.find(x=>x.id===id);if(!item)return;
    title.textContent='담당자 수정';
    body.innerHTML=inp('이름',item.name)+inp('직급',item.rank)+inp('담당영역',item.area);
    saveBtn.onclick=()=>{const n=($('em-이름')||{}).value||'';if(!n.trim()){alert('필수');return;}item.name=n.trim();item.rank=($('em-직급')||{}).value||'';item.area=($('em-담당영역')||{}).value||'';persist();closeEM();renderAsgnList();};
  }else if(type==='atype'){
    const item=accidentTypes.find(x=>x.id===id);if(!item)return;
    title.textContent='사고유형 수정';
    body.innerHTML=inp('유형명',item.name)+inp('코드',item.code,'','maxlength="4" style="text-transform:uppercase;"');
    saveBtn.onclick=()=>{const n=($('em-유형명')||{}).value||'',code=($('em-코드')||{}).value.toUpperCase()||'';if(!n||!code){alert('필수');return;}item.name=n.trim();item.code=code;persist();closeEM();renderAtypeList();populateListFilters();};
  }else if(type==='pgroup'){
    const item=productGroups.find(x=>x.id===id);if(!item)return;
    title.textContent='대분류 수정';
    body.innerHTML=inp('대분류명',item.name)+inp('코드',item.code,'','maxlength="5" style="text-transform:uppercase;"')+inp('설명',item.desc||'');
    saveBtn.onclick=()=>{const n=($('em-대분류명')||{}).value||'',code=($('em-코드')||{}).value.toUpperCase()||'';if(!n||!code){alert('필수');return;}item.name=n.trim();item.code=code;item.desc=($('em-설명')||{}).value||'';persist();closeEM();renderPgroupList();};
  }else if(type==='pcat'){
    const item=productCats.find(x=>x.id===id);if(!item)return;
    title.textContent='제품군 수정';
    const pgOpts=productGroups.map(g=>`<option value="${g.id}" ${item.groupId===g.id?'selected':''}>${g.name} (${g.code})</option>`).join('');
    body.innerHTML=inp('제품군명',item.name)+inp('코드',item.code,'','maxlength="4" style="text-transform:uppercase;"')+`<div class="fi"><label>대분류</label><select id="em-pgroup" style="padding:6px 9px;border:0.5px solid var(--bd2);border-radius:var(--r-md);background:var(--bg1);color:var(--tx1);font-size:13px;font-family:var(--font);width:100%;"><option value="">선택</option>${pgOpts}</select></div>`;
    saveBtn.onclick=()=>{const n=($('em-제품군명')||{}).value||'',code=($('em-코드')||{}).value.toUpperCase()||'';if(!n||!code){alert('필수');return;}item.name=n.trim();item.code=code;item.groupId=$('em-pgroup').value||'';persist();closeEM();renderPcatList();};;
  }
  $('edit-modal').classList.add('open');
}
function item_color(insId,color,el){const ins=insCompanies.find(x=>x.id===insId);if(ins)ins.color=color;document.querySelectorAll('.modal .color-dot').forEach(d=>d.classList.remove('selected'));el.classList.add('selected');}
function closeEM(){$('edit-modal').classList.remove('open');}

/* ══════════════════════════════════════════════
   EXPORT / IMPORT
══════════════════════════════════════════════ */
function exportCSV(){
  const hdr=['접수번호','대분류','제품군','고객사','담당보험사','고객명','연락처','주소','제품모델','통문일자','설치기사','기사ID','사고유형','귀책여부','평가반영','상태','담당자','손해액','보험접수일','클레임입력일','내용','비고'];
  const rows=claims.map(c=>[c.id,c.groupName||'',c.pcatName||'',c.client||'',c.insCoId?getInsName(c.insCoId):(c.clientId?getInsForClient(c.clientId)?.name||'':''),c.name,c.phone||'',c.addr||'',c.product||'',c.idate||'',c.tname||'',c.tid||'',c.type,c.liability||'',c.evalReflect||'',c.status,c.assignee,c.amount||0,c.insDate||'',c.date,c.desc,c.note||'']);
  const csv='\uFEFF'+[hdr,...rows].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='클레임_'+new Date().toISOString().slice(0,10)+'.csv';a.click();URL.revokeObjectURL(url);
}
function importClaims(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=e=>{try{const d=JSON.parse(e.target.result);if(Array.isArray(d)){claims=d;persist();renderDash();}else console.error('형식 오류');}catch(err){console.error('파싱 오류');}};r.readAsText(f);input.value='';}


/* ══════════════════════════════════════════════
   소액클레임
══════════════════════════════════════════════ */
let curMinorId=null;
function renderMinor(){
  // 제품구분 드롭다운 채우기
  const pc=$('mn-f-pcat');
  if(pc&&pc.children.length<=1)pc.innerHTML='<option value="">선택</option>'+productCats.map(p=>`<option value="${p.code}">${p.name}</option>`).join('');
  const q=($('minor-q')||{}).value||'';
  const st=($('minor-status')||{}).value||'';
  const ty=($('minor-type')||{}).value||'';
  const filtered=minorClaims.filter(c=>{
    const m=!q||(c.name+c.addr+c.order+c.logistics+c.partner+(c.desc||'')).toLowerCase().includes(q.toLowerCase());
    return m&&(!st||c.status===st)&&(!ty||c.type===ty);
  });
  const el=$('minor-list');if(!el)return;
  el.innerHTML=filtered.length?filtered.map(c=>`
    <div class="tr" style="grid-template-columns:90px 80px 1fr 80px 60px 70px 80px 80px;cursor:pointer;" data-minor-id="${c.id}">
      <span style="font-family:var(--mono);font-size:10px;color:var(--blue);">${c.id}</span>
      <span style="font-size:11px;">${c.logistics||c.partner||'-'}</span>
      <span><b style="font-weight:500;">${c.name}</b> <span style="color:var(--tx2);font-size:12px;">— ${(c.desc||'').slice(0,20)}</span></span>
      <span style="font-family:var(--mono);font-size:10px;">${c.order||'-'}</span>
      <span style="font-size:11px;">${c.type||'-'}</span>
      <span><span class="bdg b-${c.status==='보험접수'?'검토':c.status==='종결'?'종결':'접수'}">${c.status}</span></span>
      <span style="font-size:11px;">${c.adate||c.idate||'-'}</span>
      <span style="font-size:11px;display:flex;gap:3px;align-items:center;">
        ${c.claimRef?`<span style="font-family:var(--mono);font-size:10px;color:var(--blue);">${c.claimRef}</span>`:`<button class="btn sm pri" style="font-size:10px;padding:2px 6px;" data-link-minor="${c.id}">보험접수</button>`}
        <button class="btn sm icon" data-edit-minor="${c.id}"><svg class="ico ico-sm"><use href="#ico-pencil"/></svg></button>
        <button class="btn sm icon dng" data-delete-minor="${c.id}"><svg class="ico ico-sm"><use href="#ico-trash"/></svg></button>
      </span>
    </div>`).join(''):'<div class="empty">소액클레임 없음</div>';
}
function openMinorForm(id){
  curMinorId=id||null;
  const c=id?minorClaims.find(x=>x.id===id):{};
  $('minor-modal-title').textContent=id?'소액클레임 수정':'소액클레임 등록';
  const pc=$('mn-f-pcat');
  if(pc)pc.innerHTML='<option value="">선택</option>'+productCats.map(p=>`<option value="${p.code}" ${c.pcat===p.code?'selected':''}>${p.name}</option>`).join('');
  $('mn-f-name').value=c.name||'';
  $('mn-f-phone').value=c.phone||'';
  $('mn-f-addr').value=c.addr||'';
  $('mn-f-order').value=c.order||'';
  $('mn-f-logistics').value=c.logistics||'';
  $('mn-f-partner').value=c.partner||'';
  $('mn-f-tech').value=c.tech||'';
  $('mn-f-type').value=c.type||'';
  $('mn-f-status').value=c.status||'접수';
  $('mn-f-idate').value=c.idate||'';
  $('mn-f-adate').value=c.adate||'';
  $('mn-f-amount').value=c.amount||'';
  $('mn-f-claimref').value=c.claimRef||'';
  $('mn-f-adjuster').value=c.adjuster||'';
  $('mn-f-desc').value=c.desc||'';
  $('mn-f-note').value=c.note||'';
  $('minor-modal').classList.add('open');
}
function saveMinor(){
  const name=$('mn-f-name').value||'';
  if(!name){return;}
  const today=new Date().toISOString().slice(0,10);
  const d={
    id:curMinorId||uid('mn'),
    name,phone:$('mn-f-phone').value,addr:$('mn-f-addr').value,
    order:$('mn-f-order').value,logistics:$('mn-f-logistics').value,
    partner:$('mn-f-partner').value,tech:$('mn-f-tech').value,
    pcat:$('mn-f-pcat').value,type:$('mn-f-type').value,
    status:$('mn-f-status').value,idate:$('mn-f-idate').value,
    adate:$('mn-f-adate').value,amount:Number($('mn-f-amount').value)||0,
    claimRef:$('mn-f-claimref').value,adjuster:$('mn-f-adjuster').value,
    desc:$('mn-f-desc').value,note:$('mn-f-note').value,
    date:today,updatedAt:today
  };
  if(curMinorId){const i=minorClaims.findIndex(x=>x.id===curMinorId);if(i>=0)minorClaims[i]=d;}
  else minorClaims.unshift(d);
  persist();$('minor-modal').classList.remove('open');renderMinor();
}
function deleteMinor(id){minorClaims=minorClaims.filter(x=>x.id!==id);persist();renderMinor();}

/* 소액클레임 → 보험접수 연결 */
function linkMinorToClaim(minorId){
  const m=minorClaims.find(x=>x.id===minorId);if(!m)return;
  // 신규접수 탭으로 이동하며 정보 미리 채우기
  document.querySelectorAll('.sec').forEach(s=>s.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b=>b.classList.remove('active'));
  $('s-register').classList.add('active');
  const regBtn=document.querySelector('.nb:nth-child(3)');if(regBtn)regBtn.classList.add('active');
  editId=null;$('form-title').textContent='신규 클레임 접수 (소액클레임 연결)';
  $('f-date').value=new Date().toISOString().slice(0,10);
  populateRegisterDropdowns();
  setTimeout(()=>{
    $('f-name').value=m.name||'';
    $('f-phone').value=m.phone||'';
    $('f-addr').value=m.addr||'';
    $('f-product').value=m.order||'';
    $('f-idate').value=m.idate||'';
    $('f-tname').value=m.tech||'';
    $('f-desc').value=m.desc||'';
    $('f-logistics').value=m.logistics||'';
    $('f-note').value=`소액클레임 연결: ${m.id} / ${m.adjuster?'손해사정: '+m.adjuster:''}`;
    if($('f-type')&&m.type){
      const at=accidentTypes.find(x=>x.name===m.type);
      if(at)$('f-type').value=at.code;
    }
    // 소액클레임 상태를 보험접수로 업데이트
    m.status='보험접수';m.updatedAt=new Date().toISOString().slice(0,10);
    persist();
    const banner=$('autofill-banner');
    if(banner){banner.style.display='flex';$('autofill-msg').textContent=`소액클레임 ${m.id} 연결 — 정보 자동 입력됨`;}
  },50);
}


let curCAId=null;
function renderCA(){
  const q=($('ca-q')||{}).value||'';
  const ty=($('ca-type')||{}).value||'';
  const st=($('ca-status')||{}).value||'';
  const filtered=consumerCases.filter(c=>{
    const m=!q||(c.no+c.claimant+c.desc).toLowerCase().includes(q.toLowerCase());
    return m&&(!ty||c.type===ty)&&(!st||c.status===st);
  });
  const el=$('ca-list');if(!el)return;
  el.innerHTML=filtered.length?filtered.map(c=>`
    <div class="tr" style="grid-template-columns:110px 70px 1fr 80px 80px 70px 90px 90px;" data-open-ca="${c.id}">
      <span style="font-family:var(--mono);font-size:11px;color:var(--blue);">${c.no||'-'}</span>
      <span><span class="ca-${c.type}">${c.type}</span></span>
      <span><b style="font-weight:500;">${c.claimant}</b> <span style="color:var(--tx2);font-size:12px;">${(c.desc||'').slice(0,20)}</span></span>
      <span style="font-size:12px;">${c.respondent||'-'}</span>
      <span><span class="ca-${c.status}">${c.status}</span></span>
      <span style="font-size:11px;color:${c.claimRef?'var(--blue)':'var(--tx3)'};">${c.claimRef||'-'}</span>
      <span style="font-size:12px;">${c.date||'-'}</span>
      <span style="font-size:12px;font-weight:500;">${c.amount?fmt만원(c.amount):'-'}</span>
    </div>`).join(''):'<div class="empty">소비자원 사건 없음</div>';
}
function openCAForm(id){
  curCAId=id||null;
  const c=id?consumerCases.find(x=>x.id===id):{};
  $('ca-modal-title').textContent=id?'소비자원 사건 수정':'소비자원 사건 등록';
  const fa=$('ca-f-asgn');if(fa)fa.innerHTML='<option value="">선택</option>'+assignees.map(a=>`<option ${c.assignee===a.name?'selected':''}>${a.name}</option>`).join('');
  $('ca-f-no').value=c.no||'';$('ca-f-type').value=c.type||'피해구제';
  $('ca-f-claimant').value=c.claimant||'';$('ca-f-phone').value=c.phone||'';
  $('ca-f-respondent').value=c.respondent||'LX판토스';
  $('ca-f-date').value=c.date||new Date().toISOString().slice(0,10);
  $('ca-f-status').value=c.status||'접수';
  $('ca-f-amount').value=c.amount||'';$('ca-f-claimref').value=c.claimRef||'';
  $('ca-f-desc').value=c.desc||'';$('ca-f-note').value=c.note||'';
  $('ca-modal').classList.add('open');
}
function closeCAModal(){$('ca-modal').classList.remove('open');}
function saveCA(){
  const no=$('ca-f-no').value||'';
  const d={
    id:curCAId||uid('ca'),no,type:$('ca-f-type').value,
    claimant:$('ca-f-claimant').value,phone:$('ca-f-phone').value,
    respondent:$('ca-f-respondent').value,date:$('ca-f-date').value,
    status:$('ca-f-status').value,amount:Number($('ca-f-amount').value)||0,
    claimRef:$('ca-f-claimref').value,assignee:$('ca-f-asgn').value,
    desc:$('ca-f-desc').value,note:$('ca-f-note').value,
    updatedAt:new Date().toISOString().slice(0,10)
  };
  if(curCAId){const i=consumerCases.findIndex(x=>x.id===curCAId);if(i>=0)consumerCases[i]=d;}
  else consumerCases.unshift(d);
  persist();closeCAModal();renderCA();
}
function openCADetail(id){
  const c=consumerCases.find(x=>x.id===id);if(!c)return;
  openCAForm(id);
}
function deleteCA(id){consumerCases=consumerCases.filter(x=>x.id!==id);persist();renderCA();}

/* ══════════════════════════════════════════════
   소송
══════════════════════════════════════════════ */
let curSuitId=null;
function renderSuit(){
  const q=($('suit-q')||{}).value||'';
  const st=($('suit-status')||{}).value||'';
  const filtered=lawsuits.filter(s=>{
    const m=!q||(s.no+s.plaintiff+(s.desc||'')).toLowerCase().includes(q.toLowerCase());
    return m&&(!st||s.status===st);
  });
  const el=$('suit-list');if(!el)return;
  el.innerHTML=filtered.length?filtered.map(s=>`
    <div class="tr" style="grid-template-columns:130px 1fr 90px 80px 80px 80px 90px;" data-open-suit="${s.id}">
      <span style="font-family:var(--mono);font-size:11px;color:var(--blue);">${s.no||'-'}</span>
      <span><b style="font-weight:500;">${s.plaintiff||'-'}</b> <span style="color:var(--tx2);font-size:12px;">${(s.desc||'').slice(0,22)}</span></span>
      <span style="font-size:12px;">${s.court||'-'}</span>
      <span style="font-size:12px;">${s.amount?fmt만원(s.amount):'-'}</span>
      <span><span class="suit-${s.status||'소장접수'}">${s.status||'-'}</span></span>
      <span style="font-size:11px;color:${s.claimRef?'var(--blue)':'var(--tx3)'};">${s.claimRef||'-'}</span>
      <span style="font-size:12px;">${s.date||'-'}</span>
    </div>`).join(''):'<div class="empty">소송 사건 없음</div>';
}
function openSuitForm(id){
  curSuitId=id||null;
  const s=id?lawsuits.find(x=>x.id===id):{};
  $('suit-modal-title').textContent=id?'소송 사건 수정':'소송 사건 등록';
  $('suit-f-no').value=s.no||'';$('suit-f-court').value=s.court||'';
  $('suit-f-instance').value=s.instance||'1심';$('suit-f-type').value=s.type||'구상금청구';
  $('suit-f-plaintiff').value=s.plaintiff||'';$('suit-f-defendant').value=s.defendant||'LX판토스';
  $('suit-f-amount').value=s.amount||'';$('suit-f-date').value=s.date||new Date().toISOString().slice(0,10);
  $('suit-f-status').value=s.status||'소장접수';$('suit-f-nextdate').value=s.nextDate||'';
  $('suit-f-lawyer').value=s.lawyer||'';$('suit-f-claimref').value=s.claimRef||'';
  $('suit-f-result-amount').value=s.resultAmount||'';$('suit-f-result').value=s.result||'';
  $('suit-f-desc').value=s.desc||'';$('suit-f-note').value=s.note||'';
  $('suit-modal').classList.add('open');
}
function closeSuitModal(){$('suit-modal').classList.remove('open');}
function saveSuit(){
  const d={
    id:curSuitId||uid('suit'),no:$('suit-f-no').value,court:$('suit-f-court').value,
    instance:$('suit-f-instance').value,type:$('suit-f-type').value,
    plaintiff:$('suit-f-plaintiff').value,defendant:$('suit-f-defendant').value,
    amount:Number($('suit-f-amount').value)||0,date:$('suit-f-date').value,
    status:$('suit-f-status').value,nextDate:$('suit-f-nextdate').value,
    lawyer:$('suit-f-lawyer').value,claimRef:$('suit-f-claimref').value,
    resultAmount:Number($('suit-f-result-amount').value)||0,result:$('suit-f-result').value,
    desc:$('suit-f-desc').value,note:$('suit-f-note').value,
    updatedAt:new Date().toISOString().slice(0,10)
  };
  if(curSuitId){const i=lawsuits.findIndex(x=>x.id===curSuitId);if(i>=0)lawsuits[i]=d;}
  else lawsuits.unshift(d);
  // 연결된 클레임 상태 소송중으로 업데이트
  const claimRef=d.claimRef||window._pendingSuitClaimId||'';
  if(claimRef){
    const c=claims.find(x=>x.id===claimRef);
    if(c&&c.status!=='종결'&&c.status!=='면책'){
      c.status='소송중';
      if(!c.history)c.history=[];
      c.history.push({date:new Date().toISOString().slice(0,10),text:`소송 연결: ${d.no||'사건번호 미입력'} (${d.court||'-'})`});
    }
  }
  window._pendingSuitClaimId='';
  persist();closeSuitModal();renderSuit();
  // 클레임 상세가 열려있으면 갱신
  if(curDetail&&claimRef===curDetail.id)openDetail(curDetail.id);
}
/* 소송 연결 모달 */
function openLinkSuitModal(claimId){
  const c=claims.find(x=>x.id===claimId);if(!c)return;
  // 기존 모달 제거
  const existing=document.getElementById('link-suit-modal');if(existing)existing.remove();
  const modal=document.createElement('div');
  modal.id='link-suit-modal';
  modal.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:300;padding:20px;';
  const existingSuits=lawsuits.filter(s=>s.claimRef===claimId);
  const otherSuits=lawsuits.filter(s=>s.claimRef!==claimId);
  modal.innerHTML=`
    <div style="background:var(--bg1);border-radius:12px;border:0.5px solid var(--bd2);width:100%;max-width:560px;max-height:80vh;display:flex;flex-direction:column;">
      <div style="display:flex;align-items:center;padding:13px 16px;border-bottom:0.5px solid var(--bd3);">
        <div style="flex:1;font-size:15px;font-weight:500;">소송 연결 — ${claimId}</div>
        <button id="lsm-close" style="padding:4px 9px;border:0.5px solid var(--bd2);border-radius:8px;background:var(--bg1);cursor:pointer;font-size:12px;font-family:var(--font);color:var(--tx1);">닫기</button>
      </div>
      <div style="overflow-y:auto;flex:1;padding:14px;">
        ${otherSuits.length?`
          <div style="font-size:12px;font-weight:500;color:var(--tx2);margin-bottom:8px;">기존 소송 건 연결</div>
          ${otherSuits.map(s=>`
            <div style="display:flex;align-items:center;gap:9px;padding:8px 11px;border:0.5px solid var(--bd3);border-radius:8px;margin-bottom:6px;cursor:pointer;" id="lsm-suit-${s.id}">
              <div style="flex:1;">
                <div style="font-family:var(--mono);font-size:12px;font-weight:500;color:var(--blue);">${s.no||'-'}</div>
                <div style="font-size:11px;color:var(--tx2);">${s.court||'-'} · ${s.plaintiff||'-'} · ${s.status||'-'}</div>
              </div>
              <button class="btn sm pri" data-suit-id="${s.id}" data-claim-id="${claimId}" id="lsm-link-${s.id}">연결</button>
            </div>`).join('')}
          <div style="border-top:0.5px solid var(--bd3);margin:12px 0;"></div>`:''}
        <div style="font-size:12px;font-weight:500;color:var(--tx2);margin-bottom:8px;">새 소송 등록 후 연결</div>
        <button id="lsm-new-suit" data-claim-id="${claimId}" style="width:100%;padding:9px;border:0.5px dashed var(--bd2);border-radius:8px;background:var(--bg2);cursor:pointer;font-size:13px;font-family:var(--font);color:var(--blue);">+ 새 소송 등록</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  // 버튼 바인딩
  document.getElementById('lsm-close').addEventListener('click',()=>modal.remove());
  // 기존 소송 연결
  otherSuits.forEach(s=>{
    const btn=document.getElementById(`lsm-link-${s.id}`);
    if(btn)btn.addEventListener('click',()=>{
      s.claimRef=claimId;
      // 클레임 상태 소송중으로
      if(c.status!=='종결'&&c.status!=='면책'){c.status='소송중';}
      persist();modal.remove();openDetail(claimId);
    });
  });
  // 새 소송 등록
  const newBtn=document.getElementById('lsm-new-suit');
  if(newBtn)newBtn.addEventListener('click',()=>{
    modal.remove();
    // 소송 폼 열기 (클레임 정보 미리 채움)
    openSuitForm();
    setTimeout(()=>{
      const el=$('suit-f-claimref');if(el)el.value=claimId;
      const el2=$('suit-f-plaintiff');
      // 저장 시 클레임 상태도 소송중으로
      const origSave=window._suitSaveCallback;
      window._pendingSuitClaimId=claimId;
    },100);
  });
}



/* ══════════════════════════════════════════════
   INIT
══════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function(){
  initFirebase();
  // 로딩 표시
  document.body.innerHTML += '<div id="loading-overlay" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,0.9);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;font-family:sans-serif;"><div style="font-size:18px;font-weight:500;color:#185FA5;margin-bottom:12px;">데이터 불러오는 중...</div><div style="font-size:13px;color:#888;">Firebase 연결 중</div></div>';

  await load();

  // 로딩 제거
  const ov=document.getElementById('loading-overlay');if(ov)ov.remove();

  if(apiKey){$('api-key-input').value=apiKey;$('api-key-status').textContent='저장됨 ✓';}
  _initHandlers();
  setQuick('all');
  updateInsBadge();
});
