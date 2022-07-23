const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
    task: {
        type: String,
        required: [true, "Enter your task!"],
        trim: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    completed: {
        type: Boolean,
        default: false
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
    }
)

const Task = mongoose.model("Task", taskSchema)

module.exports = Task