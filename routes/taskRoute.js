const express = require("express")
const taskController = require("../controllers/tasksController")
const auth = require('../authentication/auth')

const router = new express.Router()

router.route('/').get(auth, taskController.getAllTasks).post(auth, taskController.createTask)

router.route('/:id').get(auth, taskController.getTask).patch(auth, taskController.editTask).delete(auth, taskController.deleteTask)

module.exports = router