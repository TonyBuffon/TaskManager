const express = require("express")
const dotenv = require("dotenv")
dotenv.config('.env')
const app = express()

const userRouter = require("./routes/userRoute")
const taskRouter = require("./routes/taskRoute")


app.use(express.json())
app.use('/api/v1/users', userRouter)
app.use('/api/v1/tasks', taskRouter)

module.exports = app