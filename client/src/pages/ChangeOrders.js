import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../services/api';

const emptyOrder = {
  title: '', description: '', original_cost: '', new_cost: '', reason: '',
  impact_timeline: '', status: 'pending', requested_by: '', notes: '',
};

export default function ChangeOrders({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyOrder);
  const [editing, setEditing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await API.get('/budget/change-orders/all');
    setItems(data);
  };

  const handleSave = async () => {
    if (editing) {
      await API.put(`/budget/change-orders/${form.id}`, form);
    } else {
      await API.post('/budget/change-orders', form);
    }
    setShowForm(false);
    setForm(emptyOrder);
    setEditing(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this change order?')) return;
    await API.delete(`/budget/change-orders/${id}`);
    setSelected(null);
    load();
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditing(true);
    setShowForm(true);
    setSelected(null);
  };

  const totalImpact = items.reduce((s, i) => s + (parseFloat(i.new_cost || 0) - parseFloat(i.original_cost || 0)), 0);
  const approvedImpact = items.filter(i => i.status === 'approved').reduce((s, i) => s + (parseFloat(i.new_cost || 0) - parseFloat(i.original_cost || 0)), 0);

  const getBadge = (status) => {
    const map = { approved: 'badge-green', pending: 'badge-yellow', denied: 'badge-red' };
    return map[status] || 'badge-gray';
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Change Orders</h1>
          <p>Track scope changes and cost adjustments</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setForm(emptyOrder); setEditing(false); setShowForm(true); }}>+ New Change Order</button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Orders</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Approved</div><div className="value" style={{ color: '#4ade80' }}>{items.filter(i => i.status === 'approved').length}</div></div>
        <div className="summary-card"><div className="label">Pending</div><div className="value" style={{ color: '#facc15' }}>{items.filter(i => i.status === 'pending').length}</div></div>
        <div className="summary-card"><div className="label">Total Cost Impact</div><div className="value money" style={{ color: totalImpact > 0 ? '#f87171' : '#4ade80' }}>+${totalImpact.toLocaleString()}</div><div className="sub">Approved: +${approvedImpact.toLocaleString()}</div></div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Original Cost</th>
              <th>New Cost</th>
              <th>Difference</th>
              <th>Requested By</th>
              <th>Timeline Impact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const diff = parseFloat(item.new_cost || 0) - parseFloat(item.original_cost || 0);
              return (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.title}</td>
                  <td className="money">${parseFloat(item.original_cost).toLocaleString()}</td>
                  <td className="money">${parseFloat(item.new_cost).toLocaleString()}</td>
                  <td className={`money ${diff > 0 ? 'money-negative' : 'money-positive'}`}>
                    {diff > 0 ? '+' : ''}${diff.toLocaleString()}
                  </td>
                  <td>{item.requested_by}</td>
                  <td>{item.impact_timeline}</td>
                  <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.title}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>
                <div className="detail-item"><div className="label">Original Cost</div><div className="value money">${parseFloat(selected.original_cost).toLocaleString()}</div></div>
                <div className="detail-item"><div className="label">New Cost</div><div className="value money">${parseFloat(selected.new_cost).toLocaleString()}</div></div>
                <div className="detail-item detail-full"><div className="label">Reason</div><div className="value">{selected.reason}</div></div>
                <div className="detail-item"><div className="label">Requested By</div><div className="value">{selected.requested_by}</div></div>
                <div className="detail-item"><div className="label">Timeline Impact</div><div className="value">{selected.impact_timeline}</div></div>
                <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
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
              <h2>{editing ? 'Edit Change Order' : 'New Change Order'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group"><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Original Cost ($)</label><input type="number" value={form.original_cost} onChange={(e) => setForm({ ...form, original_cost: e.target.value })} /></div>
                <div className="form-group"><label>New Cost ($)</label><input type="number" value={form.new_cost} onChange={(e) => setForm({ ...form, new_cost: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Reason</label><textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Requested By</label><input value={form.requested_by} onChange={(e) => setForm({ ...form, requested_by: e.target.value })} /></div>
                <div className="form-group"><label>Timeline Impact</label><input value={form.impact_timeline} onChange={(e) => setForm({ ...form, impact_timeline: e.target.value })} placeholder="e.g., +3 days" /></div>
              </div>
              <div className="form-group"><label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="pending">Pending</option><option value="approved">Approved</option><option value="denied">Denied</option>
                </select>
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
    </Layout>
  );
}
