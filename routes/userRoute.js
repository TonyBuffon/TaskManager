const express = require('express')
const userController = require('../controllers/userController')
const auth = require('../authentication/auth')

const router = new express.Router()

router.post('/signup', userController.signup)
router.post('/login', userController.login)

router.patch('/resetpassword/:token', userController.resetPassword)
router.post('/forgetpassword', userController.forgetPassword)



router.post('/logout', auth, userController.logout)
router.route('/me').patch(auth, userController.updateMe).get(auth, userController.getMe).delete(auth, userController.deleteUser)


module.exports = router