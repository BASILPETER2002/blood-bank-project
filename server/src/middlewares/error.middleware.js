// server/src/middlewares/error.middleware.js
export default function errorHandler(err, req, res, next) {
  console.error("❌ ERROR:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    message: err.message || "Internal Server Error",
  });
}
