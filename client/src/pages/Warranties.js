import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const empty = { item_name:'', category:'', provider:'', warranty_type:'', start_date:'', expiration_date:'', coverage_details:'', claim_process:'', contact_phone:'', contact_email:'', cost:'', status:'active', notes:'' };

export default function Warranties({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/warranties'); setItems(Array.isArray(data) ? data : (data.data || [])); };
  const handleSave = async () => { if (editing) await API.put(`/warranties/${form.id}`, form); else await API.post('/warranties', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/warranties/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm({...item, start_date:item.start_date?.split('T')[0]||'', expiration_date:item.expiration_date?.split('T')[0]||''}); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => { setAILoading(true); setAIData(null); setShowAI(true); try { const { data } = await API.post('/warranties/ai/review'); setAIData(data); } catch(e) { setAIData({success:false,content:e.message}); } setAILoading(false); };

  const getBadge = (s) => ({active:'badge-green',expired:'badge-red',claimed:'badge-yellow',voided:'badge-gray'}[s]||'badge-gray');
  const daysUntil = (date) => { if (!date) return null; const d = Math.ceil((new Date(date) - new Date()) / (1000*60*60*24)); return d; };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Warranties</h1><p>Track product and workmanship warranties</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={handleAI}>🤖 AI Warranty Review</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Warranty</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Warranties</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Active</div><div className="value" style={{color:'#4ade80'}}>{items.filter(i=>i.status==='active').length}</div></div>
        <div className="summary-card"><div className="label">Expiring Soon (90d)</div><div className="value" style={{color:'#facc15'}}>{items.filter(i=>{ const d=daysUntil(i.expiration_date); return d!==null && d>0 && d<=90; }).length}</div></div>
        <div className="summary-card"><div className="label">Categories</div><div className="value">{[...new Set(items.map(i=>i.category))].length}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Item</th><th>Category</th><th>Provider</th><th>Type</th><th>Start</th><th>Expires</th><th>Days Left</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => {
          const days = daysUntil(item.expiration_date);
          return (
            <tr key={item.id} onClick={()=>setSelected(item)}>
              <td style={{fontWeight:600,color:'#f1f5f9'}}>{item.item_name}</td>
              <td>{item.category}</td><td>{item.provider}</td><td>{item.warranty_type}</td>
              <td>{item.start_date?.split('T')[0]}</td><td>{item.expiration_date?.split('T')[0]}</td>
              <td style={{color: days<=90?'#f87171':days<=365?'#facc15':'#4ade80'}}>{days > 0 ? `${days}d` : 'Expired'}</td>
              <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
            </tr>
          );
        })}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{selected.item_name}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Category</div><div className="value">{selected.category}</div></div>
            <div className="detail-item"><div className="label">Provider</div><div className="value">{selected.provider}</div></div>
            <div className="detail-item"><div className="label">Type</div><div className="value">{selected.warranty_type}</div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
            <div className="detail-item"><div className="label">Start Date</div><div className="value">{selected.start_date?.split('T')[0]}</div></div>
            <div className="detail-item"><div className="label">Expiration Date</div><div className="value">{selected.expiration_date?.split('T')[0]}</div></div>
            <div className="detail-item"><div className="label">Contact Phone</div><div className="value">{selected.contact_phone}</div></div>
            <div className="detail-item"><div className="label">Contact Email</div><div className="value">{selected.contact_email}</div></div>
            <div className="detail-item detail-full"><div className="label">Coverage Details</div><div className="value">{selected.coverage_details}</div></div>
            <div className="detail-item detail-full"><div className="label">Claim Process</div><div className="value">{selected.claim_process}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Warranty':'New Warranty'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-row"><div className="form-group"><label>Item Name</label><input value={form.item_name} onChange={e=>setForm({...form,item_name:e.target.value})} /></div><div className="form-group"><label>Category</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Provider</label><input value={form.provider} onChange={e=>setForm({...form,provider:e.target.value})} /></div><div className="form-group"><label>Type</label><input value={form.warranty_type} onChange={e=>setForm({...form,warranty_type:e.target.value})} placeholder="Manufacturer, Installer..." /></div></div>
          <div className="form-row"><div className="form-group"><label>Start Date</label><input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} /></div><div className="form-group"><label>Expiration Date</label><input type="date" value={form.expiration_date} onChange={e=>setForm({...form,expiration_date:e.target.value})} /></div></div>
          <div className="form-group"><label>Coverage Details</label><textarea value={form.coverage_details} onChange={e=>setForm({...form,coverage_details:e.target.value})} /></div>
          <div className="form-group"><label>Claim Process</label><textarea value={form.claim_process} onChange={e=>setForm({...form,claim_process:e.target.value})} /></div>
          <div className="form-row"><div className="form-group"><label>Contact Phone</label><input value={form.contact_phone} onChange={e=>setForm({...form,contact_phone:e.target.value})} /></div><div className="form-group"><label>Contact Email</label><input value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Cost ($)</label><input type="number" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} /></div><div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="expired">Expired</option><option value="claimed">Claimed</option><option value="voided">Voided</option></select></div></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>🤖 AI Warranty Review</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body"><AIResponse data={aiData} loading={aiLoading} />{aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>{setAIData(null);handleAI();}}>Refresh</button></div>}</div>
      </div></div>}
    </Layout>
  );
}
