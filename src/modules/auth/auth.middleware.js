import jwt from "jsonwebtoken";
import AppError from '../../utils/AppError.js'
import { catchAsync } from "../../utils/catchAsync.js";
import User from "./auth.model.js"

export const authMiddleware = catchAsync(async (req, res, next) => {

    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new AppError("No token , Authorization Denied", 401)
    };

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
        throw new AppError("Token is not valid", 401)
    }
    req.user = decoded;

    next();
})

export const verifyRefreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return next(new AppError("Refresh Token Required", 401))
    };

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH)
    const user = await User.findById(decoded.id)

    if (!user || user.refreshToken !== refreshToken) {
        return next(new AppError("Invalid Refresh Token", 401))
    }

    req.user = user;
    next()

})

export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError("Access Denied", 403))
        }
        next()
    }
}