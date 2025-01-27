import { logger } from '../../services/logger.service.js'
import { entryService } from './entry.service.js'

export async function getEntrys(req, res) {
	try {
		const filterBy = {
			txt: req.query.txt || '',
			
            // sortField: req.query.sortField || '',
            // sortDir: req.query.sortDir || -1,
			
		}
		const entrys = await entryService.query(filterBy)
		res.json(entrys)
	} catch (err) {
		logger.error('Failed to get entrys', err)
		res.status(400).send({ err: 'Failed to get entrys' })
	}
}

export async function getEntryById(req, res) {
	try {
		const entryId = req.params.id
		const entry = await entryService.getById(entryId)
		res.json(entry)
	} catch (err) {
		logger.error('Failed to get entry', err)
		res.status(400).send({ err: 'Failed to get entry' })
	}
}

export async function addEntry(req, res) {
	const { loggedinUser, body: entry } = req

    console.log(entry.by);
    
	try {
		entry.by = loggedinUser
		const addedEntry = await entryService.add(entry)
		res.json(addedEntry)
	} catch (err) {
		logger.error('Failed to add entry', err)
		res.status(400).send({ err: 'Failed to add entry' })
	}
}

export async function updateEntry(req, res) {
	const { loggedinUser, body: entry } = req
    const { _id: userId } = loggedinUser

    if( entry.by._id !== userId) {
        res.status(403).send('Not your entry...')
        return
    }

	try {
		const updatedEntry = await entryService.update(entry)
		res.json(updatedEntry)
	} catch (err) {
		logger.error('Failed to update entry', err)
		res.status(400).send({ err: 'Failed to update entry' })
	}
}

export async function removeEntry(req, res) {
	try {
		const entryId = req.params.id
		const removedId = await entryService.remove(entryId)

		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove entry', err)
		res.status(400).send({ err: 'Failed to remove entry' })
	}
}

export async function addEntryMsg(req, res) {
	const { loggedinUser } = req

	try {
		const entryId = req.params.id
		const msg = {
			txt: req.body.txt,
			by: loggedinUser,
		}
		const savedMsg = await entryService.addEntryMsg(entryId, msg)
		res.json(savedMsg)
	} catch (err) {
		logger.error('Failed to update entry', err)
		res.status(400).send({ err: 'Failed to update entry' })
	}
}

export async function removeEntryMsg(req, res) {
	try {
		const entryId = req.params.id
		const { msgId } = req.params

		const removedId = await entryService.removeEntryMsg(entryId, msgId)
		res.send(removedId)
	} catch (err) {
		logger.error('Failed to remove entry msg', err)
		res.status(400).send({ err: 'Failed to remove entry msg' })
	}
}
