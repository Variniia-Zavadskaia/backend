import { logger } from '../../services/logger.service.js'
import { entryService } from './entry.service.js'

export async function getEntrys(req, res) {
	try {
		const filterBy = {
			txt: req.query.txt || '',
            byId: req.query.byId || '',
            // ids: req.query.ids || [],
			
            // sortField: req.query.sortField || '',
            sortDir: req.query.sortDir || -1,
		}
		const entrys = await entryService.query(filterBy)
        console.log(entrys);
        
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
    
	try {
		entry.by = loggedinUser

        console.log(entry.by);
        

		const addedEntry = await entryService.add(entry)
		res.json(addedEntry)
	} catch (err) {
		logger.error('Failed to add entry', err)
		res.status(400).send({ err: 'Failed to add entry' })
	}
}

export async function updateEntry(req, res) {
	const { loggedinUser, body: updReq } = req
    const action = updReq.action
    const { _id: userId } = loggedinUser

    logger.info(updReq, action);

    if (action === 'full') {
        const entry = updReq.entry

        if( entry.by._id !== userId) {
            res.status(403).send('Not your entry...')
            return
        }

        try {
            const updatedEntry = await entryService.updateFull(entry)
            res.json(updatedEntry)
        } catch (err) {
            logger.error('Failed to update entry', err)
            res.status(400).send({ err: 'Failed to update entry' })
        }
    }
    else if (action === 'update') {
        const allowChange = [
            'txt', 'comments', 'likedBy'
        ]
        const onlyOwnerChange = [
            'txt'
        ]
        const entryId = req.params.id
        const {field, val} = updReq

        if (!allowChange.includes(field)) {
            res.status(403).send('The change is prohibited')
            return
        }
        if (onlyOwnerChange.includes(field)) {
            const owner = await entryService.getOwner(entryId)

            logger.info('owner:', owner);

            if( owner._id !== userId) {
                res.status(403).send('Not your entry...')
                return
            }
        }

        try {
            const updatedEntry = await entryService.update(entryId, field, val)
            res.json(updatedEntry)
        } catch (err) {
            logger.error('Failed to update entry', err)
            res.status(400).send({ err: 'Failed to update entry' })
        }

    }
    else {
        res.status(403).send('Unsupported action')
        return
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

export async function addEntryComment(req, res){
    const _id = req.params.id
    const {txt} = req.body

    try {
		const updatedEntry = await entryService.addComment(_id, txt)

		res.send(updatedEntry)
	} catch (err) {
		logger.error('Failed to add comment', err)
		res.status(400).send({ err: 'Failed to add comment' })
	}
}

export async function removeEntryComment(req, res){
    const {id: _id, commentId} = req.params

    try {
		const updatedEntry = await entryService.removeComment(_id, commentId)

		res.send(updatedEntry)
	} catch (err) {
		logger.error('Failed to remove comment', err)
		res.status(400).send({ err: 'Failed to remove comment' })
	}
}

export async function updateEntryComment(req, res){
    const {id: _id, commentId} = req.params
    const { action, field, val } = req.body
    
    if (action !== 'update') {
        res.status(400).send({ err: 'Prohibited action' })
    }

    try {
		const updatedEntry = await entryService.updateComment(_id, commentId, field, val)

		res.send(updatedEntry)
	} catch (err) {
		logger.error('Failed to update comment', err)
		res.status(400).send({ err: 'Failed to update comment' })
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
