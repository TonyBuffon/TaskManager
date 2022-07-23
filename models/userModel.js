const mongoose = require("mongoose")
const validator = require("validator")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const Task = require("./taskModel")
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Enter your name!"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Enter your e-mail"],
        unique: [true, "This email is already registered , Please use another or log in"],
        trim: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Enter valid email")
            }
        }
    },
    password: {
        type: String,
        required: [true, "Create password DUDE!!!"],
        minlength: [8, "Enter at least 8 characters :)"],
        trim: true,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error("Age must be a positive number!")
            }
        }
    },
    photo: {
        type: String,
        // required: [true, "Please send us your avatar's link."]
    }
}, { timestamps: true },
    {
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'creator'
})


userSchema.methods.generateAuthToken = async () => {
    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)
    await user.save()

    return token
}
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}


// userSchema.statics.findByCredentials = async (email, password) => {
//     const user = await User.findOne({ email })
//     if (!user) {
//         throw new Error('Unable to login.:(')
//     }
//     const isMatch = await bcrypt.compare(password, user.password)
//     if (!isMatch) {
//         throw new Error("Unable to login.:(")
//     }
//     return user
// }
userSchema.pre("save", async function () {
    const user = this
    if (user.isModified('password') || user.isNew) {
        this.password = await bcrypt.hash(this.password, 12)
    }
})

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changeTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)

        return JWTTimestamp < changeTimestamp
    }
    else {
        return false
    }
}
userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')
    console.log({ resetToken }, this.passwordResetToken)
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ creator: user._id })
    next()
})

userSchema.pre('save', function (next) {
    if (!this.isModified('password') || this.isNew) return next()
    this.passwordChangedAt = Date.now() - 10000;
    next()
})

const User = mongoose.model("User", userSchema)

module.exports = User