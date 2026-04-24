import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import API from '../services/api';

const emptyPhoto = {
  title: '', room: '', phase: 'before', description: '', photo_url: '',
  taken_date: '', tags: '', notes: '',
};

export default function Photos({ user, onLogout }) {
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyPhoto);
  const [editing, setEditing] = useState(false);
  const [filterRoom, setFilterRoom] = useState('');
  const [filterPhase, setFilterPhase] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await API.get('/photos');
    setItems(data);
  };

  const handleSave = async () => {
    if (editing) {
      await API.put(`/photos/${form.id}`, form);
    } else {
      await API.post('/photos', form);
    }
    setShowForm(false);
    setForm(emptyPhoto);
    setEditing(false);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this photo?')) return;
    await API.delete(`/photos/${id}`);
    setSelected(null);
    load();
  };

  const handleEdit = (item) => {
    setForm(item);
    setEditing(true);
    setShowForm(true);
    setSelected(null);
  };

  const getPhaseBadge = (phase) => {
    const map = { before: 'badge-blue', during: 'badge-yellow', after: 'badge-green' };
    return map[phase] || 'badge-gray';
  };

  const filtered = items.filter((item) => {
    if (filterRoom && item.room !== filterRoom) return false;
    if (filterPhase && item.phase !== filterPhase) return false;
    return true;
  });

  const uniqueRooms = [...new Set(items.map((item) => item.room).filter(Boolean))];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Photos</h1>
          <p>Before/after photo gallery for tracking renovation progress</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => { setForm(emptyPhoto); setEditing(false); setShowForm(true); }}>
            + New Photo
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select
          value={filterRoom}
          onChange={(e) => setFilterRoom(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9' }}
        >
          <option value="">All Rooms</option>
          {uniqueRooms.map((room) => (
            <option key={room} value={room}>{room}</option>
          ))}
        </select>
        <select
          value={filterPhase}
          onChange={(e) => setFilterPhase(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9' }}
        >
          <option value="">All Phases</option>
          <option value="before">Before</option>
          <option value="during">During</option>
          <option value="after">After</option>
        </select>
      </div>

      {/* Gallery Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {filtered.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelected(item)}
            style={{
              background: '#0f172a', borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
              border: '1px solid #1e293b', transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1e293b'}
          >
            {item.photo_url ? (
              <img
                src={item.photo_url}
                alt={item.title}
                style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div style={{ width: '100%', height: 200, background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: 14 }}>
                No Photo
              </div>
            )}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <h3 style={{ margin: 0, fontSize: 16, color: '#f1f5f9', fontWeight: 600 }}>{item.title}</h3>
                <span className={`badge ${getPhaseBadge(item.phase)}`}>{item.phase}</span>
              </div>
              {item.room && <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{item.room}</div>}
              {item.description && <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{item.description}</div>}
              {item.taken_date && <div style={{ fontSize: 12, color: '#475569' }}>{new Date(item.taken_date).toLocaleDateString()}</div>}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          No photos found. Add your first renovation photo to get started.
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected.title}</h2>
              <button className="modal-close" onClick={() => setSelected(null)}>&times;</button>
            </div>
            <div className="modal-body">
              {selected.photo_url && (
                <div style={{ marginBottom: 16 }}>
                  <img src={selected.photo_url} alt={selected.title} style={{ width: '100%', borderRadius: 8, maxHeight: 400, objectFit: 'contain' }} />
                </div>
              )}
              <div className="detail-grid">
                <div className="detail-item"><div className="label">Room</div><div className="value">{selected.room}</div></div>
                <div className="detail-item"><div className="label">Phase</div><div className="value"><span className={`badge ${getPhaseBadge(selected.phase)}`}>{selected.phase}</span></div></div>
                {selected.taken_date && <div className="detail-item"><div className="label">Date Taken</div><div className="value">{new Date(selected.taken_date).toLocaleDateString()}</div></div>}
                {selected.tags && <div className="detail-item"><div className="label">Tags</div><div className="value">{selected.tags}</div></div>}
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

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Photo' : 'New Photo'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Title</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Room</label>
                  <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phase</label>
                  <select value={form.phase} onChange={(e) => setForm({ ...form, phase: e.target.value })}>
                    <option value="before">Before</option>
                    <option value="during">During</option>
                    <option value="after">After</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date Taken</label>
                  <input type="date" value={form.taken_date ? form.taken_date.substring(0, 10) : ''} onChange={(e) => setForm({ ...form, taken_date: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>Photo URL</label>
                <input value={form.photo_url || ''} onChange={(e) => setForm({ ...form, photo_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g., demolition, flooring, paint" />
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
    </Layout>
  );
}
