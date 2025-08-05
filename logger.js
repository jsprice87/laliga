// Production-ready logging system for La Liga del Fuego
'use strict';

/********************
 * Logger Class      *
 ********************/
class Logger {
  constructor(config = {}) {
    this.level = config.level || (this.isProduction() ? 'warn' : 'debug');
    this.enableRemoteLogging = config.enableRemoteLogging || false;
    this.remoteEndpoint = config.remoteEndpoint || '/api/logs';
    this.bufferSize = config.bufferSize || 50;
    this.flushInterval = config.flushInterval || 30000; // 30 seconds
    
    this.logBuffer = [];
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4
    };
    
    this.currentLevel = this.levels[this.level] || this.levels.info;
    
    // Start periodic flush if remote logging is enabled
    if (this.enableRemoteLogging) {
      this.startPeriodicFlush();
    }
    
    // Setup error tracking
    this.setupErrorTracking();
  }

  // Check if running in production
  isProduction() {
    return location.hostname !== 'localhost' && 
           location.hostname !== '127.0.0.1' && 
           !location.hostname.includes('dev');
  }

  // Format log message with timestamp and context
  formatMessage(level, message, data = null, context = null) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      context,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    return {
      formatted: `${timestamp} ${level.toUpperCase()} ${contextStr} ${message}`,
      entry: logEntry
    };
  }

  // Core logging method
  log(level, message, data = null, context = null) {
    if (this.levels[level] < this.currentLevel) {
      return; // Skip if below current log level
    }

    const { formatted, entry } = this.formatMessage(level, message, data, context);

    // Console output with appropriate method
    switch (level) {
      case 'debug':
        console.debug(formatted, data || '');
        break;
      case 'info':
        console.info(formatted, data || '');
        break;
      case 'warn':
        console.warn(formatted, data || '');
        break;
      case 'error':
      case 'fatal':
        console.error(formatted, data || '');
        break;
      default:
        console.log(formatted, data || '');
    }

    // Add to buffer for remote logging
    if (this.enableRemoteLogging) {
      this.addToBuffer(entry);
    }

    // Immediate flush for errors and fatal logs
    if ((level === 'error' || level === 'fatal') && this.enableRemoteLogging) {
      this.flushBuffer();
    }
  }

  // Convenience methods
  debug(message, data = null, context = null) {
    this.log('debug', message, data, context);
  }

  info(message, data = null, context = null) {
    this.log('info', message, data, context);
  }

  warn(message, data = null, context = null) {
    this.log('warn', message, data, context);
  }

  error(message, data = null, context = null) {
    this.log('error', message, data, context);
  }

  fatal(message, data = null, context = null) {
    this.log('fatal', message, data, context);
  }

  // Game-specific logging methods
  gameEvent(event, data = null) {
    this.info(`🎮 ${event}`, data, 'GAME');
  }

  gameSuccess(message, data = null) {
    this.info(`✅ ${message}`, data, 'SUCCESS');
  }

  gameError(message, error = null) {
    this.error(`❌ ${message}`, error, 'ERROR');
  }

  apiCall(method, endpoint, data = null) {
    this.debug(`📡 ${method} ${endpoint}`, data, 'API');
  }

  apiSuccess(method, endpoint, response = null) {
    this.info(`✅ ${method} ${endpoint} - Success`, response, 'API');
  }

  apiError(method, endpoint, error = null) {
    this.error(`❌ ${method} ${endpoint} - Failed`, error, 'API');
  }

  // Performance logging
  performance(operation, duration, data = null) {
    const level = duration > 1000 ? 'warn' : 'info';
    this.log(level, `⏱️ ${operation} took ${duration}ms`, data, 'PERFORMANCE');
  }

  // Add log to buffer for remote sending
  addToBuffer(entry) {
    this.logBuffer.push(entry);
    
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushBuffer();
    }
  }

  // Send logs to remote endpoint
  async flushBuffer() {
    if (this.logBuffer.length === 0) return;

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      await fetch(this.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          logs: logsToSend,
          source: 'frontend',
          timestamp: Date.now()
        })
      });
    } catch (error) {
      // Failed to send logs - add them back to buffer
      this.logBuffer.unshift(...logsToSend);
      console.warn('Failed to send logs to remote endpoint:', error);
    }
  }

  // Start periodic flush
  startPeriodicFlush() {
    setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  // Setup global error tracking
  setupErrorTracking() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.fatal('Unhandled JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.fatal('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      });
    });
  }

  // Change log level at runtime
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.level = level;
      this.currentLevel = this.levels[level];
      this.info(`Log level changed to: ${level.toUpperCase()}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  // Enable/disable remote logging
  setRemoteLogging(enabled, endpoint = null) {
    this.enableRemoteLogging = enabled;
    if (endpoint) {
      this.remoteEndpoint = endpoint;
    }
    
    if (enabled && !this.flushInterval) {
      this.startPeriodicFlush();
    }
    
    this.info(`Remote logging ${enabled ? 'enabled' : 'disabled'}`);
  }
}

/********************
 * Global Logger     *
 ********************/

// Initialize global logger
const logger = new Logger({
  level: 'debug', // Will auto-adjust for production
  enableRemoteLogging: false, // Enable when backend is ready
  remoteEndpoint: '/api/logs'
});

// Make logger available globally
window.logger = logger;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}

// Initialize message
logger.info('🚀 La Liga del Fuego Logger initialized', {
  level: logger.level,
  production: logger.isProduction(),
  remoteLogging: logger.enableRemoteLogging
});

console.log('📋 Logger system loaded successfully');