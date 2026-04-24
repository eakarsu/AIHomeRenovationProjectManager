import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import API from '../services/api';

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const [projects, contractors, permits, budget, changes, designs, timeline, materials, inspections, documents, vendors, rooms, punchlist, communications, warranties] = await Promise.all([
        API.get('/projects'), API.get('/contractors'), API.get('/permits'), API.get('/budget'),
        API.get('/budget/change-orders/all'), API.get('/designs'), API.get('/timeline'),
        API.get('/materials'), API.get('/inspections'), API.get('/documents'),
        API.get('/vendors'), API.get('/rooms'), API.get('/punchlist'),
        API.get('/communications'), API.get('/warranties'),
      ]);

      const totalBudget = budget.data.reduce((s, i) => s + parseFloat(i.estimated_cost || 0), 0);
      const totalSpent = budget.data.reduce((s, i) => s + parseFloat(i.actual_cost || 0), 0);
      const completedTasks = timeline.data.filter(t => t.status === 'completed').length;

      setStats({
        projects: projects.data.length, activeProjects: projects.data.filter(p => p.status === 'in_progress').length,
        contractors: contractors.data.length, availableContractors: contractors.data.filter(c => c.availability_status === 'available').length,
        permits: permits.data.length, approvedPermits: permits.data.filter(p => p.status === 'approved').length,
        pendingPermits: permits.data.filter(p => p.status === 'pending').length,
        budgetItems: budget.data.length, totalBudget, totalSpent,
        changeOrders: changes.data.length, pendingChanges: changes.data.filter(c => c.status === 'pending').length,
        designs: designs.data.length,
        tasks: timeline.data.length, completedTasks,
        progress: timeline.data.length ? Math.round((completedTasks / timeline.data.length) * 100) : 0,
        materials: materials.data.length, deliveredMaterials: materials.data.filter(m => m.status === 'delivered' || m.status === 'installed').length,
        inspections: inspections.data.length, passedInspections: inspections.data.filter(i => i.result === 'passed').length,
        documents: documents.data.length,
        vendors: vendors.data.length,
        rooms: rooms.data.length, roomsInProgress: rooms.data.filter(r => r.status === 'in_progress').length,
        punchlist: punchlist.data.length, openPunch: punchlist.data.filter(p => p.status === 'open').length,
        communications: communications.data.length, openComms: communications.data.filter(c => c.status === 'open').length,
        warranties: warranties.data.length, activeWarranties: warranties.data.filter(w => w.status === 'active').length,
      });
    } catch (err) { console.error('Failed to load stats:', err); }
  };

  const cards = [
    { title:'Projects', description:'Manage renovation projects, timelines, and budgets. AI portfolio analysis.', icon:'🏗️', path:'/projects', accent:'#06b6d4',
      stats:[{label:'Total',value:stats.projects||0},{label:'Active',value:stats.activeProjects||0}]},
    { title:'Contractors', description:'Match, vet, and manage contractors. AI-powered matching and vetting reports.', icon:'👷', path:'/contractors', accent:'#3b82f6',
      stats:[{label:'Total',value:stats.contractors||0},{label:'Available',value:stats.availableContractors||0}]},
    { title:'Permits', description:'Track building permits, inspections, and compliance. AI permit advisor.', icon:'📋', path:'/permits', accent:'#22c55e',
      stats:[{label:'Total',value:stats.permits||0},{label:'Approved',value:stats.approvedPermits||0}]},
    { title:'Budget', description:'Manage renovation budget with detailed cost tracking. AI budget analysis.', icon:'💰', path:'/budget', accent:'#eab308',
      stats:[{label:'Budget',value:`$${(stats.totalBudget||0).toLocaleString()}`},{label:'Spent',value:`$${(stats.totalSpent||0).toLocaleString()}`}]},
    { title:'Change Orders', description:'Track scope changes, cost adjustments, and their project impact.', icon:'📝', path:'/change-orders', accent:'#f97316',
      stats:[{label:'Total',value:stats.changeOrders||0},{label:'Pending',value:stats.pendingChanges||0}]},
    { title:'Designs', description:'Room designs, color palettes, and materials. AI design visualization.', icon:'🎨', path:'/designs', accent:'#a855f7',
      stats:[{label:'Designs',value:stats.designs||0}]},
    { title:'Timeline', description:'Project scheduling, task dependencies, and progress. AI optimization.', icon:'📅', path:'/timeline', accent:'#ec4899',
      stats:[{label:'Tasks',value:stats.tasks||0},{label:'Progress',value:`${stats.progress||0}%`}]},
    { title:'Materials', description:'Track materials, deliveries, costs, and suppliers. AI cost optimization.', icon:'🧱', path:'/materials', accent:'#78716c',
      stats:[{label:'Total',value:stats.materials||0},{label:'Delivered',value:stats.deliveredMaterials||0}]},
    { title:'Inspections', description:'Schedule and track building inspections. AI preparation guides.', icon:'🔍', path:'/inspections', accent:'#14b8a6',
      stats:[{label:'Total',value:stats.inspections||0},{label:'Passed',value:stats.passedInspections||0}]},
    { title:'Rooms', description:'Room-by-room renovation tracking with scope and cost. AI room planner.', icon:'🏠', path:'/rooms', accent:'#8b5cf6',
      stats:[{label:'Total',value:stats.rooms||0},{label:'In Progress',value:stats.roomsInProgress||0}]},
    { title:'Vendors', description:'Manage material vendors and suppliers. AI vendor comparison.', icon:'🏪', path:'/vendors', accent:'#0ea5e9',
      stats:[{label:'Total',value:stats.vendors||0}]},
    { title:'Documents', description:'Project document management and organization. AI document review.', icon:'📁', path:'/documents', accent:'#64748b',
      stats:[{label:'Total',value:stats.documents||0}]},
    { title:'Punch List', description:'Track items needing fixes or attention. AI prioritization.', icon:'✅', path:'/punchlist', accent:'#ef4444',
      stats:[{label:'Total',value:stats.punchlist||0},{label:'Open',value:stats.openPunch||0}]},
    { title:'Communications', description:'Log all project communications. AI message drafting.', icon:'💬', path:'/communications', accent:'#6366f1',
      stats:[{label:'Total',value:stats.communications||0},{label:'Open',value:stats.openComms||0}]},
    { title:'Warranties', description:'Track product and workmanship warranties. AI warranty review.', icon:'🛡️', path:'/warranties', accent:'#059669',
      stats:[{label:'Total',value:stats.warranties||0},{label:'Active',value:stats.activeWarranties||0}]},
  ];

  return (
    <Layout user={user} onLogout={onLogout}>
      <div className="page-header">
        <div>
          <h1>Project Dashboard</h1>
          <p>Welcome back, {user?.name}. Here's your renovation overview.</p>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card"><div className="label">Total Budget</div><div className="value money">${(stats.totalBudget || 0).toLocaleString()}</div><div className="sub">{stats.budgetItems || 0} line items</div></div>
        <div className="summary-card"><div className="label">Total Spent</div><div className="value money">${(stats.totalSpent || 0).toLocaleString()}</div><div className="sub">{stats.totalBudget ? Math.round((stats.totalSpent / stats.totalBudget) * 100) : 0}% of budget</div></div>
        <div className="summary-card"><div className="label">Project Progress</div><div className="value">{stats.progress || 0}%</div><div style={{ marginTop: 8 }}><div className="progress-bar"><div className="fill fill-blue" style={{ width: `${stats.progress || 0}%` }}></div></div></div></div>
        <div className="summary-card"><div className="label">Active Projects</div><div className="value">{stats.activeProjects || 0}</div><div className="sub">of {stats.projects || 0} total</div></div>
      </div>

      <div className="dashboard-grid">
        {cards.map((card) => (
          <div key={card.path} className="dashboard-card" style={{ '--card-accent': card.accent }} onClick={() => navigate(card.path)}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-title">{card.title}</div>
            <div className="card-description">{card.description}</div>
            <div className="card-stats">
              {card.stats.map((stat, i) => (
                <div key={i} className="card-stat"><span className="stat-value">{stat.value}</span> {stat.label}</div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
