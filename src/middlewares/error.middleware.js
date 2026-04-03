export const errorMiddleware = (err, req, res, next) => {

    console.error(err);

    res.status(err.statusCode || 500).json({
        status: "Error",
        message: err.message || "Internal Server Error"
    })

}