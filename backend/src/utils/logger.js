/**
 * Enhanced Logger Utility
 * Provides structured logging with different levels and formats
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
   try {
      fs.mkdirSync(logsDir, { recursive: true });
   } catch (err) {
      console.warn('Could not create logs directory:', err.message);
   }
}

// Log levels
const LOG_LEVELS = {
   ERROR: 0,
   WARN: 1,
   INFO: 2,
   DEBUG: 3
};

const COLORS = {
   ERROR: '\x1b[31m', // Red
   WARN: '\x1b[33m',  // Yellow
   INFO: '\x1b[36m',  // Cyan
   DEBUG: '\x1b[35m', // Magenta
   RESET: '\x1b[0m'
};

class Logger {
   constructor() {
      this.logLevel = process.env.LOG_LEVEL || 'INFO';
      this.enableFileLogging = process.env.ENABLE_FILE_LOGGING === 'true';
      this.enableConsole = process.env.ENABLE_CONSOLE_LOGGING !== 'false';
   }

   formatMessage(level, message, meta = {}) {
      const timestamp = new Date().toISOString();
      const processId = process.pid;
      
      const logEntry = {
         timestamp,
         level,
         message,
         processId,
         ...meta
      };

      return logEntry;
   }

   writeToFile(level, formattedMessage) {
      if (!this.enableFileLogging) return;

      try {
         const logFile = path.join(logsDir, `${level.toLowerCase()}.log`);
         const logLine = JSON.stringify(formattedMessage) + '\n';
         
         fs.appendFileSync(logFile, logLine);
      } catch (err) {
         console.error('Failed to write to log file:', err.message);
      }
   }

   writeToConsole(level, message, meta = {}) {
      if (!this.enableConsole) return;

      const timestamp = new Date().toISOString();
      const color = COLORS[level] || '';
      const reset = COLORS.RESET;
      
      const prefix = `${color}[${timestamp}] [${level}]${reset}`;
      
      if (Object.keys(meta).length > 0) {
         console.log(`${prefix} ${message}`, meta);
      } else {
         console.log(`${prefix} ${message}`);
      }
   }

   shouldLog(level) {
      const currentLevel = LOG_LEVELS[this.logLevel] || LOG_LEVELS.INFO;
      const messageLevel = LOG_LEVELS[level] || LOG_LEVELS.INFO;
      return messageLevel <= currentLevel;
   }

   log(level, message, meta = {}) {
      if (!this.shouldLog(level)) return;

      const formattedMessage = this.formatMessage(level, message, meta);
      
      this.writeToConsole(level, message, meta);
      this.writeToFile(level, formattedMessage);
   }

   error(message, meta = {}) {
      // Handle Error objects
      if (message instanceof Error) {
         meta = {
            ...meta,
            stack: message.stack,
            name: message.name
         };
         message = message.message;
      }
      
      this.log('ERROR', message, meta);
   }

   warn(message, meta = {}) {
      this.log('WARN', message, meta);
   }

   info(message, meta = {}) {
      this.log('INFO', message, meta);
   }

   debug(message, meta = {}) {
      this.log('DEBUG', message, meta);
   }

   // HTTP request logging
   request(req, message = 'HTTP Request') {
      const meta = {
         method: req.method,
         url: req.url,
         userAgent: req.get('User-Agent'),
         ip: req.ip || req.connection.remoteAddress,
         userId: req.profile?._id || 'anonymous'
      };
      
      this.info(message, meta);
   }

   // Database operation logging
   database(operation, collection, meta = {}) {
      this.debug(`Database ${operation}`, {
         collection,
         ...meta
      });
   }

   // Performance logging
   performance(operation, duration, meta = {}) {
      const level = duration > 1000 ? 'WARN' : 'INFO';
      this.log(level, `Performance: ${operation} took ${duration}ms`, meta);
   }
}

// Create singleton instance
const logger = new Logger();

// Export both the instance and the class
module.exports = logger;
module.exports.Logger = Logger;
