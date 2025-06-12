import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Subscription API',
      version: '1.0.0',
      description: 'API for managing subscriptions',
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UserRegistration: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            password: { type: 'string', format: 'password', minLength: 8 },
          },
        },
        UserLogin: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        AuthToken: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
        },
        Plan: {
          type: 'object',
          properties: {
            planId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            currency: { type: 'string' },
            interval: { type: 'string' },
            features: { type: 'array', items: { type: 'string' } },
          },
        },
        SubscriptionInitiation: {
          type: 'object',
          required: ['planId'],
          properties: {
            planId: { type: 'string' },
          },
        },
        SubscriptionResult: {
          type: 'object',
          properties: {
            subscriptionId: { type: 'string' },
            paymentIntentId: { type: 'string' },
            paymentUrl: { type: 'string' },
          },
        },
        SubscriptionStatus: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['pending', 'active', 'past_due', 'canceled', 'canceled_at_period_end', 'payment_failed', 'trialing'] },
            currentPeriodEnd: { type: 'string', format: 'date-time' },
            planId: { type: 'string' },
            planName: { type: 'string' },
          },
        },
        CancellationRequest: {
          type: 'object',
          properties: {
            effectiveDate: { type: 'string', format: 'date-time' },
          },
        },
        CancellationResult: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            message: { type: 'string' },
            effectiveDate: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/controllers/*.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)