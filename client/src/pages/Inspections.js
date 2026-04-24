import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const empty = { inspection_type:'', inspector_name:'', inspector_phone:'', scheduled_date:'', completed_date:'', status:'scheduled', result:'', area:'', permit_ref:'', follow_up_required:false, notes:'' };

export default function Inspections({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiForm, setAIForm] = useState({ inspection_type:'', area:'' });

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/inspections'); setItems(data); };
  const handleSave = async () => { if (editing) await API.put(`/inspections/${form.id}`, form); else await API.post('/inspections', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/inspections/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm({...item, scheduled_date:item.scheduled_date?.split('T')[0]||'', completed_date:item.completed_date?.split('T')[0]||''}); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => { setAILoading(true); setAIData(null); try { const { data } = await API.post('/inspections/ai/prepare', aiForm); setAIData(data); } catch(e) { setAIData({success:false,content:e.message}); } setAILoading(false); };

  const getBadge = (s) => ({completed:'badge-green',scheduled:'badge-blue',pending:'badge-yellow',failed:'badge-red',cancelled:'badge-gray'}[s]||'badge-gray');
  const getResultBadge = (r) => ({passed:'badge-green',failed:'badge-red','conditional pass':'badge-yellow'}[r]||'badge-gray');

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Inspections</h1><p>Schedule and track building inspections</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={()=>{setShowAI(true);setAIData(null);}}>🤖 AI Prep Guide</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Inspection</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Passed</div><div className="value" style={{color:'#4ade80'}}>{items.filter(i=>i.result==='passed').length}</div></div>
        <div className="summary-card"><div className="label">Scheduled</div><div className="value" style={{color:'#60a5fa'}}>{items.filter(i=>i.status==='scheduled').length}</div></div>
        <div className="summary-card"><div className="label">Follow-up Required</div><div className="value" style={{color:'#f87171'}}>{items.filter(i=>i.follow_up_required).length}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Type</th><th>Inspector</th><th>Area</th><th>Scheduled</th><th>Result</th><th>Permit Ref</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={()=>setSelected(item)}>
            <td style={{fontWeight:600,color:'#f1f5f9'}}>{item.inspection_type}</td>
            <td>{item.inspector_name}</td><td>{item.area}</td>
            <td>{item.scheduled_date?.split('T')[0]}</td>
            <td>{item.result ? <span className={`badge ${getResultBadge(item.result)}`}>{item.result}</span> : '-'}</td>
            <td>{item.permit_ref}</td>
            <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{selected.inspection_type}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Inspector</div><div className="value">{selected.inspector_name}</div></div>
            <div className="detail-item"><div className="label">Phone</div><div className="value">{selected.inspector_phone}</div></div>
            <div className="detail-item"><div className="label">Area</div><div className="value">{selected.area}</div></div>
            <div className="detail-item"><div className="label">Permit Ref</div><div className="value">{selected.permit_ref}</div></div>
            <div className="detail-item"><div className="label">Scheduled</div><div className="value">{selected.scheduled_date?.split('T')[0]}</div></div>
            <div className="detail-item"><div className="label">Completed</div><div className="value">{selected.completed_date?.split('T')[0]||'N/A'}</div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
            <div className="detail-item"><div className="label">Result</div><div className="value">{selected.result ? <span className={`badge ${getResultBadge(selected.result)}`}>{selected.result}</span> : 'Pending'}</div></div>
            <div className="detail-item"><div className="label">Follow-up Required</div><div className="value">{selected.follow_up_required ? '⚠️ Yes' : 'No'}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Inspection':'New Inspection'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-row"><div className="form-group"><label>Inspection Type</label><input value={form.inspection_type} onChange={e=>setForm({...form,inspection_type:e.target.value})} placeholder="e.g., Rough Plumbing" /></div><div className="form-group"><label>Area</label><input value={form.area} onChange={e=>setForm({...form,area:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Inspector Name</label><input value={form.inspector_name} onChange={e=>setForm({...form,inspector_name:e.target.value})} /></div><div className="form-group"><label>Inspector Phone</label><input value={form.inspector_phone} onChange={e=>setForm({...form,inspector_phone:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Scheduled Date</label><input type="date" value={form.scheduled_date} onChange={e=>setForm({...form,scheduled_date:e.target.value})} /></div><div className="form-group"><label>Completed Date</label><input type="date" value={form.completed_date} onChange={e=>setForm({...form,completed_date:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="scheduled">Scheduled</option><option value="completed">Completed</option><option value="pending">Pending</option><option value="failed">Failed</option><option value="cancelled">Cancelled</option></select></div><div className="form-group"><label>Result</label><select value={form.result||''} onChange={e=>setForm({...form,result:e.target.value})}><option value="">Pending</option><option value="passed">Passed</option><option value="failed">Failed</option><option value="conditional pass">Conditional Pass</option></select></div></div>
          <div className="form-row"><div className="form-group"><label>Permit Reference</label><input value={form.permit_ref} onChange={e=>setForm({...form,permit_ref:e.target.value})} /></div><div className="form-group"><label><input type="checkbox" checked={form.follow_up_required} onChange={e=>setForm({...form,follow_up_required:e.target.checked})} style={{marginRight:8}} />Follow-up Required</label></div></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>🤖 AI Inspection Prep Guide</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body">
          {!aiData && !aiLoading && <div className="ai-form">
            <div className="form-group"><label>Inspection Type</label><input value={aiForm.inspection_type} onChange={e=>setAIForm({...aiForm,inspection_type:e.target.value})} placeholder="e.g., Final Electrical" /></div>
            <div className="form-group"><label>Area</label><input value={aiForm.area} onChange={e=>setAIForm({...aiForm,area:e.target.value})} placeholder="e.g., Whole House" /></div>
            <button className="btn btn-ai" onClick={handleAI}>Generate Prep Guide</button>
          </div>}
          <AIResponse data={aiData} loading={aiLoading} />
          {aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>setAIData(null)}>New Analysis</button></div>}
        </div>
      </div></div>}
    </Layout>
  );
}
