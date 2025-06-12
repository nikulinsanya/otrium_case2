import mongoose from 'mongoose'

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  CANCELED_AT_PERIOD_END = 'canceled_at_period_end',
  PAYMENT_FAILED = 'payment_failed',
  TRIALING = 'trialing'
}

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true
    },
    planId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(SubscriptionStatus),
      default: SubscriptionStatus.PENDING
    },
    paymentIntentId: {
      type: String,
      required: true
    },
    currentPeriodEnd: {
      type: Date
    }
  },
  { timestamps: true }
)

const Subscription = mongoose.model('Subscription', subscriptionSchema)

export default Subscription