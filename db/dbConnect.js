const mongoose = require("mongoose")
exports.connectDB = (url) => {
    mongoose.connect(url, {
        useNewUrlParser: true
    })
}
