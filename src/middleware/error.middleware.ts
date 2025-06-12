import { Request, Response, NextFunction } from 'express'
import { logger } from '../config/logger'

interface AppError extends Error {
  statusCode?: number
  status?: string
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction): void => {
  const statusCode = err.statusCode || 500
  
  logger.error(
    `${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`
  )
  
  res.status(statusCode).json({
    status: err.status || 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}