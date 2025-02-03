import { ObjectId } from 'mongodb'

import { logger } from '../../services/logger.service.js'
import { makeId } from '../../services/util.service.js'
import { dbService } from '../../services/db.service.js'
import { asyncLocalStorage } from '../../services/als.service.js'

export const entryService = {
    remove,
    query,
    getById,
    getOwner,
    add,
    updateFull,
    update,
    addEntryMsg,
    removeEntryMsg,
    addComment,
    removeComment,
    updateComment
}

async function query(filterBy = { txt: '' }) {
    try {
        const criteria = _buildCriteria(filterBy)
        const sort = _buildSort(filterBy)

        const collection = await dbService.getCollection('entry')
        // var entryCursor = await collection.find(criteria, { sort })

        var entryCursor = await collection.find(criteria).sort({ _id: -1 })

        // if (filterBy.pageIdx !== undefined) {
        // 	entryCursor.skip(filterBy.pageIdx * PAGE_SIZE).limit(PAGE_SIZE)
        // }

        const entrys = entryCursor.toArray()
        // console.log('fff', entrys);

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

async function getOwner(entryId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(entryId) }
        logger.info('criteria', criteria)
        const collection = await dbService.getCollection('entry')
        const entry = await collection.find(criteria, { projection: { by: 1, _id: 0 } }).toArray()

        logger.info('getOwner', entry)

        return entry[0].by
    } catch (err) {
        logger.error(`while finding entry ${entryId}`, err)
        throw err
    }
}

async function remove(entryId) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const { _id: ownerId } = loggedinUser

    try {
        const criteria = {
            _id: ObjectId.createFromHexString(entryId),
        }
        criteria['by._id'] = ownerId

        const collection = await dbService.getCollection('entry')
        const res = await collection.deleteOne(criteria)

        if (res.deletedCount === 0) throw 'Not your entry'
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

async function updateFull(entry) {
    const entryToSave = { txt: entry.txt }

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

async function update(_id, field, val) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(_id) }
        let setCriteria = {}

        setCriteria[field] = val

        const collection = await dbService.getCollection('entry')
        await collection.updateOne(criteria, { $set: setCriteria })

        return getById(_id)
    } catch (err) {
        logger.error(`cannot update entry ${_id}`, err)
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
        await collection.updateOne(criteria, { $pull: { msgs: { id: msgId } } })

        return msgId
    } catch (err) {
        logger.error(`cannot add entry msg ${entryId}`, err)
        throw err
    }
}

async function addComment(_id, txt) {
    const { loggedinUser } = asyncLocalStorage.getStore()
    const newComment = {
        id: makeId(),
        txt,
        by: {
            _id: loggedinUser._id,
            fullname: loggedinUser.fullname,
            username: loggedinUser.username,
            imgUrl: loggedinUser.imgUrl,
        },
        likedBy: [],
        date: new Date(),
    }

    try {
        const criteria = { _id: ObjectId.createFromHexString(_id) }
        const collection = await dbService.getCollection('entry')
        await collection.updateOne(criteria, { $push: { comments: { $each: [newComment], $position: 0 } } })

        return getById(_id)
    } catch (err) {
        logger.error(`cannot add comment to entry ${_id}`, err)
        throw err
    }
}

async function updateComment(entryId, commentId, field, val) {
    if (field !== 'likedBy') {
        throw new Error('Prohibited change')
    }

    try {
        const entry = await getById(entryId)

        let updatedComment

        entry.comments = entry.comments.map(comment => {
            if (comment.id !== commentId) return comment
            
            comment[field] = val

            updatedComment = {...comment}

            return comment
        })

        // logger.info('updateComment entry', entry)

        const collection = await dbService.getCollection('entry')
        await collection.updateOne(
            { _id: ObjectId.createFromHexString(entryId), "comments.id": commentId }, 
            { $set: { "comments.$": updatedComment } }
          );

          return entry

    } catch (err) {
        logger.error(`cannot update comment in entry ${entryId}`, err)
        throw err
    }
}

async function removeComment(_id, commentId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(_id) }
        const collection = await dbService.getCollection('entry')
        await collection.updateOne(criteria, { $pull: { comments: { id: commentId } } })

        return getById(_id)
    } catch (err) {
        logger.error(`cannot add comment to entry ${_id}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {
        // txt: { $regex: filterBy.txt, $options: 'i' },
    }

    console.log(filterBy)

    if (filterBy.byId) {
        criteria['by._id'] = filterBy.byId
    }
    if (filterBy.ids) {
        const ids = filterBy.ids.map(id => ObjectId.createFromHexString(id))
        criteria._id = { $in: ids }
    }
    // db.collection.find({ _id: { $in: [ObjectId("65a12345abcd6789ef012345"), ObjectId("65a67890fghi1234jkl56789")] } })
    // { _id: ObjectId.createFromHexString(entryId) }
    console.log(criteria)

    return criteria
}

function _buildSort(filterBy) {
    if (!filterBy.sortField) return {}
    return { [filterBy.sortField]: filterBy.sortDir }
}
