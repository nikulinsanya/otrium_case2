import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/user.model'
import { logger } from '../config/logger'

export const UserController = {
  /**
   * @swagger
   * /users/register:
   *   post:
   *     summary: Register a new user
   *     description: Creates a new user account with email and password
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               name:
   *                 type: string
   *               password:
   *                 type: string
   *                 format: password
   *                 minLength: 8
   *     responses:
   *       201:
   *         description: User registered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       409:
   *         description: User already exists
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
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, name } = req.body

      const existingUser = await User.findOne({ email })
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' })
      }

      const user = new User({
        email,
        password, // Plain password - will be hashed by pre-save hook
        name
      })

      await user.save()
      logger.info(`User registered: ${email}`)

      return res.status(201).json({ message: 'User registered successfully' })
    } catch (error) {
      const err = error as Error
      logger.error('Error registering user:', err)
      return res.status(500).json({ message: 'Error registering user' })
    }
  },

  /**
   * @swagger
   * /users/login:
   *   post:
   *     summary: Login to user account
   *     description: Authenticates a user and returns a JWT token
   *     tags: [User]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 format: email
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   *       401:
   *         description: Invalid credentials
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
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body

      const user = await User.findOne({ email }).select('+password')
      if (!user) {
        logger.error(`No user found with email: ${email}`)
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      logger.info(`Found user: ${user._id}, checking password`)
      logger.info(`Stored password hash: ${user.password}`)
      
      const isPasswordValid = await bcrypt.compare(password, user.password)
      logger.info(`Password valid: ${isPasswordValid}`)
      
      if (!isPasswordValid) {
        logger.error(`Invalid password for user: ${email}`)
        return res.status(401).json({ message: 'Invalid credentials' })
      }

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || 'default_secret',
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' } as jwt.SignOptions
      )

      logger.info(`User logged in: ${email}`)
      return res.status(200).json({ token })
    } catch (error) {
      const err = error as Error
      logger.error('Error logging in:', err)
      return res.status(500).json({ message: 'Error logging in' })
    }
  },

  /**
   * @swagger
   * /users/profile:
   *   get:
   *     summary: Get user profile
   *     description: Returns the profile of the authenticated user
   *     tags: [User]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User profile
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 _id:
   *                   type: string
   *                 email:
   *                   type: string
   *                   format: email
   *                 name:
   *                   type: string
   *                 createdAt:
   *                   type: string
   *                   format: date-time
   *                 updatedAt:
   *                   type: string
   *                   format: date-time
   *       401:
   *         description: User not authenticated
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       404:
   *         description: User not found
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
  async getProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).userId
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' })
      }

      const user = await User.findById(userId).select('-password')
      if (!user) {
        return res.status(404).json({ message: 'User not found' })
      }

      return res.status(200).json(user)
    } catch (error) {
      const err = error as Error
      logger.error('Error getting user profile:', err)
      return res.status(500).json({ message: 'Error retrieving user profile' })
    }
  }
}