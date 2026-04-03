import { Router } from "express";
import { getUser, getById, createuser, updateuser, deleteuser } from "./users.controllers.js"
import { authMiddleware,restrictTo } from "../auth/auth.middleware.js";


const router = Router();
router.use("/users", authMiddleware) //Scope auth middleware only to user endpoints.

router.get("/users", getUser)

router.get("/admin/users",authMiddleware,restrictTo("admin"),getUser);
router.get("/users/:id", getById)
router.post("/users", createuser)
router.patch("/users/:id", updateuser)
router.delete("/users/:id", deleteuser)

export default router
