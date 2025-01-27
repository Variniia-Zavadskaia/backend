import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'


export const entryService = {
	remove,
	query,
	getById,
	add,
	update,
	addEntryMsg,
	removeEntryMsg,
}

async function query(filterBy = { txt: '' }) {
	try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

		const collection = await dbService.getCollection('entry')
		var entryCursor = await collection.find(criteria, { sort })

		if (filterBy.pageIdx !== undefined) {
			entryCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
		}

		const entrys = entryCursor.toArray()
		return entrys
	} catch (err) {
		logger.error('cannot find entrys', err)
		throw err
	}
}

async function getById(entryId) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(entryId) }

		const collection = await dbService.getCollection('entry')
		const entry = await collection.findOne(criteria)
        
		entry.createdAt = entry._id.getTimestamp()
		return entry
	} catch (err) {
		logger.error(`while finding entry ${entryId}`, err)
		throw err
	}
}

async function remove(entryId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const { _id: ownerId, isAdmin } = loggedinUser

	try {
        const criteria = { 
            _id: ObjectId.createFromHexString(entryId), 
        }
        if(!isAdmin) criteria['owner._id'] = ownerId
        
		const collection = await dbService.getCollection('entry')
		const res = await collection.deleteOne(criteria)

        if(res.deletedCount === 0) throw('Not your entry')
		return entryId
	} catch (err) {
		logger.error(`cannot remove entry ${entryId}`, err)
		throw err
	}
}

async function add(entry) {
	try {
		const collection = await dbService.getCollection('entry')
		await collection.insertOne(entry)

		return entry
	} catch (err) {
		logger.error('cannot insert entry', err)
		throw err
	}
}

async function update(entry) {
    const entryToSave = { vendor: entry.vendor, speed: entry.speed }

    try {
        const criteria = { _id: ObjectId.createFromHexString(entry._id) }

		const collection = await dbService.getCollection('entry')
		await collection.updateOne(criteria, { $set: entryToSave })

		return entry
	} catch (err) {
		logger.error(`cannot update entry ${entry._id}`, err)
		throw err
	}
}

async function addEntryMsg(entryId, msg) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(entryId) }
        msg.id = makeId()
        
		const collection = await dbService.getCollection('entry')
		await collection.updateOne(criteria, { $push: { msgs: msg } })

		return msg
	} catch (err) {
		logger.error(`cannot add entry msg ${entryId}`, err)
		throw err
	}
}

async function removeEntryMsg(entryId, msgId) {
	try {
        const criteria = { _id: ObjectId.createFromHexString(entryId) }

		const collection = await dbService.getCollection('entry')
		await collection.updateOne(criteria, { $pull: { msgs: { id: msgId }}})
        
		return msgId
	} catch (err) {
		logger.error(`cannot add entry msg ${entryId}`, err)
		throw err
	}
}

function _buildCriteria(filterBy) {
    const criteria = {
        vendor: { $regex: filterBy.txt, $options: 'i' },
        speed: { $gte: filterBy.minSpeed },
    }

    return criteria
}

function _buildSort(filterBy) {
    if(!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}