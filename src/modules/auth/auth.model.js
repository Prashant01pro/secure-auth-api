import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,

        },
        password: {
            type: String,
        },
        role:{
            type:String,
            enum:["Admin","user"],
            default:"user"
        },
        authProvider:{
            type:String,
            enum:["local","Google"],
            default:"local"
        },

        googleId:{
            type:String
        },
        avatar:{
            type:String
        },

        refreshToken:{
            type:String,
            createdAt:Date
        },
        isVerified:{
            type:Boolean,
            default:false
        },
        emailVerificationToken:String,
        emailVerificationExpires:Date,

        passwordResetToken:String,
        passwordResetExpires:Date

    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);