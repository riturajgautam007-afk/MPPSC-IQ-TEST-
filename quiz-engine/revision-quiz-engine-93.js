
let DATA=[];
const UNIT3_DATA=[];;const UNIT6_DATA=[];
const UNIT5_DATA=[];
const UNIT10_DATA=[];const UNIT1_DATA=[];const UNIT2_DATA=DATA;const PER=100;
const UNIT_DATA_MAP={1:UNIT1_DATA,2:UNIT2_DATA,3:UNIT3_DATA,5:UNIT5_DATA,6:UNIT6_DATA,10:UNIT10_DATA};
let activeUnit=2,isMixedMode=false,isUnitShuffled=false,unitWrongMode=false;let page=0,lang='hi',answers={},currentIndex=0,reviewMode=false,reviewIds=[],reviewPos=0,autoTimer=null;
const PERFORMANCE_KEY='mppscIqCandidatePerformance_v1';
function loadPerformance(){try{const x=JSON.parse(localStorage.getItem(PERFORMANCE_KEY)||'{}');return x&&x.questions&&typeof x.questions==='object'?x:{questions:{},recent:[]};}catch(e){return {questions:{},recent:[]};}}
let performanceData=loadPerformance();
function savePerformance(){try{localStorage.setItem(PERFORMANCE_KEY,JSON.stringify(performanceData));}catch(e){}}
function recordPerformance(q,index,selected){const unit=Number(q.__unit||activeUnit||0);const qid=q.__qid||`${unit}:${index}`;const ok=selected===q.answer;const at=Date.now();const rec=performanceData.questions[qid]||(performanceData.questions[qid]={unit,attempts:0,correct:0,wrong:0,lastCorrect:null,lastAt:0});rec.unit=unit;rec.attempts++;if(ok)rec.correct++;else rec.wrong++;rec.lastCorrect=ok;rec.lastAt=at;performanceData.recent=Array.isArray(performanceData.recent)?performanceData.recent:[];performanceData.recent.push({unit,correct:ok,at});if(performanceData.recent.length>30)performanceData.recent=performanceData.recent.slice(-30);performanceData.history=Array.isArray(performanceData.history)?performanceData.history:[];performanceData.history.push({unit,correct:ok,at});if(performanceData.history.length>5000)performanceData.history=performanceData.history.slice(-5000);savePerformance();}
function performanceSummary(){const records=Object.values(performanceData.questions||{});const units=Array.from({length:10},(_,i)=>i+1);const stats=units.map(unit=>{const rs=records.filter(r=>Number(r.unit)===unit);const attempts=rs.reduce((n,r)=>n+(r.attempts||0),0),correct=rs.reduce((n,r)=>n+(r.correct||0),0),wrong=rs.reduce((n,r)=>n+(r.wrong||0),0),unique=rs.length,accuracy=attempts?correct/attempts*100:0;return {unit,attempts,correct,wrong,unique,total:(UNIT_DATA_MAP[unit]||[]).length,accuracy};});const attempts=stats.reduce((n,x)=>n+x.attempts,0),correct=stats.reduce((n,x)=>n+x.correct,0),wrong=stats.reduce((n,x)=>n+x.wrong,0),unique=records.length,total=stats.reduce((n,x)=>n+x.total,0);const active=stats.filter(x=>x.attempts>0);const strongest=active.length?active.reduce((a,b)=>b.accuracy>a.accuracy?b:a):null;const weakest=active.length?active.reduce((a,b)=>b.accuracy<a.accuracy?b:a):null;const recent=performanceData.recent||[];const recentCorrect=recent.filter(x=>x.correct).length;const allMistakes=Object.entries(performanceData.questions||{}).filter(([,r])=>(r.wrong||0)>0).map(([qid,r])=>{const [unit,index]=qid.split(':').map(Number);const q=(UNIT_DATA_MAP[unit]||[])[index];return {qid,unit,index,wrong:r.wrong||0,correct:r.correct||0,attempts:r.attempts||0,lastCorrect:r.lastCorrect,question:q?cleanLang(lang==='hi'?(q.q||q.en):(q.en||q.q),lang):'प्रश्न उपलब्ध नहीं',rightAnswer:q?cleanLang(q.options?.[q.answer]||'',lang):'',q};}).sort((a,b)=>b.wrong-a.wrong||a.attempts-b.attempts);const repeatWrong=allMistakes.filter(x=>x.wrong>1).length,recovered=allMistakes.filter(x=>x.lastCorrect===true).length;return {stats,attempts,correct,wrong,unique,total,accuracy:attempts?correct/attempts*100:0,score:correct*3-wrong,unattempted:Math.max(0,total-unique),completion:total?unique/total*100:0,strongest,weakest,recentCount:recent.length,recentAccuracy:recent.length?recentCorrect/recent.length*100:0,allMistakes,uniqueWrong:allMistakes.length,repeatWrong,recovered};}
// Stable question identifiers keep performance linked to the original unit even after shuffling.
DATA=UNIT2_DATA.map((q,i)=>({...q,__unit:2,__qid:`2:${i}`}));
function resetQuizState(){answers={};page=0;currentIndex=0;reviewMode=false;reviewIds=[];reviewPos=0;unitWrongMode=false;clearTimeout(autoTimer);}
function updateUnitButtons(n){for(let i=1;i<=10;i++){const b=document.getElementById('unit'+i+'Btn');if(b)b.classList.toggle('active',i===n);}const pyq=document.getElementById('pyqBtn');if(pyq)pyq.classList.toggle('active',n===11);const analysis=document.getElementById('analysisBtn');if(analysis)analysis.classList.toggle('active',n===12);}
function setUnit(n){activeUnit=n;isMixedMode=false;isUnitShuffled=false;DATA=(UNIT_DATA_MAP[n]||[]).map((q,i)=>({...q,__unit:n,__qid:`${n}:${i}`}));resetQuizState();updateUnitButtons(n);document.querySelector('.title').textContent='MPPSC PRE 2027 PROGRAM';render();window.scrollTo({top:0,behavior:'smooth'});}
function setPYQs(){activeUnit=11;isMixedMode=false;isUnitShuffled=false;DATA=[];resetQuizState();updateUnitButtons(0);document.getElementById('pyqBtn').classList.add('active');document.querySelector('.title').textContent='MPPSC PRE 2027 | PREVIOUS YEAR QUESTIONS (PYQs)';render();window.scrollTo({top:0,behavior:'smooth'});}
function showAnalysis(){activeUnit=12;isMixedMode=false;isUnitShuffled=false;DATA=[];resetQuizState();updateUnitButtons(12);document.querySelector('.title').textContent='MPPSC PRE 2027 PROGRAM';render();window.scrollTo({top:0,behavior:'smooth'});}
function shuffleArray(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function shuffleCurrentUnit(){const base=UNIT_DATA_MAP[activeUnit]||[];if(!base.length){alert('इस यूनिट में अभी प्रश्न उपलब्ध नहीं हैं।');return;}isMixedMode=false;isUnitShuffled=true;DATA=shuffleArray(base.map((q,i)=>({...q,__unit:activeUnit,__qid:`${activeUnit}:${i}`})));resetQuizState();updateUnitButtons(activeUnit);document.querySelector('.title').textContent='MPPSC PRE 2027 | UNIT '+String(activeUnit).padStart(2,'0')+' | SHUFFLE PRACTICE';render();window.scrollTo({top:0,behavior:'smooth'});}
function mixAllUnits(){const available=Object.entries(UNIT_DATA_MAP).filter(([,items])=>Array.isArray(items)&&items.length);if(!available.length){alert('अभी किसी यूनिट में प्रश्न उपलब्ध नहीं हैं।');return;}const combined=[];for(const [unit,items] of available){for(let i=0;i<items.length;i++)combined.push({...items[i],__unit:Number(unit),__qid:`${unit}:${i}`});}DATA=shuffleArray(combined);activeUnit=0;isMixedMode=true;isUnitShuffled=false;resetQuizState();updateUnitButtons(0);document.querySelector('.title').textContent='MPPSC PRE 2027 | ALL UNITS | MIXED PRACTICE';render();window.scrollTo({top:0,behavior:'smooth'});} 

function splitBilingual(value,l){
 if(value==null)return '';
 if(typeof value==='object'&&!Array.isArray(value))return String(l==='en'?(value.en??value.english??''):(value.hi??value.hindi??''));
 const raw=String(value).trim();if(!raw)return '';
 const parts=raw.split(/\s+\/\s+/);
 if(parts.length>1)return (l==='hi'?parts[0]:parts.slice(1).join(' / ')).trim();
 return raw;
}
function englishOnly(value){const s=String(value??'').trim();return /[\u0900-\u097F]/.test(s)?'':s;}
function localizedQuestion(q){
 if(lang==='hi')return splitBilingual(q.q??q.question??'', 'hi')||splitBilingual(q.en??'', 'hi');
 const value=q.question_en??q.en??q.q_en??q.english_question??'';
 return englishOnly(splitBilingual(value,'en'))||englishOnly(splitBilingual(q.q??q.question??'','en'))||'English translation unavailable for this question.';
}
function localizedOption(q,o,index){
 if(lang==='hi')return splitBilingual(o,'hi');
 const list=q.options_en??q.option_en??q.english_options;
 if(Array.isArray(list)&&list[index]!=null)return englishOnly(splitBilingual(list[index],'en'))||'English translation unavailable for this option.';
 if(o&&typeof o==='object')return englishOnly(splitBilingual(o,'en'))||'English translation unavailable for this option.';
 const v=englishOnly(splitBilingual(o,'en'));
 return v&&v!==String(o).trim()?v:'English translation unavailable for this option.';
}
function localizedDetail(q,kind){
 const keys=kind==='explanation'?['explanation_en','explain_en','solution_en','description_en','answer_explanation_en','exp_en','explanation','explain','solution','description','answer_explanation','exp']:kind==='note'?['notes_en','note_en','facts_en','important_facts_en','extra_en','notes','note','facts','important_facts','extra']:[kind+'_en',kind];
 for(const key of keys){if(q[key]!=null&&q[key]!==''){const value=splitBilingual(q[key],lang);const safe=lang==='en'?englishOnly(value):value;if(safe)return safe;}}
 return '';
}
function cleanLang(s,l){return splitBilingual(s,l).replace(/Correct answer:/gi,l==='hi'?'सही उत्तर:':'Correct answer:').replace(/सही उत्तर:/g,l==='hi'?'सही उत्तर:':'Correct answer:').trim()}
function applyLanguageUI(){
 const en=lang==='en';
 const labels={
  backBtn:en?'← Previous Page':'← पिछला पेज',nextBtn:en?'Next Page →':'अगला पेज →',
  shuffleUnitBtn:en?'↻ Shuffle this unit':'↻ इस यूनिट के प्रश्न Shuffle',
  mixAllBtn:en?'⇄ Mix all units':'⇄ सभी यूनिट के प्रश्न मिक्स',
  pyqBtn:'PYQs',analysisBtn:en?'ANALYSIS':'विश्लेषण'
 };
 Object.entries(labels).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value;});
 const bottom=document.querySelectorAll('.bottom button');
 if(bottom[2])bottom[2].textContent=en?'Wrong Questions':'गलत प्रश्न';
 if(bottom[3])bottom[3].textContent=en?'↻ Refresh':'↻ रीसेट';
 const unitbar=document.getElementById('unitbar');if(unitbar)unitbar.setAttribute('aria-label',en?'Select Unit':'यूनिट चुनें');
 const mixbar=document.querySelector('.mixbar');if(mixbar)mixbar.setAttribute('aria-label',en?'Question order controls':'प्रश्न क्रम नियंत्रण');
}
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function setLang(l){lang=l;document.getElementById('hiBtn').classList.toggle('active',l==='hi');document.getElementById('enBtn').classList.toggle('active',l==='en');applyLanguageUI();render()}
function choose(i,k){if(answers[i]!==undefined||reviewMode)return;currentIndex=i;answers[i]=k;recordPerformance(DATA[i],i,k);render();clearTimeout(autoTimer);autoTimer=setTimeout(()=>{const pageEnd=unitWrongMode?DATA.length:Math.min(Math.floor(i/PER)*PER+PER,DATA.length);if(i+1<pageEnd){currentIndex=i+1;render();const next=document.getElementById('qcard-'+currentIndex);if(next)next.scrollIntoView({behavior:'smooth',block:'start'});}},750)}

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
function reviewWrongByUnit(unit){
 const records=Object.entries(performanceData.questions||{}).filter(([qid,r])=>Number(qid.split(':')[0])===Number(unit)&&(r.wrong||0)>0).sort((a,b)=>Number(a[0].split(':')[1])-Number(b[0].split(':')[1]));
 const items=[];for(const [qid] of records){const [u,index]=qid.split(':').map(Number);const q=(UNIT_DATA_MAP[u]||[])[index];if(q)items.push({...q,__unit:u,__qid:qid});}
 if(!items.length){alert(lang==='hi'?`UNIT ${String(unit).padStart(2,'0')} में अभी कोई गलत प्रश्न दर्ज नहीं है।`:`No incorrect questions recorded in UNIT ${String(unit).padStart(2,'0')}.`);return;}
 DATA=items;activeUnit=0;isMixedMode=true;isUnitShuffled=false;resetQuizState();unitWrongMode=true;updateUnitButtons(0);
 document.querySelector('.title').textContent=lang==='hi'?`UNIT ${String(unit).padStart(2,'0')} | गलत प्रश्नों का अभ्यास`:`UNIT ${String(unit).padStart(2,'0')} | WRONG QUESTION PRACTICE`;
 render();window.scrollTo({top:0,behavior:'smooth'});
}
function showAllRecordedWrong(){const a=performanceSummary();if(!a.allMistakes.length){alert(lang==='hi'?'अभी तक कोई गलत प्रश्न दर्ज नहीं है।':'No incorrect questions have been recorded yet.');return;}const rows=a.allMistakes.map(m=>`<tr><td><b>${String(m.unit).padStart(2,'0')}</b></td><td>${esc(m.question)}</td><td class=\"wrong-cell\">${m.wrong}</td><td>${m.correct}</td><td class=\"right-cell\">${esc(m.rightAnswer||'—')}</td></tr>`).join('');const modal=document.createElement('div');modal.className='wrong-review-modal';modal.innerHTML=`<div class=\"wrong-review-dialog\"><div class=\"wrong-review-head\"><div><b>${lang==='hi'?'सभी गलत प्रश्न':'All Incorrect Questions'}</b><small>${a.uniqueWrong} ${lang==='hi'?'प्रश्न':'questions'}</small></div><button onclick=\"this.closest('.wrong-review-modal').remove()\" aria-label=\"Close\">✕</button></div><div class=\"analysis-table-wrap\"><table class=\"analysis-table mistakes-table\"><thead><tr><th>${lang==='hi'?'यूनिट':'Unit'}</th><th>${lang==='hi'?'गलत प्रश्न':'Incorrect Question'}</th><th>${lang==='hi'?'गलत बार':'Wrong'}</th><th>${lang==='hi'?'सही बार':'Correct'}</th><th>${lang==='hi'?'सही उत्तर':'Correct Answer'}</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});document.body.appendChild(modal);}

function refreshAll(){if(confirm(lang==='hi'?'वर्तमान अभ्यास के उत्तर रीसेट करें? आपकी परफॉरमेंस हिस्ट्री सुरक्षित रहेगी।':'Reset answers for this practice session? Your performance history will remain saved.')){clearTimeout(autoTimer);answers={};page=0;currentIndex=0;reviewMode=false;reviewIds=[];reviewPos=0;render();window.scrollTo({top:0,behavior:'smooth'});}}
function programAnalysisHTML(){
 const en=lang==='en';
 const units=Array.from({length:10},(_,i)=>({id:i+1,count:(UNIT_DATA_MAP[i+1]||[]).length}));
 const activeUnits=units.filter(u=>u.count>0),total=units.reduce((n,u)=>n+u.count,0),avg=Math.round(total/activeUnits.length),top=activeUnits.reduce((a,b)=>a.count>b.count?a:b);
 const maxCount=Math.max(1,...units.map(u=>u.count));
 const cards=units.map(u=>`<div class="program-unit"><div class="program-bar-count">${u.count.toLocaleString('en-IN')}</div><div class="program-bar-area"><i style="height:${u.count?Math.max(5,u.count/maxCount*100):0}%"></i></div><div class="program-bar-label">UNIT ${String(u.id).padStart(2,'0')}</div><div class="program-bar-share">${u.count.toLocaleString('en-IN')}Q</div><button class="program-bar-open" onclick="setUnit(${u.id})">${en?'Open ↗':'खोलें ↗'}</button></div>`).join('');
 return `<section class="program-analysis"><div class="program-kicker">MPPSC IQ</div><h2>MPPSC PRE 2027 PROGRAM</h2><div class="program-analysis-label">PROGRAM ANALYSIS</div><p>${en?'Complete question-bank dashboard for your preparation':'आपकी तैयारी के लिए पूरा प्रश्न-बैंक डैशबोर्ड'}</p><div class="program-summary"><div><b>${total.toLocaleString('en-IN')}</b><span>${en?'TOTAL QUESTIONS':'कुल प्रश्न'}</span></div><div><b>${activeUnits.length}</b><span>${en?'ACTIVE UNITS':'सक्रिय यूनिट'}</span></div><div><b>${avg.toLocaleString('en-IN')}</b><span>${en?'AVG / UNIT':'औसत / यूनिट'}</span></div><div><b>${top.count.toLocaleString('en-IN')}</b><span>${en?'TOP UNIT':'सबसे बड़ी यूनिट'} ${String(top.id).padStart(2,'0')}</span></div></div><h3>${en?'Unit-wise Question Distribution':'यूनिट-वाइज प्रश्न वितरण'}</h3><div class="program-units">${cards}</div></section>`;
}

let analysisTab='overview';
function setAnalysisTab(tab){analysisTab=tab;document.querySelectorAll('.analysis-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));document.querySelectorAll('.analysis-pane').forEach(p=>p.classList.toggle('active',p.dataset.pane===tab));}
function downloadMistakesCSV(){const a=performanceSummary();const head=lang==='hi'?['यूनिट','प्रश्न','गलत प्रयास','सही प्रयास','सही उत्तर']:['Unit','Question','Wrong Attempts','Correct Attempts','Correct Answer'];const rows=a.allMistakes.map(m=>[m.unit,m.question,m.wrong,m.correct,m.rightAnswer]);const csv='\uFEFF'+[head,...rows].map(r=>r.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='MPPSC_IQ_Wrong_Questions.csv';document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);}
let html2canvasLoader=null;
function ensureHtml2Canvas(){
 if(window.html2canvas)return Promise.resolve(window.html2canvas);
 if(html2canvasLoader)return html2canvasLoader;
 html2canvasLoader=new Promise((resolve,reject)=>{
  const sc=document.createElement('script');
  sc.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
  sc.onload=()=>window.html2canvas?resolve(window.html2canvas):reject(new Error('PNG library unavailable'));
  sc.onerror=()=>reject(new Error('PNG library could not be loaded'));
  document.head.appendChild(sc);
 });
 return html2canvasLoader;
}
async function downloadUltraPNG(targetId,fileBase){
 const target=document.querySelector('.'+targetId);
 if(!target){alert('डाउनलोड के लिए सेक्शन नहीं मिला।');return;}
 const buttons=document.querySelectorAll('.ultra-png-btn');
 buttons.forEach(b=>{b.disabled=true;if(b.dataset.busy!=='1'){b.dataset.oldText=b.textContent;b.textContent='PNG तैयार हो रही है…';b.dataset.busy='1';}});
 try{
  const capture=await ensureHtml2Canvas();
  const canvas=await capture(target,{scale:3,useCORS:true,allowTaint:false,backgroundColor:'#0b1424',logging:false,scrollX:0,scrollY:0,windowWidth:Math.max(document.documentElement.clientWidth,target.scrollWidth),onclone:(doc)=>{const el=doc.querySelector('.'+targetId);if(el){el.style.transform='none';el.style.maxWidth=getComputedStyle(target).maxWidth;}}});
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG creation failed')),'image/png'));
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=fileBase+'_ULTRA_HD.png';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
 }catch(err){console.error(err);alert('PNG डाउनलोड नहीं हो पाया। इंटरनेट कनेक्शन जाँचकर दोबारा प्रयास करें।');}
 finally{buttons.forEach(b=>{b.disabled=false;if(b.dataset.oldText){b.textContent=b.dataset.oldText;delete b.dataset.oldText;}delete b.dataset.busy;});}
}
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
   const unitQuickCards=`<div class="unit-quick-grid">${a.stats.map(x=>{const done=x.unique,remaining=Math.max(0,x.total-done),bar=x.total?Math.min(100,done/x.total*100):0;return `<article class="unit-quick-card"><div class="unit-quick-head"><b>UNIT ${String(x.unit).padStart(2,'0')}</b><span>${pct(x.accuracy)}</span></div><div class="unit-quick-progress"><i style="width:${bar.toFixed(1)}%"></i></div><div class="unit-quick-metrics"><div><b>${done}</b><small>${lang==='hi'?'हल किए':'Solved'}</small></div><div><b>${x.correct}</b><small>${lang==='hi'?'सही':'Correct'}</small></div><div><b>${x.wrong}</b><small>${lang==='hi'?'गलत':'Wrong'}</small></div><div><b>${remaining}</b><small>${lang==='hi'?'बाकी':'Left'}</small></div></div><button onclick="setUnit(${x.unit})">${lang==='hi'?'यूनिट खोलें':'Open Unit'} ↗</button></article>`;}).join('')}</div>`;
   const overview=`<div class="analysis-pane ${analysisTab==='overview'?'active':''}" data-pane="overview"><p class="analysis-note">${lang==='hi'?'हर यूनिट के हल किए गए, सही, गलत और बाकी प्रश्न एक साथ देखें। अभ्यास शुरू करने के लिए यूनिट खोलें।':'See solved, correct, incorrect and remaining questions for each unit. Open a unit to practise.'}</p>${unitQuickCards}<div class="revision-actions report-download"><button onclick="printPerformanceReport()">${lang==='hi'?'रिपोर्ट प्रिंट / PDF':'Print / Save PDF'}</button></div></div>`;
   const wrongPane=`<div class="analysis-pane ${analysisTab==='wrong'?'active':''}" data-pane="wrong"><div class="wrong-unit-heading"><div><b>${lang==='hi'?'यूनिट-वाइज गलत प्रश्न':'Unit-wise Wrong Questions'}</b><small>${lang==='hi'?'यूनिट चुनें और प्रश्न एक-एक करके हल करें':'Choose a unit and answer its questions one by one'}</small></div></div><div class="wrong-unit-grid">${a.stats.map(x=>`<button class="wrong-unit-button" onclick="reviewWrongByUnit(${x.unit})"><b>UNIT ${String(x.unit).padStart(2,'0')}</b><strong>${Object.entries(performanceData.questions||{}).filter(([qid,r])=>Number(qid.split(':')[0])===x.unit&&(r.wrong||0)>0).length}</strong><span>${lang==='hi'?'गलत प्रश्न':'Wrong Questions'}</span></button>`).join('')}</div></div>`;
   const unitsPane=`<div class="analysis-pane ${analysisTab==='units'?'active':''}" data-pane="units"><div class="analysis-note">${lang==='hi'?'कम सटीकता वाली यूनिट पर अधिक अभ्यास करें। यूनिट खोलने के लिए अभ्यास बटन चुनें।':'Focus on units with lower accuracy. Use Practice to open a unit.'}</div>${unitTable}</div>`;
   const progressPane=`<div class="analysis-pane ${analysisTab==='progress'?'active':''}" data-pane="progress">${renderProgressPane(a)}</div>`;
   const revisionPane=`<div class="analysis-pane ${analysisTab==='revision'?'active':''}" data-pane="revision">${renderRevisionPane(a)}</div>`;
   document.getElementById('pageInfo').textContent='CANDIDATE PERFORMANCE';
   document.getElementById('score').textContent=`Attempted: ${a.attempts} · Accuracy: ${pct(a.accuracy)}`;
   document.getElementById('bottomScore').textContent=lang==='hi'?`सटीकता: ${pct(a.accuracy)}`:`Accuracy: ${pct(a.accuracy)}`;
   document.getElementById('progressFill').style.width=`${a.completion.toFixed(2)}%`;
   document.getElementById('reviewNote').textContent='';
   questionBox.innerHTML=programAnalysisHTML()+`<div class="png-export-row"><button class="ultra-png-btn" onclick="downloadUltraPNG('program-analysis','MPPSC_IQ_Program_Analysis')">⬇ Ultra HD PNG डाउनलोड</button></div><section class="analysis-panel performance-panel"><div class="analysis-kicker">MPPSC IQ<br>MPPSC PRE&nbsp;&nbsp;2027</div><h2>${lang==='hi'?'अभ्यर्थी परफॉरमेंस एनालिसिस':'CANDIDATE PERFORMANCE'}</h2><p class="analysis-sub">${lang==='hi'?'अपनी तैयारी, गलतियों और प्रगति का पूरा विश्लेषण':'A complete view of your preparation, mistakes and progress'}</p>${tabbar}${overview}${wrongPane}${unitsPane}${progressPane}${revisionPane}<p class="analysis-foot">${lang==='hi'?'नियमित अभ्यास • गलतियों का विश्लेषण • बेहतर सटीकता':'Practice regularly • Review mistakes • Improve accuracy'}</p></section><div class="png-export-row candidate-png-row"><button class="ultra-png-btn" onclick="downloadUltraPNG('performance-panel','MPPSC_IQ_Candidate_Performance')">⬇ Ultra HD PNG डाउनलोड</button></div>`;
   ['backBtn','nextBtn'].forEach(id=>{const b=document.getElementById(id);b.disabled=true;b.style.display='none'});
   const wb=document.querySelector('.bottom button[onclick="showWrong()"]');if(wb)wb.style.display='none';
   const mix=document.querySelector('.mixbar');if(mix)mix.style.display='none';
   document.querySelector('.bottom').style.display='none';
   return;
  }
  document.getElementById('pageInfo').textContent=`UNIT ${activeUnit} · प्रश्न उपलब्ध नहीं`;
  document.getElementById('score').textContent='Attempted: 0 | Correct: 0';
  document.getElementById('bottomScore').textContent=lang==='hi'?'स्कोर: 0':'Score: 0';
  document.getElementById('progressFill').style.width='0%';
  document.getElementById('reviewNote').textContent='';
  questionBox.innerHTML=activeUnit===11?`<div class="unit-empty">PYQs का सेक्शन तैयार है।<br>इसमें अभी प्रश्न जोड़े नहीं गए हैं।</div>`:`<div class="unit-empty">UNIT ${activeUnit} में अभी प्रश्न जोड़े नहीं गए हैं।<br>वर्तमान में UNIT 01, UNIT 02, UNIT 03, UNIT 05, UNIT 06 और UNIT 10 में प्रश्न उपलब्ध हैं।</div>`;
  ['backBtn','nextBtn'].forEach(id=>{const b=document.getElementById(id);b.disabled=true;b.style.display='none'});
  const wb=document.querySelector('.bottom button[onclick="showWrong()"]');if(wb)wb.style.display='none';
  return;
 }
 document.querySelector('.bottom').style.display='';
 const mixbar=document.querySelector('.mixbar');if(mixbar)mixbar.style.display='';
 const wb=document.querySelector('.bottom button[onclick="showWrong()"]');if(wb)wb.style.display='';
 const pageStart=Math.floor(currentIndex/PER)*PER,pageEnd=Math.min(pageStart+PER,available);
 const indices=reviewMode?[reviewIds[reviewPos]]:unitWrongMode?[currentIndex]:Array.from({length:pageEnd-pageStart},(_,n)=>pageStart+n);
 if(!reviewMode)currentIndex=Math.max(pageStart,Math.min(pageEnd-1,currentIndex));
 page=Math.floor(currentIndex/PER);
 document.getElementById('pageInfo').textContent=unitWrongMode?(lang==='hi'?`UNIT ${String(DATA[0]?.__unit||0).padStart(2,'0')} · गलत प्रश्न · ${currentIndex+1}/${DATA.length}`:`UNIT ${String(DATA[0]?.__unit||0).padStart(2,'0')} · WRONG QUESTIONS · ${currentIndex+1}/${DATA.length}`):isMixedMode?(lang==='hi'?`सभी यूनिट मिक्स · पेज ${page+1}/${Math.ceil(DATA.length/PER)} · प्रश्न ${pageStart+1}–${pageEnd} / ${DATA.length}`:`ALL UNITS MIXED · Page ${page+1}/${Math.ceil(DATA.length/PER)} · Questions ${pageStart+1}–${pageEnd} of ${DATA.length}`):(lang==='hi'?`यूनिट ${String(activeUnit).padStart(2,'0')} · पेज ${page+1}/${Math.ceil(DATA.length/PER)} · प्रश्न ${pageStart+1}–${pageEnd} / ${DATA.length}`:`UNIT ${String(activeUnit).padStart(2,'0')} · Page ${page+1}/${Math.ceil(DATA.length/PER)} · Questions ${pageStart+1}–${pageEnd} of ${DATA.length}`);
 document.getElementById('backBtn').disabled=!reviewMode&&currentIndex<=0;
 document.getElementById('nextBtn').disabled=!reviewMode&&currentIndex>=DATA.length-1;
 document.getElementById('backBtn').style.display=reviewMode?'none':'';
 document.getElementById('nextBtn').style.display=reviewMode?'none':'';
 let attempted=Object.keys(answers).length,correct=Object.entries(answers).filter(([i,k])=>DATA[+i].answer===k).length,wrong=attempted-correct,score=correct*3-wrong;
 document.getElementById('score').textContent=lang==='hi'?`हल ${attempted} · सही ${correct} · गलत ${wrong} · स्कोर ${score}`:`Attempted ${attempted} · Correct ${correct} · Wrong ${wrong} · Score ${score}`;
 document.getElementById('bottomScore').textContent=lang==='hi'?`स्कोर: ${score}`:`Score: ${score}`;
 document.getElementById('bottomScore').setAttribute('aria-label',`Total Score: ${score}`);
 document.getElementById('bottomScore').title=`Total Score: ${score}`;
 document.getElementById('progressFill').style.width=`${(currentIndex+1)/DATA.length*100}%`;
 document.getElementById('reviewNote').textContent=reviewMode?`Wrong Question ${reviewPos+1} / ${reviewIds.length}`:unitWrongMode?(currentIndex===DATA.length-1&&answers[currentIndex]!==undefined?(lang==='hi'?'इस यूनिट के सभी गलत प्रश्न पूरे हुए।':'All wrong questions in this unit completed.'):`${lang==='hi'?'गलत प्रश्न':'Wrong questions'} ${currentIndex+1} / ${DATA.length} · ${lang==='hi'?'उत्तर देते ही अगला प्रश्न खुलेगा':'Next question opens after answering'}`):'';
 const title=lang==='hi'?'प्रश्न':'Question';
 document.getElementById('questions').innerHTML=indices.map(idx=>{
  const q=DATA[idx],chosen=answers[idx],opts=q.options||[];
  const separateLang=(isMixedMode?q.__unit===6:activeUnit===6)||idx>=1400;
  const questionText=String(localizedQuestion(q)).replace(/^(?:प्रश्न|Question)\s*\d+\.\s*/i,'');
  const isPairQuestion=/(युग्म|सुमेलित|मिलान|match(?:ing)?|correctly matched|incorrectly matched)/i.test(questionText);
  const optionRows=opts.map((o,k)=>{const shown=localizedOption(q,o,k);let cls=chosen!==undefined&&k===q.answer?'correct':'';if(chosen===k&&k!==q.answer)cls='wrong';return {k,shown,cls};});
  const options=isPairQuestion?`<div class="match-table-wrap statement-table-wrap"><table class="match-table statement-table answer-match-table"><thead><tr><th>${lang==='hi'?'विकल्प':'Option'}</th><th>${lang==='hi'?'युग्म / मिलान':'Pair / Match'}</th></tr></thead><tbody>${optionRows.map(({k,shown,cls})=>`<tr><td><button class="option ${cls}" onclick="choose(${idx},${k})" ${chosen!==undefined||reviewMode?'disabled':''}>${'ABCD'[k]||k+1}.</button></td><td><button class="option ${cls}" onclick="choose(${idx},${k})" ${chosen!==undefined||reviewMode?'disabled':''}>${esc(shown)}</button></td></tr>`).join('')}</tbody></table></div>`:optionRows.map(({k,shown,cls})=>`<button class="option ${cls}" onclick="choose(${idx},${k})" ${chosen!==undefined||reviewMode?'disabled':''}><span class="letter">${'ABCD'[k]||k+1}.</span><span>${esc(shown)}</span></button>`).join('')+'</div>';
  const structured=structuredQuestionTable(questionText);
  const legacyMatch=structured.table?'':matchTable(questionText,idx);
  const visibleQuestion=structured.table?(structured.intro||title):questionText;
  const cardTitle=isMixedMode?`UNIT ${String(q.__unit).padStart(2,'0')} · ${title} ${idx+1}`:`${title} ${idx+1}`;
  const sourceUnit=Number(q.__unit||activeUnit||0),sourceIndex=Number(String(q.__qid||`${sourceUnit}:${idx}`).split(':').pop());
  const saved=revisionBookmarkExists(sourceUnit,sourceIndex);
  const actions=`<div class="revision-question-actions"><button type="button" class="revision-q-action ${saved?'saved':''}" onclick="toggleRevisionBookmark(${sourceUnit},${sourceIndex},this)">${saved?(lang==='hi'?'🔖✓ बुकमार्क किया':'🔖✓ Bookmarked'):(lang==='hi'?'🔖 बुकमार्क':'🔖 Bookmark')}</button><button type="button" class="revision-q-action" onclick="reportRevisionQuestion(${sourceUnit},${sourceIndex})">⚑ ${lang==='hi'?'प्रश्न रिपोर्ट करें':'Report question'}</button></div>`;
  const explanation=localizedDetail(q,'explanation'),note=localizedDetail(q,'note');const details=[explanation?'<div class="quiz-explanation"><b>'+(lang==='hi'?'व्याख्या:':'Explanation:')+'</b> '+esc(explanation)+'</div>':'',note?'<div class="quiz-note"><b>'+(lang==='hi'?'महत्वपूर्ण तथ्य:':'Important facts:')+'</b> '+esc(note)+'</div>':''].join('');return `<section class="card" id="qcard-${idx}"><div class="qtext">${cardTitle}. ${esc(visibleQuestion)}</div>${structured.table||legacyMatch}${options}${details}${actions}</section>`;
 }).join('');
 const wrongBtn=document.querySelector('.bottom button[onclick="showWrong()"]');if(wrongBtn){wrongBtn.textContent=reviewMode?(lang==='hi'?`अगला गलत ${reviewPos+1}/${reviewIds.length}`:`Next Wrong ${reviewPos+1}/${reviewIds.length}`):(lang==='hi'?`गलत (${wrong})`:`Wrong (${wrong})`);wrongBtn.style.display=unitWrongMode?'none':'';}if(unitWrongMode){['backBtn','nextBtn'].forEach(id=>{const b=document.getElementById(id);if(b)b.style.display='none';});const mb=document.querySelector('.mixbar');if(mb)mb.style.display='none';}
}

function changePage(d){clearTimeout(autoTimer);if(reviewMode){reviewPos=Math.max(0,Math.min(reviewIds.length-1,reviewPos+d));currentIndex=reviewIds[reviewPos];page=Math.floor(currentIndex/PER);render();window.scrollTo({top:0,behavior:'smooth'});return;}const totalPages=Math.ceil(DATA.length/PER);const targetPage=Math.max(0,Math.min(totalPages-1,Math.floor(currentIndex/PER)+d));currentIndex=targetPage*PER;page=targetPage;render();window.scrollTo({top:0,behavior:'smooth'});}
function applyTheme(theme){document.body.classList.toggle('dark',theme==='dark');const b=document.getElementById('themeBtn');if(b){b.textContent=theme==='dark'?'☀️ Light':'🌙 Dark';b.setAttribute('aria-pressed',theme==='dark'?'true':'false');}try{localStorage.setItem('mppscIqTheme',theme)}catch(e){}}
function toggleTheme(){applyTheme(document.body.classList.contains('dark')?'light':'dark')}
(function(){let t='light';try{t=localStorage.getItem('mppscIqTheme')||'light'}catch(e){}applyTheme(t)})();
const REVISION_BOOKMARK_KEY='mppscIqRevisionBookmarks_v1';
function revisionBookmarks(){try{const v=JSON.parse(localStorage.getItem(REVISION_BOOKMARK_KEY)||'[]');return Array.isArray(v)?v:[]}catch(e){return [];}}
function revisionBookmarkExists(unit,index){return revisionBookmarks().some(x=>Number(x.unit)===Number(unit)&&Number(x.index)===Number(index));}
function toggleRevisionBookmark(unit,index,button){const rows=revisionBookmarks(),pos=rows.findIndex(x=>Number(x.unit)===Number(unit)&&Number(x.index)===Number(index));if(pos>=0)rows.splice(pos,1);else{const q=(UNIT_DATA_MAP[unit]||[])[index];if(!q)return;rows.unshift({unit,index,question:q.q||'',english:q.question_en||q.en||'',options:q.options||[],options_en:q.options_en||[],answer:q.answer,savedAt:new Date().toISOString()});}try{localStorage.setItem(REVISION_BOOKMARK_KEY,JSON.stringify(rows));}catch(e){alert(lang==='hi'?'बुकमार्क सेव नहीं हो सका।':'Could not save bookmark.');return;}const active=pos<0;button.classList.toggle('saved',active);button.textContent=active?(lang==='hi'?'🔖✓ बुकमार्क किया':'🔖✓ Bookmarked'):(lang==='hi'?'🔖 बुकमार्क':'🔖 Bookmark');}
async function reportRevisionQuestion(unit,index){const q=(UNIT_DATA_MAP[unit]||[])[index];if(!q)return;const en=lang==='en';const reason=prompt(en?'What is wrong with this question?\\nWrong answer / Question / Options / Language':'इस प्रश्न में क्या समस्या है?\\nगलत उत्तर / प्रश्न / विकल्प / भाषा');if(!reason||!reason.trim())return;const message=`MPPSC IQ Revision Quiz · UNIT ${String(unit).padStart(2,'0')} · ${en?'Question':'प्रश्न'} ${index+1}\n${en?'Issue':'समस्या'}: ${reason.trim()}\n${en?'Question':'प्रश्न'}: ${en?localizedQuestion(q):(q.q||'')}\n${en?'Options':'विकल्प'}: ${(q.options||[]).map((o,i)=>localizedOption(q,o,i)).join(' | ')}\n${en?'Answer key':'उत्तर कुंजी'}: ${Number(q.answer)+1}`;try{const response=await fetch('/api/support',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:'Quiz Question Report',message})});const result=await response.json().catch(()=>({}));if(!response.ok)throw new Error(result.error||(en?'Report could not be sent':'रिपोर्ट भेजी नहीं जा सकी'));alert(en?'Question report submitted.':'प्रश्न रिपोर्ट भेज दी गई है।');}catch(error){alert(error.message||(en?'Could not submit report.':'रिपोर्ट भेजने में समस्या हुई।'));}}
(async function bootRevisionQuizFromJson(){
  try {
    const response = await fetch('./quiz-data/revision-units-93.json?v=1', {cache:'no-store'});
    if (!response.ok) throw new Error('Question data could not be loaded ('+response.status+')');
    const payload = await response.json();
    if (!payload || !payload.units) throw new Error('Question data format is invalid');
    Object.assign(UNIT_DATA_MAP, payload.units);
    DATA = UNIT_DATA_MAP[activeUnit] || [];
    render();
  } catch (error) {
    const host = document.getElementById('questions') || document.body;
    host.innerHTML = '<div class="unit-empty">प्रश्न डेटा लोड नहीं हो पाया। कृपया इंटरनेट कनेक्शन जाँचकर पेज दोबारा खोलें।<br><small>'+String(error.message || error)+'</small></div>';
  }
})();