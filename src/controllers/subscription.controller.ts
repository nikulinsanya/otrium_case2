import { Request as ExpressRequest, Response } from 'express'
import { SubscriptionService } from '../services/subscription.service'
import { logger } from '../config/logger'

interface Request extends ExpressRequest {
  userId?: string
}

export const SubscriptionController = {
  /**
   * @swagger
   * /subscription/plan:
   *   get:
   *     summary: Get available subscription plan
   *     description: Returns details of the available subscription plan
   *     tags: [Subscription]
   *     responses:
   *       200:
   *         description: Subscription plan details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Plan'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getPlan(_req: Request, res: Response): Promise<Response> {
    try {
      const plan = await SubscriptionService.getPlan()
      return res.status(200).json(plan)
    } catch (error) {
      const err = error as Error
      logger.error('Error getting subscription plan:', err)
      return res.status(500).json({ message: 'Error retrieving subscription plan' })
    }
  },

  /**
   * @swagger
   * /subscription/initiate:
   *   post:
   *     summary: Initiate a new subscription
   *     description: Creates a new subscription and returns payment information
   *     tags: [Subscription]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/SubscriptionInitiation'
   *     responses:
   *       202:
   *         description: Subscription initiated successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SubscriptionResult'
   *       400:
   *         description: Invalid request parameters
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       402:
   *         description: Payment required or failed
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async initiateSubscription(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      const { planId } = req.body
      if (!planId) {
        return res.status(400).json({ message: 'planId is required' })
      }

      const availablePlan = await SubscriptionService.getPlan()
      if (planId !== availablePlan.planId) {
        return res.status(400).json({ message: 'Invalid plan ID' })
      }

      const result = await SubscriptionService.initiateSubscription(req.userId, planId)
      return res.status(202).json(result)
    } catch (error) {
      const err = error as Error
      logger.error('Error initiating subscription:', err)
      if (err.name === 'PaymentError') {
        return res.status(402).json({ message: err.message })
      } else {
        return res.status(500).json({ message: 'Error processing subscription request' })
      }
    }
  },

  /**
   * @swagger
   * /webhooks/payment:
   *   post:
   *     summary: Handle payment webhook events
   *     description: Processes payment webhook events from payment provider
   *     tags: [Webhook]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Webhook processed successfully
   *       400:
   *         description: Invalid webhook payload
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async handlePaymentWebhook(req: Request, res: Response): Promise<Response> {
    try {
      const event = req.body
      if (!event || !event.type || !event.data || !event.data.object) {
        return res.status(400).json({ message: 'Invalid webhook payload' })
      }

      if (
        event.type === 'payment_intent.succeeded' ||
        event.type === 'payment_intent.payment_failed'
      ) {
        await SubscriptionService.handlePaymentWebhook(event)
      }
      return res.status(200).json({ received: true })
    } catch (error) {
      const err = error as Error
      logger.error('Error processing webhook:', err)
      return res.status(500).json({ message: 'Error processing webhook' })
    }
  },

  /**
   * @swagger
   * /subscription/status:
   *   get:
   *     summary: Get current subscription status
   *     description: Returns the current status of user's subscription
   *     tags: [Subscription]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current subscription status
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/SubscriptionStatus'
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: No subscription found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async getSubscriptionStatus(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      const status = await SubscriptionService.getSubscriptionStatus(req.userId)
      return res.status(200).json(status)
    } catch (error) {
      const err = error as Error
      logger.error('Error getting subscription status:', err)
      if (err.name === 'SubscriptionError') {
        return res.status(404).json({ message: err.message })
      } else {
        return res.status(500).json({ message: 'Error retrieving subscription status' })
      }
    }
  },

  /**
   * @swagger
   * /subscription/cancel:
   *   post:
   *     summary: Cancel subscription
   *     description: Cancels the user's active subscription
   *     tags: [Subscription]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CancellationRequest'
   *     responses:
   *       200:
   *         description: Subscription canceled successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/CancellationResult'
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: No active subscription found
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Server error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   */
  async cancelSubscription(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      const { effectiveDate } = req.body
      const result = await SubscriptionService.cancelSubscription(req.userId, effectiveDate)
      return res.status(200).json(result)
    } catch (error) {
      const err = error as Error
      logger.error('Error canceling subscription:', err)
      if (err.name === 'SubscriptionError') {
        return res.status(404).json({ message: err.message })
      } else {
        return res.status(500).json({ message: 'Error processing cancellation request' })
      }
    }
  },
}