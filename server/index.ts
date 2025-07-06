import "./env";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
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

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  console.log(`🚀 Starting crypto dashboard server...`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database URL configured: ${!!process.env.DATABASE_URL}`);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Server error ${status}:`, err);
    res.status(status).json({ 
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    
    if (status >= 500) {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: "custom",
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "../../dist/public");
    console.log(`📁 Looking for static files in: ${distPath}`);
    
    if (!fs.existsSync(distPath)) {
      console.error(`❌ Build directory not found: ${distPath}`);
      console.log(`📝 Make sure to run 'npm run build' first`);
      
      // Create a fallback response for missing build
      app.use("*", (_req, res) => {
        res.status(500).json({
          error: "Application not built",
          message: "Static files not found. Please run 'npm run build' first.",
          expectedPath: distPath
        });
      });
    } else {
      console.log(`✅ Static files found, serving from: ${distPath}`);
      
      // Serve static files with proper headers
      app.use(express.static(distPath, {
        maxAge: '1d',
        etag: true,
        lastModified: true
      }));
      
      // fall through to index.html if the file doesn't exist
      app.use("*", (_req, res) => {
        const indexPath = path.resolve(distPath, "index.html");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).json({
            error: "Frontend not found",
            message: "index.html missing from build directory"
          });
        }
      });
    }
  }

  const port = process.env.PORT || 5000;
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      console.log(`✅ Server running successfully on port ${port}`);
      console.log(`🌐 Health check available at: http://localhost:${port}/api/health`);
      console.log(`📊 API base URL: http://localhost:${port}/api`);
      
      // Test database connection on startup
      setTimeout(async () => {
        try {
          const response = await fetch(`http://localhost:${port}/api/health`);
          const healthData = await response.json();
          console.log(`🔍 Startup health check:`, healthData.status === 'ok' ? '✅ HEALTHY' : '❌ UNHEALTHY');
        } catch (error) {
          console.error(`🔍 Startup health check failed:`, error);
        }
      }, 2000);
    }
  );
})();
