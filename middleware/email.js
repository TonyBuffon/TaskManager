const sgMail = require("@sendgrid/mail")

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "tonysamy100@outlook.com",
        subject: "Thanks for joining us <3",
        text: `Welcome to the app, ${name}. I wish you find no problems here.\n Don't forget to send us your feedback`
    }).then(() => {
        console.log("Email sent")
    }).catch((err) => {
        console.log("Error!: " + err)
    })
}
const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: "tonysamy100@outlook.com",
        subject: 'Sorry to see you go!',
        text: `GoodBye ${name} my friend.I hope to see you back sometime soon.`
    }).then(() => {
        console.log("Email sent")
    }).catch((err) => {
        console.log("Error!: " + err)
    })
}

const sendResetToken = (email, name, url) => {
    sgMail.send({
        to: email,
        from: "tonysamy100@outlook.com",
        subject: 'Reset Password (valid for only 10 minutes)',
        text: `Hello,${name}. If you tried to reset your password click on the link below and if you didn't just ignore this mail\n ${url}`
    }).then(() => {
        console.log("Email sent")
    }).catch((err) => {
        console.log("Error!: " + err)
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail,
    sendResetToken
}