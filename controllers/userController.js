
const User = require("../models/userModel")
const auth = require("../authentication/auth")
const { sendWelcomeEmail, sendCancelationEmail, sendResetToken } = require('../middleware/email')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const AppError = require("../utils/AppError")
const catchAsync = require("../utils/catchAsync")

const signToken = id => {
    return jwt.sign({
        id
    }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, res) => {
    const id = user._id.toString()
    const token = signToken(id)

    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 3600000),
        httpOnly: true,
        secure: true
    }
    res.cookie('jwt', token, cookieOptions)
    user.password = undefined


    res.status(statusCode).json({ user, token })
}

exports.signup = catchAsync(async (req, res) => {

    const newUser = await User.create(req.body)
    sendWelcomeEmail(newUser.email, newUser.name)
    createSendToken(newUser, 201, res)
})

exports.login = catchAsync(async (req, res, next) => {

    const { email, password } = req.body

    //  Check if email & password exist

    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400))
    }
    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401))
    }
    console.log(user)

    createSendToken(user, 200, res)

})

exports.logout = (req, res) => {
    try {
        res.cookie('jwt', 'loggedout', {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true
        })
        res.send()
    } catch (err) {
        res.status(500).send()
    }
}


exports.getMe = (req, res) => {
    const user = req.user
    res.status(200).json({
        status: "Success",
        user
    })
}
exports.updateMe = catchAsync(async (req, res, next) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'age', "password"]
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    if (!isValid) {
        return next(new AppError("Invalid updates.", 400))
    }

    updates.forEach((update) => req.user[update] = req.body[update])
    await req.user.save({
        new: true,
        runValidators: true
    })
    res.status(200).json({ user: req.user })
})

exports.deleteUser = catchAsync(async (req, res) => {
    const user = req.user
    await user.remove()
    sendCancelationEmail(user.email, user.name)
    res.status(204).json({ user })
})
// const upload = multer({
//     storage: multer.memoryStorage(),
//     limits: {
//         fileSize: 1000000
//     },
//     fileFilter(req, file, cb) {
//         if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
//             return cb(new Error("Please upload Image with {jpg-jpeg-png} extension"))
//         }
//         cb(undefined, true)
//     }
// })

// exports.uploadPic = upload.single('photo')

// exports.resizePic = async (req, res, next) => {
//     if (!req.file) return next()
//     // req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

//     const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer()
//     req.user.photo = buffer
//     await req.user.save()
//     res.send()
// }
// exports.errorUploadPic = (error, req, res, next) => {
//     res.status(400).send({ error: error.message })
// }
// exports.deletePic = async (req, res) => {
//     req.user.photo = undefined
//     await req.user.save()
//     res.send()
// }

// exports.getPic = async (req, res) => {
//     try {
//         const user = await User.findById(req.params.id)
//         if (!user || !user.photo) {
//             throw new Error()
//         }
//         res.set('Content-Type', 'image/png')
//         res.send(user.photo)

//     } catch (err) {
//         res.status(404).send()
//     }
// }

exports.forgetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on posted email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        res.status(404).send("Can't find user with that email!")

    }
    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false })
    // 3) send it to user's email

    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`

        sendResetToken(user.email, user.name, resetURL)

        res.status(200).json({
            status: 'success',
            resetURL,
            message: 'Token sent to email!'
        })
    }
    catch (err) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })
        return next(new AppError(err.message, 500))

    }
})
exports.resetPassword = catchAsync(async (req, res, next) => {

    // 1) Get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt: Date.now() } })

    // 2) If token has not expired, and there is user , set the new password
    if (!user) {
        res.status(400).send('Token is invalid or has expired')
    }

    if (req.body.password !== req.body.passwordConfirm) {
        return next(new AppError("password and password confirm should be the same!", 400))
    }

    user.password = req.body.password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    // 3) Update changePasswordAt property for the user
    console.log(user)
    // 4) log the user in, send JWT


    createSendToken(user, 200, res)
})
// exports.updatePassword = async (req, res, next) => {
//     //  1) Get user from collection
//     const user = await User.findById(req.user.id).select('+password')
//     // 2) Check if Posted current password is correct
//     if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
//         res.status(401).send("Wrong Password")
//     }
//     // 3) if so, update password
//     user.password = req.body.password
//     user.passwordConfirm = req.body.passwordConfirm
//     await user.save()

//     // 4) log user in , send JWT

//     createSendToken(user, 200, res)
// }
