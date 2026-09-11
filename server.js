const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send("Server is active");
});

app.use('/users', require('./routes/users'));
app.use('/transactions', require('./routes/transactions'));
app.use('/grants', require('./routes/grants'));
app.use('/businesses', require('./routes/businesses'));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});