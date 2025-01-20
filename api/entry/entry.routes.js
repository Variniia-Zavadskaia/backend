import express from 'express'

import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import { getEntrys, getEntryById, addEntry, updateEntry, removeEntry, addEntryMsg, removeEntryMsg } from './entry.controller.js'

const router = express.Router()

// We can add a middleware for the entire router:
// router.use(requireAuth)

router.get('/', log, getEntrys)
router.get('/:id', log, getEntryById)
router.post('/', log, requireAuth, addEntry)
router.put('/:id', requireAuth, updateEntry)
router.delete('/:id', requireAuth, removeEntry)
// router.delete('/:id', requireAuth, requireAdmin, removeEntry)

router.post('/:id/msg', requireAuth, addEntryMsg)
router.delete('/:id/msg/:msgId', requireAuth, removeEntryMsg)

export const entryRoutes = router