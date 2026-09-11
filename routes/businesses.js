const express = require('express');
const router = express.Router();
const db = require('../db');

// Import authentication and validation middleware
const authenticate = require('../middleware/auth.middleware');
const { validateBusiness } = require('../middleware/validate.middleware');
console.log("authenticate:", typeof authenticate);
console.log("validateBusiness:", typeof validateBusiness);

// ==========================================
// GET /businesses (Fetch All Businesses)
// ==========================================
router.get('/', authenticate, async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        b.business_id,
        b.user_id,
        u.full_name AS owner_name,
        u.email AS owner_email,
        b.business_name,
        b.industry_sector,
        b.is_registered,
        b.monthly_avg_revenue,
        b.readiness_score
      FROM businesses b
      JOIN users u ON b.user_id = u.user_id
      ORDER BY b.business_id DESC
    `;
    const [rows] = await db.query(sql);

    res.status(200).json({ 
      success: true, 
      count: rows.length,
      data: rows 
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// POST /businesses (Create Business)
// ==========================================
router.post('/', authenticate, validateBusiness, async (req, res, next) => {
  const { business_name, industry_sector, is_registered, monthly_avg_revenue, readiness_score } = req.body;
  const userId = req.user.user_id; // Securely extracted from JWT payload

  try {
    const sql = `
      INSERT INTO businesses (user_id, business_name, industry_sector, is_registered, monthly_avg_revenue, readiness_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      userId,
      business_name,
      industry_sector,
      is_registered !== undefined ? is_registered : false,
      monthly_avg_revenue !== undefined ? monthly_avg_revenue : 0.00,
      readiness_score !== undefined ? readiness_score : 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Business created successfully',
      business_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// PUT /businesses/:id (Update Business)
// ==========================================
router.put('/:id', authenticate, async (req, res, next) => {
  const { id } = req.params;
  const { business_name, industry_sector, is_registered, monthly_avg_revenue, readiness_score } = req.body;
  const userId = req.user.user_id;

  try {
    // 1. Verify business existence and ownership
    const [existing] = await db.query('SELECT * FROM businesses WHERE business_id = ?', [id]);

    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

    if (existing[0].user_id !== userId) {
      return res.status(403).json({ success: false, message: 'Access forbidden: You do not own this business.' });
    }

    // 2. Build dynamic update query
    const updates = [];
    const values = [];

    if (business_name !== undefined) { updates.push('business_name = ?'); values.push(business_name); }
    if (industry_sector !== undefined) { updates.push('industry_sector = ?'); values.push(industry_sector); }
    if (is_registered !== undefined) { updates.push('is_registered = ?'); values.push(is_registered); }
    if (monthly_avg_revenue !== undefined) { updates.push('monthly_avg_revenue = ?'); values.push(monthly_avg_revenue); }
    if (readiness_score !== undefined) { updates.push('readiness_score = ?'); values.push(readiness_score); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    values.push(id);
    const sql = `UPDATE businesses SET ${updates.join(', ')} WHERE business_id = ?`;
    await db.query(sql, values);

    res.status(200).json({ success: true, message: `Business with ID ${id} updated successfully.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;