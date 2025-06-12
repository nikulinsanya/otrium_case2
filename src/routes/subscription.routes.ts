import express from 'express'
import { body } from 'express-validator'
import { SubscriptionController } from '../controllers/subscription.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validateRequest } from '../middleware/validation.middleware'
import { idempotencyMiddleware } from '../middleware/idempotency.middleware'

const router = express.Router()

router.get('/plan', SubscriptionController.getPlan)

router.post(
  '/initiate',
  authenticate,
  idempotencyMiddleware,
  [body('planId').notEmpty().withMessage('Plan ID is required')],
  validateRequest,
  SubscriptionController.initiateSubscription
)

router.get('/status', authenticate, SubscriptionController.getSubscriptionStatus)

router.post(
  '/cancel',
  authenticate,
  idempotencyMiddleware,
  [
    body('effectiveDate')
      .optional()
      .isISO8601()
      .withMessage('Effective date must be a valid ISO date'),
  ],
  validateRequest,
  SubscriptionController.cancelSubscription
)

export default router