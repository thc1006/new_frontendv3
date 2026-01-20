/**
 * Centralized logging utility for debugging navigation and page lifecycle issues
 *
 * Features:
 * - Persistent storage using IndexedDB (survives page refresh)
 * - Session tracking for correlating logs across navigation
 * - Export functionality for debugging
 * - Console output with color coding
 *
 * Usage:
 *   import { logger, createModuleLogger } from '~/utils/logger'
 *   const log = createModuleLogger('MyComponent')
 *   log.info('Something happened', { data: 123 })
 *
 * Console commands for debugging:
 *   window.__logger.getHistory()     - Get all logs from current session
 *   window.__logger.exportLogs()     - Export all stored logs as JSON
 *   window.__logger.clearAllLogs()   - Clear all stored logs
 *   window.__logger.setEnabled(true) - Enable/disable logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  id?: number
  sessionId: string
  timestamp: string
  level: LogLevel
  module: string
  message: string
  data?: unknown
  url?: string
}

const LOG_COLORS = {
  debug: '#9E9E9E',
  info: '#2196F3',
  warn: '#FF9800',
  error: '#F44336'
}

const MODULE_COLORS: Record<string, string> = {
  'Layout': '#673AB7',
  'Router': '#009688',
  'Auth': '#E91E63',
  'Overviews': '#4CAF50',
  'SceneDeployment': '#FF5722',
  'AISimulator': '#3F51B5',
  'AIRAN': '#795548',
  'AIModelEval': '#607D8B',
  'Map': '#00BCD4',
  'Store': '#9C27B0'
}

const DB_NAME = 'WiSDON_Logs'
const DB_VERSION = 1
const STORE_NAME = 'logs'
const MAX_STORED_LOGS = 1000 // Keep last 1000 logs in IndexedDB

class Logger {
  private static instance: Logger
  private enabled: boolean = true
  private logHistory: LogEntry[] = []
  private maxHistorySize: number = 200
  private sessionId: string
  private db: IDBDatabase | null = null
  private dbReady: Promise<void>

  private constructor() {
    // Generate unique session ID
    this.sessionId = this.generateSessionId()

    // Check if we're in browser and if debug mode is enabled
    if (typeof window !== 'undefined') {
      this.enabled = localStorage.getItem('debug_logging') === 'true' ||
                     process.env.NODE_ENV === 'development'
      this.dbReady = this.initDB()
    } else {
      this.dbReady = Promise.resolve()
    }
  }

  private generateSessionId(): string {
    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
    const timeStr = now.toISOString().slice(11, 19).replace(/:/g, '')
    const random = Math.random().toString(36).substring(2, 6)
    return `${dateStr}-${timeStr}-${random}`
  }

  private async initDB(): Promise<void> {
    if (typeof window === 'undefined') return

    return new Promise((resolve, _reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.warn('[Logger] IndexedDB not available, using memory-only storage')
        resolve()
      }

      request.onsuccess = () => {
        this.db = request.result
        this.cleanOldLogs()
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
          store.createIndex('sessionId', 'sessionId', { unique: false })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('level', 'level', { unique: false })
          store.createIndex('module', 'module', { unique: false })
        }
      }
    })
  }

  private async cleanOldLogs(): Promise<void> {
    if (!this.db) return

    const transaction = this.db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const countRequest = store.count()

    countRequest.onsuccess = () => {
      const count = countRequest.result
      if (count > MAX_STORED_LOGS) {
        // Delete oldest logs
        const deleteCount = count - MAX_STORED_LOGS
        const cursorRequest = store.openCursor()
        let deleted = 0

        cursorRequest.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
          if (cursor && deleted < deleteCount) {
            cursor.delete()
            deleted++
            cursor.continue()
          }
        }
      }
    }
  }

  private async persistLog(entry: LogEntry): Promise<void> {
    if (!this.db) return

    try {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.add(entry)
    } catch {
      // Silently fail - don't let logging break the app
    }
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  private getTimestamp(): string {
    return new Date().toISOString()
  }

  private getShortTimestamp(): string {
    return new Date().toISOString().substr(11, 12)
  }

  private formatMessage(level: LogLevel, module: string, message: string, data?: unknown): void {
    if (!this.enabled) return

    const timestamp = this.getTimestamp()
    const shortTimestamp = this.getShortTimestamp()
    const moduleColor = MODULE_COLORS[module] || '#666'
    const levelColor = LOG_COLORS[level]

    const entry: LogEntry = {
      sessionId: this.sessionId,
      timestamp,
      level,
      module,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }

    // Store in memory history
    this.logHistory.push(entry)
    if (this.logHistory.length > this.maxHistorySize) {
      this.logHistory.shift()
    }

    // Persist to IndexedDB
    this.persistLog(entry)

    // Console output with styling
    const prefix = `%c[${shortTimestamp}]%c [${module}]%c [${level.toUpperCase()}]`
    const styles = [
      'color: #888',
      `color: ${moduleColor}; font-weight: bold`,
      `color: ${levelColor}; font-weight: bold`
    ]

    if (data !== undefined) {
      console.log(prefix, ...styles, message, data)
    } else {
      console.log(prefix, ...styles, message)
    }
  }

  debug(module: string, message: string, data?: unknown): void {
    this.formatMessage('debug', module, message, data)
  }

  info(module: string, message: string, data?: unknown): void {
    this.formatMessage('info', module, message, data)
  }

  warn(module: string, message: string, data?: unknown): void {
    this.formatMessage('warn', module, message, data)
  }

  error(module: string, message: string, data?: unknown): void {
    this.formatMessage('error', module, message, data)

    // Send error to Sentry if available
    if (typeof window !== 'undefined' && (window as any).$sentry) {
      (window as any).$sentry.captureMessage(message, {
        level: 'error',
        tags: { module },
        extra: { data, sessionId: this.sessionId }
      })
    }
  }

  // Navigation specific logging
  navigation(from: string, to: string, trigger: string): void {
    this.info('Router', `Navigation: ${from} → ${to} (triggered by: ${trigger})`)
  }

  // Lifecycle logging
  lifecycle(module: string, event: string, details?: unknown): void {
    this.debug(module, `Lifecycle: ${event}`, details)
  }

  // Map initialization logging
  mapInit(module: string, status: string, details?: unknown): void {
    this.info('Map', `[${module}] ${status}`, details)
  }

  // Get current session ID
  getSessionId(): string {
    return this.sessionId
  }

  // Get log history from current session (memory)
  getHistory(): LogEntry[] {
    return [...this.logHistory]
  }

  // Get all logs from IndexedDB
  async getAllLogs(): Promise<LogEntry[]> {
    if (!this.db) return this.logHistory

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(this.logHistory)
    })
  }

  // Get logs by session ID
  async getLogsBySession(sessionId: string): Promise<LogEntry[]> {
    if (!this.db) return this.logHistory.filter(l => l.sessionId === sessionId)

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('sessionId')
      const request = index.getAll(sessionId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve([])
    })
  }

  // Export logs as JSON string
  async exportLogs(): Promise<string> {
    const logs = await this.getAllLogs()
    return JSON.stringify(logs, null, 2)
  }

  // Download logs as file
  async downloadLogs(): Promise<void> {
    const logs = await this.exportLogs()
    const blob = new Blob([logs], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wisdon-logs-${this.sessionId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Clear log history (memory only)
  clearHistory(): void {
    this.logHistory = []
  }

  // Clear all logs (including IndexedDB)
  async clearAllLogs(): Promise<void> {
    this.logHistory = []

    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      store.clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
    })
  }

  // Enable/disable logging
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('debug_logging', String(enabled))
    }
  }

  // Check if logging is enabled
  isEnabled(): boolean {
    return this.enabled
  }
}

// Export singleton instance
export const logger = Logger.getInstance()

// Export convenience functions for specific modules
export const createModuleLogger = (module: string) => ({
  debug: (message: string, data?: unknown) => logger.debug(module, message, data),
  info: (message: string, data?: unknown) => logger.info(module, message, data),
  warn: (message: string, data?: unknown) => logger.warn(module, message, data),
  error: (message: string, data?: unknown) => logger.error(module, message, data),
  lifecycle: (event: string, details?: unknown) => logger.lifecycle(module, event, details),
  mapInit: (status: string, details?: unknown) => logger.mapInit(module, status, details)
})

// Window global for debugging in console
if (typeof window !== 'undefined') {
  (window as unknown as { __logger: Logger }).__logger = logger
}
