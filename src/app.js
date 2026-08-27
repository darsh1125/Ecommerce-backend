import express from 'express';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(express.json());

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'E-commerce API is running',
  });
});

// Routes
app.use('/api/auth', authRoutes);

export default app;
