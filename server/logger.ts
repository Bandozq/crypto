type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMessage {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = this.isDevelopment ? 'debug' : 'info';

  private formatMessage(level: LogLevel, message: string, context?: string, data?: unknown): LogMessage {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      data
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    return levels[level] >= levels[this.logLevel];
  }

  private output(logMessage: LogMessage): void {
    if (!this.shouldLog(logMessage.level)) return;

    const { timestamp, level, message, context, data } = logMessage;
    const contextStr = context ? ` [${context}]` : '';
    const prefix = `${timestamp} ${level.toUpperCase()}${contextStr}:`;

    if (this.isDevelopment) {
      // Colorful output for development
      const colors = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[32m',  // green
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m'  // red
      };
      const reset = '\x1b[0m';
      console.log(`${colors[level]}${prefix}${reset} ${message}`);
      if (data) {
        console.log(`${colors[level]}Data:${reset}`, data);
      }
    } else {
      // Structured JSON output for production
      console.log(JSON.stringify(logMessage));
    }
  }

  debug(message: string, context?: string, data?: unknown): void {
    this.output(this.formatMessage('debug', message, context, data));
  }

  info(message: string, context?: string, data?: unknown): void {
    this.output(this.formatMessage('info', message, context, data));
  }

  warn(message: string, context?: string, data?: unknown): void {
    this.output(this.formatMessage('warn', message, context, data));
  }

  error(message: string, context?: string, data?: unknown): void {
    this.output(this.formatMessage('error', message, context, data));
  }

  // Helper methods for common patterns
  apiRequest(method: string, path: string, params?: unknown): void {
    this.info(`${method} ${path}`, 'API', params);
  }

  apiResponse(method: string, path: string, status: number, responseTime?: number): void {
    const message = `${method} ${path} ${status}${responseTime ? ` in ${responseTime}ms` : ''}`;
    if (status >= 500) {
      this.error(message, 'API');
    } else if (status >= 400) {
      this.warn(message, 'API');
    } else {
      this.info(message, 'API');
    }
  }

  databaseQuery(query: string, duration?: number): void {
    this.debug(`Query executed${duration ? ` in ${duration}ms` : ''}`, 'DB', { query });
  }

  databaseError(error: Error, query?: string): void {
    this.error('Database operation failed', 'DB', { error: error.message, query });
  }

  websocket(event: string, data?: unknown): void {
    this.debug(`WebSocket ${event}`, 'WS', data);
  }

  scraper(source: string, message: string, data?: unknown): void {
    this.info(message, `SCRAPER-${source.toUpperCase()}`, data);
  }

  scraperError(source: string, error: Error): void {
    this.error(`Scraping failed: ${error.message}`, `SCRAPER-${source.toUpperCase()}`, { error: error.message });
  }
}

export const logger = new Logger();