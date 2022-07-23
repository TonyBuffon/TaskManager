const jwt = require("jsonwebtoken")
const catchAsync = require('./../utils/catchAsync')
const AppError = require('./../utils/AppError')
const { promisify } = require('util')

const User = require("../models/userModel")
const dotenv = require("dotenv")
dotenv.config('.env')

// const auth = async (req, res, next) => {
//     try {
//         console.log(req.header('Authorization').replace('Bearer ', ''))
//         const token = req.header('Authorization').replace('Bearer ', '')
//         const decoded = jwt.verify(token, process.env.JWT_SECRET)
//         const user = await User.findOne({ _id: decoded.id, 'tokens.token': token })
//         console.log(decoded)
//         console.log(user)
//         if (!user) {
//             throw new Error("There's no user")
//         }


//         //  4) Check if user changed password after the token was issued

//         if (user.changedPasswordAfter(decoded.iat)) {
//             throw new Error("User recently changed their password! Please login again!")
//         }
//         //  GRANT ACCESS TO PROTECTED ROUTES
//         req.token = token
//         req.user = user

//         next()
//     } catch (err) {
//         res.status(401).send({ error: 'Please authenticate.' })
//     }
// }

const auth = catchAsync(async (req, res, next) => {

    // 1) Getting token and check if it's exist
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer') && req.headers.authorization.split(' ')[1]) {
        token = req.headers.authorization.split(' ')[1]
    } else {

        return next(new AppError('You are not logged in! Please log in to get access.', 401))
    }
    // 2) Verification token

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)


    // 3) Check if user still existis

    const currentUser = await User.findById(decoded.id)
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401))
    }

    //  4) Check if user changed password after the token was issued

    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed their password! Please login again!', 401))
    }
    //  GRANT ACCESS TO PROTECTED ROUTES
    req.user = currentUser
    res.locals.user = currentUser;

    next()
})

module.exports = auth