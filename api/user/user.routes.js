import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'

import { getUser, getUsers, deleteUser, updateUser, getSavedEntrys } from './user.controller.js'

const router = express.Router()

router.get('/', getUsers)
router.get('/:id', getUser)
router.get('/:id/saved', requireAuth, getSavedEntrys)
router.put('/:id', requireAuth, updateUser)
// router.delete('/:id', requireAuth, requireAdmin, deleteUser)

export const userRoutes = router