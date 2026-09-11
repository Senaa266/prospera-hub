const mysql = require('mysql2/promise');

// Create a connection pool to handle multiple queries efficiently
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',      // Your MySQL username
  password: '@administrator@20',      // Your MySQL password
  database: 'hackDB',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;