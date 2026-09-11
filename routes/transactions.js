const express = require('express');
const router = express.Router();
const db = require('../db');

// Import middleware functions
const authenticate = require('../middleware/auth.middleware');
const { verifyBusinessOwnership, verifyTransactionOwnership } = require('../middleware/ownership.middleware');
const { validateTransaction } = require('../middleware/validate.middleware');

// ==========================================
// GET /transactions (Protected & Ownership Filtered)
// ==========================================
router.get('/', authenticate, async (req, res, next) => {
  const { business_id } = req.query;

  try {
    let sql = `
      SELECT 
        t.transaction_id,
        t.business_id,
        b.business_name,
        t.type,
        t.amount,
        t.category,
        t.description,
        t.transaction_date
      FROM transactions t
      JOIN businesses b ON t.business_id = b.business_id
      WHERE b.user_id = ?
    `;
    const values = [req.user.user_id];

    // Optional query param: /transactions?business_id=1
    if (business_id) {
      sql += ' AND t.business_id = ?';
      values.push(business_id);
    }

    sql += ' ORDER BY t.transaction_date DESC';

    const [rows] = await db.query(sql, values);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    next(error); // Delegate to centralized errorHandler middleware
  }
});

// ==========================================
// POST /transactions (Protected, Validated, & Business Ownership Checked)
// ==========================================
router.post(
  '/',
  authenticate,
  validateTransaction,
  verifyBusinessOwnership,
  async (req, res, next) => {
    const { business_id, type, amount, category, description, transaction_date } = req.body;

    try {
      const sql = `
        INSERT INTO transactions (business_id, type, amount, category, description, transaction_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [result] = await db.query(sql, [
        business_id,
        type.toUpperCase(),
        amount,
        category || null,
        description || null,
        transaction_date
      ]);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        transaction_id: result.insertId
      });
    } catch (error) {
      next(error);
    }
  }
);

// ==========================================
// PUT /transactions/:id (Protected, Validated, & Transaction Ownership Checked)
// ==========================================
router.put(
  '/:id',
  authenticate,
  verifyTransactionOwnership,
  validateTransaction,
  async (req, res, next) => {
    const { id } = req.params;
    const { type, amount, category, description, transaction_date } = req.body;

    try {
      const updates = [];
      const values = [];

      if (type !== undefined) {
        updates.push('type = ?');
        values.push(type.toUpperCase());
      }
      if (amount !== undefined) { updates.push('amount = ?'); values.push(amount); }
      if (category !== undefined) { updates.push('category = ?'); values.push(category); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (transaction_date !== undefined) { updates.push('transaction_date = ?'); values.push(transaction_date); }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields provided for update.' });
      }

      values.push(id);
      const sql = `UPDATE transactions SET ${updates.join(', ')} WHERE transaction_id = ?`;
      await db.query(sql, values);

      res.status(200).json({ success: true, message: `Transaction with ID ${id} updated successfully.` });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;