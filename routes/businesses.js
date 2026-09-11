const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
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
    `;
    const [rows] = await db.query(sql);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { user_id, business_name, industry_sector, is_registered, monthly_avg_revenue, readiness_score } = req.body;

  if (!user_id || !business_name || !industry_sector) {
    return res.status(400).json({
      success: false,
      message: 'user_id, business_name, and industry_sector are required fields.'
    });
  }

  try {
    const [userExists] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [user_id]);
    if (userExists.length === 0) {
      return res.status(404).json({ success: false, message: `User with ID ${user_id} does not exist.` });
    }

    const sql = `
      INSERT INTO businesses (user_id, business_name, industry_sector, is_registered, monthly_avg_revenue, readiness_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      user_id,
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
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { business_name, industry_sector, is_registered, monthly_avg_revenue, readiness_score } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM businesses WHERE business_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Business not found.' });
    }

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
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;