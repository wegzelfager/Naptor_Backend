const errorMidlleware = (err, req, res, next) => {
    console.error(`🚨 [Error] ${req.method} ${req.url} -> ${err.message}`);
    const statusCode = err.statusCode || 500;
    if (err.isOperational) {
        return res.status(400).json({
            status: "error",
            message: err.message,
        })
    }
    if (statusCode === 401 || err.message.includes('token')) {
        return res.status(401).json({
            status: "error",
            message: err.message || "Not authorized, token failed or expired"
        });
    }

    if (err.name == "CastError") {
        return res.status(err.status).json({
            status: "error",
            message: `Invalid ${err.path}: ${err.value}. Please provide a valid ID.`
        })
    }

    if (err.code === 11000) {   
        return res.status(409).json({
            status: "error",
            message: `Email already exists. Please use a different value.`,
        })
    }

    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        return res.status(422).json({
            status: "error",
            message: messages.join(". "),
        });
    }

    if (err.statusCode) {
        return res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
    }

    return res.status(500).json({
        status: "error",
        message: "Something went wrong on our end. Please try again later."
    })
}
module.exports = errorMidlleware;