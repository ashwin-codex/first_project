import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRouter from './routes';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';

// Load environment configurations
dotenv.config();

const app = express();

// Secure application with HTTP headers
app.use(helmet());

// Configure Cross-Origin Resource Sharing
app.use(
  cors({
    origin: '*', // Allow all origins for dev/sandbox portability, easily restricted in prod
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all standard APIs
app.use('/api', apiRateLimiter);

// Register base routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Capture 404 Route Not Found
app.use((req, res) => {
  res.status(404).json({ message: `Resource not found: ${req.method} ${req.url}` });
});

// Centralized error boundary
app.use(errorHandler);

export default app;
