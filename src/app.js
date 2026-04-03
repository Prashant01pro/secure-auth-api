import express from "express";
import userRoute from "./modules/users/users.routes.js"
import { errorMiddleware } from "./middlewares/error.middleware.js";
import authRouter from "./modules/auth/auth.routes.js"
import cors from "cors"

const app = express();

app.use(cors({
    origin: "http://127.0.0.1:5500",  // front-end Url
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(authRouter)  // /register, /login
app.use(userRoute);  // /users protected by authMiddleware

app.use(errorMiddleware);

export default app;