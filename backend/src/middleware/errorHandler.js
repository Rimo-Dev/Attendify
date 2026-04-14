function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
}

function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || "Something went wrong.",
    details: error.details || null,
    stack: process.env.NODE_ENV === "production" ? undefined : error.stack,
  });
}

module.exports = {
  notFound,
  errorHandler,
};
