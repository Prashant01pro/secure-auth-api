import { registerfn, loginfn, generatePassowrdResetToken } from "./auth.services.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { generateAccessToken } from "./auth.services.js";
import crypto from "crypto"
import AppError from "../../utils/AppError.js";
import User from "./auth.model.js"
import { generateEmailVerificationToken } from "./auth.services.js";
import bcrypt from "bcryptjs";
import client from "../../config/googleClient.js";

export const register = catchAsync(async (req, res) => {
    const { username, email, password } = req.body;

    const data = await registerfn(username, email, password)

    res.status(201).json({
        message: "User Registeration Successfull",
        ...data
    })
});

export const login = catchAsync(async (req, res) => {
    const { email, password } = req.body;


    if (!email || !password) {
        throw new AppError("Email and password are required", 400);
    }

    const data = await loginfn(email, password)

    res.status(200).json({
        message: "Login Successful",
        ...data
    })
})

export const refreshTokenController = catchAsync((req, res) => {
    const newAccessToken = generateAccessToken(req.user._id)

    res.status(200).json({
        accessToken: newAccessToken
    })

})

export const verifyEmailController = catchAsync(async (req, res) => {
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex")

    const user = await User.findOne({
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        throw new AppError("Invalid or Expires token", 400)
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Email verified successfully" });


})

export const resendVerificationController = catchAsync(async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError("User not found", 404);
    }

    if (user.isVerified) {
        throw new AppError("Email already verified", 400);
    }

    const verificationToken = generateEmailVerificationToken(user);

    await user.save();

    const verificationURL = `http://localhost:4000/verify-email/${verificationToken}`;

    console.log("Resend Verification URL:", verificationURL);

    res.status(200).json({
        message: "Verification email resent successfully"
    });
});

export const forgetPasswordController = catchAsync(async (req, res) => {

    const { email } = req.body
    const user = await User.findOne({ email })

    if (!user) {
        throw new AppError("User not found", 404);
    }

    const resetToken = generatePassowrdResetToken(user)
    await user.save()

    const resetUrl = `http://localhost:4000/reset-password/${resetToken}`

    console.log("Password Reset URL : ", resetUrl)

    res.status(200).json({
        message: "Password Reset Link Send"
    });

})

export const resetPasswordController = catchAsync(async (req, res) => {
    const hashedToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })

    if (!user) {
        throw new AppError("Token invalid or expired", 400);
    }

    const { newPassword } = req.body;

    user.password = await bcrypt.hash(newPassword, 12);

    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({
        message: "Passowrd Reset Successful"
    })
})

export const logoutController = catchAsync(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    user.refreshToken = undefined;

    await user.save();

    res.status(200).json({
        message: "Logged out successfully"
    });
});

export const googleAuthController = catchAsync(async (req, res) => {
    const { token } = req.body;

    if (!token) {
        throw new AppError("Google token is required", 400)
    }

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()

    const { sub, email, name, picture } = payload;

    let user = await User.findOne({ email });

    if (!user) {
        user = await User.create({
            username: name,
            email,
            googleId: sub,
            avatar: picture,
            authProvider: "Google",
            isVerified: true
        })
    }

    const accessToken = generateAccessToken(user._id);

    res.status(200).json({
        message: "Google Login Successful",
        accessToken,
        user
    })
})
