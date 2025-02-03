import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getEntrys, getEntryById, addEntry, updateEntry, removeEntry, addEntryComment, removeEntryComment, updateEntryComment } from './entry.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, getEntrys)
router.get('/:id', log, getEntryById)
router.post('/', log, requireAuth, addEntry)
router.put('/:id', requireAuth, updateEntry)
router.delete('/:id', requireAuth, removeEntry)

router.post('/:id/comment', requireAuth, addEntryComment)
router.put('/:id/comment/:commentId', requireAuth, updateEntryComment)
router.delete('/:id/comment/:commentId', requireAuth, removeEntryComment)

export const entryRoutes = router