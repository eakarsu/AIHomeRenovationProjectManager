import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const emptyTask = {
  task_name: '', phase: '', description: '', start_date: '', end_date: '',
  assigned_contractor: '', status: 'not_started', dependencies: '',
  priority: 'medium', completion_percentage: 0, notes: '',
};

export default function Timeline({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyTask);
  const [editing, setEditing] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiMode, setAIMode] = useState('optimize');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await API.get('/timeline');
    setItems(Array.isArray(data) ? data : (data.data || []));
  };

  const handleSave = async () => {
    if (editing) {
      await API.put(`/timeline/${form.id}`, form);
    } else {
      await API.post('/timeline', form);
    }
    setShowForm(false);
    setForm(emptyTask);
    setEditing(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    await API.delete(`/timeline/${id}`);
    setSelected(null);
    load();
  };

  const handleEdit = (item) => {
    setForm({ ...item, start_date: item.start_date?.split('T')[0] || '', end_date: item.end_date?.split('T')[0] || '' });
    setEditing(true);
    setShowForm(true);
    setSelected(null);
  };

  const handleAI = async (mode) => {
    setAILoading(true);
    setAIData(null);
    setAIMode(mode);
    setShowAI(true);
    try {
      const endpoint = mode === 'optimize' ? '/timeline/ai/optimize' : '/timeline/ai/conflicts';
      const { data } = await API.post(endpoint);
      setAIData(data);
    } catch (err) {
      setAIData({ success: false, content: err.message });
    }
    setAILoading(false);
  };

  const completed = items.filter(i => i.status === 'completed').length;
  const inProgress = items.filter(i => i.status === 'in_progress').length;
  const progress = items.length ? Math.round((completed / items.length) * 100) : 0;

  const getBadge = (status) => {
    const map = { completed: 'badge-green', in_progress: 'badge-blue', not_started: 'badge-gray', delayed: 'badge-red', on_hold: 'badge-yellow' };
    return map[status] || 'badge-gray';
  };

  const getPriorityBadge = (p) => {
    const map = { critical: 'badge-red', high: 'badge-yellow', medium: 'badge-blue', low: 'badge-gray' };
    return map[p] || 'badge-gray';
  };

  const getProgressColor = (pct) => {
    if (pct >= 80) return 'fill-green';
    if (pct >= 40) return 'fill-blue';
    if (pct > 0) return 'fill-yellow';
    return 'fill-gray';
  };

  const phases = [...new Set(items.map(i => i.phase))];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Project Timeline</h1>
          <p>Track tasks, phases, and project progress</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={() => handleAI('optimize')}>🤖 AI Optimize</button>
          <button className="btn btn-ai" onClick={() => handleAI('conflicts')} style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>⚠️ Detect Conflicts</button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyTask); setEditing(false); setShowForm(true); }}>+ New Task</button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Tasks</div><div className="value">{items.length}</div></div>
        <div className="summary-card"><div className="label">Completed</div><div className="value" style={{ color: '#4ade80' }}>{completed}</div></div>
        <div className="summary-card"><div className="label">In Progress</div><div className="value" style={{ color: '#60a5fa' }}>{inProgress}</div></div>
        <div className="summary-card">
          <div className="label">Overall Progress</div>
          <div className="value">{progress}%</div>
          <div style={{ marginTop: 8 }}><div className="progress-bar"><div className={`fill ${getProgressColor(progress)}`} style={{ width: `${progress}%` }}></div></div></div>
        </div>
      </div>

      {phases.map(phase => (
        <div key={phase} style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', marginBottom: 12, paddingLeft: 4 }}>{phase}</h3>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Contractor</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Progress</th>
                  <th>Priority</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.filter(i => i.phase === phase).map((item) => (
                  <tr key={item.id} onClick={() => setSelected(item)}>
                    <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.task_name}</td>
                    <td>{item.assigned_contractor || '-'}</td>
                    <td>{item.start_date?.split('T')[0]}</td>
                    <td>{item.end_date?.split('T')[0]}</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className={`fill ${getProgressColor(item.completion_percentage)}`} style={{ width: `${item.completion_percentage}%` }}></div>
                        </div>
                        <span style={{ fontSize: 12, color: '#94a3b8', minWidth: 32 }}>{item.completion_percentage}%</span>
                      </div>
                    </td>
                    <td><span className={`badge ${getPriorityBadge(item.priority)}`}>{item.priority}</span></td>
                    <td><span className={`badge ${getBadge(item.status)}`}>{item.status?.replace('_', ' ')}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.task_name}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>Progress</span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{selected.completion_percentage}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className={`fill ${getProgressColor(selected.completion_percentage)}`} style={{ width: `${selected.completion_percentage}%` }}></div>
                </div>
              </div>
              <div className="detail-grid">
                <div className="detail-item"><div className="label">Phase</div><div className="value">{selected.phase}</div></div>
                <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.status)}`}>{selected.status?.replace('_', ' ')}</span></div></div>
                <div className="detail-item"><div className="label">Start Date</div><div className="value">{selected.start_date?.split('T')[0]}</div></div>
                <div className="detail-item"><div className="label">End Date</div><div className="value">{selected.end_date?.split('T')[0]}</div></div>
                <div className="detail-item"><div className="label">Contractor</div><div className="value">{selected.assigned_contractor || 'Unassigned'}</div></div>
                <div className="detail-item"><div className="label">Priority</div><div className="value"><span className={`badge ${getPriorityBadge(selected.priority)}`}>{selected.priority}</span></div></div>
                {selected.dependencies && <div className="detail-item detail-full"><div className="label">Dependencies</div><div className="value">{selected.dependencies}</div></div>}
                {selected.description && <div className="detail-item detail-full"><div className="label">Description</div><div className="value">{selected.description}</div></div>}
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
              <h2>{editing ? 'Edit Task' : 'New Task'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label>Task Name</label><input value={form.task_name} onChange={(e) => setForm({ ...form, task_name: e.target.value })} /></div>
                <div className="form-group"><label>Phase</label><input value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })} placeholder="e.g., Phase 1" /></div>
              </div>
              <div className="form-group"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-row">
                <div className="form-group"><label>Start Date</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div className="form-group"><label>End Date</label><input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Assigned Contractor</label><input value={form.assigned_contractor} onChange={(e) => setForm({ ...form, assigned_contractor: e.target.value })} /></div>
                <div className="form-group"><label>Dependencies</label><input value={form.dependencies} onChange={(e) => setForm({ ...form, dependencies: e.target.value })} placeholder="Comma-separated task names" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="not_started">Not Started</option><option value="in_progress">In Progress</option><option value="completed">Completed</option><option value="delayed">Delayed</option><option value="on_hold">On Hold</option>
                  </select>
                </div>
                <div className="form-group"><label>Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Completion: {form.completion_percentage}%</label>
                <input type="range" min="0" max="100" value={form.completion_percentage} onChange={(e) => setForm({ ...form, completion_percentage: parseInt(e.target.value) })} style={{ width: '100%' }} />
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
              <h2>🤖 {aiMode === 'optimize' ? 'AI Timeline Optimization' : 'AI Conflict Detection'}</h2>
              <button className="modal-close" onClick={() => setShowAI(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <AIResponse data={aiData} loading={aiLoading} />
              {aiData && <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => handleAI(aiMode)}>Refresh</button>
              </div>}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
