import { userService } from './user.service.js'
import { logger } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'

export async function getUser(req, res) {
    try {
        const user = await userService.getById(req.params.id)
        res.send(user)
    } catch (err) {
        logger.error('Failed to get user', err)
        res.status(400).send({ err: 'Failed to get user' })
    }
}

export async function getUsers(req, res) {
    try {
        const filterBy = {
            txt: req.query?.txt || '',
        }
        const users = await userService.query(filterBy)
        res.send(users)
    } catch (err) {
        logger.error('Failed to get users', err)
        res.status(400).send({ err: 'Failed to get users' })
    }
}

export async function deleteUser(req, res) {
    try {
        await userService.remove(req.params.id)
        res.send({ msg: 'Deleted successfully' })
    } catch (err) {
        logger.error('Failed to delete user', err)
        res.status(400).send({ err: 'Failed to delete user' })
    }
}

export async function updateUser(req, res) {
    const { loggedinUser } = req
    const { _id: userId } = loggedinUser
    const updUserId = req.params.id
    const { action } = req.body

    if (updUserId !== userId) {
        res.status(403).send('Not a logged in user...')
        return
    }

    if (action === 'update') {
        const { field, val } = req.body
        try {
            const updatedUser = await userService.update(updUserId, field, val)
            res.json(updatedUser)
        } catch (err) {
            logger.error('Failed to update user', err)
            res.status(400).send({ err: 'Failed to update user' })
        }
    } else if ( action === 'follow' || action === 'unfollow') {
        const followerId = updUserId
        const {followedId} = req.body
        
        try {
            const {followedUser, followingUser} = await userService.follow(followerId, followedId, action)
            res.json({followedUser, followingUser})
        } catch (err) {
            logger.error('Failed to ' + action + ' user', err)
            res.status(400).send({ err: 'Failed to ' + action + ' user' })
        }
    }
    else {
        res.status(403).send('Unsupported action')
        return
    }
}

export async function getSavedEntrys(req, res) {
    const { loggedinUser } = req
    const { _id: userId } = loggedinUser
    const _id = req.params.id

    if (_id !== userId) {
        res.status(403).send('Not a logged in user...')
        return
    }

    try {
        const savedEntrys = await userService.getSavedEntrys(_id)
        res.json(savedEntrys)
    } catch (err) {
        logger.error('Failed to get saved entrys ', err)
        res.status(400).send({ err: 'Failed to get saved entrys' })
    }
}

export async function getSuggestedUsers(req, res) {
    const { loggedinUser } = req
    const { _id: userId } = loggedinUser
    const _id = req.params.id

    if (_id !== userId) {
        res.status(403).send('Not a logged in user...')
        return
    }

    try {
        const suggestedUsers = await userService.suggestedUsers(_id)
        res.json(suggestedUsers)
    } catch (err) {
        logger.error('Failed to get suggested users ', err)
        res.status(400).send({ err: 'Failed to get suggested users' })
    }
}
