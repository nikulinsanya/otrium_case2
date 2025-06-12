import mongoose from 'mongoose'
import { logger } from './logger'

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI
    
    if (!mongoURI) {
      logger.error('MongoDB URI not found in environment variables')
      return false
    }
    
    await mongoose.connect(mongoURI)
    
    logger.info('MongoDB connected successfully')
    return true
  } catch (error) {
    logger.error(`MongoDB connection error: ${error}`)
    logger.warn('Using in-memory database for testing purposes')
    return false
  }
}

export default connectDB