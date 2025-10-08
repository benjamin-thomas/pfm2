import express from 'express';

const app = express();
const PORT = process.env.PORT || 8086;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS - allow frontend
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5176');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/hello/:name', (req, res) => {
  res.json({ message: `Hello, ${req.params.name}!` });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
