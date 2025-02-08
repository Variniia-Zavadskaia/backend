import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { reviewService } from '../review/review.service.js'
import { ObjectId } from 'mongodb'

export const userService = {
    add, // Create (Signup)
    getById, // Read (Profile page)
    update, // Update (Edit profile)
    remove, // Delete (remove user)
    query, // List (of users)
    getByUsername, // Used for Login
    getSavedEntrys,
    follow,
    unfollow,
    suggestedUsers
}

async function query(filterBy = {}) {
    const criteria = _buildCriteria(filterBy)
    try {
        const collection = await dbService.getCollection('user')
        var users = await collection.find(criteria).toArray()
        users = users.map(user => {
            delete user.password
            user.createdAt = user._id.getTimestamp()
            // Returning fake fresh data
            // user.createdAt = Date.now() - (1000 * 60 * 60 * 24 * 3) // 3 days ago
            return user
        })
        return users
    } catch (err) {
        logger.error('cannot find users', err)
        throw err
    }
}

async function getById(userId) {
    try {
        var criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection('user')
        const user = await collection.findOne(criteria)
        delete user.password

        // criteria = { byUserId: userId }

        // user.givenReviews = await reviewService.query(criteria)
        // user.givenReviews = user.givenReviews.map(review => {
        //     delete review.byUser
        //     return review
        // })

        return user
    } catch (err) {
        logger.error(`while finding user by id: ${userId}`, err)
        throw err
    }
}

async function getByUsername(username) {
    try {
        const collection = await dbService.getCollection('user')
        const user = await collection.findOne({ username })
        return user
    } catch (err) {
        logger.error(`while finding user by username: ${username}`, err)
        throw err
    }
}

async function remove(userId) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection('user')
        await collection.deleteOne(criteria)
    } catch (err) {
        logger.error(`cannot remove user ${userId}`, err)
        throw err
    }
}

async function update(_id, field, val) {
    try {
        const criteria = { _id: ObjectId.createFromHexString(_id) }
        let setCriteria = {}

        setCriteria[field] = val

        const collection = await dbService.getCollection('user')
        await collection.updateOne(criteria, { $set: setCriteria })

        return getById(_id)
    } catch (err) {
        logger.error(`cannot update user ${_id}`, err)
        throw err
    }
}

async function getSavedEntrys(_id) {
    try {
        const collection = await dbService.getCollection('user')

        const savedEntrys = await collection
            .aggregate([
                {
                    $match: { _id: ObjectId.createFromHexString(_id) },
                },
                {
                    $addFields: {
                        savedObjectIds: {
                            $map: {
                                input: '$savedEntryIds',
                                as: 'entryId',
                                in: {
                                    $toObjectId: '$$entryId',
                                },
                            },
                        },
                    }, // Convert string IDs to ObjectIds
                },
                {
                    $lookup: {
                        from: 'entry',
                        localField: 'savedObjectIds',
                        foreignField: '_id',
                        as: 'savedEntrys',
                    },
                },
                {
                    $project: {
                        savedEntrys: 1,
                        _id: 0,
                    },
                },
            ])
            .toArray()

        return savedEntrys[0].savedEntrys
    } catch (err) {
        logger.error('while finding saved entrys', err)
        throw err
    }
}

async function add(user) {
    try {
        // peek only updatable fields!
        const userToAdd = {
            username: user.username,
            password: user.password,
            fullname: user.fullname,
            imgUrl: user.imgUrl,
        }
        const collection = await dbService.getCollection('user')
        await collection.insertOne(userToAdd)
        return userToAdd
    } catch (err) {
        logger.error('cannot add user', err)
        throw err
    }
}

async function suggestedUsers(userId) {
    try {
        var criteria = { _id: ObjectId.createFromHexString(userId) }

        const collection = await dbService.getCollection('user')
        let { following } = await collection.findOne(criteria, { following: 1 })

        // console.log(following);

        following = following.map(followed => ObjectId.createFromHexString(followed._id))

        following.push(ObjectId.createFromHexString(userId))

        logger.info('ddd', following);

        const suggestions = await collection.aggregate([
            {
                $match: {
                    _id: { $nin: following },
                },
            },
            {
                $sample: { size: 3 },
            },
            {
                $project: {
                    username: 1,
                    fullname: 1,
                    imgUrl: 1,
                },
            },
        ]).toArray()

        logger.info('hhhh', suggestions);
        

        return suggestions
    } catch (err) {
        logger.error('cannot get suggested users', err)
        throw err
    }
}

async function follow(followerId, followedId, action) {
    try {
        const collection = await dbService.getCollection('user')
        const followingUser = await getById(followerId)
        const followedUser = await getById(followedId)

        if (action === 'follow') {
            if (!followedUser.followers) followedUser.followers = []
            if (!followedUser.followers.some(follower => follower._id === followerId)) {
                followedUser.followers.push({
                    _id: followerId,
                    username: followingUser.username,
                    imgUrl: followingUser.imgUrl,
                })
            }

            if (!followingUser.following) followingUser.following = []
            if (!followingUser.following.some(followed => followed._id === followedId)) {
                followingUser.following.push({
                    _id: followedId,
                    username: followedUser.username,
                    imgUrl: followedUser.imgUrl,
                })
            }
        } else {
            if (followedUser.followers) {
                followedUser.followers = followedUser.followers.filter(follower => follower._id !== followerId)
            }
            if (followingUser.following) {
                followingUser.following = followingUser.following.filter(followed => followed._id !== followedId)
            }
        }

        // logger.info('users:', followingUser, followedUser)

        await collection.bulkWrite([
            {
                updateOne: {
                    filter: { _id: ObjectId.createFromHexString(followerId) },
                    update: { $set: { following: followingUser.following } },
                },
            },
            {
                updateOne: {
                    filter: { _id: ObjectId.createFromHexString(followedId) },
                    update: { $set: { followers: followedUser.followers } },
                },
            },
        ])

        return { followingUser, followedUser }
    } catch (err) {
        logger.error('cannot follow user', err)
        throw err
    }
}

async function unfollow(followerId, followedId) {}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.txt) {
        const txtCriteria = { $regex: filterBy.txt, $options: 'i' }
        criteria.$or = [
            {
                username: txtCriteria,
            },
            {
                fullname: txtCriteria,
            },
        ]
    }

    return criteria
}
