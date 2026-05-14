import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import Pagination from '../components/Pagination';
import API from '../services/api';

const empty = { name:'', address:'', project_type:'', total_budget:'', start_date:'', end_date:'', status:'planning', description:'', client_name:'', client_phone:'', notes:'' };

export default function Projects({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiHistory, setAiHistory] = useState([]);
  const [rateLimitError, setRateLimitError] = useState(null);

  useEffect(() => { load(1); loadAIHistory(); }, []);

  const load = async (page = 1) => {
    const { data } = await API.get(`/projects?page=${page}&limit=20`);
    // Support both paginated and legacy responses
    if (data.data) {
      setItems(data.data);
      setPagination(data.pagination);
    } else {
      setItems(Array.isArray(data) ? data : []);
    }
  };

  const loadAIHistory = async () => {
    try {
      const { data } = await API.get('/projects/ai/history');
      setAiHistory(data || []);
    } catch (_) {}
  };

  const handleSave = async () => {
    if (editing) await API.put(`/projects/${form.id}`, form);
    else await API.post('/projects', form);
    setShowForm(false); setForm(empty); setEditing(false); load(pagination.page);
  };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/projects/${id}`); setSelected(null); load(pagination.page); };
  const handleEdit = (item) => { setForm({...item, start_date: item.start_date?.split('T')[0]||'', end_date: item.end_date?.split('T')[0]||''}); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => {
    setAILoading(true); setAIData(null); setShowAI(true); setRateLimitError(null);
    try {
      const { data } = await API.post('/projects/ai/analyze');
      setAIData(data);
      loadAIHistory();
    } catch(e) {
      if (e.response?.status === 429) {
        setRateLimitError(e.response.data?.error || 'AI rate limit exceeded. Max 20 requests/hour.');
      } else {
        setAIData({success:false,content:e.message});
      }
    }
    setAILoading(false);
  };

  const getBadge = (s) => ({planning:'badge-gray',in_progress:'badge-blue',completed:'badge-green',on_hold:'badge-yellow',cancelled:'badge-red'}[s]||'badge-gray');
  const totalBudget = items.reduce((s,i) => s + parseFloat(i.total_budget||0), 0);

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Projects</h1><p>Manage renovation projects</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={handleAI}>AI Portfolio Analysis</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Project</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Projects</div><div className="value">{pagination.total || items.length}</div></div>
        <div className="summary-card"><div className="label">Active</div><div className="value" style={{color:'#60a5fa'}}>{items.filter(i=>i.status==='in_progress').length}</div></div>
        <div className="summary-card"><div className="label">Completed</div><div className="value" style={{color:'#4ade80'}}>{items.filter(i=>i.status==='completed').length}</div></div>
        <div className="summary-card"><div className="label">Total Budget</div><div className="value money">${totalBudget.toLocaleString()}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Name</th><th>Type</th><th>Client</th><th>Budget</th><th>Start</th><th>End</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={() => setSelected(item)}>
            <td style={{fontWeight:600,color:'#f1f5f9'}}>{item.name}</td>
            <td>{item.project_type}</td>
            <td>{item.client_name}</td>
            <td className="money">${parseFloat(item.total_budget||0).toLocaleString()}</td>
            <td>{item.start_date?.split('T')[0]}</td>
            <td>{item.end_date?.split('T')[0]}</td>
            <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => load(p)} />

      {/* AI History */}
      {aiHistory.length > 0 && (
        <div style={{ marginTop: 24, padding: 16, background: '#0f172a', borderRadius: 8, border: '1px solid #1e293b' }}>
          <h3 style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12 }}>Recent AI Analyses</h3>
          {aiHistory.map((h) => (
            <div key={h.id} style={{ fontSize: 12, color: '#64748b', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ color: '#475569' }}>{new Date(h.created_at).toLocaleDateString()}</span> — {h.result?.substring(0, 120)}...
            </div>
          ))}
        </div>
      )}

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{selected.name}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Type</div><div className="value">{selected.project_type}</div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
            <div className="detail-item detail-full"><div className="label">Address</div><div className="value">{selected.address}</div></div>
            <div className="detail-item"><div className="label">Client</div><div className="value">{selected.client_name}</div></div>
            <div className="detail-item"><div className="label">Phone</div><div className="value">{selected.client_phone}</div></div>
            <div className="detail-item"><div className="label">Budget</div><div className="value money">${parseFloat(selected.total_budget||0).toLocaleString()}</div></div>
            <div className="detail-item"><div className="label">Timeline</div><div className="value">{selected.start_date?.split('T')[0]} to {selected.end_date?.split('T')[0]}</div></div>
            <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions">
            <button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button>
            <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button>
          </div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Project':'New Project'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label>Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
            <div className="form-group"><label>Type *</label><input value={form.project_type} onChange={e=>setForm({...form,project_type:e.target.value})} placeholder="e.g., Kitchen, Whole Home" /></div>
          </div>
          <div className="form-group"><label>Address</label><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div className="form-row">
            <div className="form-group"><label>Client Name</label><input value={form.client_name} onChange={e=>setForm({...form,client_name:e.target.value})} /></div>
            <div className="form-group"><label>Client Phone</label><input value={form.client_phone} onChange={e=>setForm({...form,client_phone:e.target.value})} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Total Budget ($) *</label><input type="number" value={form.total_budget} onChange={e=>setForm({...form,total_budget:e.target.value})} /></div>
            <div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="planning">Planning</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="on_hold">On Hold</option><option value="cancelled">Cancelled</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Date</label><input type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} /></div>
            <div className="form-group"><label>End Date</label><input type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} /></div>
          </div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>AI Portfolio Analysis</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body">
          {rateLimitError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16, marginBottom: 16, color: '#dc2626' }}>
              {rateLimitError}
            </div>
          )}
          <AIResponse data={aiData} loading={aiLoading} />
          {aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>{setAIData(null);handleAI();}}>Refresh</button></div>}
        </div>
      </div></div>}
    </Layout>
  );
}
