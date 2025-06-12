import express from 'express'
import { SubscriptionController } from '../controllers/subscription.controller'

const router = express.Router()

// JSON parser for webhook
router.post('/payment', express.json(), SubscriptionController.handlePaymentWebhook)

export default router