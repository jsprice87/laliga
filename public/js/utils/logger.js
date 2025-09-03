/**
 * Logger Utility
 * Provides structured logging with different levels and contexts
 */

export class Logger {
  constructor(context = 'App') {
    this.context = context;
    this.level = this.getLogLevel();
    this.colors = {
      error: '#ff0066',
      warn: '#ffaa00', 
      info: '#00ffff',
      debug: '#00ff00',
      trace: '#ff00ff'
    };
  }

  /**
   * Get log level from environment or default to 'info'
   */
  getLogLevel() {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const debugMode = urlParams.get('debug');
      
      if (debugMode) {
        return 'debug';
      }
      
      if (window.location.hostname === 'localhost') {
        return 'debug';
      }
    }
    
    return 'info';
  }

  /**
   * Check if log level should be output
   */
  shouldLog(level) {
    const levels = ['error', 'warn', 'info', 'debug', 'trace'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex <= currentLevelIndex;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, ...args) {
    const timestamp = new Date().toISOString();
    const contextStr = this.context ? `[${this.context}]` : '';
    
    return {
      timestamp,
      level: level.toUpperCase(),
      context: this.context,
      message,
      args
    };
  }

  /**
   * Output log message
   */
  output(level, message, ...args) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, ...args);
    const color = this.colors[level] || '#ffffff';
    
    const style = `
      color: ${color}; 
      font-weight: bold;
      background: rgba(0,0,0,0.1);
      padding: 2px 6px;
      border-radius: 3px;
    `;

    switch (level) {
      case 'error':
        console.error(
          `%c${formatted.level} ${formatted.context}`,
          style,
          formatted.message,
          ...formatted.args
        );
        break;
      case 'warn':
        console.warn(
          `%c${formatted.level} ${formatted.context}`,
          style,
          formatted.message,
          ...formatted.args
        );
        break;
      default:
        console.log(
          `%c${formatted.level} ${formatted.context}`,
          style,
          formatted.message,
          ...formatted.args
        );
    }
  }

  /**
   * Error level logging
   */
  error(message, ...args) {
    this.output('error', message, ...args);
    
    // Send errors to monitoring service in production
    if (this.level !== 'debug') {
      this.reportError(message, ...args);
    }
  }

  /**
   * Warning level logging
   */
  warn(message, ...args) {
    this.output('warn', message, ...args);
  }

  /**
   * Info level logging
   */
  info(message, ...args) {
    this.output('info', message, ...args);
  }

  /**
   * Debug level logging
   */
  debug(message, ...args) {
    this.output('debug', message, ...args);
  }

  /**
   * Trace level logging
   */
  trace(message, ...args) {
    this.output('trace', message, ...args);
  }

  /**
   * Log performance timing
   */
  time(label) {
    console.time(`[${this.context}] ${label}`);
  }

  /**
   * End performance timing
   */
  timeEnd(label) {
    console.timeEnd(`[${this.context}] ${label}`);
  }

  /**
   * Log performance mark
   */
  mark(name) {
    if (performance && performance.mark) {
      performance.mark(`${this.context}-${name}`);
    }
    this.debug(`Performance mark: ${name}`);
  }

  /**
   * Measure performance between marks
   */
  measure(name, startMark, endMark) {
    if (performance && performance.measure) {
      try {
        performance.measure(
          `${this.context}-${name}`,
          `${this.context}-${startMark}`,
          `${this.context}-${endMark}`
        );
        
        const measures = performance.getEntriesByType('measure');
        const measure = measures[measures.length - 1];
        
        this.info(`Performance measure: ${name} took ${measure.duration.toFixed(2)}ms`);
      } catch (error) {
        this.warn('Performance measurement failed:', error.message);
      }
    }
  }

  /**
   * Log API calls
   */
  api(method, url, status, duration) {
    const statusColor = status < 400 ? '✅' : '❌';
    this.info(`${statusColor} ${method} ${url} - ${status} (${duration}ms)`);
  }

  /**
   * Log user actions
   */
  userAction(action, details = {}) {
    this.info(`👤 User action: ${action}`, details);
  }

  /**
   * Log state changes
   */
  stateChange(property, oldValue, newValue) {
    this.debug(`🔄 State change: ${property}`, { from: oldValue, to: newValue });
  }

  /**
   * Log component lifecycle
   */
  component(componentName, lifecycle, details = {}) {
    this.debug(`🧩 ${componentName} - ${lifecycle}`, details);
  }

  /**
   * Report error to monitoring service
   */
  reportError(message, ...args) {
    // In a real application, this would send to a service like Sentry
    // For now, just store in localStorage for development
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        context: this.context,
        message,
        args,
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      const errors = JSON.parse(localStorage.getItem('laliga-errors') || '[]');
      errors.push(errorLog);
      
      // Keep only last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('laliga-errors', JSON.stringify(errors));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Get stored error logs
   */
  getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('laliga-errors') || '[]');
    } catch (e) {
      return [];
    }
  }

  /**
   * Clear error logs
   */
  clearErrorLogs() {
    try {
      localStorage.removeItem('laliga-errors');
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Create child logger with extended context
   */
  child(childContext) {
    return new Logger(`${this.context}:${childContext}`);
  }
}