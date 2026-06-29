import fs from 'fs'
import path from 'path'

const logPath = path.join(process.cwd(), 'logs')

if (!fs.existsSync(logPath)) {
  fs.mkdirSync(logPath, { recursive: true })
}

const logFile = path.join(logPath, 'app.log')

type LogLevel = 'INFO' | 'ADVERTENCIA' | 'ERROR' | 'DEBUG'

function write(level: LogLevel, message: string, meta?: unknown) {
  const line =
    `[${new Date().toISOString()}] [${level}] ${message}` +
    (meta ? ` ${JSON.stringify(meta)}` : '') +
    '\n'

  console.log(line.trim())

  fs.appendFile(logFile, line, err => {
    if (err) {
      console.error('Hubo un error al escribir el log', err)
    }
  })
}

export const logger = {
  info: (message: string, meta?: unknown) =>
    write('INFO', message, meta),

  warn: (message: string, meta?: unknown) =>
    write('ADVERTENCIA', message, meta),

  error: (message: string, meta?: unknown) =>
    write('ERROR', message, meta),

  debug: (message: string, meta?: unknown) =>
    write('DEBUG', message, meta),
}