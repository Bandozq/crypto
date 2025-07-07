import "./env";
import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "./logger";
import type { AppError } from "@shared/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.apiResponse(req.method, path, res.statusCode, duration);
      if (capturedJsonResponse && logger['isDevelopment']) {
        logger.debug("Response data", "API", capturedJsonResponse);
      }
    }
  });

  next();
});

(async () => {
  logger.info("Starting crypto dashboard server", "STARTUP");
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`, "STARTUP");
  logger.info(`Database URL configured: ${!!process.env.DATABASE_URL}`, "STARTUP");
  
  const server = await registerRoutes(app);

  app.use((err: AppError, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`Server error ${status}: ${message}`, "ERROR", { 
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
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
    logger.debug(`Looking for static files in: ${distPath}`, "STATIC");
    
    if (!fs.existsSync(distPath)) {
      logger.error(`Build directory not found: ${distPath}`, "STATIC");
      logger.warn("Make sure to run 'npm run build' first", "STATIC");
      
      // Create a fallback response for missing build
      app.use("*", (_req, res) => {
        res.status(500).json({
          error: "Application not built",
          message: "Static files not found. Please run 'npm run build' first.",
          expectedPath: distPath
        });
      });
    } else {
      logger.info(`Static files found, serving from: ${distPath}`, "STATIC");
      
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
      logger.info(`Server running successfully on port ${port}`, "STARTUP");
      logger.info(`Health check available at: http://localhost:${port}/api/health`, "STARTUP");
      logger.info(`API base URL: http://localhost:${port}/api`, "STARTUP");
      
      // Test database connection on startup
      setTimeout(async () => {
        try {
          const response = await fetch(`http://localhost:${port}/api/health`);
          const healthData = await response.json();
          logger.info(`Startup health check: ${healthData.status === 'ok' ? 'HEALTHY' : 'UNHEALTHY'}`, "HEALTH");
        } catch (error) {
          logger.error('Startup health check failed', "HEALTH", error);
        }
      }, 2000);
    }
  );
})();
