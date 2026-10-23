const test=require('node:test'); const assert=require('node:assert/strict'); const express=require('../server/node_modules/express'); const http=require('http');
const {createWave37Router}=require('../server/routes/wave37a');
const FEATURE='schedule-risk';
async function svc(){ const app=express(); app.use(express.json()); app.use((req,res,next)=>{ if(req.header('x-test-user')) req.user={id:req.header('x-test-user')}; next(); }); app.use('/api/wave37',createWave37Router({env:{}})); const s=http.createServer(app); await new Promise(r=>s.listen(0,r)); return {s,url:'http://127.0.0.1:'+s.address().port}; }
async function call(base,method,path,body,user='u1'){ const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json','x-test-user':user},body:body?JSON.stringify(body):undefined}); const t=await r.text(); let j; try{j=JSON.parse(t)}catch{j=t} return {status:r.status,body:j,raw:t,ctype:r.headers.get('content-type')}; }
test('wave37 tasks auth, CRUD, search/filter, export, AI fallback', async (t)=>{
  const {s,url}=await svc(); t.after(()=>s.close());
  assert.equal((await call(url,'GET','/api/wave37/tasks',null,'')).status,401);
  const noUser=await fetch(url+'/api/wave37/tasks'); assert.equal(noUser.status,401);
  const c1=await call(url,'POST','/api/wave37/tasks',{title:'Alpha task',priority:'high',estimateHours:0,doneFlag:false,category:'ops'}); assert.equal(c1.status,201); assert.equal(c1.body.estimateHours,0); assert.equal(c1.body.doneFlag,false);
  const c2=await call(url,'POST','/api/wave37/tasks',{title:'Beta other',status:'done'}); assert.equal(c2.status,201);
  assert.equal((await call(url,'POST','/api/wave37/tasks',{notes:'x'})).status,400);
  const upd=await call(url,'PUT','/api/wave37/tasks/'+c1.body.id,{status:'in_progress'}); assert.equal(upd.body.status,'in_progress');
  const q=await call(url,'GET','/api/wave37/tasks?q=alpha'); assert.equal(q.body.total,1);
  const f=await call(url,'GET','/api/wave37/tasks?status=done'); assert.equal(f.body.total,1);
  const other=await call(url,'GET','/api/wave37/tasks',null,'u2'); assert.equal(other.body.total,0);
  const jexp=await call(url,'GET','/api/wave37/tasks/export?format=json'); assert.equal(jexp.body.total,2); assert.equal(jexp.body.items[0].doneFlag,false);
  const cexp=await call(url,'GET','/api/wave37/tasks/export?format=csv'); assert.match(cexp.ctype,/text\/csv/); assert.match(cexp.raw,/Alpha task/); assert.match(cexp.raw,/false/);
  const ai=await call(url,'POST','/api/wave37/ai/'+FEATURE,{}); assert.equal(ai.body.aiGenerated,false); assert.equal(ai.body.provider,null); assert.ok(Array.isArray(ai.body.sections)&&ai.body.sections.length>=3); assert.ok(ai.body.sections.every(x=>x.label));
  const emptyAi=await call(url,'POST','/api/wave37/ai/'+FEATURE,{},'u-empty'); assert.equal(emptyAi.body.aiGenerated,false); assert.ok(emptyAi.body.sections.some(x=>x.value===0||x.value===''||x.value===false));
});
