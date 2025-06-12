import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { logger } from '../config/logger'

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' })
      return
    }
    
    const token = authHeader.split(' ')[1]
    
    if (!token) {
      res.status(401).json({ message: 'Authentication token required' })
      return
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { userId: string }
    
    // Add userId to request object for use in controllers
    (req as any).userId = decoded.userId
    
    next()
  } catch (error) {
    logger.error('Authentication error:', error)
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}