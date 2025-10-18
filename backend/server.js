const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables - fix for deployment
if (process.env.NODE_ENV === 'production') {
  // In production, use environment variables directly (Render sets them)
  dotenv.config();
} else {
  // In development, try to load from backend/.env
  dotenv.config({ path: './backend/.env' });
}

const app = express();

// Middleware - CORS (explicit origin required when using credentials)
const ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(s => s.trim());

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without origin (like curl or same-origin) and allowed origins
    if (!origin || ORIGINS.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/email-deliverability-tool', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected Successfully'))
.catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/email-tests', require('./routes/emailTests'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/admin', require('./routes/admin'));

// Quick health ping for frontend diagnostics
app.get('/api/ping', (req, res) => {
  res.json({ ok: true, origin: req.get('origin') || null, time: new Date().toISOString() });
});

// Health Check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Email Deliverability Testing Tool API',
    version: '1.0.0',
    status: 'running',
    description: 'Test email deliverability across multiple providers'
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
