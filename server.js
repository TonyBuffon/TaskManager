const chalk = require("chalk")
const errors = chalk.bold.red;

const app = require("./app")
const dbConnection = require("./db/dbConnect")

const port = process.env.PORT || 3000

const start = async () => {
    try {
        dbConnection.connectDB(process.env.DATABASE_URI_LOCAL)
        app.listen(port, console.log(`Server is running on port: ${port}....`))

    } catch (err) {
        console.log(errors("ERROR!: " + err))
    }
}

start()