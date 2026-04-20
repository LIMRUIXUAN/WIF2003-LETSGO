const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong with the EcoPlanner!",
        error: err.message
    });
};

module.exports = errorHandler;