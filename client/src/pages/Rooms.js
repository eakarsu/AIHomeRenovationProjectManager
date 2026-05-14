import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const empty = { name:'', floor:'', room_type:'', dimensions:'', square_footage:'', current_condition:'', renovation_scope:'', estimated_cost:'', status:'not_started', assigned_contractor:'', notes:'' };

export default function Rooms({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/rooms'); setItems(Array.isArray(data) ? data : (data.data || [])); };
  const handleSave = async () => { if (editing) await API.put(`/rooms/${form.id}`, form); else await API.post('/rooms', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/rooms/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => { setAILoading(true); setAIData(null); setShowAI(true); try { const { data } = await API.post('/rooms/ai/plan'); setAIData(data); } catch(e) { setAIData({success:false,content:e.message}); } setAILoading(false); };

  const getBadge = (s) => ({completed:'badge-green',in_progress:'badge-blue',not_started:'badge-gray',demo_complete:'badge-yellow',framing_done:'badge-purple'}[s]||'badge-gray');
  const totalSqFt = items.reduce((s,i) => s + parseFloat(i.square_footage||0), 0);
  const totalCost = items.reduce((s,i) => s + parseFloat(i.estimated_cost||0), 0);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Rooms</h1><p>Room-by-room renovation tracking</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={handleAI}>🤖 AI Room Plan</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Room</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Rooms</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Total Sq Ft</div><div className="value">{totalSqFt.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">In Progress</div><div className="value" style={{color:'#60a5fa'}}>{items.filter(i=>i.status==='in_progress').length}</div></div>
        <div className="summary-card"><div className="label">Total Est. Cost</div><div className="value money">${totalCost.toLocaleString()}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Room</th><th>Floor</th><th>Type</th><th>Size</th><th>Sq Ft</th><th>Condition</th><th>Cost</th><th>Contractor</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={()=>setSelected(item)}>
            <td style={{fontWeight:600,color:'#f1f5f9'}}>{item.name}</td>
            <td>{item.floor}</td><td>{item.room_type}</td><td>{item.dimensions}</td>
            <td>{item.square_footage}</td><td>{item.current_condition}</td>
            <td className="money">${parseFloat(item.estimated_cost).toLocaleString()}</td>
            <td>{item.assigned_contractor||'-'}</td>
            <td><span className={`badge ${getBadge(item.status)}`}>{item.status?.replace('_',' ')}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{selected.name}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Floor</div><div className="value">{selected.floor}</div></div>
            <div className="detail-item"><div className="label">Type</div><div className="value">{selected.room_type}</div></div>
            <div className="detail-item"><div className="label">Dimensions</div><div className="value">{selected.dimensions}</div></div>
            <div className="detail-item"><div className="label">Square Footage</div><div className="value">{selected.square_footage} sqft</div></div>
            <div className="detail-item"><div className="label">Condition</div><div className="value">{selected.current_condition}</div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status?.replace('_',' ')}</span></div></div>
            <div className="detail-item"><div className="label">Estimated Cost</div><div className="value money">${parseFloat(selected.estimated_cost).toLocaleString()}</div></div>
            <div className="detail-item"><div className="label">Contractor</div><div className="value">{selected.assigned_contractor||'Unassigned'}</div></div>
            <div className="detail-item detail-full"><div className="label">Renovation Scope</div><div className="value">{selected.renovation_scope}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Room':'New Room'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-row"><div className="form-group"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div><div className="form-group"><label>Room Type</label><input value={form.room_type} onChange={e=>setForm({...form,room_type:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Floor</label><input value={form.floor} onChange={e=>setForm({...form,floor:e.target.value})} placeholder="e.g., 1st Floor" /></div><div className="form-group"><label>Dimensions</label><input value={form.dimensions} onChange={e=>setForm({...form,dimensions:e.target.value})} placeholder="e.g., 20x15" /></div></div>
          <div className="form-row"><div className="form-group"><label>Square Footage</label><input type="number" value={form.square_footage} onChange={e=>setForm({...form,square_footage:e.target.value})} /></div><div className="form-group"><label>Estimated Cost ($)</label><input type="number" value={form.estimated_cost} onChange={e=>setForm({...form,estimated_cost:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Current Condition</label><input value={form.current_condition} onChange={e=>setForm({...form,current_condition:e.target.value})} /></div><div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="not_started">Not Started</option><option value="demo_complete">Demo Complete</option><option value="framing_done">Framing Done</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></div></div>
          <div className="form-group"><label>Assigned Contractor</label><input value={form.assigned_contractor} onChange={e=>setForm({...form,assigned_contractor:e.target.value})} /></div>
          <div className="form-group"><label>Renovation Scope</label><textarea value={form.renovation_scope} onChange={e=>setForm({...form,renovation_scope:e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>🤖 AI Room Renovation Plan</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body"><AIResponse data={aiData} loading={aiLoading} />{aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>{setAIData(null);handleAI();}}>Refresh</button></div>}</div>
      </div></div>}
    </Layout>
  );
}
