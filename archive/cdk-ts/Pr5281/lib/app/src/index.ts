// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore express is installed at compile time
import express from 'express';

const app = express();
const port = process.env['PORT'] || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req: any, res: any) => {
  console.log(req.headers);
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (req: any, res: any) => {
  console.log(req.headers);
  res.json({
    message: 'Welcome to IAC Test Automations API',
    company: process.env['COMPANY'] || 'Default Company',
    division: process.env['DIVISION'] || 'Default Division',
    version: '1.0.0',
    environment: process.env['NODE_ENV'] || 'development',
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
