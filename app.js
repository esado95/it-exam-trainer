import {topics,files,byId,juryFollowups} from './bank.js';
import {freshState,blankDraft,currentQuestion,currentRecord,submitAttempt,nextQuestion,startSeries,stats,topicProfile,confidenceNote,validateSnapshot,applyReview,reviewPrompt,validateAnswer} from './engine.js';

const $=id=>document.getElementById(id),KEY='it-atelier-progress-v1';
const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
const addText=(parent,tag,text,cls)=>parent.appendChild(node(tag,text,cls));
const names={diagnostic:'Диагностика',quiz:'Квиз',practice:'Практика',jury:'Устное жюри'};
let state=freshState(),storageWarning=false;
function notice(message){$('notice').textContent=message;$('notice').hidden=!message;}
try{const stored=localStorage.getItem(KEY);if(stored)state=validateSnapshot(JSON.parse(stored));}catch(e){notice('Сохранённый прогресс не удалось прочитать. Он не удалён. Можно загрузить резервный снимок или начать новую тренировку.');}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){if(!storageWarning){storageWarning=true;notice('Браузер не разрешает сохранить прогресс. Используйте «Сохранить», прежде чем закрывать страницу.');}}}
function safe(action){try{action();$('validation').hidden=true;}catch(e){$('validation').textContent=e.message;$('validation').hidden=false;}}
function commit(newState){state=newState;save();render();}
for(const t of topics){const o=node('option',t.id+' · '+t.name);o.value=t.id;$('topic').appendChild(o);}
function configureSelectors(){const diagnostic=$('mode').value==='diagnostic';$('topic').disabled=diagnostic;$('count').disabled=diagnostic;if(diagnostic){$('topic').value='all';$('count').value='12';}}
$('mode').value=state.series.mode;$('topic').value=state.series.topic;$('count').value=String(state.series.ids.length);configureSelectors();
$('mode').addEventListener('change',()=>{$('count').value=$('mode').value==='jury'?'5':$('mode').value==='practice'?'1':'10';configureSelectors();});
$('start').addEventListener('click',()=>safe(()=>{const mode=$('mode').value,count=Number($('count').value),topic=$('topic').value;const next=startSeries(state,mode,topic,count);commit(next);$('summary').hidden=true;notice(mode==='diagnostic'?'Начата диагностика: 12 вопросов, по 4 на каждое направление.':next.series.ids.length<count?'В выбранной теме доступно '+next.series.ids.length+' заданий; серия содержит их без дублирования.':'Серия начата.');}));
function syncDraft(){state={...state,draft:{...state.draft,answer:$('answer').value}};save();}
$('answer').addEventListener('input',syncDraft);
$('confidence').addEventListener('input',()=>{state.draft.confidence=Number($('confidence').value);save();renderConfidence();});
$('skip-confidence').addEventListener('change',()=>{state.draft.skipConfidence=$('skip-confidence').checked;save();renderConfidence();});
function renderConfidence(){const r=currentRecord(state),d=r?{confidence:r.confidence,skipConfidence:r.confidence===null}:state.draft;$('confidence-value').textContent=d.skipConfidence||d.confidence===null?'Не указана':d.confidence+'%';$('confidence').value=String(d.confidence??50);$('confidence').disabled=!!r||d.skipConfidence;$('skip-confidence').checked=d.skipConfidence;$('skip-confidence').disabled=!!r;}
$('hint').addEventListener('click',()=>{if(currentRecord(state))return;state.draft.hints=Math.min(2,state.draft.hints+1);save();renderHint();});
function renderHint(){const q=currentQuestion(state),r=currentRecord(state),hints=r?.hints??state.draft.hints;$('hint-text').hidden=!q||hints===0;$('hint-text').textContent=hints&&q?'Подсказка '+hints+': '+q.hints[Math.min(hints-1,q.hints.length-1)]:'';$('hint').disabled=!!r||hints>=2;}
$('answer-form').addEventListener('submit',e=>{e.preventDefault();safe(()=>{
 const q=currentQuestion(state);syncDraft();
 if(q.type==='jury'&&state.draft.parts.length<juryFollowups.length){validateAnswer(q,state.draft);state.draft.parts.push((state.draft.parts.length===0?'Основной ответ':'Уточнение '+state.draft.parts.length)+': '+state.draft.answer.trim());state.draft.answer='';save();render();return;}
 commit(submitAttempt(state));
});});
$('reveal').addEventListener('click',()=>safe(()=>{syncDraft();commit(submitAttempt(state,{reveal:true}));}));
$('next').addEventListener('click',()=>safe(()=>{commit(nextQuestion(state));$('question').scrollIntoView({block:'start',behavior:'auto'});}));
$('apply-review').addEventListener('click',()=>safe(()=>{let raw=$('review-json').value.trim();if(raw.startsWith('```'))raw=raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'');const result=JSON.parse(raw),r=currentRecord(state);if(!r||result.attemptId!==r.id)throw Error('Оценка должна относиться к текущей сохранённой попытке.');commit(applyReview(state,result));notice('Разбор сохранён. Исходный ответ и уверенность остались в журнале.');}));
$('copy-prompt').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('review-prompt').value);notice('Запрос скопирован. Вставьте его в этот чат для содержательной оценки.');}catch(e){$('review-prompt').focus();$('review-prompt').select();notice('Копирование недоступно. Текст выделен — скопируйте его вручную.');}});
function render(){
 const q=currentQuestion(state),r=currentRecord(state),s=stats(state);$('series-title').textContent=names[state.series.mode];$('series-count').textContent=(q?state.series.cursor+1:state.series.ids.length)+' / '+state.series.ids.length;
 $('progress-track').setAttribute('aria-valuemax',String(state.series.ids.length));$('progress-track').setAttribute('aria-valuenow',String(s.completed));$('progress-fill').style.width=(100*s.completed/state.series.ids.length)+'%';
 $('coverage-row').replaceChildren(...['SYS','NET','SEC'].map(d=>node('span',d+' · завершено '+s.coverage[d])));
 $('question').hidden=!q;$('summary').hidden=!!q;
 if(!q){renderSummary();renderPanels();return;}
 $('question-topic').textContent=q.topic;$('question-kind').textContent=q.type==='qcm'?'QCM · без обоснования':q.type==='jury'?'Учебная симуляция жюри':q.type==='practice'?'Практическая ситуация':'Открытый вопрос';
 $('attempt-label').textContent=r?'Попытка №'+r.attemptNumber:(state.history.filter(a=>a.qid===q.id).length?'Повторная попытка':'Первая попытка');
 const stage=q.type==='jury'?state.draft.parts.length:0;
 $('question-title').textContent=stage&&!r?'Уточнение '+stage+'/2: '+juryFollowups[stage-1]:q.prompt;
 $('scenario').hidden=!q.scenario;$('scenario').textContent=q.scenario??'';
 $('question-source').textContent=q.source.file+' → '+q.source.section+' · '+q.source.locator;
 $('rubric').textContent='Критерии /20: '+q.rubric.map(([name,max])=>name+' — '+max).join('; ')+'. '+(q.type==='qcm'?'Обоснование здесь не оценивается.':'Частичные баллы возможны в каждом критерии. Французский оценивается отдельно.');
 $('choices').hidden=q.type!=='qcm';$('open-answer').hidden=q.type==='qcm';
 $('choice-list').replaceChildren();
 if(q.type==='qcm'){
   $('choice-instructions').textContent='Выберите '+q.choose+' вариант'+(q.choose===1?'':'а')+'.';
   q.options.forEach((option,i)=>{const label=node('label',undefined,'choice'),input=document.createElement('input');input.type=q.choose===1?'radio':'checkbox';input.name='choice';input.value=String(i);input.checked=(r?.selected??state.draft.selected).includes(i);input.disabled=!!r;label.append(input,node('span',option));$('choice-list').append(label);input.addEventListener('change',()=>{state.draft.selected=[...$('choice-list').querySelectorAll('input:checked')].map(x=>Number(x.value));save();});});
 }
 $('answer').value=r?.answer??state.draft.answer;$('answer').disabled=!!r;
 $('open-guide').textContent=q.type==='practice'?'Назовите гипотезу, проверки, решение и способ подтверждения результата.':q.type==='jury'?'Один основной вопрос и два уточнения. Разбор — после всех ответов.':'Достаточно 2–4 предложений. Оценка по содержанию — в чате.';
 $('submit').disabled=!!r;$('submit').textContent=q.type==='qcm'?'Ответить':q.type==='jury'&&stage<2?'Сохранить ответ и уточнить':'Сохранить и передать в чат';$('reveal').disabled=!!r;
 renderConfidence();renderHint();
 $('handoff').hidden=!(r&&r.status==='pending');if(r?.status==='pending'){$('review-prompt').value=reviewPrompt(r);$('review-json').value='';}
 $('feedback').hidden=!r||r.status==='pending';if(r&&r.status!=='pending')renderFeedback(q,r);
 $('next').disabled=!r||r.status==='pending';$('next').textContent=state.series.cursor===state.series.ids.length-1?'Завершить серию':'Следующий вопрос';$('next-note').textContent=r?.status==='pending'?'Ожидается содержательная оценка из чата':r?'Попытка сохранена':'После завершения попытки';
 renderPanels();
}
function renderFeedback(q,r){
 const el=$('feedback');el.replaceChildren();el.className='feedback '+(r.score===20?'good':r.score!==null&&r.score<12?'bad':'');
 addText(el,'h3',r.revealed?'Разобрано · без самостоятельной оценки':(r.score===20?'Верно':r.score<12?'Есть существенная ошибка':'Ответ оценён')+' · '+r.score.toFixed(1)+' /20');
 if(r.hints&&!r.revealed)addText(el,'p','С помощью · '+r.hints+' подсказки. Результат учитывается отдельно от самостоятельного.','small');
 if(q.type==='qcm'){
   if(!r.revealed)addText(el,'p',r.score===20?'Что понято верно: вы выбрали подходящее понятие или решение.':'Ошибка: выбранный вариант не соответствует проверяемому понятию или условиям.');
   addText(el,'p',q.explanation);q.reasons.forEach((reason,i)=>addText(el,'p',String.fromCharCode(65+i)+'. '+q.options[i]+' — '+reason,'small'));
   const fr=node('p',q.fr,'fr-answer');fr.lang='fr';el.append(fr);addText(el,'p','Содержание документа: '+q.source.file+' → '+q.source.section+' · '+q.source.locator,'source-line');
   if(q.clarification){const p=node('p',q.clarification.text+' ','small'),a=node('a',q.clarification.title);a.href=q.clarification.url;a.target='_blank';a.rel='noopener noreferrer';p.append(a);el.append(p);}
   addText(el,'p','Надёжность разбора: '+q.reliability,'small');
 }else{
   const v=r.review;for(const [label,key] of [['Что понято верно','correct'],['Ошибка или недостающий элемент','missing'],['Объяснение','explanation']])addText(el,'p',label+': '+v[key]);const fr=node('p',v.fr,'fr-answer');fr.lang='fr';el.append(fr);addText(el,'p','Французский отдельно: '+v.french,'small');addText(el,'p','Источник: '+v.source,'source-line');addText(el,'p','Надёжность разбора: '+v.reliability,'small');addText(el,'p','Критерии: '+q.rubric.map(([name,max],i)=>name+' '+v.criteria[i]+'/'+max).join('; '),'small');
 }
 addText(el,'p','Ваша уверенность: '+(r.confidence===null?'не указана':r.confidence+'%')+'. '+confidenceNote(r),'small');
}
const avgText=x=>x.average===null?'Нет оценённых попыток':x.sum.toFixed(1)+' / '+x.count+' = '+x.average.toFixed(1)+' /20';
function renderSummary(){const s=stats(state),el=$('summary-content');el.replaceChildren();const grid=node('div',undefined,'score-grid');for(const [label,x] of [['Самостоятельно',s.independent],['С помощью',s.assisted]]){const item=node('div');addText(item,'div',label,'muted');addText(item,'div',x.average===null?'— /20':x.average.toFixed(1)+' /20','score-value');addText(item,'p',avgText(x),'small');grid.append(item);}el.append(grid);addText(el,'p','Охват завершённых заданий: SYS '+s.coverage.SYS+' · NET '+s.coverage.NET+' · SEC '+s.coverage.SEC+'. Разобрано без самостоятельной попытки: '+s.revealed+'.');
 const weak=[...new Set(s.weak.map(a=>byId[a.qid].topic))].slice(0,3);addText(el,'p',weak.length?'Главные темы для закрепления: '+weak.join(', ')+'.':'В этой серии существенные ошибки не зафиксированы. Это не означает освоение непроверенных тем.');addText(el,'p','Ошибки при высокой уверенности: '+s.overconfident.length+'. Правильные ответы при низкой уверенности: '+s.underconfident.length+'.');addText(el,'p','Следующий шаг: небольшая серия по слабым темам, затем повторение и ещё не проверенный материал.','small');$('repeat-errors').disabled=!weak.length;
}
$('repeat-errors').addEventListener('click',()=>safe(()=>{const weak=stats(state).weak.map(a=>byId[a.qid].topic);commit(startSeries(state,'quiz',weak[0]??'all',3));notice('Начата серия для закрепления слабой темы. Первые оценки сохраняются отдельно.');}));
function renderPanels(){
 const progress=$('progress-content');progress.replaceChildren();for(const t of topics){const p=topicProfile(state.history,t.id),row=node('div',undefined,'topic-row');addText(row,'strong',t.id+' · '+t.name+' — '+p.status);addText(row,'small','Проверенные навыки: '+(p.skills.join(', ')||'пока нет')+'. Попыток: '+p.attempts+'.');progress.append(row);}
 const errors=$('errors-content');errors.replaceChildren();const rows=state.history.filter(a=>a.score!==null&&a.score<16||a.revealed||a.status==='pending');if(!rows.length)addText(errors,'p','Завершённых ошибочных попыток пока нет.');for(const a of rows.slice().reverse()){const q=byId[a.qid],row=node('div',undefined,'error-row');addText(row,'strong',q.id+' · '+q.topic+' · попытка №'+a.attemptNumber+' · '+(a.status==='pending'?'ожидает разбора':a.revealed?'разобрано':a.score.toFixed(1)+'/20'));addText(row,'p','Ответ: '+(a.answer||'разбор без попытки'),'small');addText(row,'p','Уверенность: '+(a.confidence===null?'не указана':a.confidence+'%')+' · подсказки: '+a.hints,'small');addText(row,'p',a.review?.missing??(a.status==='pending'?'Нужна оценка из чата.':q.explanation),'small');
   if(a.status==='pending'){
     const details=document.createElement('details');details.append(node('summary','Запрос и оценка этой попытки'));
     const prompt=node('textarea');prompt.readOnly=true;prompt.rows=5;prompt.value=reviewPrompt(a);prompt.setAttribute('aria-label','Запрос разбора '+a.qid);details.append(prompt);
     const input=node('textarea');input.rows=3;input.placeholder='Вставьте JSON оценки из чата';input.setAttribute('aria-label','Оценка попытки '+a.id);details.append(input);
     const apply=node('button','Сохранить оценку этой попытки');details.append(apply);apply.addEventListener('click',()=>safe(()=>{const raw=JSON.parse(input.value.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));if(raw.attemptId!==a.id)throw Error('Оценка относится к другой попытке.');commit(applyReview(state,raw));notice('Оценка сохранена для исходной попытки '+a.qid+'.');}));row.append(details);
   }
   errors.append(row);}
}
for(const b of document.querySelectorAll('[data-panel]'))b.addEventListener('click',()=>{const panel=$(b.dataset.panel);panel.hidden=!panel.hidden;if(!panel.hidden)panel.scrollIntoView({block:'start',behavior:'auto'});});
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>{$(b.dataset.close).hidden=true;});
for(const [d,file] of Object.entries(files)){addText($('sources-content'),'h3',d+' · '+file);addText($('sources-content'),'p',d==='SYS'?'Инфраструктура, AD, DevOps, VMware и порты. Две таблицы; рисунок active/passive FTP.':d==='NET'?'OSI, Ethernet, VLAN, DHCP/DNS, резервирование, маршрутизация, среды и QoS. Пять таблиц; рисунок четырёх топологий.':'ACL/NAT, защитные службы, управление безопасностью, криптография, VPN, атаки и EBIOS RM. Рисунки SOC/CERT/CSIRT и RSA.');}
addText($('sources-content'),'p','Границы: Kubernetes лишь упомянут; подробного синтаксиса Cisco IOS нет. Transfer FSMO не раскрыт. Спорные уточнения в журнале отмечены «требует проверки» и проверяются до оцениваемого задания.','small');
function portableText(){const s=stats(state),q=currentQuestion(state);return 'Снимок IT Atelier. Вопросы по-французски, разбор по-русски, таймер выключен, оценка /20. Режим: '+names[state.series.mode]+'. Самостоятельно: '+avgText(s.independent)+'. С помощью: '+avgText(s.assisted)+'. Незавершённое задание: '+(q?q.id+' '+q.prompt:'нет')+'. Следующий шаг: '+(currentRecord(state)?.status==='pending'?'содержательный разбор текущего ответа':'продолжить серию')+'. Для продолжения в другом чате понадобятся этот снимок и три исходных файла SYS/NET/SEC.';}
$('export').addEventListener('click',()=>{const data={kind:'it-snapshot',version:1,exportedAt:new Date().toISOString(),portableText:portableText(),state};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='it-atelier-progress-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Снимок сохранён. Для продолжения в другом чате нужны он и три исходных fiche.');});
$('import-button').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async()=>{const file=$('import-file').files[0];if(!file)return;try{if(file.size>2*1024*1024)throw Error('Снимок слишком большой. Допустимо до 2 МБ.');const raw=JSON.parse(await file.text());if(raw.kind!=='it-snapshot')throw Error('Выберите снимок прогресса IT Atelier.');const next=validateSnapshot(raw.state);commit(next);$('mode').value=state.series.mode;$('topic').value=state.series.topic;$('count').value=String(state.series.ids.length);configureSelectors();notice('Прогресс восстановлен из снимка.');}catch(e){notice('Импорт отклонён: '+e.message);}finally{$('import-file').value='';}});
render();
