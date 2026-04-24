import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const emptyPermit = {
  permit_type: '', description: '', jurisdiction: '', status: 'pending',
  submission_date: '', approval_date: '', expiration_date: '', fee: '',
  inspector_name: '', inspector_phone: '', project_address: '', notes: '',
};

export default function Permits({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPermit);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiForm, setAIForm] = useState({ project_type: '', location: '', scope: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await API.get('/permits');
    setItems(data);
  };

  const handleSave = async () => {
    if (editing) {
      await API.put(`/permits/${form.id}`, form);
    } else {
      await API.post('/permits', form);
    }
    setShowForm(false);
    setForm(emptyPermit);
    setEditing(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this permit?')) return;
    await API.delete(`/permits/${id}`);
    setSelected(null);
    load();
  };

  const handleEdit = (item) => {
    setForm({ ...item, submission_date: item.submission_date?.split('T')[0] || '', approval_date: item.approval_date?.split('T')[0] || '', expiration_date: item.expiration_date?.split('T')[0] || '' });
    setEditing(true);
    setShowForm(true);
    setSelected(null);
  };

  const handleAI = async () => {
    setAILoading(true);
    setAIData(null);
    try {
      const { data } = await API.post('/permits/ai/requirements', aiForm);
      setAIData(data);
    } catch (err) {
      setAIData({ success: false, content: err.message });
    }
    setAILoading(false);
  };

  const getBadge = (status) => {
    const map = { approved: 'badge-green', pending: 'badge-yellow', in_review: 'badge-blue', denied: 'badge-red', expired: 'badge-gray' };
    return map[status] || 'badge-gray';
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Permits</h1>
          <p>Track building permits and inspections</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={() => { setShowAI(true); setAIData(null); }}>🤖 AI Permit Advisor</button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyPermit); setEditing(false); setShowForm(true); }}>+ New Permit</button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Permits</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Approved</div><div className="value" style={{ color: '#4ade80' }}>{items.filter(i => i.status === 'approved').length}</div></div>
        <div className="summary-card"><div className="label">Pending</div><div className="value" style={{ color: '#facc15' }}>{items.filter(i => i.status === 'pending').length}</div></div>
        <div className="summary-card"><div className="label">Total Fees</div><div className="value money">${items.reduce((s, i) => s + parseFloat(i.fee || 0), 0).toLocaleString()}</div></div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Jurisdiction</th>
              <th>Status</th>
              <th>Fee</th>
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.permit_type}</td>
                <td style={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</td>
                <td>{item.jurisdiction}</td>
                <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
                <td className="money">${item.fee}</td>
                <td>{item.submission_date?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.permit_type}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>
                <div className="detail-item"><div className="label">Jurisdiction</div><div className="value">{selected.jurisdiction}</div></div>
                <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
                <div className="detail-item"><div className="label">Fee</div><div className="value money">${selected.fee}</div></div>
                <div className="detail-item"><div className="label">Submitted</div><div className="value">{selected.submission_date?.split('T')[0] || 'N/A'}</div></div>
                <div className="detail-item"><div className="label">Approved</div><div className="value">{selected.approval_date?.split('T')[0] || 'N/A'}</div></div>
                <div className="detail-item"><div className="label">Expires</div><div className="value">{selected.expiration_date?.split('T')[0] || 'N/A'}</div></div>
                <div className="detail-item"><div className="label">Inspector</div><div className="value">{selected.inspector_name || 'N/A'}</div></div>
                <div className="detail-item"><div className="label">Inspector Phone</div><div className="value">{selected.inspector_phone || 'N/A'}</div></div>
                <div className="detail-item detail-full"><div className="label">Address</div><div className="value">{selected.project_address}</div></div>
                {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
              </div>
              <div className="detail-actions">
                <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Permit' : 'New Permit'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label>Permit Type</label><input value={form.permit_type} onChange={(e) => setForm({ ...form, permit_type: e.target.value })} /></div>
                <div className="form-group"><label>Jurisdiction</label><input value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="pending">Pending</option><option value="in_review">In Review</option><option value="approved">Approved</option><option value="denied">Denied</option><option value="expired">Expired</option>
                  </select>
                </div>
                <div className="form-group"><label>Fee ($)</label><input type="number" value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Submission Date</label><input type="date" value={form.submission_date} onChange={(e) => setForm({ ...form, submission_date: e.target.value })} /></div>
                <div className="form-group"><label>Approval Date</label><input type="date" value={form.approval_date} onChange={(e) => setForm({ ...form, approval_date: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Expiration Date</label><input type="date" value={form.expiration_date} onChange={(e) => setForm({ ...form, expiration_date: e.target.value })} /></div>
                <div className="form-group"><label>Project Address</label><input value={form.project_address} onChange={(e) => setForm({ ...form, project_address: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Inspector Name</label><input value={form.inspector_name} onChange={(e) => setForm({ ...form, inspector_name: e.target.value })} /></div>
                <div className="form-group"><label>Inspector Phone</label><input value={form.inspector_phone} onChange={(e) => setForm({ ...form, inspector_phone: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {showAI && (
        <div className="modal-overlay" onClick={() => setShowAI(false)}>
          <div className="modal modal-ai" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🤖 AI Permit Advisor</h2>
              <button className="modal-close" onClick={() => setShowAI(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {!aiData && !aiLoading && (
                <div className="ai-form">
                  <div className="form-group"><label>Project Type</label><input value={aiForm.project_type} onChange={(e) => setAIForm({ ...aiForm, project_type: e.target.value })} placeholder="e.g., Kitchen Renovation" /></div>
                  <div className="form-group"><label>Location</label><input value={aiForm.location} onChange={(e) => setAIForm({ ...aiForm, location: e.target.value })} placeholder="e.g., Austin, TX" /></div>
                  <div className="form-group"><label>Scope of Work</label><textarea value={aiForm.scope} onChange={(e) => setAIForm({ ...aiForm, scope: e.target.value })} placeholder="Describe the scope..." /></div>
                  <button className="btn btn-ai" onClick={handleAI}>Analyze Permit Requirements</button>
                </div>
              )}
              <AIResponse data={aiData} loading={aiLoading} />
              {aiData && <div style={{ marginTop: 16 }}><button className="btn btn-secondary btn-sm" onClick={() => { setAIData(null); }}>New Analysis</button></div>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
