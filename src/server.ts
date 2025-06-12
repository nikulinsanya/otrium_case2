import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import { config } from 'dotenv'
import swaggerUi from 'swagger-ui-express'
import userRoutes from './routes/user.routes'
import subscriptionRoutes from './routes/subscription.routes'
import webhookRoutes from './routes/webhook.routes'
import { swaggerSpec } from './config/swagger'
import { logger } from './config/logger'
import { errorHandler } from './middleware/error.middleware'
import connectDB from './config/database'

config()

const app = express()
const port = process.env.PORT || 3002

// Connect to MongoDB but continue even if it fails
connectDB().then(connected => {
  if (!connected) {
    logger.warn('Server running without MongoDB connection - some features will be limited')
  }
})

app.use(helmet())
app.use(compression())
app.use(cors())

app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.originalUrl === '/api/v1/webhooks/payment') {
    next()
  } else {
    express.json()(req, res, next)
  }
})

app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/subscription', subscriptionRoutes)
app.use('/api/v1/webhooks', webhookRoutes)
app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'API is running' })
})

app.use(errorHandler)

app.listen(port, () => {
  logger.info(`Server running on port ${port}`)
})
