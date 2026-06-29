import { NextFunction, Request, Response } from 'express'
import { logger } from '../utils/logger'

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  logger.error(err.message, {
    method: req.method,
    url: req.originalUrl,
    stack: err.stack,
  })

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  })
}