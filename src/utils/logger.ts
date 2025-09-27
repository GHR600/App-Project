import AsyncStorage from '@react-native-async-storage/async-storage';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  category?: string;
  data?: any;
  userId?: string;
  sessionId?: string;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  enableRemote: boolean;
  maxStoredLogs: number;
  remoteEndpoint?: string;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private logBuffer: LogEntry[] = [];
  private isFlushingLogs = false;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: __DEV__,
      enableStorage: true,
      enableRemote: !__DEV__,
      maxStoredLogs: 1000,
      ...config,
    };

    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.initializeLogger();
  }

  private async initializeLogger() {
    // Clean up old logs on startup
    await this.cleanupOldLogs();

    // Set up periodic log flushing
    if (this.config.enableRemote) {
      setInterval(() => {
        this.flushRemoteLogs();
      }, 30000); // Flush every 30 seconds
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private async log(level: LogLevel, message: string, category?: string, data?: any) {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      category,
      data,
      sessionId: this.sessionId,
    };

    // Console logging
    if (this.config.enableConsole) {
      const consoleMethod = level === 'debug' ? 'log' : level;
      const prefix = `[${level.toUpperCase()}]${category ? ` [${category}]` : ''}`;

      if (data) {
        console[consoleMethod](prefix, message, data);
      } else {
        console[consoleMethod](prefix, message);
      }
    }

    // Storage logging
    if (this.config.enableStorage) {
      await this.storeLog(logEntry);
    }

    // Remote logging
    if (this.config.enableRemote) {
      this.logBuffer.push(logEntry);
    }
  }

  debug(message: string, category?: string, data?: any) {
    this.log('debug', message, category, data);
  }

  info(message: string, category?: string, data?: any) {
    this.log('info', message, category, data);
  }

  warn(message: string, category?: string, data?: any) {
    this.log('warn', message, category, data);
  }

  error(message: string, category?: string, data?: any) {
    this.log('error', message, category, data);
  }

  // Specific logging methods for common use cases
  userAction(action: string, data?: any) {
    this.info(`User action: ${action}`, 'USER_ACTION', data);
  }

  apiCall(endpoint: string, method: string, duration?: number, success?: boolean) {
    const message = `API ${method} ${endpoint}${duration ? ` (${duration}ms)` : ''}`;
    if (success === false) {
      this.error(message, 'API');
    } else {
      this.info(message, 'API');
    }
  }

  performance(operation: string, duration: number, data?: any) {
    this.info(`Performance: ${operation} took ${duration}ms`, 'PERFORMANCE', data);
  }

  navigation(from: string, to: string) {
    this.info(`Navigation: ${from} -> ${to}`, 'NAVIGATION');
  }

  private async storeLog(logEntry: LogEntry) {
    try {
      const storedLogs = await this.getStoredLogs();
      storedLogs.push(logEntry);

      // Keep only the most recent logs
      if (storedLogs.length > this.config.maxStoredLogs) {
        storedLogs.splice(0, storedLogs.length - this.config.maxStoredLogs);
      }

      await AsyncStorage.setItem('@app_logs', JSON.stringify(storedLogs));
    } catch (error) {
      console.error('Failed to store log:', error);
    }
  }

  async getStoredLogs(): Promise<LogEntry[]> {
    try {
      const stored = await AsyncStorage.getItem('@app_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve stored logs:', error);
      return [];
    }
  }

  async clearStoredLogs(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@app_logs');
    } catch (error) {
      console.error('Failed to clear stored logs:', error);
    }
  }

  private async cleanupOldLogs() {
    try {
      const logs = await this.getStoredLogs();
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

      const recentLogs = logs.filter(log =>
        new Date(log.timestamp).getTime() > oneDayAgo
      );

      if (recentLogs.length !== logs.length) {
        await AsyncStorage.setItem('@app_logs', JSON.stringify(recentLogs));
      }
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  private async flushRemoteLogs() {
    if (this.isFlushingLogs || this.logBuffer.length === 0 || !this.config.remoteEndpoint) {
      return;
    }

    this.isFlushingLogs = true;
    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          logs: logsToSend,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.debug(`Flushed ${logsToSend.length} logs to remote`, 'LOGGER');
    } catch (error) {
      console.error('Failed to flush logs to remote:', error);
      // Put logs back in buffer for retry
      this.logBuffer.unshift(...logsToSend);
    } finally {
      this.isFlushingLogs = false;
    }
  }

  async exportLogs(format: 'json' | 'csv' | 'txt' = 'json'): Promise<string> {
    const logs = await this.getStoredLogs();

    switch (format) {
      case 'csv':
        return this.exportAsCSV(logs);
      case 'txt':
        return this.exportAsText(logs);
      case 'json':
      default:
        return JSON.stringify(logs, null, 2);
    }
  }

  private exportAsCSV(logs: LogEntry[]): string {
    const headers = ['Timestamp', 'Level', 'Category', 'Message', 'Data'];
    let csv = headers.join(',') + '\n';

    logs.forEach(log => {
      const row = [
        log.timestamp,
        log.level,
        log.category || '',
        `"${log.message.replace(/"/g, '""')}"`,
        log.data ? `"${JSON.stringify(log.data).replace(/"/g, '""')}"` : ''
      ];
      csv += row.join(',') + '\n';
    });

    return csv;
  }

  private exportAsText(logs: LogEntry[]): string {
    return logs.map(log => {
      let line = `${log.timestamp} [${log.level.toUpperCase()}]`;
      if (log.category) line += ` [${log.category}]`;
      line += ` ${log.message}`;
      if (log.data) line += ` | Data: ${JSON.stringify(log.data)}`;
      return line;
    }).join('\n');
  }

  // Method to capture and log unhandled errors
  setupGlobalErrorHandling() {
    // Capture unhandled promise rejections
    if (typeof global !== 'undefined') {
      global.onunhandledrejection = (event: any) => {
        this.error(
          'Unhandled promise rejection',
          'GLOBAL_ERROR',
          {
            reason: event.reason,
            promise: event.promise?.toString(),
          }
        );
      };
    }

    // Note: React Native doesn't have window.onerror, but you can use
    // libraries like react-native-exception-handler for global error catching
  }

  // Configuration methods
  setLevel(level: LogLevel) {
    this.config.level = level;
  }

  setUserId(userId: string) {
    this.logBuffer.forEach(log => log.userId = userId);
  }

  setRemoteEndpoint(endpoint: string) {
    this.config.remoteEndpoint = endpoint;
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

// Create and export default logger instance
export const logger = new Logger({
  level: __DEV__ ? 'debug' : 'info',
  enableConsole: __DEV__,
  enableStorage: true,
  enableRemote: !__DEV__,
  maxStoredLogs: 1000,
});

// Export the Logger class for custom instances
export { Logger };

// Helper function to create performance timers
export const createPerformanceTimer = (operation: string) => {
  const startTime = Date.now();

  return {
    end: (data?: any) => {
      const duration = Date.now() - startTime;
      logger.performance(operation, duration, data);
      return duration;
    }
  };
};

// Helper function to log async operations
export const logAsyncOperation = async <T>(
  operation: string,
  asyncFn: () => Promise<T>
): Promise<T> => {
  const timer = createPerformanceTimer(operation);

  try {
    logger.debug(`Starting: ${operation}`, 'ASYNC_OP');
    const result = await asyncFn();
    timer.end({ success: true });
    logger.debug(`Completed: ${operation}`, 'ASYNC_OP');
    return result;
  } catch (error) {
    timer.end({ success: false, error: error.message });
    logger.error(`Failed: ${operation}`, 'ASYNC_OP', error);
    throw error;
  }
};