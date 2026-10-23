'use strict';
// Wave 37A: authenticated tasks, search/filter, CSV/JSON export, domain AI.
// Operational summaries only - not a diagnosis or clinical recommendation.
const express = require('express');
const DISCLAIMER = 'Operational summary only - not a diagnosis or clinical recommendation.';
function ownerOf(req){ const o = (req.auth && (req.auth.userId||req.auth.profileId)) || (req.user && (req.user.id||req.user.userId||req.user.sub)) || req.userId; return o==null?null:String(o); }
function csvCell(v){ if(v===null||v===undefined) return ''; const s = typeof v==='boolean' ? String(v) : typeof v==='number' ? String(v) : String(v); return /[",\n]/.test(s) ? '"'+s.replace(/"/g,'""')+'"' : s; }
function toCsv(rows){ const cols=['id','title','notes','status','priority','category','estimateHours','doneFlag']; return [cols.join(','), ...rows.map(r=>cols.map(c=>csvCell(r[c])).join(','))].join('\n')+'\n'; }
const DOMAIN = {"schedule-risk": "Summarize renovation schedule risk from open tasks.", "budget-signal": "Summarize budget-related task signals.", "punchlist-focus": "Summarize punchlist focus."};
function summarize(tasks){
  const total=tasks.length;
  const open=tasks.filter(t=>t.status!=='done');
  const done=tasks.filter(t=>t.status==='done');
  const high=open.filter(t=>t.priority==='high');
  const hours=open.reduce((a,t)=>a+(Number(t.estimateHours)||0),0);
  return {total, openCount:open.length, doneCount:done.length, highPriorityOpen:high.length, openEstimateHours:hours,
    nextHighPriorityTitle: high.length?high[0].title:'', anyDone: done.length>0, zeroEstimateOpen: open.filter(t=>!(Number(t.estimateHours)>0)).length};
}
function buildSections(featureId, tasks){
  const s=summarize(tasks);
  const builders={
'schedule-risk':(s)=>[{label:'Total renovation tasks',value:s.total},{label:'Open tasks',value:s.openCount},{label:'High-priority open',value:s.highPriorityOpen},{label:'Next high-priority task',value:s.nextHighPriorityTitle},{label:'Any completed',value:s.anyDone}],
    'budget-signal':(s)=>[{label:'Open estimate (hours)',value:s.openEstimateHours},{label:'Open with zero estimate',value:s.zeroEstimateOpen},{label:'Completed tasks',value:s.doneCount}],
    'punchlist-focus':(s,t)=>[{label:'Categories present',value:[...new Set(t.map(x=>x.category).filter(Boolean))].join(', ')},{label:'Open tasks',value:s.openCount},{label:'High-priority open',value:s.highPriorityOpen}]
  };
  return builders[featureId](s,tasks);
}
function createWave37Router({env=process.env, fetchImpl=(...a)=>fetch(...a)}={}){
  const router=express.Router();
  const store=new Map(); let seq=0;
  router.use((req,res,next)=>{ const o=ownerOf(req); if(!o) return res.status(401).json({error:'unauthorized'}); req.waveOwner=o; next(); });
  const mine=(req)=>{ if(!store.has(req.waveOwner)) store.set(req.waveOwner,new Map()); return store.get(req.waveOwner); };
  const list=(req)=>[...mine(req).values()];
  function filterTasks(req){ let rows=list(req); const q=String(req.query.q||req.query.search||'').trim().toLowerCase();
    if(q) rows=rows.filter(t=>[t.title,t.notes,t.category,t.status,t.priority].join(' ').toLowerCase().includes(q));
    if(req.query.status) rows=rows.filter(t=>t.status===String(req.query.status));
    if(req.query.priority) rows=rows.filter(t=>t.priority===String(req.query.priority));
    if(req.query.category) rows=rows.filter(t=>t.category===String(req.query.category));
    return rows; }
  function clean(body, partial){
    const out={};
    if(!partial||body.title!==undefined){ const t=String((body&&body.title)||'').trim(); if(!t) throw Object.assign(new Error('title_required'),{status:400}); out.title=t; }
    if(body.notes!==undefined) out.notes=String(body.notes||'');
    if(body.category!==undefined) out.category=String(body.category||'');
    if(body.status!==undefined){ if(!['todo','in_progress','done'].includes(body.status)) throw Object.assign(new Error('status_invalid'),{status:400}); out.status=body.status; }
    if(body.priority!==undefined){ if(!['low','normal','high'].includes(body.priority)) throw Object.assign(new Error('priority_invalid'),{status:400}); out.priority=body.priority; }
    if(body.estimateHours!==undefined){ const n=Number(body.estimateHours); if(!Number.isFinite(n)||n<0) throw Object.assign(new Error('estimateHours_invalid'),{status:400}); out.estimateHours=n; }
    if(body.doneFlag!==undefined) out.doneFlag=Boolean(body.doneFlag);
    return out; }
  router.get('/tasks/export',(req,res)=>{ const rows=filterTasks(req); const fmt=String(req.query.format||'json').toLowerCase();
    if(fmt==='csv'){ res.setHeader('Content-Type','text/csv'); return res.send(toCsv(rows)); }
    if(fmt!=='json') return res.status(400).json({error:'format_invalid'});
    res.setHeader('Content-Type','application/json'); return res.json({items:rows,total:rows.length}); });
  router.get('/tasks',(req,res)=>{ const rows=filterTasks(req); res.json({items:rows,total:rows.length}); });
  router.post('/tasks',(req,res)=>{ try{ const f=clean(req.body||{},false); const task={id:++seq,title:f.title,notes:f.notes||'',status:f.status||'todo',priority:f.priority||'normal',category:f.category||'',estimateHours:f.estimateHours!==undefined?f.estimateHours:0,doneFlag:f.doneFlag!==undefined?f.doneFlag:false,createdAt:new Date().toISOString()}; mine(req).set(task.id,task); res.status(201).json(task); }catch(e){ res.status(e.status||400).json({error:e.message}); } });
  router.get('/tasks/:id',(req,res)=>{ const t=mine(req).get(Number(req.params.id)); if(!t) return res.status(404).json({error:'not_found'}); res.json(t); });
  router.put('/tasks/:id',update); router.patch('/tasks/:id',update);
  function update(req,res){ const t=mine(req).get(Number(req.params.id)); if(!t) return res.status(404).json({error:'not_found'}); try{ Object.assign(t,clean(req.body||{},true)); t.updatedAt=new Date().toISOString(); res.json(t); }catch(e){ res.status(e.status||400).json({error:e.message}); } }
  router.get('/ai/features',(req,res)=>res.json({features:Object.keys(DOMAIN),disclaimer:DISCLAIMER}));
  router.post('/ai/:feature', async (req,res)=>{
    const fid=req.params.feature; if(!DOMAIN[fid]) return res.status(404).json({error:'unknown_feature'});
    const tasks=list(req); const sections=buildSections(fid,tasks);
    const key=env.OPENROUTER_API_KEY||env.OPENAI_API_KEY;
    if(key){ try{
      const isOr=Boolean(env.OPENROUTER_API_KEY);
      const url=isOr?'https://openrouter.ai/api/v1/chat/completions':'https://api.openai.com/v1/chat/completions';
      const model=env.OPENROUTER_MODEL||env.OPENAI_MODEL||'openai/gpt-4o-mini';
      const r=await fetchImpl(url,{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model,messages:[{role:'user',content:DOMAIN[fid]+' Operational only, no diagnosis. Tasks: '+JSON.stringify(tasks)}]})});
      if(r&&r.ok){ const b=await r.json(); const text=b&&b.choices&&b.choices[0]&&b.choices[0].message&&b.choices[0].message.content; if(text) return res.json({feature:fid,aiGenerated:true,provider:isOr?'openrouter':'openai',model,sections:[{label:'Provider summary',value:String(text)}],disclaimer:DISCLAIMER}); }
    }catch(_){ /* fall through to deterministic */ } }
    return res.json({feature:fid,aiGenerated:false,provider:null,sections,disclaimer:DISCLAIMER});
  });
  return router;
}
module.exports={createWave37Router,toCsv,DISCLAIMER};
