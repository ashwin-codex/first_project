import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Attempt connection to MongoDB
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`PocketPilot Server running in development mode on port ${PORT}`);
      console.log(`Base URL path: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown hooks
    const shutdown = () => {
      console.log('Shutting down server connections...');
      server.close(() => {
        console.log('Server process terminated gracefully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    console.error('Critical process startup exception:', error);
    process.exit(1);
  }
};

startServer();
