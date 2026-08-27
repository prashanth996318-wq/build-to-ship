import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { loadEnv } from './config/env';
import { advisoryRouter } from './routes/advisories';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Load and validate environment variables before anything else
const env = loadEnv();

const app = express();

// ---------------------------------------------------------------------------
// Security headers
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ---------------------------------------------------------------------------
// Body parsing (with a sensible size limit to prevent abuse)
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '100kb' }));

// ---------------------------------------------------------------------------
// General rate limiter — broad protection
// ---------------------------------------------------------------------------
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
});

// Stricter limiter for AI advisory generation (expensive operation)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many advisory requests. Please wait a moment before trying again.',
    },
  },
});

app.use(generalLimiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: '🌱 Agriculture Advisor Backend API is running.',
    frontend_web_app: env.FRONTEND_ORIGIN,
    health_check: '/api/health',
  });
});

app.use('/api/health', healthRouter);
app.use('/api/advisories', advisoryRouter(aiLimiter));

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
const PORT = parseInt(env.PORT, 10);

app.listen(PORT, () => {
  console.log(`\n🌱  Agriculture Advisor API`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Port        : ${PORT}`);
  console.log(`   CORS origin : ${env.FRONTEND_ORIGIN}`);
  console.log(`   Gemini model: ${env.GEMINI_MODEL}\n`);
});

export default app;
