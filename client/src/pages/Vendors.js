import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const empty = { name:'', category:'', contact_name:'', phone:'', email:'', website:'', rating:'', payment_terms:'', delivery_speed:'', location:'', notes:'' };

export default function Vendors({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiForm, setAIForm] = useState({ material_needed:'', budget:'' });

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/vendors'); setItems(Array.isArray(data) ? data : (data.data || [])); };
  const handleSave = async () => { if (editing) await API.put(`/vendors/${form.id}`, form); else await API.post('/vendors', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/vendors/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => { setAILoading(true); setAIData(null); try { const { data } = await API.post('/vendors/ai/compare', aiForm); setAIData(data); } catch(e) { setAIData({success:false,content:e.message}); } setAILoading(false); };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Vendors & Suppliers</h1><p>Manage material vendors and suppliers</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={()=>{setShowAI(true);setAIData(null);}}>🤖 AI Compare</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Vendor</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Vendors</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Categories</div><div className="value">{[...new Set(items.map(i=>i.category))].length}</div></div>
        <div className="summary-card"><div className="label">Avg Rating</div><div className="value">{items.length ? (items.reduce((s,i)=>s+parseFloat(i.rating||0),0)/items.length).toFixed(1) : '0'}/5</div></div>
        <div className="summary-card"><div className="label">Top Rated</div><div className="value" style={{fontSize:16}}>{items.sort((a,b)=>b.rating-a.rating)[0]?.name||'-'}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Name</th><th>Category</th><th>Contact</th><th>Rating</th><th>Payment</th><th>Delivery</th><th>Location</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={()=>setSelected(item)}>
            <td style={{fontWeight:600,color:'#f1f5f9'}}>{item.name}</td>
            <td>{item.category}</td><td>{item.contact_name}</td>
            <td><span className="rating">{'★'.repeat(Math.round(item.rating))}{'☆'.repeat(5-Math.round(item.rating))}</span> {item.rating}</td>
            <td>{item.payment_terms}</td><td>{item.delivery_speed}</td><td>{item.location}</td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{selected.name}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Category</div><div className="value">{selected.category}</div></div>
            <div className="detail-item"><div className="label">Rating</div><div className="value"><span className="rating">{'★'.repeat(Math.round(selected.rating))}</span> {selected.rating}/5</div></div>
            <div className="detail-item"><div className="label">Contact</div><div className="value">{selected.contact_name}</div></div>
            <div className="detail-item"><div className="label">Phone</div><div className="value">{selected.phone}</div></div>
            <div className="detail-item"><div className="label">Email</div><div className="value">{selected.email}</div></div>
            <div className="detail-item"><div className="label">Website</div><div className="value">{selected.website}</div></div>
            <div className="detail-item"><div className="label">Payment Terms</div><div className="value">{selected.payment_terms}</div></div>
            <div className="detail-item"><div className="label">Delivery Speed</div><div className="value">{selected.delivery_speed}</div></div>
            <div className="detail-item"><div className="label">Location</div><div className="value">{selected.location}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Vendor':'New Vendor'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-row"><div className="form-group"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div><div className="form-group"><label>Category</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Contact Name</label><input value={form.contact_name} onChange={e=>setForm({...form,contact_name:e.target.value})} /></div><div className="form-group"><label>Phone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Email</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} /></div><div className="form-group"><label>Website</label><input value={form.website} onChange={e=>setForm({...form,website:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Rating (0-5)</label><input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e=>setForm({...form,rating:e.target.value})} /></div><div className="form-group"><label>Location</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Payment Terms</label><input value={form.payment_terms} onChange={e=>setForm({...form,payment_terms:e.target.value})} placeholder="e.g., Net 30" /></div><div className="form-group"><label>Delivery Speed</label><input value={form.delivery_speed} onChange={e=>setForm({...form,delivery_speed:e.target.value})} placeholder="e.g., 3-5 days" /></div></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>🤖 AI Vendor Comparison</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body">
          {!aiData && !aiLoading && <div className="ai-form">
            <div className="form-group"><label>Material Needed</label><input value={aiForm.material_needed} onChange={e=>setAIForm({...aiForm,material_needed:e.target.value})} placeholder="e.g., Quartz countertops" /></div>
            <div className="form-group"><label>Budget ($)</label><input type="number" value={aiForm.budget} onChange={e=>setAIForm({...aiForm,budget:e.target.value})} /></div>
            <button className="btn btn-ai" onClick={handleAI}>Compare Vendors</button>
          </div>}
          <AIResponse data={aiData} loading={aiLoading} />{aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>setAIData(null)}>New Comparison</button></div>}
        </div>
      </div></div>}
    </Layout>
  );
}
