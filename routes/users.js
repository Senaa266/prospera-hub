const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db'); // Adjust path based on folder structure

// Note: endpoints become relative to '/users' mounted in server.js
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT user_id, full_name, email, phone_number, country, created_at FROM users'
    );
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { full_name, email, phone_number, country, password } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'full_name, email, and password are required fields.'
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `
      INSERT INTO users (full_name, email, phone_number, country, password)
      VALUES (?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      full_name,
      email,
      phone_number || null,
      country || 'Ghana',
      hashedPassword
    ]);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user_id: result.insertId
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email already exists.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone_number, country, password } = req.body;

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE user_id = ?', [id]);
    if (existingUser.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const updates = [];
    const values = [];

    if (full_name !== undefined) { updates.push('full_name = ?'); values.push(full_name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (phone_number !== undefined) { updates.push('phone_number = ?'); values.push(phone_number); }
    if (country !== undefined) { updates.push('country = ?'); values.push(country); }
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields provided for update.' });
    }

    values.push(id);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE user_id = ?`;
    await db.query(sql, values);

    res.status(200).json({ success: true, message: `User with ID ${id} updated successfully.` });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Email address is already in use.' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;