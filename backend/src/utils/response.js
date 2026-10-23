/**
 * Centralized Response Utilities
 * Standardizes all API responses across the application.
 */

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {*} data - Response payload
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
  };
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {Array} errors - Detailed error list (e.g., Zod validation errors)
 */
const sendError = (res, message = 'An error occurred', statusCode = 500, errors = []) => {
  const response = {
    success: false,
    message,
  };
  if (errors.length > 0) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response.
 */
const sendPaginated = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
};

module.exports = { sendSuccess, sendError, sendPaginated };
