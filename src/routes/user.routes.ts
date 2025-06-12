import express from 'express'
import { body } from 'express-validator'
import { UserController } from '../controllers/user.controller'
import { validateRequest } from '../middleware/validation.middleware'
import { authenticate } from '../middleware/auth.middleware'

const router = express.Router()

router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long'),
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long')
  ],
  validateRequest,
  UserController.register
)

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validateRequest,
  UserController.login
)

router.get('/profile', authenticate, UserController.getProfile)

export default router