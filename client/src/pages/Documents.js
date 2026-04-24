import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const empty = { title:'', document_type:'', category:'', file_name:'', uploaded_by:'', description:'', tags:'', version:'1.0', status:'active', notes:'' };

export default function Documents({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => { const { data } = await API.get('/documents'); setItems(data); };
  const handleSave = async () => { if (editing) await API.put(`/documents/${form.id}`, form); else await API.post('/documents', form); setShowForm(false); setForm(empty); setEditing(false); load(); };
  const handleDelete = async (id) => { if (!window.confirm('Delete?')) return; await API.delete(`/documents/${id}`); setSelected(null); load(); };
  const handleEdit = (item) => { setForm(item); setEditing(true); setShowForm(true); setSelected(null); };
  const handleAI = async () => { setAILoading(true); setAIData(null); setShowAI(true); try { const { data } = await API.post('/documents/ai/organize'); setAIData(data); } catch(e) { setAIData({success:false,content:e.message}); } setAILoading(false); };

  const getIcon = (type) => ({Blueprint:'📐',Render:'🖼️',Permit:'📋',Contract:'📄',Report:'📊',Specification:'📑',Spreadsheet:'📈',Certificate:'🏆',Photos:'📸',Schedule:'📅',Letter:'✉️',Log:'📝',Warranty:'🛡️'}[type]||'📄');

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div><h1>Documents</h1><p>Manage project documents and files</p></div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={handleAI}>🤖 AI Document Review</button>
          <button className="btn btn-primary" onClick={() => { setForm(empty); setEditing(false); setShowForm(true); }}>+ New Document</button>
        </div>
      </div>
      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Documents</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Categories</div><div className="value">{[...new Set(items.map(i=>i.category))].length}</div></div>
        <div className="summary-card"><div className="label">Active</div><div className="value" style={{color:'#4ade80'}}>{items.filter(i=>i.status==='active').length}</div></div>
        <div className="summary-card"><div className="label">Types</div><div className="value">{[...new Set(items.map(i=>i.document_type))].length}</div></div>
      </div>
      <div className="data-table-container"><table className="data-table"><thead><tr>
        <th>Title</th><th>Type</th><th>Category</th><th>File</th><th>Version</th><th>Uploaded By</th><th>Status</th>
      </tr></thead><tbody>
        {items.map(item => (
          <tr key={item.id} onClick={()=>setSelected(item)}>
            <td style={{fontWeight:600,color:'#f1f5f9'}}>{getIcon(item.document_type)} {item.title}</td>
            <td>{item.document_type}</td><td>{item.category}</td>
            <td style={{fontSize:12,color:'#94a3b8'}}>{item.file_name}</td>
            <td>v{item.version}</td><td>{item.uploaded_by}</td>
            <td><span className={`badge ${item.status==='active'?'badge-green':'badge-gray'}`}>{item.status}</span></td>
          </tr>
        ))}
      </tbody></table></div>

      {selected && <div className="modal-overlay" onClick={()=>setSelected(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{getIcon(selected.document_type)} {selected.title}</h2><button className="modal-close" onClick={()=>setSelected(null)}>&times;</button></div>
        <div className="modal-body">
          <div className="detail-grid">
            <div className="detail-item"><div className="label">Type</div><div className="value">{selected.document_type}</div></div>
            <div className="detail-item"><div className="label">Category</div><div className="value">{selected.category}</div></div>
            <div className="detail-item"><div className="label">File Name</div><div className="value">{selected.file_name}</div></div>
            <div className="detail-item"><div className="label">Version</div><div className="value">v{selected.version}</div></div>
            <div className="detail-item"><div className="label">Uploaded By</div><div className="value">{selected.uploaded_by}</div></div>
            <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${selected.status==='active'?'badge-green':'badge-gray'}`}>{selected.status}</span></div></div>
            <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>
            <div className="detail-item detail-full"><div className="label">Tags</div><div className="value">{selected.tags?.split(',').map((t,i) => <span key={i} className="badge badge-blue" style={{marginRight:6}}>{t.trim()}</span>)}</div></div>
            {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
          </div>
          <div className="detail-actions"><button className="btn btn-primary btn-sm" onClick={()=>handleEdit(selected)}>Edit</button><button className="btn btn-danger btn-sm" onClick={()=>handleDelete(selected.id)}>Delete</button></div>
        </div>
      </div></div>}

      {showForm && <div className="modal-overlay" onClick={()=>setShowForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>{editing?'Edit Document':'New Document'}</h2><button className="modal-close" onClick={()=>setShowForm(false)}>&times;</button></div>
        <div className="modal-body">
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} /></div>
          <div className="form-row"><div className="form-group"><label>Type</label><input value={form.document_type} onChange={e=>setForm({...form,document_type:e.target.value})} placeholder="Blueprint, Contract, Report..." /></div><div className="form-group"><label>Category</label><input value={form.category} onChange={e=>setForm({...form,category:e.target.value})} placeholder="Design, Legal, Financial..." /></div></div>
          <div className="form-row"><div className="form-group"><label>File Name</label><input value={form.file_name} onChange={e=>setForm({...form,file_name:e.target.value})} /></div><div className="form-group"><label>Version</label><input value={form.version} onChange={e=>setForm({...form,version:e.target.value})} /></div></div>
          <div className="form-row"><div className="form-group"><label>Uploaded By</label><input value={form.uploaded_by} onChange={e=>setForm({...form,uploaded_by:e.target.value})} /></div><div className="form-group"><label>Status</label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Active</option><option value="archived">Archived</option><option value="superseded">Superseded</option></select></div></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
          <div className="form-group"><label>Tags (comma separated)</label><input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} /></div>
          <div className="form-group"><label>Notes</label><textarea value={form.notes||''} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div className="modal-footer"><button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing?'Update':'Create'}</button></div>
      </div></div>}

      {showAI && <div className="modal-overlay" onClick={()=>setShowAI(false)}><div className="modal modal-ai" onClick={e=>e.stopPropagation()}>
        <div className="modal-header"><h2>🤖 AI Document Review</h2><button className="modal-close" onClick={()=>setShowAI(false)}>&times;</button></div>
        <div className="modal-body"><AIResponse data={aiData} loading={aiLoading} />{aiData && <div style={{marginTop:16}}><button className="btn btn-secondary btn-sm" onClick={()=>{setAIData(null);handleAI();}}>Refresh</button></div>}</div>
      </div></div>}
    </Layout>
  );
}
