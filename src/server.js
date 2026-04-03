import app from "./app.js"
import dotenv from "dotenv"
import mongoose from "mongoose"

dotenv.config()

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Database is Connected");

    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
})

connectDB();


// process.exit(1): This is a "hard stop." The 1 stands for "exit with failure."
// Why kill the app? If your app relies on a database to function, there is no point in letting the server keep running in a "zombie" state where every user request will eventually fail anyway.

// 1. The "Next" Problem
// The catchAsync utility is designed specifically for Express route handlers.It works by catching an error and passing it to the next() middleware: 

// 2. Startup vs. RuntimeThe "job" of error handling changes depending on when the error happens:ScenarioTool UsedGoalApp Startup (connectDB)try-catchCrash the app. If the DB is down, the server shouldn't even start.User Request (Route)catchAsyncKeep the app alive. Send a 500 error to one user, but stay online for others.
