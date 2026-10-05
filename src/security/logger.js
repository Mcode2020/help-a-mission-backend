import fs from 'node:fs';
import path from 'node:path';

// SECURITY: Redacting structured logger — prevents credential/PII leaks into log sinks (DPDP/GDPR)
const SENSITIVE_KEYS = new Set([
  'authorization',
  'password',
  'token',
  'secret',
  'cookie',
  'apikey',
  'apiKey',
  'credit_card',
  'cardNumber'
]);

function redact(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(redact);

  const copy = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      copy[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      copy[key] = redact(value);
    } else {
      copy[key] = value;
    }
  }
  return copy;
}

const LOG_DIR = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function writeLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  const safeMeta = redact(meta);
  const logEntry = {
    timestamp,
    level,
    message,
    ...(Object.keys(safeMeta).length > 0 ? { meta: safeMeta } : {})
  };

  const line = JSON.stringify(logEntry) + '\n';
  const stream = level === 'ERROR' ? process.stderr : process.stdout;
  stream.write(`[${timestamp}] [${level}] ${message} ${Object.keys(safeMeta).length > 0 ? JSON.stringify(safeMeta) : ''}\n`);

  try {
    fs.appendFileSync(path.join(LOG_DIR, 'app.log'), line);
  } catch {
    // Fail-safe if file write is temporarily restricted
  }
}

export const logger = {
  info: (msg, meta) => writeLog('INFO', msg, meta),
  warn: (msg, meta) => writeLog('WARN', msg, meta),
  error: (msg, meta) => writeLog('ERROR', msg, meta),
  debug: (msg, meta) => writeLog('DEBUG', msg, meta)
};
