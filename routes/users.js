const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// Import validation middleware
const { validateUserRegister } = require('../middleware/validate.middleware');

// ==========================================
// GET /users (Fetch All Users)
// ==========================================
router.get('/', async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        user_id, 
        full_name, 
        email, 
        phone_number, 
        country, 
        created_at 
      FROM users 
      ORDER BY user_id DESC
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
// POST /users/register (User Registration)
// ==========================================
router.post('/register', validateUserRegister, async (req, res, next) => {
  const { full_name, email, phone_number, country, password } = req.body;

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
      message: 'User registered successfully',
      user_id: result.insertId
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// POST /users/login (User Authentication & JWT Signing)
// ==========================================
router.post('/login', async (req, res, next) => {
  console.log("🔥 LOGIN ROUTE WAS HIT");

  // Check what the server actually received
  console.log("BODY RECEIVED:", req.body);

  const { email, password } = req.body;

  console.log("EMAIL:", email);
  console.log("PASSWORD EXISTS:", !!password);

  // Check if email or password is missing
  if (!email || !password) {
    console.log("❌ Email or password missing");

    return res.status(400).json({
      success: false,
      message: 'Email and password are required.'
    });
  }

  try {
    // ==========================================
    // Find user in database
    // ==========================================
    console.log("🔍 Searching database for:", email);

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    console.log("👤 Users found:", rows.length);

    // User doesn't exist
    if (rows.length === 0) {
      console.log("❌ No user found with this email");

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const user = rows[0];

    console.log("✅ User found:", user.email);
    console.log("🔍 FULL USER OBJECT:", user);
console.log("🔍 USER KEYS:", Object.keys(user));
console.log("🔐 PASSWORD VALUE:", user.Password);
console.log("🔐 PASSWORD EXISTS:", !!user.Password);

    // ==========================================
    // Make sure password hash exists
    // ==========================================
    if (!user.Password) {
      console.log("❌ User has no password hash in database");

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // ==========================================
    // Compare entered password with DB hash
    // ==========================================
    console.log("🔐 Comparing password...");

    const isPasswordValid = await bcrypt.compare(
      password,
      user.Password
    );

    console.log("🔑 Password valid:", isPasswordValid);

    // Password is incorrect
    if (!isPasswordValid) {
      console.log("❌ Incorrect password");

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // ==========================================
    // Create JWT payload
    // ==========================================
    const payload = {
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name
    };

    // ==========================================
    // Generate JWT
    // ==========================================
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_fallback_jwt_secret',
      {
        expiresIn: '24h'
      }
    );

    console.log("✅ JWT generated successfully");

    // ==========================================
    // Send response
    // ==========================================
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        country: user.country
      }
    });

  } catch (error) {
    console.error("🔥 LOGIN ERROR:", error);
    next(error);
  }
});

module.exports = router;