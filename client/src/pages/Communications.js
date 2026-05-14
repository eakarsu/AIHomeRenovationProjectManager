import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const empty = { subject:'', message:'', from_name:'', to_name:'', comm_type:'email', comm_date:'', priority:'normal', status:'open', related_to:'', follow_up_date:'', notes:'' };

export default function Communications({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiForm, setAIForm] = useState({ recipient:'', topic:'', tone:'professional', context:'' });

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/communications'); setItems(Array.isArray(data) ? data : (data.data || [])); };
  const handleSave = async () => { if (editing) await API.put(`/communications/${form.id}`, form); else await API.post('/communications', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/communications/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm({...item, comm_date:item.comm_date?.split('T')[0]||'', follow_up_date:item.follow_up_date?.split('T')[0]||''}); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => { setAILoading(true); setAIData(null); try { const { data } = await API.post('/communications/ai/draft', aiForm); setAIData(data); } catch(e) { setAIData({success:false,content:e.message}); } setAILoading(false); };

  const getBadge = (s) => ({open:'badge-yellow',resolved:'badge-green',pending:'badge-blue'}[s]||'badge-gray');
  const getTypeIcon = (t) => ({email:'📧',phone:'📞',meeting:'🤝',letter:'✉️',note:'📝',text:'💬'}[t]||'📄');

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Communication Log</h1><p>Track all project communications</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={()=>{setShowAI(true);setAIData(null);}}>🤖 AI Draft Message</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Entry</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Messages</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Open</div><div className="value" style={{color:'#facc15'}}>{items.filter(i=>i.status==='open').length}</div></div>
        <div className="summary-card"><div className="label">Follow-ups Due</div><div className="value" style={{color:'#f87171'}}>{items.filter(i=>i.follow_up_date && i.status==='open').length}</div></div>
        <div className="summary-card"><div className="label">This Month</div><div className="value">{items.filter(i=>{ const d=new Date(i.comm_date); const n=new Date(); return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear(); }).length}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Type</th><th>Subject</th><th>From</th><th>To</th><th>Date</th><th>Related To</th><th>Priority</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={()=>setSelected(item)}>
            <td>{getTypeIcon(item.comm_type)} {item.comm_type}</td>
            <td style={{fontWeight:600,color:'#f1f5f9',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.subject}</td>
            <td>{item.from_name}</td><td>{item.to_name}</td>
            <td>{item.comm_date?.split('T')[0]}</td>
            <td>{item.related_to}</td>
            <td><span className={`badge ${item.priority==='urgent'?'badge-red':item.priority==='high'?'badge-yellow':'badge-gray'}`}>{item.priority}</span></td>
            <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{getTypeIcon(selected.comm_type)} {selected.subject}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">From</div><div className="value">{selected.from_name}</div></div>
            <div className="detail-item"><div className="label">To</div><div className="value">{selected.to_name}</div></div>
            <div className="detail-item"><div className="label">Type</div><div className="value">{selected.comm_type}</div></div>
            <div className="detail-item"><div className="label">Date</div><div className="value">{selected.comm_date?.split('T')[0]}</div></div>
            <div className="detail-item"><div className="label">Priority</div><div className="value">{selected.priority}</div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
            <div className="detail-item"><div className="label">Related To</div><div className="value">{selected.related_to}</div></div>
            <div className="detail-item"><div className="label">Follow-up</div><div className="value">{selected.follow_up_date?.split('T')[0]||'None'}</div></div>
            <div className="detail-item detail-full"><div className="label">Message</div><div className="value" style={{whiteSpace:'pre-wrap',lineHeight:1.6}}>{selected.message}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Entry':'New Communication'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-group"><label>Subject</label><input value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} /></div>
          <div className="form-row"><div className="form-group"><label>From</label><input value={form.from_name} onChange={e=>setForm({...form,from_name:e.target.value})} /></div><div className="form-group"><label>To</label><input value={form.to_name} onChange={e=>setForm({...form,to_name:e.target.value})} /></div></div>
          <div className="form-group"><label>Message</label><textarea value={form.message} onChange={e=>setForm({...form,message:e.target.value})} rows={4} /></div>
          <div className="form-row"><div className="form-group"><label>Type</label><select value={form.comm_type} onChange={e=>setForm({...form,comm_type:e.target.value})}><option value="email">Email</option><option value="phone">Phone</option><option value="meeting">Meeting</option><option value="letter">Letter</option><option value="note">Note</option><option value="text">Text</option></select></div><div className="form-group"><label>Date</label><input type="date" value={form.comm_date} onChange={e=>setForm({...form,comm_date:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></div><div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="open">Open</option><option value="resolved">Resolved</option><option value="pending">Pending</option></select></div></div>
          <div className="form-row"><div className="form-group"><label>Related To</label><input value={form.related_to} onChange={e=>setForm({...form,related_to:e.target.value})} /></div><div className="form-group"><label>Follow-up Date</label><input type="date" value={form.follow_up_date} onChange={e=>setForm({...form,follow_up_date:e.target.value})} /></div></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>🤖 AI Draft Message</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body">
          {!aiData && !aiLoading && <div className="ai-form">
            <div className="form-row"><div className="form-group"><label>Recipient</label><input value={aiForm.recipient} onChange={e=>setAIForm({...aiForm,recipient:e.target.value})} placeholder="e.g., General Contractor" /></div><div className="form-group"><label>Tone</label><select value={aiForm.tone} onChange={e=>setAIForm({...aiForm,tone:e.target.value})}><option value="professional">Professional</option><option value="friendly">Friendly</option><option value="firm">Firm</option><option value="urgent">Urgent</option></select></div></div>
            <div className="form-group"><label>Topic</label><input value={aiForm.topic} onChange={e=>setAIForm({...aiForm,topic:e.target.value})} placeholder="e.g., Schedule delay concern" /></div>
            <div className="form-group"><label>Context</label><textarea value={aiForm.context} onChange={e=>setAIForm({...aiForm,context:e.target.value})} placeholder="Additional details..." /></div>
            <button className="btn btn-ai" onClick={handleAI}>Draft Message</button>
          </div>}
          <AIResponse data={aiData} loading={aiLoading} />{aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>setAIData(null)}>New Draft</button></div>}
        </div>
      </div></div>}
    </Layout>
  );
}
