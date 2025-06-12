import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/user.model'
import Subscription, { SubscriptionStatus } from '../models/subscription.model'
import bcrypt from 'bcryptjs'

// Load environment variables
dotenv.config()

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/otrium'
    await mongoose.connect(mongoURI)
    console.log('Connected to MongoDB')

    // Clear existing data (optional)
    await User.deleteMany({})
    await Subscription.deleteMany({})
    console.log('Cleared existing data')

    // Create a user
    const password = 'sanya123'
    
    // Create user document directly without using the model's pre-save hook
    // const userDoc = {
    //   email: 'test@test.com',
    //   name: 'Sanya Nikulin',
    //   password, // Plain password - will be hashed by pre-save hook
    //   isVerified: true,
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // }
    
    // // Insert the user directly
    // const result = await User.create(userDoc)
    // const user = result
    // console.log('Password used:', password)
    // console.log('Created user:', user._id)

    // // Create a subscription for the user
    // const paymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`
    // const subscription = new Subscription({
    //   userId: user._id,
    //   planId: 'premium-monthly',
    //   status: SubscriptionStatus.ACTIVE,
    //   paymentIntentId,
    //   currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    // })
    // await subscription.save()
    // console.log('Created subscription:', subscription._id)

    console.log('Database seeded successfully!')
  } catch (error) {
    console.error('Error seeding database:', error)
  } finally {
    // Close the connection
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the seed function
seedDatabase()
