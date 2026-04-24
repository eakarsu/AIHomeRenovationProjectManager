import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const empty = { name:'', category:'', supplier:'', quantity:'', unit:'', unit_price:'', total_cost:'', status:'needed', delivery_date:'', room:'', notes:'' };

export default function Materials({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/materials'); setItems(data); };
  const handleSave = async () => { if (editing) await API.put(`/materials/${form.id}`, form); else await API.post('/materials', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/materials/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm({...item, delivery_date: item.delivery_date?.split('T')[0]||''}); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => { setAILoading(true); setAIData(null); setShowAI(true); try { const { data } = await API.post('/materials/ai/optimize'); setAIData(data); } catch(e) { setAIData({success:false,content:e.message}); } setAILoading(false); };

  const getBadge = (s) => ({delivered:'badge-green',installed:'badge-green',ordered:'badge-blue',needed:'badge-yellow',backordered:'badge-red'}[s]||'badge-gray');
  const totalCost = items.reduce((s,i) => s + parseFloat(i.total_cost||0), 0);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Materials</h1><p>Track materials, deliveries, and costs</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={handleAI}>🤖 AI Optimize</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Material</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Items</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Delivered</div><div className="value" style={{color:'#4ade80'}}>{items.filter(i=>i.status==='delivered'||i.status==='installed').length}</div></div>
        <div className="summary-card"><div className="label">Pending</div><div className="value" style={{color:'#facc15'}}>{items.filter(i=>i.status==='ordered'||i.status==='needed').length}</div></div>
        <div className="summary-card"><div className="label">Total Cost</div><div className="value money">${totalCost.toLocaleString()}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Name</th><th>Category</th><th>Supplier</th><th>Qty</th><th>Unit Price</th><th>Total</th><th>Room</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={() => setSelected(item)}>
            <td style={{fontWeight:600,color:'#f1f5f9'}}>{item.name}</td>
            <td>{item.category}</td><td>{item.supplier}</td>
            <td>{item.quantity} {item.unit}</td>
            <td className="money">${item.unit_price}</td>
            <td className="money">${parseFloat(item.total_cost).toLocaleString()}</td>
            <td>{item.room}</td>
            <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{selected.name}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Category</div><div className="value">{selected.category}</div></div>
            <div className="detail-item"><div className="label">Supplier</div><div className="value">{selected.supplier}</div></div>
            <div className="detail-item"><div className="label">Quantity</div><div className="value">{selected.quantity} {selected.unit}</div></div>
            <div className="detail-item"><div className="label">Unit Price</div><div className="value money">${selected.unit_price}</div></div>
            <div className="detail-item"><div className="label">Total Cost</div><div className="value money">${parseFloat(selected.total_cost).toLocaleString()}</div></div>
            <div className="detail-item"><div className="label">Room</div><div className="value">{selected.room}</div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
            <div className="detail-item"><div className="label">Delivery Date</div><div className="value">{selected.delivery_date?.split('T')[0]||'N/A'}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Material':'New Material'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-row"><div className="form-group"><label>Name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div><div className="form-group"><label>Category</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Supplier</label><input value={form.supplier} onChange={e=>setForm({...form,supplier:e.target.value})} /></div><div className="form-group"><label>Room</label><input value={form.room} onChange={e=>setForm({...form,room:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Quantity</label><input type="number" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})} /></div><div className="form-group"><label>Unit</label><input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="sqft, units, gallons" /></div></div>
          <div className="form-row"><div className="form-group"><label>Unit Price ($)</label><input type="number" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})} /></div><div className="form-group"><label>Total Cost ($)</label><input type="number" value={form.total_cost} onChange={e=>setForm({...form,total_cost:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="needed">Needed</option><option value="ordered">Ordered</option><option value="delivered">Delivered</option><option value="installed">Installed</option><option value="backordered">Backordered</option></select></div><div className="form-group"><label>Delivery Date</label><input type="date" value={form.delivery_date} onChange={e=>setForm({...form,delivery_date:e.target.value})} /></div></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>🤖 AI Material Optimization</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body"><AIResponse data={aiData} loading={aiLoading} />{aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>{setAIData(null);handleAI();}}>Refresh</button></div>}</div>
      </div></div>}
    </Layout>
  );
}
