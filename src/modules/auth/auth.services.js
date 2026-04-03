import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./auth.model.js"
import AppError from "../../utils/AppError.js"
import crypto from "crypto"


const generateRefreshToken = (UserId) => {
    return jwt.sign(
        { id: UserId },
        process.env.JWT_REFRESH,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

export const generateAccessToken = (UserId) => {
    return jwt.sign(
        { id: UserId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    )
}

export const generatePassowrdResetToken = (user) => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    user.passwordResetExpires = Date.now() + 10 * 60 * 1000  // 10 min
    return rawToken;
}

export const generateEmailVerificationToken = (user) => {

    const rawToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex")

    user.emailVerificationExpires = Date.now() + 10 * 60 * 1000;   // 10 Minutes

    return rawToken;

};

export const registerfn = async (username, email, password) => {

    const existingUser = await User.findOne({ email })

    if (existingUser) {
        throw new AppError("User Already Exist", 400)
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        username,
        email,
        password: hashedPassword
    });

    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);
    const verificationToken = generateEmailVerificationToken(newUser)

    // Save Refresh Token in DB
    newUser.refreshToken = refreshToken;
    // newUser.emailVerificationToken=verificationToken
    await newUser.save();

    return {
        accessToken,
        refreshToken,
        verificationToken,
        user: {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email
        }
    }
};

export const loginfn = async (email, password) => {

    const user = await User.findOne({ email });

    if (!user) {
        throw new AppError("Invalid Creditials", 400)
    }

    const ismatch = await bcrypt.compare(password, user.password);
    if (!ismatch) {
        throw new AppError("Invalid Creditials", 400)
    }

    //Generate Token

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save()

    return {
        accessToken,
        refreshToken,
        username: user.username
    }

};


