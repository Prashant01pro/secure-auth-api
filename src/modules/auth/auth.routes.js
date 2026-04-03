import { Router } from "express";
import { register, login, refreshTokenController, verifyEmailController, resendVerificationController, resetPasswordController, forgetPasswordController,logoutController } from "./auth.controller.js";
import { verifyRefreshToken,authMiddleware } from "./auth.middleware.js";
import { googleAuthController } from "./auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", verifyRefreshToken, refreshTokenController)
router.get("/verify-email/:token", verifyEmailController);
router.post("/resend-verification", resendVerificationController);
router.post("/forget-password", forgetPasswordController)
router.patch("/reset-password/:token", resetPasswordController)
router.post("/logout", authMiddleware, logoutController);
router.post("/google",googleAuthController)

export default router;

// search :google cloud console [ for oAuth google system authentication ]