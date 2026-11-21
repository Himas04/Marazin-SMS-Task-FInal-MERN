const errorMiddleware = (err, req, res, next) => {
    console.error(err);

    if (err.code === 11000) {
        const fields = err.keyPattern
            ? Object.keys(err.keyPattern)
            : (err.keyValue ? Object.keys(err.keyValue) : []);
        const fieldName = fields.length > 0 ? fields.join(", ") : "Field";
        return res.status(400).json({
            message: `${fieldName} already exists`,
        });
    }

    if (err.name === "ValidationError") {
        const errors = Object.values(err.errors || {}).map((error) => error.message);
        return res.status(400).json({
            message: errors.join(", "),
        });
    }

    if (err.name === "CastError") {
        return res.status(400).json({
            message: "Invalid ID format",
        });
    }

    res.status(err.statusCode || 500).json({
        message: err.message || "Server error",
    });
};

export default errorMiddleware;
