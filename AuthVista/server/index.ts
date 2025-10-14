import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    console.log('🚀 Starting Tadoba Conservation System...');
    
    // Test database connection
    console.log('📊 Testing database connection...');
    const { sqlite } = await import('./db');
    sqlite.exec('SELECT 1');
    console.log('✅ Database connected successfully');
    
    // Register routes
    console.log('🔌 Registering routes...');
    const server = await registerRoutes(app);
    console.log('✅ Routes registered successfully');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    console.log('⚡ Setting up Vite...');
    if (app.get("env") === "development") {
      await setupVite(app, server);
      console.log('✅ Vite setup complete');
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, () => {
      console.log('✅ Server listening successfully');
      log(`serving on port ${port}`);
      console.log(`🌐 http://localhost:${port}`);
      console.log('🎯 Ready to accept requests!');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    process.exit(1);
  }
})().catch(error => {
  console.error('❌ Unhandled promise rejection:', error);
  console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
  process.exit(1);
});
