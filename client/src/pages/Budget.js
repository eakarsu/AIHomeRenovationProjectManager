import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import Pagination from '../components/Pagination';
import API from '../services/api';

const emptyItem = {
  category: '', description: '', estimated_cost: '', actual_cost: '',
  vendor: '', status: 'planned', priority: 'medium', notes: '',
};

export default function Budget({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyItem);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [rateLimitError, setRateLimitError] = useState(null);
  const [variancePrediction, setVariancePrediction] = useState(null);
  const [varianceLoading, setVarianceLoading] = useState(false);

  useEffect(() => { load(1); }, []);

  const load = async (page = 1) => {
    const { data } = await API.get(`/budget?page=${page}&limit=20`);
    if (data.data) { setItems(data.data); setPagination(data.pagination); }
    else setItems(Array.isArray(data) ? data : []);
  };

  const handleSave = async () => {
    if (editing) {
      await API.put(`/budget/${form.id}`, form);
    } else {
      await API.post('/budget', form);
    }
    setShowForm(false);
    setForm(emptyItem);
    setEditing(false);
    setVariancePrediction(null);
    load(pagination.page);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget item?')) return;
    await API.delete(`/budget/${id}`);
    setSelected(null);
    load(pagination.page);
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditing(true);
    setShowForm(true);
    setSelected(null);
  };

  const handleVariancePredict = async () => {
    if (!form.category || !form.estimated_cost) return;
    setVarianceLoading(true);
    setVariancePrediction(null);
    try {
      const { data } = await API.post('/budget/ai/variance-predict', {
        category: form.category,
        description: form.description,
        estimated_cost: parseFloat(form.estimated_cost),
      });
      setVariancePrediction(data.structured || { warning_message: data.ai_analysis?.content });
    } catch (err) {
      setVariancePrediction({ warning_message: err.message });
    }
    setVarianceLoading(false);
  };

  const handleAI = async () => {
    setAILoading(true);
    setAIData(null);
    setShowAI(true);
    setRateLimitError(null);
    try {
      const { data } = await API.post('/budget/ai/analyze');
      setAIData(data);
    } catch (err) {
      if (err.response?.status === 429) {
        setRateLimitError(err.response.data?.error || 'AI rate limit exceeded. Max 20 requests/hour.');
      } else {
        setAIData({ success: false, content: err.message });
      }
    }
    setAILoading(false);
  };

  const totalEstimated = items.reduce((s, i) => s + parseFloat(i.estimated_cost || 0), 0);
  const totalActual = items.reduce((s, i) => s + parseFloat(i.actual_cost || 0), 0);
  const variance = totalActual - totalEstimated;

  const getBadge = (status) => {
    const map = { completed: 'badge-green', in_progress: 'badge-blue', ordered: 'badge-purple', planned: 'badge-gray' };
    return map[status] || 'badge-gray';
  };

  const getPriorityBadge = (p) => {
    const map = { critical: 'badge-red', high: 'badge-yellow', medium: 'badge-blue', low: 'badge-gray' };
    return map[p] || 'badge-gray';
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Budget Management</h1>
          <p>Track costs and manage your renovation budget</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={handleAI}>🤖 AI Budget Analysis</button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyItem); setEditing(false); setShowForm(true); }}>+ New Item</button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Estimated</div><div className="value money">${totalEstimated.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Total Spent</div><div className="value money">${totalActual.toLocaleString()}</div></div>
        <div className="summary-card"><div className="label">Remaining</div><div className="value money" style={{color: totalEstimated - totalActual >= 0 ? '#4ade80' : '#f87171'}}>${(totalEstimated - totalActual).toLocaleString()}</div></div>
        <div className="summary-card">
          <div className="label">Budget Used</div>
          <div className="value">{totalEstimated ? Math.round((totalActual / totalEstimated) * 100) : 0}%</div>
          <div style={{ marginTop: 8 }}><div className="progress-bar"><div className={`fill ${totalActual / totalEstimated > 0.9 ? 'fill-red' : totalActual / totalEstimated > 0.7 ? 'fill-yellow' : 'fill-green'}`} style={{ width: `${Math.min(100, totalEstimated ? (totalActual / totalEstimated) * 100 : 0)}%` }}></div></div></div>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Estimated</th>
              <th>Actual</th>
              <th>Variance</th>
              <th>Vendor</th>
              <th>Status</th>
              <th>Priority</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const v = parseFloat(item.actual_cost || 0) - parseFloat(item.estimated_cost || 0);
              return (
                <tr key={item.id} onClick={() => setSelected(item)}>
                  <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.category}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</td>
                  <td className="money">${parseFloat(item.estimated_cost).toLocaleString()}</td>
                  <td className="money">${parseFloat(item.actual_cost).toLocaleString()}</td>
                  <td className={`money ${v > 0 ? 'money-negative' : v < 0 ? 'money-positive' : ''}`}>
                    {v !== 0 ? `${v > 0 ? '+' : ''}$${v.toLocaleString()}` : '-'}
                  </td>
                  <td>{item.vendor}</td>
                  <td><span className={`badge ${getBadge(item.status)}`}>{item.status}</span></td>
                  <td><span className={`badge ${getPriorityBadge(item.priority)}`}>{item.priority}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => load(p)} />

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.category} - {selected.description?.substring(0, 40)}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="label">Category</div><div className="value">{selected.category}</div></div>
                <div className="detail-item"><div className="label">Vendor</div><div className="value">{selected.vendor}</div></div>
                <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>
                <div className="detail-item"><div className="label">Estimated Cost</div><div className="value money">${parseFloat(selected.estimated_cost).toLocaleString()}</div></div>
                <div className="detail-item"><div className="label">Actual Cost</div><div className="value money">${parseFloat(selected.actual_cost).toLocaleString()}</div></div>
                <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status}</span></div></div>
                <div className="detail-item"><div className="label">Priority</div><div className="value"><span className={`badge ${getPriorityBadge(selected.priority)}`}>{selected.priority}</span></div></div>
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
              <h2>{editing ? 'Edit Budget Item' : 'New Budget Item'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select...</option>
                    {['Kitchen','Bathroom','Flooring','Electrical','HVAC','Painting','Windows','Landscaping','Structural','Roofing','Plumbing','Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Vendor</label><input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Estimated Cost ($)</label><input type="number" value={form.estimated_cost} onChange={(e) => setForm({ ...form, estimated_cost: e.target.value })} /></div>
                <div className="form-group"><label>Actual Cost ($)</label><input type="number" value={form.actual_cost} onChange={(e) => setForm({ ...form, actual_cost: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="planned">Planned</option><option value="ordered">Ordered</option><option value="in_progress">In Progress</option><option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group"><label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Notes</label><textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

              {!editing && form.category && form.estimated_cost && (
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-ai"
                    onClick={handleVariancePredict}
                    disabled={varianceLoading}
                    style={{ width: '100%', marginBottom: 10 }}
                  >
                    {varianceLoading ? '🤖 Predicting...' : '🤖 Predict Cost Variance Risk'}
                  </button>
                  {variancePrediction && (
                    <div style={{
                      padding: 14, borderRadius: 8, marginTop: 8,
                      background: variancePrediction.variance_risk === 'high' ? '#fef2f2' : variancePrediction.variance_risk === 'medium' ? '#fefce8' : '#f0fdf4',
                      border: `1px solid ${variancePrediction.variance_risk === 'high' ? '#fca5a5' : variancePrediction.variance_risk === 'medium' ? '#fde047' : '#86efac'}`,
                    }}>
                      {variancePrediction.variance_risk && (
                        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, color: variancePrediction.variance_risk === 'high' ? '#dc2626' : variancePrediction.variance_risk === 'medium' ? '#ca8a04' : '#16a34a' }}>
                          Risk: {variancePrediction.variance_risk?.toUpperCase()}
                          {variancePrediction.predicted_overrun_percent !== undefined && ` — Avg Overrun: ${variancePrediction.predicted_overrun_percent}%`}
                          {variancePrediction.predicted_actual_cost !== undefined && ` — Predicted Actual: $${variancePrediction.predicted_actual_cost?.toLocaleString()}`}
                        </div>
                      )}
                      <div style={{ fontSize: 13, color: '#374151' }}>{variancePrediction.warning_message || variancePrediction.historical_context}</div>
                      {variancePrediction.recommendations?.length > 0 && (
                        <ul style={{ margin: '8px 0 0', paddingLeft: 18, fontSize: 12, color: '#374151' }}>
                          {variancePrediction.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
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
              <h2>🤖 AI Budget Analysis</h2>
              <button className="modal-close" onClick={() => setShowAI(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {rateLimitError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: 16, marginBottom: 16, color: '#dc2626' }}>
                  {rateLimitError}
                </div>
              )}
              <AIResponse data={aiData} loading={aiLoading} />
              {aiData && <div style={{ marginTop: 16 }}><button className="btn btn-secondary btn-sm" onClick={() => { setAIData(null); handleAI(); }}>Refresh Analysis</button></div>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
