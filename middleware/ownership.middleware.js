const db = require('../db');

// Check if a business belongs to the authenticated user
exports.verifyBusinessOwnership = async (req, res, next) => {
  const businessId = req.params.id || req.body.business_id;
  const userId = req.user.user_id;

  if (!businessId) {
    return res.status(400).json({ success: false, message: 'Business ID is required.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT user_id FROM businesses WHERE business_id = ?',
      [businessId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not own this business.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Check if a transaction belongs to a business owned by the user
exports.verifyTransactionOwnership = async (req, res, next) => {
  const transactionId = req.params.id;
  const userId = req.user.user_id;

  try {
    const sql = `
      SELECT b.user_id 
      FROM transactions t
      JOIN businesses b ON t.business_id = b.business_id
      WHERE t.transaction_id = ?
    `;
    const [rows] = await db.query(sql, [transactionId]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden: You do not own the business associated with this transaction.'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};