import {byId,quiz,openQuestions,diagnosticIds,topics} from './bank.js';
export const VERSION=1;
export const modes=['diagnostic','quiz','practice','jury'];
export const blankDraft=()=>({answer:'',selected:[],confidence:null,skipConfidence:false,hints:0,parts:[]});
const uid=()=>globalThis.crypto?.randomUUID?.()??'id-'+Date.now()+'-'+Math.random().toString(36).slice(2);
export function freshState(){return {version:VERSION,series:{id:uid(),mode:'diagnostic',topic:'all',ids:[...diagnosticIds],cursor:0},history:[],draft:blankDraft()};}
export const currentQuestion=s=>byId[s.series.ids[s.series.cursor]]??null;
export const currentRecord=s=>s.history.find(a=>a.seriesId===s.series.id&&a.position===s.series.cursor)??null;
export function choiceScore(q,selected){if(q.type!=='qcm'||selected.length!==q.choose||new Set(selected).size!==selected.length||selected.some(i=>!Number.isInteger(i)||i<0||i>=q.options.length))throw Error('Выберите указанное количество вариантов.');return 20*selected.filter(i=>q.correct.includes(i)).length/q.correct.length;}
export function validateAnswer(q,draft){if(draft.confidence===null&&!draft.skipConfidence)throw Error('Укажите уверенность или выберите «Не указываю уверенность».');if(q.type==='qcm'){choiceScore(q,draft.selected);}else if(!draft.answer.trim())throw Error('Введите ответ или «не знаю».');}
export function submitAttempt(state,{reveal=false}={}){
 const q=currentQuestion(state);if(!q||currentRecord(state))throw Error('Эта попытка уже сохранена.');
 if(!reveal)validateAnswer(q,state.draft);
 const d=state.draft;
 const answer=q.type==='qcm'?d.selected.map(i=>q.options[i]).join('; '):[...d.parts,d.answer.trim()].filter(Boolean).join('\n\n');
 const r={id:uid(),seriesId:state.series.id,position:state.series.cursor,qid:q.id,mode:state.series.mode,answer,selected:[...d.selected],confidence:d.skipConfidence?null:d.confidence,hints:d.hints,revealed:reveal,status:q.type==='qcm'?(reveal?'reviewed':'graded'):'pending',score:q.type==='qcm'&&!reveal?choiceScore(q,d.selected):null,review:null,date:new Date().toISOString(),attemptNumber:state.history.filter(a=>a.qid===q.id).length+1};
 return {...state,history:[...state.history,r]};
}
export function nextQuestion(state){const r=currentRecord(state);if(!r||r.status==='pending')throw Error('Сначала завершите разбор текущего ответа.');if(state.series.cursor>=state.series.ids.length)throw Error('Серия завершена.');return {...state,series:{...state.series,cursor:state.series.cursor+1},draft:blankDraft()};}
export function confidenceNote(a){if(a.confidence===null)return 'Уверенность не указана.';if(a.score!==null&&a.score<12&&a.confidence>=80)return 'Ошибка при высокой уверенности — приоритет для разбора.';if(a.score===20&&a.confidence<=40)return 'Правильный ответ при низкой уверенности — укрепляем уверенность.';return 'Обычное закрепление; уверенность не влияет на балл.';}
export function topicProfile(history,id){
 const attempts=history.filter(a=>byId[a.qid]?.topic===id&&a.status!=='pending');
 const independent=attempts.filter(a=>a.score!==null&&!a.hints&&!a.revealed);
 const last=independent.slice(-3);
 const skills=[...new Set(attempts.filter(a=>a.score!==null).map(a=>byId[a.qid].skill))];
 let status='не проверено';
 if(attempts.length)status=independent.length?'нужна практика':'изучаем';
 if(last.length>=3&&last.every(a=>a.score>=16)&&skills.length>=2&&new Set(last.map(a=>a.qid)).size>=2)status='устойчиво отвечаю';
 return {status,skills,attempts:attempts.length,independent:independent.length};
}
export function stats(state){const rows=state.history.filter(a=>a.seriesId===state.series.id);const independent=rows.filter(a=>a.status==='graded'&&a.score!==null&&!a.hints&&!a.revealed);const assisted=rows.filter(a=>a.status==='graded'&&a.score!==null&&a.hints&&!a.revealed);const group=arr=>({count:arr.length,sum:arr.reduce((s,a)=>s+a.score,0),average:arr.length?arr.reduce((s,a)=>s+a.score,0)/arr.length:null});return {independent:group(independent),assisted:group(assisted),completed:rows.filter(a=>a.status!=='pending').length,pending:rows.filter(a=>a.status==='pending').length,revealed:rows.filter(a=>a.revealed).length,coverage:Object.fromEntries(['SYS','NET','SEC'].map(d=>[d,rows.filter(a=>a.status!=='pending'&&byId[a.qid].topic.startsWith(d)).length])),weak:rows.filter(a=>a.score!==null&&a.score<12),overconfident:rows.filter(a=>a.score!==null&&a.score<12&&a.confidence>=80),underconfident:rows.filter(a=>a.score===20&&a.confidence!==null&&a.confidence<=40)};}
export function pickQuestions(mode,topic,count,history,random=Math.random){
 if(!modes.includes(mode))throw Error('Неизвестный режим.');if(!Number.isInteger(count)||count<1||count>50)throw Error('Количество должно быть целым числом от 1 до 50.');
 if(mode==='diagnostic')return [...diagnosticIds];
 const pool=(mode==='quiz'?quiz:openQuestions.filter(q=>q.type===mode)).filter(q=>topic==='all'||q.topic===topic||q.topic.startsWith(topic));
 if(!pool.length)throw Error('Для этой темы в выбранном режиме пока нет задания. Выберите направление или другую тему.');
 const shuffled=arr=>arr.map(x=>({x,r:random()})).sort((a,b)=>a.r-b.r).map(v=>v.x);
 if(mode!=='quiz')return shuffled(pool).slice(0,count).map(q=>q.id);
 const profiles=Object.fromEntries(topics.map(t=>[t.id,topicProfile(history,t.id)]));
 const weak=shuffled(pool.filter(q=>profiles[q.topic].status==='нужна практика'||history.some(a=>byId[a.qid]?.topic===q.topic&&a.score!==null&&a.score<12)));
 const repeat=shuffled(pool.filter(q=>profiles[q.topic].status==='изучаем'||profiles[q.topic].status==='устойчиво отвечаю'));
 const unseen=shuffled(pool.filter(q=>profiles[q.topic].status==='не проверено'));
 const n=Math.min(count,pool.length);let chosen=[];
 const add=(arr,quota)=>{for(const q of arr){if(chosen.length>=n||quota<=0)break;if(!chosen.includes(q)){chosen.push(q);quota--;}}};
 add(weak,Math.round(n*.5));add(repeat,Math.round(n*.3));add(unseen,Math.max(1,Math.round(n*.2)));add(shuffled(pool),n);
 if(topic==='all'&&n>=3){for(const domain of ['SYS','NET','SEC']){if(!chosen.some(q=>q.topic.startsWith(domain))){const replacement=pool.find(q=>q.topic.startsWith(domain));let idx=chosen.findLastIndex(q=>chosen.filter(v=>v.topic.startsWith(q.topic.slice(0,3))).length>1);if(replacement&&idx>=0)chosen[idx]=replacement;}}}
 return chosen.map(q=>q.id);
}
export function startSeries(state,mode,topic,count){if(!['all','SYS','NET','SEC',...topics.map(t=>t.id)].includes(topic))throw Error('Неизвестная тема.');return {...state,series:{id:uid(),mode,topic:mode==='diagnostic'?'all':topic,ids:pickQuestions(mode,topic,count,state.history),cursor:0},draft:blankDraft()};}
const fail=()=>{throw Error('Снимок несовместим или содержит некорректные данные. Текущий прогресс сохранён.');};
const string=(s,max=50000)=>typeof s==='string'&&s.length<=max;
const number=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
export function validateSnapshot(raw){
 if(!raw||raw.version!==VERSION||!raw.series||!Array.isArray(raw.history)||raw.history.length>5000||!raw.draft)fail();const s=raw.series;
 if(!string(s.id,100)||!modes.includes(s.mode)||!['all','SYS','NET','SEC',...topics.map(t=>t.id)].includes(s.topic)||!Array.isArray(s.ids)||s.ids.length<1||s.ids.length>50||new Set(s.ids).size!==s.ids.length||s.ids.some(id=>!byId[id])||!Number.isInteger(s.cursor)||!number(s.cursor,0,s.ids.length))fail();
 if(s.mode==='diagnostic'&&JSON.stringify(s.ids)!==JSON.stringify(diagnosticIds))fail();
 if(s.mode!=='diagnostic'&&s.ids.some(id=>byId[id].type!==(s.mode==='quiz'?'qcm':s.mode)))fail();
 const ids=new Set(),positions=new Set();
 const history=raw.history.map(a=>{
   const q=byId[a.qid];if(!q||!string(a.id,100)||ids.has(a.id)||!string(a.seriesId,100)||!Number.isInteger(a.position)||a.position<0||!modes.includes(a.mode)||!string(a.answer)||!Array.isArray(a.selected)||new Set(a.selected).size!==a.selected.length||a.selected.some(i=>!Number.isInteger(i)||i<0||i>=(q.options?.length??0))||!(a.confidence===null||number(a.confidence,0,100))||!Number.isInteger(a.hints)||!number(a.hints,0,2)||typeof a.revealed!=='boolean'||!['pending','graded','reviewed'].includes(a.status)||!(a.score===null||number(a.score,0,20))||!Number.isInteger(a.attemptNumber)||a.attemptNumber<1||!string(a.date,100))fail();
   if(a.status==='graded'&&(a.score===null||a.revealed)||a.status==='reviewed'&&(!a.revealed||a.score!==null)||a.status==='pending'&&a.score!==null)fail();
   if(q.type==='qcm'&&a.status==='pending'||q.type==='qcm'&&!a.revealed&&(a.selected.length!==q.choose||a.score!==choiceScore(q,a.selected)))fail();
   if(q.type!=='qcm'&&a.status!=='pending'&&!a.review)fail();
   let review=null;
   if(a.review){review=validateReview(a.review,a);if(review.score!==a.score)fail();}
   const key=a.seriesId+':'+a.position;if(positions.has(key))fail();positions.add(key);ids.add(a.id);
   if(a.seriesId===s.id&&(a.position>=s.ids.length||s.ids[a.position]!==a.qid||a.mode!==s.mode))fail();
   return {id:a.id,seriesId:a.seriesId,position:a.position,qid:a.qid,mode:a.mode,answer:a.answer,selected:[...a.selected],confidence:a.confidence,hints:a.hints,revealed:a.revealed,status:a.status,score:a.score,review,date:a.date,attemptNumber:a.attemptNumber};
 });
 for(let i=0;i<s.cursor;i++){if(!history.some(a=>a.seriesId===s.id&&a.position===i&&a.status!=='pending'))fail();}
 const d=raw.draft,q=byId[s.ids[s.cursor]];if(!string(d.answer)||!Array.isArray(d.selected)||new Set(d.selected).size!==d.selected.length||d.selected.some(i=>!q||!Number.isInteger(i)||i<0||i>=(q.options?.length??0))||!(d.confidence===null||number(d.confidence,0,100))||typeof d.skipConfidence!=='boolean'||!Number.isInteger(d.hints)||!number(d.hints,0,2)||!Array.isArray(d.parts)||d.parts.length>2||d.parts.some(p=>!string(p)))fail();
 return {version:VERSION,series:{id:s.id,mode:s.mode,topic:s.topic,ids:[...s.ids],cursor:s.cursor},history,draft:{answer:d.answer,selected:[...d.selected],confidence:d.confidence,skipConfidence:d.skipConfidence,hints:d.hints,parts:[...d.parts]}};
}
export function validateReview(review,record){
 const q=byId[record.qid];if(!review||review.kind!=='it-review'||review.attemptId!==record.id||review.qid!==record.qid||q.type==='qcm')throw Error('Разбор должен относиться к сохранённой свободной попытке.');
 if(!Array.isArray(review.criteria)||review.criteria.length!==q.rubric.length||review.criteria.some((p,i)=>!number(p,0,q.rubric[i][1])))throw Error('Баллы критериев не соответствуют объявленной шкале.');
 if(record.revealed){if(review.score!==null)throw Error('Разобранный без попытки вопрос не оценивается.');}else if(!number(review.score,0,20)||Math.abs(review.criteria.reduce((a,b)=>a+b,0)-review.score)>.001)throw Error('Сумма критериев должна совпадать с оценкой /20.');
 for(const k of ['correct','missing','explanation','fr','source','french','reliability'])if(!string(review[k],10000))throw Error('В разборе отсутствует поле '+k+'.');
 if(!['высокая','средняя','ограниченная'].some(v=>review.reliability.startsWith(v)))throw Error('Укажите надёжность разбора и причину.');
 return {kind:'it-review',attemptId:record.id,qid:record.qid,score:review.score,criteria:[...review.criteria],...Object.fromEntries(['correct','missing','explanation','fr','source','french','reliability'].map(k=>[k,review[k]]))};
}
export function applyReview(state,raw){const record=state.history.find(a=>a.id===raw.attemptId);if(!record||record.status!=='pending')throw Error('Для этой попытки разбор уже сохранён или попытка не найдена.');const review=validateReview(raw,record);return {...state,history:state.history.map(a=>a.id===record.id?{...a,status:a.revealed?'reviewed':'graded',score:review.score,review}:a)};}
export function reviewPrompt(record){const q=byId[record.qid];const schema={kind:'it-review',attemptId:record.id,qid:record.qid,score:record.revealed?null:'балл 0–20',criteria:q.rubric.map(([name,max])=>name+': 0–'+max),correct:'что понято верно',missing:'ошибка или недостающий элемент',explanation:'объяснение по-русски',fr:'короткий корректный ответ по-французски',source:q.source.file+' → '+q.source.section+'; '+q.source.locator,french:'отдельная языковая оценка: терминология, понятность, грамматика, естественность',reliability:'высокая/средняя/ограниченная — причина'};
 return 'Продолжи мой персональный IT-тренажёр. Для оценки нужны исходные три fiches; если их нет в этом чате, попроси загрузить их. Не оценивай по ключевым словам. Принимай эквивалентные формулировки и правильные альтернативы.\n\nЗадание '+q.id+' ('+q.topic+'): '+q.prompt+'\nИсточник: '+q.source.file+' → '+q.source.section+'; '+q.source.locator+'\nУсловия: '+(q.scenario??'тренировочный вопрос по материалам')+'\nОтвет:\n'+record.answer+'\nУверенность: '+(record.confidence===null?'не указана; я отказываюсь её указывать':record.confidence+'%')+'\nПодсказки: '+record.hints+'; попытка №'+record.attemptNumber+'\nКритерии: '+q.rubric.map(([name,max])=>name+' — '+max).join('; ')+'.\n'+(record.revealed?'Я добровольно запросил разбор без самостоятельной попытки. Покажи объяснение, технический балл null, criteria заполни нулями.':'Оцени содержательно /20. Французский оцени отдельно. Первую оценку не изменяй задним числом.')+'\nДай понятный разбор по-русски, французский ответ, точный источник, уточнение при ошибке fiche, надёжность разбора с причиной, соотношение уверенности и результата. Затем верни отдельный JSON без Markdown внутри JSON, по схеме ниже. criteria — массив чисел в указанном порядке; score равен их сумме (или null для добровольного разбора).\n'+JSON.stringify(schema,null,2);
}
