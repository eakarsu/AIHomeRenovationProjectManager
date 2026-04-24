import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AIResponse from '../components/AIResponse';
import API from '../services/api';

const emptyContractor = {
  name: '', specialty: '', phone: '', email: '', license_number: '',
  insurance_verified: false, rating: '', hourly_rate: '', years_experience: '',
  location: '', availability_status: 'available', portfolio_url: '', notes: '',
};

export default function Contractors({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyContractor);
  const [editing, setEditing] = useState(false);
  const [showAIMatch, setShowAIMatch] = useState(false);
  const [aiData, setAIData] = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [matchForm, setMatchForm] = useState({ project_description: '', budget: '', timeline: '' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await API.get('/contractors');
    setItems(data);
  };

  const handleSave = async () => {
    if (editing) {
      await API.put(`/contractors/${form.id}`, form);
    } else {
      await API.post('/contractors', form);
    }
    setShowForm(false);
    setForm(emptyContractor);
    setEditing(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contractor?')) return;
    await API.delete(`/contractors/${id}`);
    setSelected(null);
    load();
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditing(true);
    setShowForm(true);
    setSelected(null);
  };

  const handleAIMatch = async () => {
    setAILoading(true);
    setAIData(null);
    try {
      const { data } = await API.post('/contractors/ai/match', matchForm);
      setAIData(data);
    } catch (err) {
      setAIData({ success: false, content: err.message });
    }
    setAILoading(false);
  };

  const handleAIVet = async (id) => {
    setAILoading(true);
    setAIData(null);
    setShowAIMatch(true);
    try {
      const { data } = await API.post(`/contractors/ai/vet/${id}`);
      setAIData(data);
    } catch (err) {
      setAIData({ success: false, content: err.message });
    }
    setAILoading(false);
  };

  const getBadge = (status) => {
    const map = { available: 'badge-green', busy: 'badge-yellow', unavailable: 'badge-red' };
    return map[status] || 'badge-gray';
  };

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Contractors</h1>
          <p>Manage and vet your renovation contractors</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-ai" onClick={() => { setShowAIMatch(true); setAIData(null); }}>
            🤖 AI Match
          </button>
          <button className="btn btn-primary" onClick={() => { setForm(emptyContractor); setEditing(false); setShowForm(true); }}>
            + New Contractor
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Specialty</th>
              <th>Rating</th>
              <th>Rate</th>
              <th>Experience</th>
              <th>Location</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} onClick={() => setSelected(item)}>
                <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.name}</td>
                <td>{item.specialty}</td>
                <td><span className="rating">{'★'.repeat(Math.round(item.rating))}{'☆'.repeat(5 - Math.round(item.rating))}</span> {item.rating}</td>
                <td className="money">${item.hourly_rate}/hr</td>
                <td>{item.years_experience} yrs</td>
                <td>{item.location}</td>
                <td><span className={`badge ${getBadge(item.availability_status)}`}>{item.availability_status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.name}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item"><div className="label">Specialty</div><div className="value">{selected.specialty}</div></div>
                <div className="detail-item"><div className="label">Rating</div><div className="value"><span className="rating">{'★'.repeat(Math.round(selected.rating))}</span> {selected.rating}/5</div></div>
                <div className="detail-item"><div className="label">Hourly Rate</div><div className="value money">${selected.hourly_rate}/hr</div></div>
                <div className="detail-item"><div className="label">Experience</div><div className="value">{selected.years_experience} years</div></div>
                <div className="detail-item"><div className="label">Phone</div><div className="value">{selected.phone}</div></div>
                <div className="detail-item"><div className="label">Email</div><div className="value">{selected.email}</div></div>
                <div className="detail-item"><div className="label">License</div><div className="value">{selected.license_number}</div></div>
                <div className="detail-item"><div className="label">Insurance</div><div className="value">{selected.insurance_verified ? '✅ Verified' : '❌ Not Verified'}</div></div>
                <div className="detail-item"><div className="label">Location</div><div className="value">{selected.location}</div></div>
                <div className="detail-item"><div className="label">Status</div><div className="value"><span className={`badge ${getBadge(selected.availability_status)}`}>{selected.availability_status}</span></div></div>
                {selected.notes && <div className="detail-item detail-full"><div className="label">Notes</div><div className="value">{selected.notes}</div></div>}
              </div>
              <div className="detail-actions">
                <button className="btn btn-ai btn-sm" onClick={() => handleAIVet(selected.id)}>🤖 AI Vet Report</button>
                <button className="btn btn-primary btn-sm" onClick={() => handleEdit(selected)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(selected.id)}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Contractor' : 'New Contractor'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Specialty</label>
                  <input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>License Number</label>
                  <input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Hourly Rate ($)</label>
                  <input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Years Experience</label>
                  <input type="number" value={form.years_experience} onChange={(e) => setForm({ ...form, years_experience: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Rating (0-5)</label>
                  <input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.availability_status} onChange={(e) => setForm({ ...form, availability_status: e.target.value })}>
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>
                  <input type="checkbox" checked={form.insurance_verified} onChange={(e) => setForm({ ...form, insurance_verified: e.target.checked })} style={{ marginRight: 8 }} />
                  Insurance Verified
                </label>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Match Modal */}
      {showAIMatch && (
        <div className="modal-overlay" onClick={() => setShowAIMatch(false)}>
          <div className="modal modal-ai" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🤖 AI Contractor Analysis</h2>
              <button className="modal-close" onClick={() => setShowAIMatch(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {!aiData && !aiLoading && (
                <div className="ai-form">
                  <div className="form-group">
                    <label>Project Description</label>
                    <textarea value={matchForm.project_description} onChange={(e) => setMatchForm({ ...matchForm, project_description: e.target.value })} placeholder="Describe your renovation project..." />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Budget ($)</label>
                      <input type="number" value={matchForm.budget} onChange={(e) => setMatchForm({ ...matchForm, budget: e.target.value })} placeholder="50000" />
                    </div>
                    <div className="form-group">
                      <label>Timeline</label>
                      <input value={matchForm.timeline} onChange={(e) => setMatchForm({ ...matchForm, timeline: e.target.value })} placeholder="e.g., 3 months" />
                    </div>
                  </div>
                  <button className="btn btn-ai" onClick={handleAIMatch}>Find Best Matches</button>
                </div>
              )}
              <AIResponse data={aiData} loading={aiLoading} />
              {aiData && (
                <div style={{ marginTop: 16 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setAIData(null); setAILoading(false); }}>New Analysis</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
