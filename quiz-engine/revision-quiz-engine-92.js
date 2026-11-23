// MPPSC IQ PRE 2027 — JSON-driven revision quiz engine
// Question content is loaded from ../quiz-data/revision-units-92.json; this file owns quiz behavior only.

let DATA=[];const PER=100;const UNIT_DATA_MAP={};
let activeUnit=2,isMixedMode=false,isUnitShuffled=false;let page=0,lang='hi',answers={},currentIndex=0,reviewMode=false,reviewIds=[],reviewPos=0,autoTimer=null;
const PERFORMANCE_KEY='mppscIqCandidatePerformance_v1';
function loadPerformance(){try{const x=JSON.parse(localStorage.getItem(PERFORMANCE_KEY)||'{}');return x&&x.questions&&typeof x.questions==='object'?x:{questions:{},recent:[]};}catch(e){return {questions:{},recent:[]};}}
let performanceData=loadPerformance();
function savePerformance(){try{localStorage.setItem(PERFORMANCE_KEY,JSON.stringify(performanceData));}catch(e){}}
const REVISION_SESSION_KEY='mppscIqRevisionSession_v1';let progressSaveTimer=null,progressSyncState='local';
function currentRevisionSession(){return {activeUnit:activeUnit,isMixedMode:isMixedMode,isUnitShuffled:isUnitShuffled,questionOrder:DATA.map(q=>String(q.__qid||'')),answers:answers,currentIndex:currentIndex,savedAt:Date.now()};}
function saveLocalRevisionSession(){try{localStorage.setItem(REVISION_SESSION_KEY,JSON.stringify({performance:performanceData,session:currentRevisionSession()}));}catch(e){}}
function revisionAuthHeaders(){return {'Content-Type':'application/json',Authorization:'Bearer '+(window.MPPSC_IQ_TOKEN||'')};}
async function saveRevisionProgress(){const payload={performance:performanceData,session:currentRevisionSession()};try{const response=await fetch(MPPSC_IQ_API+'/api/revision-progress',{method:'PUT',credentials:'include',headers:revisionAuthHeaders(),body:JSON.stringify(payload)});if(!response.ok){const err=await response.json().catch(()=>({}));throw new Error(err.error||('HTTP '+response.status));}progressSyncState='synced';console.info('Revision progress synced to student account');}catch(error){progressSyncState='local';console.warn('Revision progress cloud sync failed; local backup retained:',error.message);}}
function scheduleRevisionProgressSave(){saveLocalRevisionSession();clearTimeout(progressSaveTimer);progressSaveTimer=setTimeout(saveRevisionProgress,450);}
function restoreRevisionSession(session){if(!session||typeof session!=='object')return false;const unit=Number(session.activeUnit);if(!Number.isInteger(unit)||unit<0||unit>12)return false;activeUnit=unit;isMixedMode=!!session.isMixedMode;isUnitShuffled=!!session.isUnitShuffled;const all=new Map();for(const [u,items] of Object.entries(UNIT_DATA_MAP)){(items||[]).forEach((q,i)=>{const key=String(u)+':'+i,copy={...q,__unit:Number(u),__qid:key};const edit=window.MPPSC_IQ_EDITS&&window.MPPSC_IQ_EDITS[key];if(edit)Object.assign(copy,edit,{__unit:Number(u),__qid:key});all.set(key,copy);});}const order=Array.isArray(session.questionOrder)?session.questionOrder.map(k=>all.get(String(k))).filter(Boolean):[];if(order.length)DATA=order;else if(isMixedMode)DATA=[];else DATA=(UNIT_DATA_MAP[unit]||[]).map((q,i)=>({...q,__unit:unit,__qid:unit+':'+i}));answers=session.answers&&typeof session.answers==='object'?Object.fromEntries(Object.entries(session.answers).filter(([k,v])=>/^\d+$/.test(k)&&Number.isInteger(Number(v))&&Number(v)>=0&&Number(v)<=3)):{};currentIndex=Math.max(0,Math.min(Math.max(0,DATA.length-1),Number(session.currentIndex)||0));page=Math.floor(currentIndex/PER);reviewMode=false;reviewIds=[];reviewPos=0;unitWrongMode=false;updateUnitButtons(unit);return true;}
async function restoreRevisionProgress(){let local=null;try{local=JSON.parse(localStorage.getItem(REVISION_SESSION_KEY)||'null');}catch(e){}if(local&&local.session){if(local.performance&&local.performance.questions)performanceData=local.performance;restoreRevisionSession(local.session);}try{const response=await fetch(MPPSC_IQ_API+'/api/revision-progress',{credentials:'include',headers:window.MPPSC_IQ_TOKEN?{Authorization:'Bearer '+window.MPPSC_IQ_TOKEN}:{},cache:'no-store'});if(!response.ok){const err=await response.json().catch(()=>({}));throw new Error(err.error||('HTTP '+response.status));}const remote=await response.json();if(remote.updated_at){if(remote.performance_json&&typeof remote.performance_json==='object')performanceData=remote.performance_json;restoreRevisionSession(remote.session_json||{});try{localStorage.setItem(PERFORMANCE_KEY,JSON.stringify(performanceData));}catch(e){}progressSyncState='synced';}else if(local&&local.session){await saveRevisionProgress();} }catch(error){console.warn('Revision progress restore failed; local backup retained:',error.message);}render();}

function recordPerformance(q,index,selected){const unit=Number(q.__unit||activeUnit||0);const qid=q.__qid||`${unit}:${index}`;const ok=selected===q.answer;const at=Date.now();const rec=performanceData.questions[qid]||(performanceData.questions[qid]={unit,attempts:0,correct:0,wrong:0,lastCorrect:null,lastAt:0});rec.unit=unit;rec.attempts++;if(ok)rec.correct++;else rec.wrong++;rec.lastCorrect=ok;rec.lastAt=at;performanceData.recent=Array.isArray(performanceData.recent)?performanceData.recent:[];performanceData.recent.push({unit,correct:ok,at});if(performanceData.recent.length>30)performanceData.recent=performanceData.recent.slice(-30);performanceData.history=Array.isArray(performanceData.history)?performanceData.history:[];performanceData.history.push({unit,correct:ok,at});if(performanceData.history.length>5000)performanceData.history=performanceData.history.slice(-5000);savePerformance();}
function performanceSummary(){const records=Object.values(performanceData.questions||{});const units=Object.keys(UNIT_DATA_MAP).map(Number).sort((a,b)=>a-b);const stats=units.map(unit=>{const rs=records.filter(r=>Number(r.unit)===unit);const attempts=rs.reduce((n,r)=>n+(r.attempts||0),0),correct=rs.reduce((n,r)=>n+(r.correct||0),0),wrong=rs.reduce((n,r)=>n+(r.wrong||0),0),unique=rs.length,accuracy=attempts?correct/attempts*100:0;return {unit,attempts,correct,wrong,unique,total:(UNIT_DATA_MAP[unit]||[]).length,accuracy};});const attempts=stats.reduce((n,x)=>n+x.attempts,0),correct=stats.reduce((n,x)=>n+x.correct,0),wrong=stats.reduce((n,x)=>n+x.wrong,0),unique=records.length,total=stats.reduce((n,x)=>n+x.total,0);const active=stats.filter(x=>x.attempts>0);const strongest=active.length?active.reduce((a,b)=>b.accuracy>a.accuracy?b:a):null;const weakest=active.length?active.reduce((a,b)=>b.accuracy<a.accuracy?b:a):null;const recent=performanceData.recent||[];const recentCorrect=recent.filter(x=>x.correct).length;const allMistakes=Object.entries(performanceData.questions||{}).filter(([,r])=>(r.wrong||0)>0).map(([qid,r])=>{const [unit,index]=qid.split(':').map(Number);const q=(UNIT_DATA_MAP[unit]||[])[index];return {qid,unit,index,wrong:r.wrong||0,correct:r.correct||0,attempts:r.attempts||0,lastCorrect:r.lastCorrect,question:q?cleanLang(lang==='hi'?(q.q||q.en):(q.en||q.q),lang):'प्रश्न उपलब्ध नहीं',rightAnswer:q?cleanLang(q.options?.[q.answer]||'',lang):'',q};}).sort((a,b)=>b.wrong-a.wrong||a.attempts-b.attempts);const repeatWrong=allMistakes.filter(x=>x.wrong>1).length,recovered=allMistakes.filter(x=>x.lastCorrect===true).length;return {stats,attempts,correct,wrong,unique,total,accuracy:attempts?correct/attempts*100:0,score:correct*3-wrong,unattempted:Math.max(0,total-unique),completion:total?unique/total*100:0,strongest,weakest,recentCount:recent.length,recentAccuracy:recent.length?recentCorrect/recent.length*100:0,allMistakes,uniqueWrong:allMistakes.length,repeatWrong,recovered};}
// Stable question identifiers keep performance linked to the original unit even after shuffling.
DATA=UNIT2_DATA.map((q,i)=>({...q,__unit:2,__qid:`2:${i}`}));
function resetQuizState(){answers={};page=0;currentIndex=0;reviewMode=false;reviewIds=[];reviewPos=0;clearTimeout(autoTimer);}
function updateUnitButtons(n){for(let i=1;i<=10;i++){const b=document.getElementById('unit'+i+'Btn');if(b)b.classList.toggle('active',i===n);}const pyq=document.getElementById('pyqBtn');if(pyq)pyq.classList.toggle('active',n===11);const analysis=document.getElementById('analysisBtn');if(analysis)analysis.classList.toggle('active',n===12);}
function setUnit(n){activeUnit=n;isMixedMode=false;isUnitShuffled=false;DATA=(UNIT_DATA_MAP[n]||[]).map((q,i)=>({...q,__unit:n,__qid:`${n}:${i}`}));applyQuestionOverrides();resetQuizState();updateUnitButtons(n);document.querySelector('.title').textContent='MPPSC PRE 2027 PROGRAM';render();scheduleRevisionProgressSave();window.scrollTo({top:0,behavior:'smooth'});}
function setPYQs(){activeUnit=11;isMixedMode=false;isUnitShuffled=false;DATA=[];resetQuizState();updateUnitButtons(0);document.getElementById('pyqBtn').classList.add('active');document.querySelector('.title').textContent='MPPSC PRE 2027 | PREVIOUS YEAR QUESTIONS (PYQs)';render();window.scrollTo({top:0,behavior:'smooth'});}
function showAnalysis(){activeUnit=12;isMixedMode=false;isUnitShuffled=false;DATA=[];resetQuizState();updateUnitButtons(12);document.querySelector('.title').textContent='MPPSC PRE 2027 PROGRAM';render();window.scrollTo({top:0,behavior:'smooth'});}
function shuffleArray(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function shuffleCurrentUnit(){const base=UNIT_DATA_MAP[activeUnit]||[];if(!base.length){alert('इस यूनिट में अभी प्रश्न उपलब्ध नहीं हैं।');return;}isMixedMode=false;isUnitShuffled=true;DATA=shuffleArray(base.map((q,i)=>({...q,__unit:activeUnit,__qid:`${activeUnit}:${i}`})));applyQuestionOverrides();resetQuizState();updateUnitButtons(activeUnit);document.querySelector('.title').textContent='MPPSC PRE 2027 | UNIT '+String(activeUnit).padStart(2,'0')+' | SHUFFLE PRACTICE';render();scheduleRevisionProgressSave();window.scrollTo({top:0,behavior:'smooth'});}
function mixAllUnits(){const available=Object.entries(UNIT_DATA_MAP).filter(([,items])=>Array.isArray(items)&&items.length);if(!available.length){alert('अभी किसी यूनिट में प्रश्न उपलब्ध नहीं हैं।');return;}const combined=[];for(const [unit,items] of available){for(let i=0;i<items.length;i++)combined.push({...items[i],__unit:Number(unit),__qid:`${unit}:${i}`});}DATA=shuffleArray(combined);applyQuestionOverrides();activeUnit=0;isMixedMode=true;isUnitShuffled=false;resetQuizState();updateUnitButtons(0);document.querySelector('.title').textContent='MPPSC PRE 2027 | ALL UNITS | MIXED PRACTICE';render();scheduleRevisionProgressSave();window.scrollTo({top:0,behavior:'smooth'});} 

function cleanLang(s,l){let v=String(s??'');if(l==='hi'){v=v.replace(/\s*\/\s*[^/\n]+/g,'');v=v.replace(/Correct answer:/gi,'सही उत्तर:');}else{v=v.replace(/सही उत्तर:/g,'Correct answer:');v=v.replace(/([^\n/]+)\s*\/\s*/g,'');}return v.trim()}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setLang(l){lang=l;document.getElementById('hiBtn').classList.toggle('active',l==='hi');document.getElementById('enBtn').classList.toggle('active',l==='en');render()}
function choose(i,k){if(answers[i]!==undefined||reviewMode)return;currentIndex=i;answers[i]=k;recordPerformance(DATA[i],i,k);scheduleRevisionProgressSave();render();clearTimeout(autoTimer);autoTimer=setTimeout(()=>{const pageEnd=Math.min(Math.floor(i/PER)*PER+PER,DATA.length);if(i+1<pageEnd){currentIndex=i+1;render();scheduleRevisionProgressSave();const next=document.getElementById('qcard-'+currentIndex);if(next)next.scrollIntoView({behavior:'smooth',block:'start'});}},750)}

function matchTable(q, questionIndex){
 const special={
  104:{left:[['a','कौषीतकी उपनिषद','Kaushitaki Upanishad'],['b','शतपथ ब्राह्मण','Shatapatha Brahmana'],['c','ऐतरेय ब्राह्मण','Aitareya Brahmana']],right:[['1','रेवोत्तरा (नर्मदा) नदी','Revatottara (Narmada) River'],['2','विश्वामित्र के 50 शापित पुत्रों का मालवा में निवास','Residence of Vishwamitra’s 50 cursed sons in Malwa'],['3','मध्य प्रदेश के विंध्याचल पर्वत का उल्लेख','Reference to the Vindhya mountains of Madhya Pradesh']]},
  107:{left:[['A','कपिल मुनि व ऋषि मार्कंडेय का आश्रम','Hermitages of Kapila Muni and Rishi Markandeya'],['B','सांदीपनि आश्रम','Sandipani Ashram'],['C','दुगड आश्रम','Dugad Ashram'],['D','ऋषि श्रृंग की तपोस्थली','Tapasthali of Rishi Shring']],right:[['1','अमरकंटक (अनूपपुर)','Amarkantak (Anuppur)'],['2','उज्जैन','Ujjain'],['3','दुगड आश्रम का स्थान: उपलब्ध स्रोत से पुष्टि नहीं','Location of Dugad Ashram: not verified from available sources'],['4','सिंगारपुर, मंडला','Singarpur, Mandla']]}
 };
 function makeTable(left,right,titleLeft,titleRight){
  const count=Math.max(left.length,right.length);
  return `<div class="match-table-wrap"><table class="match-table"><thead><tr><th>${lang==='hi'?titleLeft[0]:titleLeft[1]}</th><th>${lang==='hi'?titleRight[0]:titleRight[1]}</th></tr></thead><tbody>${Array.from({length:count},(_,i)=>`<tr><td>${left[i]?`<b>${esc(left[i][0])}.</b> ${esc(lang==='hi'?left[i][1]:left[i][2]||left[i][1])}`:''}</td><td>${right[i]?`<b>${esc(right[i][0])}.</b> ${esc(lang==='hi'?right[i][1]:right[i][2]||right[i][1])}`:''}</td></tr>`).join('')}</tbody></table></div>`;
 }
 if(special[questionIndex]){
  const d=special[questionIndex];
  if(questionIndex===107){
   return makeTable(d.left,d.right,['सूची–I : स्थल/आश्रम','List I: Sites/Ashrams'],['सूची–II : संबंधित स्थान','List II: Corresponding Places']);
  }
  return makeTable(d.left,d.right,['सूची–I : प्राचीन ग्रंथ','List I: Ancient Texts'],['सूची–II : ऐतिहासिक तथ्य','List II: Historical Facts']);
 }
 const raw=String(q||'').replace(/\r/g,'').trim();
 const left=[],right=[];
 // Multiline A-D / 1-4 lists.
 for(const line of raw.split('\n')){
  let m=line.match(/^\s*([A-D])\s*[.)]\s*(.+?)\s*$/i); if(m) left.push([m[1].toUpperCase(),m[2].trim(),'']);
  m=line.match(/^\s*([1-4])\s*[.)]\s*(.+?)\s*$/); if(m) right.push([m[1],m[2].trim(),'']);
 }
 // Compact forms: (A) item — (1) item; (B) item — (2) item ...
 if(left.length<2 || right.length<2){
  const clean=raw.replace(/\n/g,' ');
  const re=/\(?([A-D])\)?\s*[.)]?\s*([^;—–]+?)\s*[—–-]\s*\(?([1-4])\)?\s*[.)]?\s*([^;]+?)(?=\s*;\s*\(?[A-D]\)?\s*[.)]?|$)/gi;
  let m; while((m=re.exec(clean))!==null){left.push([m[1].toUpperCase(),m[2].trim(),'']);right.push([m[3],m[4].trim(),'']);}
 }
 if(left.length>=2 && right.length>=2){
  return makeTable(left,right,['सूची–I','List I'],['सूची–II','List II']);
 }
 return '';
}
function structuredQuestionTable(raw){
 const text=String(raw||'').replace(/\r/g,' ').replace(/\s+/g,' ').trim();
 if(!text)return {intro:'',table:''};
 const table=(headers,rows)=>`<div class="match-table-wrap statement-table-wrap"><table class="match-table statement-table"><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
 // Assertion–Reason questions: keep the question instruction outside the table.
 const ar=text.match(/^(.*?)(?:कथन\s*\(?A\)?|Assertion\s*\(?A\)?)\s*[:：-]\s*(.*?)\s*(?:कारण\s*\(?R\)?|Reason\s*\(?R\)?)\s*[:：-]\s*(.*)$/i);
 if(ar)return {intro:ar[1].trim(),table:table([lang==='hi'?'भाग':'Part',lang==='hi'?'विवरण':'Description'],[[`<b>${lang==='hi'?'कथन (A)':'Assertion (A)'}</b>`,esc(ar[2])],[`<b>${lang==='hi'?'कारण (R)':'Reason (R)'}</b>`,esc(ar[3])]])};
 // List-I / List-II questions, including compact inline lists.
 const list1=text.match(/^(.*?)(?:सूची\s*[-–—]?\s*I|List\s*[-–—]?\s*I)\s*\([^)]*\)?\s*[:：]?\s*(.*?)(?=(?:सूची\s*[-–—]?\s*II|List\s*[-–—]?\s*II))/i);
 const list2=text.match(/(?:सूची\s*[-–—]?\s*II|List\s*[-–—]?\s*II)\s*\([^)]*\)?\s*[:：]?\s*(.*?)(?=\s*(?:सही|उचित|नीचे|कूट|मिलान|Select|Choose|The correct|$))/i);
 if(list1&&list2){
  const parse=(v,letters)=>{const out=[];const re=letters?/(?:^|[,;।]\s*|\s+)([A-D])\s*[.)]\s*(.*?)(?=(?:[,;।]\s*|\s+)[A-D]\s*[.)]\s*|$)/gi:/(?:^|[,;।]\s*|\s+)([1-4])\s*[.)]\s*(.*?)(?=(?:[,;।]\s*|\s+)[1-4]\s*[.)]\s*|$)/g;let m;while((m=re.exec(v))!==null){const val=m[2].trim().replace(/[;,।]+$/,'');if(val)out.push([m[1].toUpperCase(),val]);}return out;};
  const a=parse(list1[2],true),b=parse(list2[1],false);
  if(a.length>=2&&b.length>=2){const n=Math.max(a.length,b.length);const tail=(text.match(/(?:सही|उचित|नीचे|कूट|मिलान|Select|Choose|The correct).*$/i)||[])[0]||'';
   return {intro:[list1[1].trim(),tail].filter(Boolean).join(' '),table:table([lang==='hi'?'सूची–I':'List–I',lang==='hi'?'सूची–II':'List–II'],Array.from({length:n},(_,i)=>[a[i]?`<b>${esc(a[i][0])}.</b> ${esc(a[i][1])}`:'',b[i]?`<b>${esc(b[i][0])}.</b> ${esc(b[i][1])}`:'']))};}
 }
 // Numbered statements/pairs. Accept both (1) and 1. formats.
 const re=/(?:^|\s)(?:\(([1-5])\)|([1-5])\s*[.)])\s*/g;
 const matches=[...text.matchAll(re)];
 if(matches.length>=2){
  const intro=text.slice(0,matches[0].index).trim().replace(/[—:：-]+$/,'');
  const rows=[];let instruction='';
  for(let i=0;i<matches.length;i++){
   const start=matches[i].index+matches[i][0].length;
   const end=i+1<matches.length?matches[i+1].index:text.length;
   let value=text.slice(start,end).trim().replace(/[;।]+$/,'');
   if(i===matches.length-1){const tail=value.match(/\s*((?:सही|उचित|उपर्युक्त में से|उपर्युक्त में कितने|कितने युग्म|नीचे दिए गए|Choose|Select|How many|The correct).*?)$/i);if(tail){instruction=tail[1].trim();value=value.slice(0,tail.index).trim();}}
   if(value)rows.push([`<b>${matches[i][1]||matches[i][2]}.</b>`,esc(value)]);
  }
  if(rows.length>=2)return {intro:[intro,instruction].filter(Boolean).join(' '),table:table([lang==='hi'?'क्रमांक':'No.',lang==='hi'?'कथन / युग्म':'Statement / Pair'],rows)};
 }
 return {intro:text,table:''};
}
function showWrong(){
 clearTimeout(autoTimer);
 if(reviewMode){
   reviewPos=(reviewPos+1)%reviewIds.length;
   currentIndex=reviewIds[reviewPos]; page=Math.floor(currentIndex/PER); render();
   const el=document.getElementById('qcard-'+currentIndex); if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
   return;
 }
 const ids=Object.keys(answers).map(Number).filter(i=>DATA[i] && DATA[i].answer!==answers[i]).sort((a,b)=>a-b);
 if(!ids.length){alert('अभी कोई गलत उत्तर नहीं है।');return;}
 reviewIds=ids;reviewPos=0;reviewMode=true;currentIndex=reviewIds[0];page=Math.floor(currentIndex/PER);render();
 const el=document.getElementById('qcard-'+currentIndex); if(el) el.scrollIntoView({behavior:'smooth',block:'start'});
}
function reviewAllRecordedWrong(){const records=Object.entries(performanceData.questions||{}).filter(([,r])=>(r.wrong||0)>0).sort((a,b)=>(b[1].wrong||0)-(a[1].wrong||0));const items=[];for(const [qid,rec] of records){const [unit,index]=qid.split(':').map(Number);const q=(UNIT_DATA_MAP[unit]||[])[index];if(q)items.push({...q,__unit:unit,__qid:qid});}if(!items.length){alert(lang==='hi'?'अभी तक कोई गलत प्रश्न दर्ज नहीं है।':'No incorrect questions have been recorded yet.');return;}DATA=items;activeUnit=0;isMixedMode=true;isUnitShuffled=false;resetQuizState();reviewMode=false;updateUnitButtons(0);document.querySelector('.title').textContent=lang==='hi'?'MPPSC PRE 2027 | सभी गलत प्रश्न':'MPPSC PRE 2027 | ALL INCORRECT QUESTIONS';render();window.scrollTo({top:0,behavior:'smooth'});}
function refreshAll(){if(confirm('वर्तमान अभ्यास के उत्तर रीसेट करें? आपकी परफॉरमेंस हिस्ट्री सुरक्षित रहेगी।')){clearTimeout(autoTimer);answers={};page=0;currentIndex=0;reviewMode=false;reviewIds=[];reviewPos=0;render();window.scrollTo({top:0,behavior:'smooth'});}}
function programAnalysisHTML(){
 const en=lang==='en';
 const units=Object.entries(UNIT_DATA_MAP).map(([id,items])=>({id:Number(id),count:items.length}));
 const total=units.reduce((n,u)=>n+u.count,0),avg=Math.round(total/units.length),top=units.reduce((a,b)=>a.count>b.count?a:b);
 const cards=units.map(u=>`<div class="program-unit"><div class="program-unit-top"><strong>UNIT ${String(u.id).padStart(2,'0')}</strong><b>${u.count.toLocaleString('en-IN')}</b></div><div class="program-track"><i style="width:${(u.count/total*100).toFixed(1)}%"></i></div><div class="program-unit-bottom"><span>${(u.count/total*100).toFixed(1)}%</span><button onclick="setUnit(${u.id})">${en?'Open ↗':'खोलें ↗'}</button></div></div>`).join('');
 return `<section class="program-analysis"><div class="program-kicker">MPPSC IQ · PRE 2027</div><h2>PROGRAM ANALYSIS</h2><p>${en?'Complete question-bank dashboard for your preparation':'आपकी तैयारी के लिए पूरा प्रश्न-बैंक डैशबोर्ड'}</p><div class="program-summary"><div><b>${total.toLocaleString('en-IN')}</b><span>${en?'TOTAL QUESTIONS':'कुल प्रश्न'}</span></div><div><b>${units.length}</b><span>${en?'ACTIVE UNITS':'सक्रिय यूनिट'}</span></div><div><b>${avg.toLocaleString('en-IN')}</b><span>${en?'AVG / UNIT':'औसत / यूनिट'}</span></div><div><b>${top.count.toLocaleString('en-IN')}</b><span>${en?'TOP UNIT':'सबसे बड़ी यूनिट'} ${String(top.id).padStart(2,'0')}</span></div></div><h3>${en?'Unit-wise Question Distribution':'यूनिट-वाइज प्रश्न वितरण'}</h3><div class="program-units">${cards}</div><div class="program-actions"><button onclick="setUnit(${top.id})">${en?'Open Largest Unit':'सबसे बड़ी यूनिट खोलें'}</button><button onclick="mixAllUnits()">${en?'Mixed Practice · All Units':'सभी यूनिट मिक्स प्रैक्टिस'}</button></div><div class="program-note">${en?'Note: This section shows the available question bank and unit-wise distribution. Your personal attempts and score are shown in Candidate Performance below.':'नोट: यह भाग उपलब्ध प्रश्नों और यूनिट-वाइज वितरण की जानकारी देता है। आपके प्रयासों और व्यक्तिगत स्कोर का विश्लेषण नीचे दिया गया है।'}</div></section>`;
}

let analysisTab='overview';
function setAnalysisTab(tab){analysisTab=tab;document.querySelectorAll('.analysis-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelectorAll('.analysis-pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===tab));}
function downloadMistakesCSV(){const a=performanceSummary();const head=lang==='hi'?['यूनिट','प्रश्न','गलत प्रयास','सही प्रयास','सही उत्तर']:['Unit','Question','Wrong Attempts','Correct Attempts','Correct Answer'];const rows=a.allMistakes.map(m=>[m.unit,m.question,m.wrong,m.correct,m.rightAnswer]);const csv='\uFEFF'+[head,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='MPPSC_IQ_Wrong_Questions.csv';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);}
function printPerformanceReport(){window.print();}
function renderProgressPane(a){const hist=Array.isArray(performanceData.history)?performanceData.history:[];const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const key=`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;const items=hist.filter(x=>{const t=new Date(x.at);return `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`===key;});const ok=items.filter(x=>x.correct).length;days.push({label:d.toLocaleDateString(lang==='hi'?'hi-IN':'en-IN',{day:'numeric',month:'short'}),count:items.length,accuracy:items.length?ok/items.length*100:0});}const max=Math.max(1,...days.map(x=>x.count));const bars=days.map(x=>`<div class="trend-day"><div class="trend-bar-area"><i style="height:${Math.max(3,x.count/max*100)}%" title="${x.count} ${lang==='hi'?'प्रयास':'attempts'}"></i></div><b>${x.count}</b><span>${x.label}</span><small>${x.count?x.accuracy.toFixed(0)+'%':'—'}</small></div>`).join('');const recent=(performanceData.recent||[]).slice(-30);const recentRows=recent.slice().reverse().slice(0,10).map((x,i)=>`<tr><td>${i+1}</td><td>UNIT ${String(x.unit).padStart(2,'0')}</td><td>${x.correct?(lang==='hi'?'सही':'Correct'):(lang==='hi'?'गलत':'Wrong')}</td><td>${new Date(x.at).toLocaleString(lang==='hi'?'hi-IN':'en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</td></tr>`).join('');return `<div class="analysis-mini-cards"><div><b>${a.recentCount}</b><span>${lang==='hi'?'हाल के उत्तर':'Recent answers'}</span></div><div><b>${a.recentAccuracy.toFixed(1)}%</b><span>${lang==='hi'?'हाल की सटीकता':'Recent accuracy'}</span></div><div><b>${days.reduce((n,d)=>n+d.count,0)}</b><span>${lang==='hi'?'पिछले 7 दिन के प्रयास':'Attempts · last 7 days'}</span></div></div><h3 class="analysis-section-title">${lang==='hi'?'पिछले 7 दिनों की गतिविधि':'Last 7 Days Activity'}</h3><div class="trend-chart">${bars}</div><p class="analysis-note">${lang==='hi'?'बार की ऊँचाई दैनिक प्रयासों की संख्या दिखाती है; नीचे सटीकता दी गई है।':'Bar height shows daily attempts; accuracy is shown below each bar.'}</p><h3 class="analysis-section-title">${lang==='hi'?'हाल के 10 उत्तर':'Last 10 Answers'}</h3><div class="analysis-table-wrap"><table class="analysis-table"><thead><tr><th>#</th><th>${lang==='hi'?'यूनिट':'Unit'}</th><th>${lang==='hi'?'परिणाम':'Result'}</th><th>${lang==='hi'?'समय':'Time'}</th></tr></thead><tbody>${recentRows||`<tr><td colspan="4">${lang==='hi'?'अभी कोई रिकॉर्ड नहीं':'No activity recorded yet'}</td></tr>`}</tbody></table></div><div class="analysis-note">${lang==='hi'?'दैनिक इतिहास इस अपडेट के बाद किए गए प्रयासों से बनेगा। पहले के रिकॉर्ड में केवल हाल के 30 उत्तर उपलब्ध हो सकते हैं।':'Daily history builds from attempts made after this update. Older records may contain only the last 30 answers.'}</div>`;}
function renderRevisionPane(a){const repeat=a.allMistakes.filter(x=>x.wrong>1);const recovered=a.allMistakes.filter(x=>x.lastCorrect===true);const list=(items)=>items.length?`<div class="analysis-table-wrap"><table class="analysis-table"><thead><tr><th>${lang==='hi'?'यूनिट':'Unit'}</th><th>${lang==='hi'?'प्रश्न':'Question'}</th><th>${lang==='hi'?'गलत बार':'Wrong'}</th><th>${lang==='hi'?'स्थिति':'Status'}</th></tr></thead><tbody>${items.slice(0,12).map(m=>`<tr><td>UNIT ${String(m.unit).padStart(2,'0')}</td><td>${esc(m.question)}</td><td>${m.wrong}</td><td>${m.lastCorrect?(lang==='hi'?'अब सही':'Now correct'):(lang==='hi'?'दोहराएँ':'Revise')}</td></tr>`).join('')}</tbody></table></div>`:`<div class="analysis-note">${lang==='hi'?'अभी डेटा उपलब्ध नहीं है।':'No data available yet.'}</div>`;return `<div class="revision-actions"><button onclick="reviewAllRecordedWrong()">${lang==='hi'?'सभी गलत प्रश्नों का टेस्ट शुरू करें':'Start All Wrong Questions Test'}</button><button class="secondary-action" onclick="downloadMistakesCSV()">${lang==='hi'?'गलत प्रश्न CSV डाउनलोड':'Download Wrong Questions CSV'}</button></div><h3 class="analysis-section-title">${lang==='hi'?'बार-बार गलत हुए प्रश्न':'Repeatedly Incorrect Questions'} · ${repeat.length}</h3>${list(repeat)}<h3 class="analysis-section-title">${lang==='hi'?'सुधार किए गए प्रश्न':'Recovered Questions'} · ${recovered.length}</h3>${list(recovered)}<div class="analysis-note">${lang==='hi'?'रिवीजन सूची में वे प्रश्न आते हैं जिन पर कम-से-कम एक बार गलत उत्तर दिया गया है।':'The revision list includes every question answered incorrectly at least once.'}</div>`;}
function render(){
 const available=DATA.length;
 const questionBox=document.getElementById('questions');
 if(!available){
  if(activeUnit===12){
   const a=performanceSummary();
   const pct=v=>`${v.toFixed(1)}%`;
   const strongest=a.strongest?`UNIT ${String(a.strongest.unit).padStart(2,'0')} (${pct(a.strongest.accuracy)})`:(lang==='hi'?'अभी उपलब्ध नहीं':'Not available yet');
   const weakest=a.weakest?`UNIT ${String(a.weakest.unit).padStart(2,'0')} (${pct(a.weakest.accuracy)})`:(lang==='hi'?'अभी उपलब्ध नहीं':'Not available yet');
   const summaryRows=[
    [lang==='hi'?'कुल प्रयास':'Total Attempts',a.attempts],[lang==='hi'?'सही उत्तर':'Correct Answers',a.correct],[lang==='hi'?'गलत प्रयास':'Wrong Attempts',a.wrong],[lang==='hi'?'कुल स्कोर (+3/−1)':'Total Score (+3/−1)',a.score],[lang==='hi'?'अलग प्रश्न हल':'Unique Questions Attempted',a.unique],[lang==='hi'?'अलग गलत प्रश्न':'Distinct Wrong Questions',a.uniqueWrong],[lang==='hi'?'बार-बार गलत प्रश्न':'Repeatedly Wrong Questions',a.repeatWrong],[lang==='hi'?'गलती के बाद आखिरी बार सही':'Last Attempt Correct',a.recovered],[lang==='hi'?'अभी तक नहीं हल':'Not Yet Attempted',a.unattempted],[lang==='hi'?'प्रश्न-बैंक कवरेज':'Question Bank Coverage',pct(a.completion)],[lang==='hi'?'हाल के 30 उत्तरों की सटीकता':'Last 30 Answers Accuracy',pct(a.recentAccuracy)]];
   const summaryTable=`<div class="analysis-table-wrap"><table class="analysis-table"><thead><tr><th>${lang==='hi'?'विवरण':'Metric'}</th><th>${lang==='hi'?'आपका प्रदर्शन':'Your Performance'}</th></tr></thead><tbody>${summaryRows.map(r=>`<tr><td>${r[0]}</td><td><b>${r[1]}</b></td></tr>`).join('')}</tbody></table></div>`;
   const unitTable=`<div class="analysis-table-wrap"><table class="analysis-table"><thead><tr><th>${lang==='hi'?'यूनिट':'Unit'}</th><th>${lang==='hi'?'हल':'Attempted'}</th><th>${lang==='hi'?'सही':'Correct'}</th><th>${lang==='hi'?'गलत':'Wrong'}</th><th>${lang==='hi'?'सटीकता':'Accuracy'}</th><th>${lang==='hi'?'कुल प्रश्न':'Total'}</th></tr></thead><tbody>${a.stats.map(x=>`<tr><td><b>UNIT ${String(x.unit).padStart(2,'0')}</b></td><td>${x.unique}</td><td>${x.correct}</td><td class="wrong-cell">${x.wrong}</td><td><b>${pct(x.accuracy)}</b></td><td>${x.total}</td></tr>`).join('')}</tbody></table></div>`;
   const mistakeTable=`<div class="analysis-table-wrap"><table class="analysis-table mistakes-table"><thead><tr><th>${lang==='hi'?'यूनिट':'Unit'}</th><th>${lang==='hi'?'गलत प्रश्न':'Incorrect Question'}</th><th>${lang==='hi'?'गलत बार':'Wrong'}</th><th>${lang==='hi'?'सही बार':'Correct'}</th><th>${lang==='hi'?'सही उत्तर':'Correct Answer'}</th></tr></thead><tbody>${a.allMistakes.map(m=>`<tr><td><b>${String(m.unit).padStart(2,'0')}</b></td><td>${esc(m.question)}</td><td class="wrong-cell">${m.wrong}</td><td>${m.correct}</td><td class="right-cell">${esc(m.rightAnswer||'—')}</td></tr>`).join('')}</tbody></table></div>`;
   const tabs=[['overview',lang==='hi'?'ओवरव्यू':'Overview'],['wrong',lang==='hi'?'गलत प्रश्न':'Wrong Questions'],['units',lang==='hi'?'यूनिट रिपोर्ट':'Unit Analysis'],['progress',lang==='hi'?'प्रगति':'Progress'],['revision',lang==='hi'?'रिवीजन सेंटर':'Revision Center']];
   const tabbar=`<div class="analysis-tabs">${tabs.map(([id,label])=>`<button class="analysis-tab ${analysisTab===id?'active':''}" data-tab="${id}" onclick="setAnalysisTab('${id}')">${label}</button>`).join('')}</div>`;
   const overview=`<div class="analysis-pane ${analysisTab==='overview'?'active':''}" data-pane="overview"><div class="analysis-total"><strong>${pct(a.accuracy)}</strong><span>${lang==='hi'?'कुल सटीकता':'OVERALL ACCURACY'}</span></div><h3 class="analysis-section-title">${lang==='hi'?'कुल प्रदर्शन':'Overall Performance'}</h3>${summaryTable}<div class="perf-insights"><div><span>${lang==='hi'?'सबसे मजबूत यूनिट':'Strongest Unit'}</span><strong>${strongest}</strong></div><div><span>${lang==='hi'?'अधिक अभ्यास की जरूरत':'Needs More Practice'}</span><strong>${weakest}</strong></div></div><div class="revision-actions"><button onclick="printPerformanceReport()">${lang==='hi'?'रिपोर्ट प्रिंट / PDF':'Print / Save PDF'}</button></div></div>`;
   const wrongPane=`<div class="analysis-pane ${analysisTab==='wrong'?'active':''}" data-pane="wrong"><div class="analysis-mini-cards"><div><b>${a.wrong}</b><span>${lang==='hi'?'कुल गलत प्रयास':'Wrong attempts'}</span></div><div><b>${a.uniqueWrong}</b><span>${lang==='hi'?'अलग गलत प्रश्न':'Distinct wrong questions'}</span></div><div><b>${a.repeatWrong}</b><span>${lang==='hi'?'बार-बार गलत':'Repeated errors'}</span></div></div><div class="revision-actions"><button onclick="reviewAllRecordedWrong()">${lang==='hi'?'सभी गलत प्रश्नों का टेस्ट':'Practice All Wrong Questions'}</button><button class="secondary-action" onclick="downloadMistakesCSV()">${lang==='hi'?'CSV डाउनलोड':'Download CSV'}</button></div>${a.allMistakes.length?mistakeTable:`<div class="analysis-note">${lang==='hi'?'अभी तक कोई गलत उत्तर दर्ज नहीं हुआ है।':'No incorrect answers recorded yet.'}</div>`}</div>`;
   const unitsPane=`<div class="analysis-pane ${analysisTab==='units'?'active':''}" data-pane="units"><div class="analysis-note">${lang==='hi'?'कम सटीकता वाली यूनिट पर अधिक अभ्यास करें। यूनिट खोलने के लिए अभ्यास बटन चुनें।':'Focus on units with lower accuracy. Use Practice to open a unit.'}</div>${unitTable}<div class="unit-practice-list">${a.stats.map(x=>`<button onclick="setUnit(${x.unit})">UNIT ${String(x.unit).padStart(2,'0')} · ${lang==='hi'?'अभ्यास खोलें':'Practice'} ↗</button>`).join('')}</div></div>`;
   const progressPane=`<div class="analysis-pane ${analysisTab==='progress'?'active':''}" data-pane="progress">${renderProgressPane(a)}</div>`;
   const revisionPane=`<div class="analysis-pane ${analysisTab==='revision'?'active':''}" data-pane="revision">${renderRevisionPane(a)}</div>`;
   document.getElementById('pageInfo').textContent='CANDIDATE PERFORMANCE';
   document.getElementById('score').textContent=`Attempted: ${a.attempts} · Accuracy: ${pct(a.accuracy)}`;
   document.getElementById('bottomScore').textContent=`सटीकता: ${pct(a.accuracy)}`;
   document.getElementById('progressFill').style.width=`${a.completion.toFixed(2)}%`;
   document.getElementById('reviewNote').textContent='';
   questionBox.innerHTML=programAnalysisHTML()+`<section class="analysis-panel performance-panel"><div class="analysis-kicker">MPPSC IQ · PRE 2027</div><h2>${lang==='hi'?'अभ्यर्थी परफॉरमेंस एनालिसिस':'CANDIDATE PERFORMANCE'}</h2><p class="analysis-sub">${lang==='hi'?'अपनी तैयारी, गलतियों और प्रगति का पूरा विश्लेषण':'A complete view of your preparation, mistakes and progress'}</p>${tabbar}${overview}${wrongPane}${unitsPane}${progressPane}${revisionPane}<div class="analysis-note">${lang==='hi'?'आपका रिकॉर्ड इसी डिवाइस/ब्राउज़र में सेव रहता है। ब्राउज़र डेटा साफ करने पर रिकॉर्ड मिट सकता है। रैंक/पर्सेंटाइल और दूसरे अभ्यर्थियों से तुलना के लिए साझा सर्वर डेटा आवश्यक है।':'Your record is stored in this device/browser. Clearing browser data may erase it. Rank/percentile and comparison with other candidates require shared server data.'}</div><p class="analysis-foot">${lang==='hi'?'नियमित अभ्यास • गलतियों का विश्लेषण • बेहतर सटीकता':'Practice regularly • Review mistakes • Improve accuracy'}</p></section>`;
   ['backBtn','nextBtn'].forEach(id=>{const b=document.getElementById(id);b.disabled=true;b.style.display='none'});
   const wb=document.querySelector('.bottom button[onclick="showWrong()"]');if(wb)wb.style.display='none';
   const mix=document.querySelector('.mixbar');if(mix)mix.style.display='none';
   document.querySelector('.bottom').style.display='none';
   return;
  }
  document.getElementById('pageInfo').textContent=`UNIT ${activeUnit} · प्रश्न उपलब्ध नहीं`;
  document.getElementById('score').textContent='Attempted: 0 | Correct: 0';
  document.getElementById('bottomScore').textContent='Score: 0';
  document.getElementById('progressFill').style.width='0%';
  document.getElementById('reviewNote').textContent='';
  questionBox.innerHTML=activeUnit===11?`<div class="unit-empty">PYQs का सेक्शन तैयार है।<br>इसमें अभी प्रश्न जोड़े नहीं गए हैं।</div>`:`<div class="unit-empty">UNIT ${activeUnit} में अभी प्रश्न जोड़े नहीं गए हैं।<br>वर्तमान में UNIT 02, UNIT 03, UNIT 05, UNIT 06 और UNIT 10 में प्रश्न उपलब्ध हैं।</div>`;
  ['backBtn','nextBtn'].forEach(id=>{const b=document.getElementById(id);b.disabled=true;b.style.display='none'});
  const wb=document.querySelector('.bottom button[onclick="showWrong()"]');if(wb)wb.style.display='none';
  return;
 }
 document.querySelector('.bottom').style.display='';
 const mixbar=document.querySelector('.mixbar');if(mixbar)mixbar.style.display='';
 const wb=document.querySelector('.bottom button[onclick="showWrong()"]');if(wb)wb.style.display='';
 const pageStart=Math.floor(currentIndex/PER)*PER,pageEnd=Math.min(pageStart+PER,available);
 const indices=reviewMode?[reviewIds[reviewPos]]:Array.from({length:pageEnd-pageStart},(_,n)=>pageStart+n);
 if(!reviewMode)currentIndex=Math.max(pageStart,Math.min(pageEnd-1,currentIndex));
 page=Math.floor(currentIndex/PER);
 document.getElementById('pageInfo').textContent=isMixedMode?`ALL UNITS MIXED · Page ${page+1}/${Math.ceil(DATA.length/PER)} · Questions ${pageStart+1}–${pageEnd} of ${DATA.length}`:`UNIT ${String(activeUnit).padStart(2,'0')} · Page ${page+1}/${Math.ceil(DATA.length/PER)} · Questions ${pageStart+1}–${pageEnd} of ${DATA.length}`;
 document.getElementById('backBtn').disabled=!reviewMode&&currentIndex<=0;
 document.getElementById('nextBtn').disabled=!reviewMode&&currentIndex>=DATA.length-1;
 document.getElementById('backBtn').style.display=reviewMode?'none':'';
 document.getElementById('nextBtn').style.display=reviewMode?'none':'';
 let attempted=Object.keys(answers).length,correct=Object.entries(answers).filter(([i,k])=>DATA[+i].answer===k).length,wrong=attempted-correct,score=correct*3-wrong;
 document.getElementById('score').textContent=`Attempted ${attempted} · Correct ${correct} · Wrong ${wrong} · Score ${score}`;
 document.getElementById('bottomScore').textContent=`Score: ${score}`;
 document.getElementById('bottomScore').setAttribute('aria-label',`Total Score: ${score}`);
 document.getElementById('bottomScore').title=`Total Score: ${score}`;
 document.getElementById('progressFill').style.width=`${(currentIndex+1)/DATA.length*100}%`;
 document.getElementById('reviewNote').textContent=reviewMode?`Wrong Question ${reviewPos+1} / ${reviewIds.length}`:'';
 const title=lang==='hi'?'प्रश्न':'Question';
 document.getElementById('questions').innerHTML=indices.map(idx=>{
  const q=DATA[idx],chosen=answers[idx],opts=q.options||[];
  const separateLang=(isMixedMode?q.__unit===6:activeUnit===6)||idx>=1400;
  const questionSource=lang==='hi'?(q.q||q.en):(q.en||q.q);const questionParts=String(questionSource??'').split(/\s*\/\s*/);const questionText=lang==='hi'?(questionParts[0]||questionSource):(questionParts.length>1?questionParts.slice(1).join(' / '):questionSource);
  const isPairQuestion=/(युग्म|सुमेलित|मिलान|match(?:ing)?|correctly matched|incorrectly matched)/i.test(questionText);
  const optionRows=opts.map((o,k)=>{let raw=String(o??'');let parts=raw.split(/\s*\/\s*/);let shown=lang==='hi'?(parts[0]||raw):(parts.length>1?parts.slice(1).join(' / '):raw);let cls=chosen!==undefined&&k===q.answer?'correct':'';if(chosen===k&&k!==q.answer)cls='wrong';return {k,shown,cls};});
  const options=isPairQuestion?`<div class="match-table-wrap statement-table-wrap"><table class="match-table statement-table answer-match-table"><thead><tr><th>${lang==='hi'?'विकल्प':'Option'}</th><th>${lang==='hi'?'युग्म / मिलान':'Pair / Match'}</th></tr></thead><tbody>${optionRows.map(({k,shown,cls})=>`<tr><td><button class="option ${cls}" onclick="choose(${idx},${k})" ${chosen!==undefined||reviewMode?'disabled':''}>${'ABCD'[k]||k+1}.</button></td><td><button class="option ${cls}" onclick="choose(${idx},${k})" ${chosen!==undefined||reviewMode?'disabled':''}>${esc(shown)}</button></td></tr>`).join('')}</tbody></table></div>`:optionRows.map(({k,shown,cls})=>`<button class="option ${cls}" onclick="choose(${idx},${k})" ${chosen!==undefined||reviewMode?'disabled':''}><span class="letter">${'ABCD'[k]||k+1}.</span><span>${esc(shown)}</span></button>`).join('')+'</div>';
  const structured=structuredQuestionTable(questionText);
  const legacyMatch=structured.table?'':matchTable(lang==='hi'?(q.q||''):(q.en||''),idx);
  const visibleQuestion=structured.table?(structured.intro||title):questionText;
  const cardTitle=isMixedMode?`UNIT ${String(q.__unit).padStart(2,'0')} · ${title} ${idx+1}`:`${title} ${idx+1}`;
  const editControl=window.MPPSC_IQ_ADMIN?'<button class="admin-edit-btn" onclick="editQuestion('+idx+')">✏️ Edit</button>':'';
  return `<section class="card" id="qcard-${idx}"><div class="qtext">${cardTitle}. ${esc(visibleQuestion)}</div>${editControl}${structured.table||legacyMatch}${options}</section>`;
 }).join('');
 const wrongBtn=document.querySelector('.bottom button[onclick="showWrong()"]');if(wrongBtn)wrongBtn.textContent=reviewMode?`Next Wrong ${reviewPos+1}/${reviewIds.length}`:`Wrong (${wrong})`;
}

function changePage(d){clearTimeout(autoTimer);if(reviewMode){reviewPos=Math.max(0,Math.min(reviewIds.length-1,reviewPos+d));currentIndex=reviewIds[reviewPos];page=Math.floor(currentIndex/PER);render();scheduleRevisionProgressSave();window.scrollTo({top:0,behavior:'smooth'});return;}const totalPages=Math.ceil(DATA.length/PER);const targetPage=Math.max(0,Math.min(totalPages-1,Math.floor(currentIndex/PER)+d));currentIndex=targetPage*PER;page=targetPage;render();scheduleRevisionProgressSave();window.scrollTo({top:0,behavior:'smooth'});}
function applyTheme(theme){document.body.classList.toggle('dark',theme==='dark');const b=document.getElementById('themeBtn');if(b){b.textContent=theme==='dark'?'☀️ Light':'🌙 Dark';b.setAttribute('aria-pressed',theme==='dark'?'true':'false');}try{localStorage.setItem('mppscIqTheme',theme)}catch(e){}}
function toggleTheme(){applyTheme(document.body.classList.contains('dark')?'light':'dark')}
(function(){let t='light';try{t=localStorage.getItem('mppscIqTheme')||'light'}catch(e){}applyTheme(t)})();

const MPPSC_IQ_API='https://mppsc-iq-telegram-platform-mdri.onrender.com';window.MPPSC_IQ_ADMIN=false;window.MPPSC_IQ_TOKEN='';window.MPPSC_IQ_EDITS={};
function applyQuestionOverrides(){if(!Array.isArray(DATA))return;DATA.forEach(q=>{const e=window.MPPSC_IQ_EDITS[String(q.__qid||'')];if(e)Object.assign(q,e,{__unit:q.__unit,__qid:q.__qid});});}
async function initMppscIqEditor(){try{const initData=window.Telegram&&Telegram.WebApp?Telegram.WebApp.initData:'';if(!initData){await restoreRevisionProgress();return;}const r=await fetch(MPPSC_IQ_API+'/api/auth/telegram',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData})});if(!r.ok){await restoreRevisionProgress();return;}const auth=await r.json();window.MPPSC_IQ_TOKEN=auth.token||'';const me=await fetch(MPPSC_IQ_API+'/api/me',{headers:{Authorization:'Bearer '+window.MPPSC_IQ_TOKEN}});if(!me.ok)return;window.MPPSC_IQ_ADMIN=(await me.json()).role==='admin';const edits=await fetch(MPPSC_IQ_API+'/api/question-bank-overrides',{headers:{Authorization:'Bearer '+window.MPPSC_IQ_TOKEN}});if(edits.ok){window.MPPSC_IQ_EDITS=(await edits.json()).edits||{};applyQuestionOverrides();render();}await restoreRevisionProgress();}catch(e){console.warn('MPPSC IQ shared question sync unavailable',e);}}
function openQuestionEditor(q,idx){return new Promise(resolve=>{const card=document.getElementById('qcard-'+idx);if(!card)return resolve(null);const old=card.querySelector('.iq-inline-editor');if(old)old.remove();const escHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const panel=document.createElement('div');panel.className='iq-inline-editor';panel.style.cssText='margin:14px 0;padding:14px;background:#f3f7fc;border:1px solid #cbd8e8;border-radius:14px;color:#172b45';panel.innerHTML='<div style="font-weight:900;font-size:16px;margin-bottom:10px">✏️ इसी प्रश्न को संपादित करें</div><label style="display:block;font-size:12px;font-weight:800;margin:9px 0 5px">प्रश्न (हिंदी)</label><textarea data-q rows="3" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd6e3;border-radius:9px;font:inherit">'+escHtml(q.q||'')+'</textarea><label style="display:block;font-size:12px;font-weight:800;margin:9px 0 5px">प्रश्न (English)</label><textarea data-en rows="2" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd6e3;border-radius:9px;font:inherit">'+escHtml(q.en||'')+'</textarea><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px">'+[0,1,2,3].map(i=>'<label style="display:block;font-size:12px;font-weight:800">विकल्प '+('ABCD'[i])+'<textarea data-opt="'+i+'" rows="2" style="display:block;width:100%;box-sizing:border-box;margin-top:5px;padding:9px;border:1px solid #cbd6e3;border-radius:9px;font:inherit">'+escHtml((q.options||[])[i]||'')+'</textarea></label>').join('')+'</div><label style="display:block;font-size:12px;font-weight:800;margin:10px 0 5px">सही उत्तर</label><select data-answer style="width:100%;padding:11px;border:1px solid #cbd6e3;border-radius:9px;font-size:15px">'+['A','B','C','D'].map((v,i)=>'<option value="'+i+'" '+(Number(q.answer)===i?'selected':'')+'>'+v+'</option>').join('')+'</select><label style="display:block;font-size:12px;font-weight:800;margin:10px 0 5px">व्याख्या</label><textarea data-explanation rows="4" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #cbd6e3;border-radius:9px;font:inherit">'+escHtml(q.explanation||'')+'</textarea><div style="display:flex;gap:9px;margin-top:12px"><button type="button" data-cancel style="flex:1;padding:11px;border:1px solid #cbd6e3;border-radius:9px;background:#fff;font-weight:800">रद्द करें</button><button type="button" data-save style="flex:1;padding:11px;border:0;border-radius:9px;background:#e9bd5b;color:#102b4b;font-weight:900">परिवर्तन सेव करें</button></div><div data-error style="color:#b42318;font-size:12px;margin-top:8px"></div>';const qtext=card.querySelector('.qtext');if(qtext)qtext.insertAdjacentElement('afterend',panel);else card.prepend(panel);panel.querySelector('[data-cancel]').onclick=()=>{panel.remove();resolve(null)};panel.querySelector('[data-save]').onclick=()=>{const value={q:panel.querySelector('[data-q]').value.trim(),en:panel.querySelector('[data-en]').value.trim(),options:[...panel.querySelectorAll('[data-opt]')].map(x=>x.value.trim()),answer:Number(panel.querySelector('[data-answer]').value),explanation:panel.querySelector('[data-explanation]').value.trim()};if(!value.q||value.options.some(x=>!x)){panel.querySelector('[data-error]').textContent='प्रश्न और चारों विकल्प भरना आवश्यक है।';return;}resolve(value);};panel.scrollIntoView({behavior:'smooth',block:'center'});panel.querySelector('[data-q]').focus();});}
async function editQuestion(idx){const q=DATA[idx];if(!q||!window.MPPSC_IQ_ADMIN)return;const id=String(q.__qid||'').split(':');const unit=Number(id[0]||q.__unit||activeUnit),index=Number(id[1]);if(!Number.isInteger(index))return alert('प्रश्न क्रमांक नहीं मिला');const payload=await openQuestionEditor(q,idx);if(!payload)return;try{const res=await fetch(MPPSC_IQ_API+'/api/admin/question-bank/'+unit+'/'+index,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+window.MPPSC_IQ_TOKEN},body:JSON.stringify(payload)});const result=await res.json();if(!res.ok)throw Error(result.error||'Save failed');window.MPPSC_IQ_EDITS[unit+':'+index]=payload;applyQuestionOverrides();render();alert('प्रश्न सेव हो गया। सभी विद्यार्थियों को अपडेट दिखेगा।');}catch(e){alert('सेव नहीं हुआ: '+e.message);}}
async function bootRevisionQuizFromJson(){
  const questionBox=document.getElementById('questions');
  try{
    const response=await fetch('./quiz-data/revision-units-92.json?v=1',{cache:'no-store'});
    if(!response.ok) throw new Error('Question data load failed: HTTP '+response.status);
    const bank=await response.json();
    if(!bank||bank.schemaVersion!==1||!bank.units||typeof bank.units!=='object') throw new Error('Question data format is invalid');
    Object.keys(bank.units).forEach(key=>{
      const list=bank.units[key];
      if(!Array.isArray(list)) throw new Error('Invalid question list for unit '+key);
      UNIT_DATA_MAP[Number(key)]=list;
    });
    DATA=UNIT_DATA_MAP[activeUnit]||[];
    if(window.Telegram&&Telegram.WebApp){Telegram.WebApp.ready();Telegram.WebApp.expand();}
    initMppscIqEditor();
    render();
  }catch(error){
    console.error('MPPSC IQ JSON quiz boot error:',error);
    if(questionBox) questionBox.innerHTML='<div class="card"><b>प्रश्न लोड नहीं हो पाए।</b><p>कृपया इंटरनेट कनेक्शन जाँचकर Refresh दबाएँ।</p><small>'+String(error.message||error)+'</small></div>';
  }
}
bootRevisionQuizFromJson();
