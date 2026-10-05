const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check / Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Help A Mission Welfare Society Backend API is running successfully!'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
