import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose'

const idempotencySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  response: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '24h', // TTL index - automatically remove after 24 hours
  },
})

const IdempotencyRecord = mongoose.model('IdempotencyRecord', idempotencySchema)

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'POST') {
    return next()
  }

  const idempotencyKey = req.headers['idempotency-key'] as string

  if (!idempotencyKey) {
    return next()
  }

  try {
    const existingRecord = await IdempotencyRecord.findOne({ key: idempotencyKey })

    if (existingRecord) {
      return res.status(200).json(existingRecord.response)
    }

    // Store the original send function
    const originalSend = res.send

    // Override the send function to capture the response
    res.send = function (body) {
      // Store response only for successful requests
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const responseBody = typeof body === 'string' ? JSON.parse(body) : body

        // Save the response asynchronously - don't wait for it to complete
        IdempotencyRecord.create({
          key: idempotencyKey,
          response: responseBody,
        }).catch(err => console.error('Failed to save idempotency record:', err))
      }

      // Call the original send function
      return originalSend.call(this, body)
    }

    next()
  } catch (error) {
    next(error)
  }
}
