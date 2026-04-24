const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/contractors', require('./routes/contractors'));
app.use('/api/permits', require('./routes/permits'));
app.use('/api/budget', require('./routes/budget'));
app.use('/api/designs', require('./routes/designs'));
app.use('/api/timeline', require('./routes/timeline'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/inspections', require('./routes/inspections'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/punchlist', require('./routes/punchlist'));
app.use('/api/communications', require('./routes/communications'));
app.use('/api/warranties', require('./routes/warranties'));
app.use('/api/dailylog', require('./routes/dailylog'));
app.use('/api/photos', require('./routes/photos'));
app.use('/api/payments', require('./routes/payments'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🏠 Home Renovation API running on port ${PORT}`);
});
