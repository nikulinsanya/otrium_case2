import Subscription, { SubscriptionStatus } from '../models/subscription.model'
import { logger } from '../config/logger'

export interface Plan {
  planId: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string[]
}

export interface SubscriptionResult {
  subscriptionId: string
  paymentIntentId: string
  paymentUrl: string
}

export interface WebhookEvent {
  type: string
  data: {
    object: {
      id: string
      status: string
    }
  }
}

export interface SubscriptionStatusResponse {
  status: string
  currentPeriodEnd?: Date
  planId: string
  planName: string
}

export interface CancellationResult {
  status: string
  message: string
  effectiveDate?: Date
}

export const SubscriptionService = {
  async getPlan(): Promise<Plan> {
    return {
      planId: 'premium-monthly',
      name: 'Premium Plan',
      description: 'Full access to all features',
      price: 19.99,
      currency: 'EUR',
      interval: 'month',
      features: ['Feature 1', 'Feature 2', 'Feature 3', 'Priority Support']
    }
  },

  async initiateSubscription(userId: string, planId: string): Promise<SubscriptionResult> {
    try {
      const existingSubscription = await Subscription.findOne({
        userId,
        status: { $in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE] }
      })

      if (existingSubscription) {
        const error = new Error('User already has an active subscription')
        error.name = 'PaymentError'
        throw error
      }

      const paymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`
      const paymentUrl = `https://payment-provider.com/checkout/${paymentIntentId}`

      const subscription = new Subscription({
        userId,
        planId,
        status: SubscriptionStatus.PENDING,
        paymentIntentId
      })

      await subscription.save()
      logger.info(`Subscription initiated for user ${userId} with plan ${planId}`)

      return {
        subscriptionId: subscription._id.toString(),
        paymentIntentId,
        paymentUrl
      }
    } catch (error) {
      logger.error('Error initiating subscription:', error)
      throw error
    }
  },

  async handlePaymentWebhook(event: WebhookEvent): Promise<void> {
    try {
      const { id, status } = event.data.object
      
      const subscription = await Subscription.findOne({ paymentIntentId: id })
      
      if (!subscription) {
        logger.warn(`No subscription found for payment intent ${id}`)
        return
      }

      if (event.type === 'payment_intent.succeeded') {
        subscription.status = SubscriptionStatus.ACTIVE
        subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        logger.info(`Subscription ${subscription._id} activated for user ${subscription.userId}`)
      } else if (event.type === 'payment_intent.payment_failed') {
        subscription.status = SubscriptionStatus.PAYMENT_FAILED
        logger.info(`Subscription ${subscription._id} payment failed for user ${subscription.userId}`)
      }

      await subscription.save()
    } catch (error) {
      logger.error('Error processing payment webhook:', error)
      throw error
    }
  },

  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatusResponse> {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: { 
          $in: [
            SubscriptionStatus.ACTIVE, 
            SubscriptionStatus.TRIALING, 
            SubscriptionStatus.PAST_DUE, 
            SubscriptionStatus.CANCELED
          ] 
        }
      }).sort({ createdAt: -1 })

      if (!subscription) {
        const error = new Error('No active subscription found')
        error.name = 'SubscriptionError'
        throw error
      }

      const plan = await this.getPlan()

      return {
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd as Date,
        planId: subscription.planId,
        planName: plan.name
      }
    } catch (error) {
      logger.error('Error getting subscription status:', error)
      throw error
    }
  },

  async cancelSubscription(userId: string, effectiveDate?: string): Promise<CancellationResult> {
    try {
      const subscription = await Subscription.findOne({
        userId,
        status: SubscriptionStatus.ACTIVE
      })

      if (!subscription) {
        const error = new Error('No active subscription found to cancel')
        error.name = 'SubscriptionError'
        throw error
      }

      let cancellationDate: Date
      let message: string

      if (effectiveDate && new Date(effectiveDate) > new Date()) {
        cancellationDate = new Date(effectiveDate)
        subscription.status = SubscriptionStatus.CANCELED_AT_PERIOD_END
        message = 'Subscription will be canceled at the end of the billing period'
      } else {
        cancellationDate = new Date()
        subscription.status = SubscriptionStatus.CANCELED
        message = 'Subscription has been canceled immediately'
      }

      await subscription.save()
      logger.info(`Subscription ${subscription._id} canceled for user ${userId}`)

      return {
        status: subscription.status,
        message,
        effectiveDate: cancellationDate
      }
    } catch (error) {
      logger.error('Error canceling subscription:', error)
      throw error
    }
  }
}