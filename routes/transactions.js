const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
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
    `;
    const values = [];

    if (business_id) {
      sql += ' WHERE t.business_id = ?';
      values.push(business_id);
    }

    sql += ' ORDER BY t.transaction_date DESC';

    const [rows] = await db.query(sql, values);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { business_id, type, amount, category, description, transaction_date } = req.body;

  if (!business_id || !type || amount === undefined || !transaction_date) {
    return res.status(400).json({
      success: false,
      message: 'business_id, type, amount, and transaction_date are required fields.'
    });
  }

  if (!['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
    return res.status(400).json({
      success: false,
      message: "type must be either 'INCOME' or 'EXPENSE'."
    });
  }

  try {
    const [bizExists] = await db.query('SELECT business_id FROM businesses WHERE business_id = ?', [business_id]);
    if (bizExists.length === 0) {
      return res.status(404).json({ success: false, message: `Business with ID ${business_id} does not exist.` });
    }

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
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { type, amount, category, description, transaction_date } = req.body;

  try {
    const [existing] = await db.query('SELECT * FROM transactions WHERE transaction_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const updates = [];
    const values = [];

    if (type !== undefined) {
      if (!['INCOME', 'EXPENSE'].includes(type.toUpperCase())) {
        return res.status(400).json({ success: false, message: "type must be either 'INCOME' or 'EXPENSE'." });
      }
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
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;