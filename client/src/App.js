import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contractors from './pages/Contractors';
import Permits from './pages/Permits';
import Budget from './pages/Budget';
import ChangeOrders from './pages/ChangeOrders';
import Designs from './pages/Designs';
import Timeline from './pages/Timeline';
import Projects from './pages/Projects';
import Materials from './pages/Materials';
import Inspections from './pages/Inspections';
import Documents from './pages/Documents';
import Vendors from './pages/Vendors';
import Rooms from './pages/Rooms';
import PunchList from './pages/PunchList';
import Communications from './pages/Communications';
import Warranties from './pages/Warranties';
import DailyLog from './pages/DailyLog';
import Photos from './pages/Photos';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || 'null'));

  const handleLogin = (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const P = ({ children }) => token ? children : <Navigate to="/login" />;
  const props = { user, onLogout: handleLogout };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/" element={<P><Dashboard {...props} /></P>} />
        <Route path="/projects" element={<P><Projects {...props} /></P>} />
        <Route path="/contractors" element={<P><Contractors {...props} /></P>} />
        <Route path="/permits" element={<P><Permits {...props} /></P>} />
        <Route path="/budget" element={<P><Budget {...props} /></P>} />
        <Route path="/change-orders" element={<P><ChangeOrders {...props} /></P>} />
        <Route path="/designs" element={<P><Designs {...props} /></P>} />
        <Route path="/timeline" element={<P><Timeline {...props} /></P>} />
        <Route path="/materials" element={<P><Materials {...props} /></P>} />
        <Route path="/inspections" element={<P><Inspections {...props} /></P>} />
        <Route path="/documents" element={<P><Documents {...props} /></P>} />
        <Route path="/vendors" element={<P><Vendors {...props} /></P>} />
        <Route path="/rooms" element={<P><Rooms {...props} /></P>} />
        <Route path="/punchlist" element={<P><PunchList {...props} /></P>} />
        <Route path="/communications" element={<P><Communications {...props} /></P>} />
        <Route path="/warranties" element={<P><Warranties {...props} /></P>} />
        <Route path="/daily-log" element={<P><DailyLog {...props} /></P>} />
        <Route path="/photos" element={<P><Photos {...props} /></P>} />
        <Route path="/payments" element={<P><Payments {...props} /></P>} />
        <Route path="/reports" element={<P><Reports {...props} /></P>} />
      </Routes>
    </Router>
  );
}

export default App;
