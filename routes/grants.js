const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  const { target_sector } = req.query;

  try {
    let sql = 'SELECT * FROM grants';
    const values = [];

    if (target_sector) {
      sql += ' WHERE target_sector = ?';
      values.push(target_sector);
    }

    sql += ' ORDER BY deadline ASC';

    const [rows] = await db.query(sql, values);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { provider_name, grant_title, target_sector, max_amount, requires_registration, deadline } = req.body;

  if (!provider_name || !grant_title) {
    return res.status(400).json({
      success: false,
      message: 'provider_name and grant_title are required fields.'
    });
  }

  try {
    const sql = `
      INSERT INTO grants (provider_name, grant_title, target_sector, max_amount, requires_registration, deadline)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      provider_name,
      grant_title,
      target_sector || null,
      max_amount !== undefined ? max_amount : null,
      requires_registration !== undefined ? requires_registration : false,
      deadline || null
    ]);

    res.status(201).json({
      success: true,
      message: 'Grant created successfully',
      grant_id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { provider_name, grant_title, target_sector, max_amount, requires_registration, deadline } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM grants WHERE grant_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Grant not found.' });
    }

    const updates = [];
    const values = [];

    if (provider_name !== undefined) { updates.push('provider_name = ?'); values.push(provider_name); }
    if (grant_title !== undefined) { updates.push('grant_title = ?'); values.push(grant_title); }
    if (target_sector !== undefined) { updates.push('target_sector = ?'); values.push(target_sector); }
    if (max_amount !== undefined) { updates.push('max_amount = ?'); values.push(max_amount); }
    if (requires_registration !== undefined) { updates.push('requires_registration = ?'); values.push(requires_registration); }
    if (deadline !== undefined) { updates.push('deadline = ?'); values.push(deadline); }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    values.push(id);
    const sql = `UPDATE grants SET ${updates.join(', ')} WHERE grant_id = ?`;
    await db.query(sql, values);

    res.status(200).json({ success: true, message: `Grant with ID ${id} updated successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;