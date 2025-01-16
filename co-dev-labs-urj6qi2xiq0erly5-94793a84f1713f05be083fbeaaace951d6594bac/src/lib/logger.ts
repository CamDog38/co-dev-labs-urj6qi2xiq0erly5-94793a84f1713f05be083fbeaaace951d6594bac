type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
}

export const logger = {
  info: (message: string, context?: any) => {
    logMessage('info', message, context);
  },
  
  warn: (message: string, context?: any) => {
    logMessage('warn', message, context);
  },
  
  error: (message: string, context?: any) => {
    logMessage('error', message, context);
  }
};

function logMessage(level: LogLevel, message: string, context?: any) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context
  };

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    const logFn = level === 'error' ? console.error : 
                  level === 'warn' ? console.warn : 
                  console.log;
    logFn(`[${entry.timestamp}] ${level.toUpperCase()}: ${message}`, context || '');
  }

  // In production, you might want to send this to a logging service
  if (process.env.NODE_ENV === 'production') {
    // Here you could implement production logging
    // For example, sending to an error tracking service
    if (level === 'error') {
      // Log errors to console in production as well
      console.error(`[${entry.timestamp}] ERROR:`, message, context || '');
    }
  }
}