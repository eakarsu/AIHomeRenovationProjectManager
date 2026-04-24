import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const empty = { title:'', description:'', room:'', category:'', assigned_to:'', priority:'medium', status:'open', due_date:'', reported_by:'', notes:'' };

export default function PunchList({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/punchlist'); setItems(data); };
  const handleSave = async () => { if (editing) await API.put(`/punchlist/${form.id}`, form); else await API.post('/punchlist', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/punchlist/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm({...item, due_date:item.due_date?.split('T')[0]||''}); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => { setAILoading(true); setAIData(null); setShowAI(true); try { const { data } = await API.post('/punchlist/ai/prioritize'); setAIData(data); } catch(e) { setAIData({success:false,content:e.message}); } setAILoading(false); };

  const getBadge = (s) => ({open:'badge-yellow',in_progress:'badge-blue',completed:'badge-green',deferred:'badge-gray'}[s]||'badge-gray');
  const getPriorityBadge = (p) => ({high:'badge-red',medium:'badge-yellow',low:'badge-gray'}[p]||'badge-gray');

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Punch List</h1><p>Track items needing attention or fixes</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={handleAI}>🤖 AI Prioritize</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Item</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Items</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Open</div><div className="value" style={{color:'#facc15'}}>{items.filter(i=>i.status==='open').length}</div></div>
        <div className="summary-card"><div className="label">In Progress</div><div className="value" style={{color:'#60a5fa'}}>{items.filter(i=>i.status==='in_progress').length}</div></div>
        <div className="summary-card"><div className="label">High Priority</div><div className="value" style={{color:'#f87171'}}>{items.filter(i=>i.priority==='high').length}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Title</th><th>Room</th><th>Category</th><th>Assigned To</th><th>Priority</th><th>Due Date</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={()=>setSelected(item)}>
            <td style={{fontWeight:600,color:'#f1f5f9'}}>{item.title}</td>
            <td>{item.room}</td><td>{item.category}</td><td>{item.assigned_to}</td>
            <td><span className={`badge ${getPriorityBadge(item.priority)}`}>{item.priority}</span></td>
            <td>{item.due_date?.split('T')[0]}</td>
            <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{selected.title}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>
            <div className="detail-item"><div className="label">Room</div><div className="value">{selected.room}</div></div>
            <div className="detail-item"><div className="label">Category</div><div className="value">{selected.category}</div></div>
            <div className="detail-item"><div className="label">Assigned To</div><div className="value">{selected.assigned_to}</div></div>
            <div className="detail-item"><div className="label">Reported By</div><div className="value">{selected.reported_by}</div></div>
            <div className="detail-item"><div className="label">Priority</div><div className="value"><span className={`badge ${getPriorityBadge(selected.priority)}`}>{selected.priority}</span></div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
            <div className="detail-item"><div className="label">Due Date</div><div className="value">{selected.due_date?.split('T')[0]||'N/A'}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Item':'New Punch List Item'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div className="form-row"><div className="form-group"><label>Room</label><input value={form.room} onChange={e=>setForm({...form,room:e.target.value})} /></div><div className="form-group"><label>Category</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Carpentry, Electrical, Plumbing..." /></div></div>
          <div className="form-row"><div className="form-group"><label>Assigned To</label><input value={form.assigned_to} onChange={e=>setForm({...form,assigned_to:e.target.value})} /></div><div className="form-group"><label>Reported By</label><input value={form.reported_by} onChange={e=>setForm({...form,reported_by:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Priority</label><select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div><div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="open">Open</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="deferred">Deferred</option></select></div></div>
          <div className="form-group"><label>Due Date</label><input type="date" value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>🤖 AI Punch List Prioritization</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body"><AIResponse data={aiData} loading={aiLoading} />{aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>{setAIData(null);handleAI();}}>Refresh</button></div>}</div>
      </div></div>}
    </Layout>
  );
}
