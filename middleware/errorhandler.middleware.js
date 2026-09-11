module.exports = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);

  // Handle MySQL Duplicate Entry Errors (e.g., duplicate emails)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate record entry encountered.'
    });
  }

  // Handle MySQL Foreign Key Constraint Failures
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Referenced foreign key resource does not exist.'
    });
  }

  // Default Generic Error Response
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};