export type Event = {
  id?: number
  level: string
  message: string
  metadata?: Record<string, unknown>
  timestamp?: string
}