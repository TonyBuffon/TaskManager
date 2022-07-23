const Task = require("../models/taskModel")
const auth = require("../authentication/auth")
const catchAsync = require("../utils/catchAsync")

exports.getAllTasks = catchAsync(async (req, res) => {
    const match = {}
    const sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }
    console.log(match)


    await req.user.populate([{
        path: "tasks", match, options: {
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip),
            sort
        }
    }])
    console.log(req.user)
    res.status(200).json({
        status: "success",
        tasks: req.user.tasks
    })
})
exports.getTask = catchAsync(async (req, res) => {
    const Tid = req.params.id

    const task = await Task.findOne({ _id: Tid, creator: req.user._id })
    console.log(task)
    if (!task) {
        return res.status(404).send()
    }
    res.status(200).json({
        status: "success",
        task
    })
})

exports.createTask = catchAsync(async (req, res) => {
    const task = new Task({
        ...req.body,
        creator: req.user._id
    })

    await task.save()
    res.status(201).json({
        status: 'success',
        task
    })
})

exports.editTask = catchAsync(async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['task', 'completed']
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    if (!isValid) {
        return res.status(400).send({ error: "Invalid updates!!" })
    }

    const task = await Task.findOne({ _id: req.params.id, creator: req.user._id })
    if (!task) {
        return res.status(404).send()
    }
    updates.forEach((update) => task[update] = req.body[update])
    await task.save()
    res.status(200).json({
        status: 'success',
        task
    })

})

exports.deleteTask = catchAsync(async (req, res) => {

    const task = await Task.findByIdAndDelete({ _id: req.params.id, creator: req.user._id })
    if (!task) {
        res.status(404).send()
    }
    res.send(task)

})