// Validate User Registration payload
exports.validateUserRegister = (req, res, next) => {
  const { full_name, email, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'full_name, email, and password are required.'
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address format.' });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.'
    });
  }

  next();
};

// Validate Transaction payload
exports.validateTransaction = (req, res, next) => {
  const { business_id, type, amount, transaction_date } = req.body;

  if (req.method === 'POST' && (!business_id || !type || amount === undefined || !transaction_date)) {
    return res.status(400).json({
      success: false,
      message: 'business_id, type, amount, and transaction_date are required.'
    });
  }

  if (type && !['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "Type must be either 'INCOME' or 'EXPENSE'."
    });
  }

  if (amount !== undefined && (isNaN(amount) || Number(amount) < 0)) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a non-negative number.'
    });
  }

  next();
};
// Validate Business payload
exports.validateBusiness = (req, res, next) => {
  const {
    business_name,
    industry_sector,
    is_registered,
    monthly_avg_revenue,
    readiness_score
  } = req.body;

  // Required fields
  if (!business_name || !industry_sector) {
    return res.status(400).json({
      success: false,
      message: 'business_name and industry_sector are required.'
    });
  }

  // Validate is_registered if provided
  if (
    is_registered !== undefined &&
    typeof is_registered !== 'boolean'
  ) {
    return res.status(400).json({
      success: false,
      message: 'is_registered must be true or false.'
    });
  }

  // Validate monthly_avg_revenue if provided
  if (
    monthly_avg_revenue !== undefined &&
    (isNaN(monthly_avg_revenue) || Number(monthly_avg_revenue) < 0)
  ) {
    return res.status(400).json({
      success: false,
      message: 'monthly_avg_revenue must be a non-negative number.'
    });
  }

  // Validate readiness_score if provided
  if (
    readiness_score !== undefined &&
    (
      isNaN(readiness_score) ||
      Number(readiness_score) < 0 ||
      Number(readiness_score) > 100
    )
  ) {
    return res.status(400).json({
      success: false,
      message: 'readiness_score must be between 0 and 100.'
    });
  }

  next();
};