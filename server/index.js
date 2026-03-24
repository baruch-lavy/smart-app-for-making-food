require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/illustrations', require('./routes/illustrations'));
app.use('/api/pantry', require('./routes/pantry'));
app.use('/api/mealhistory', require('./routes/mealHistory'));
app.use('/api/shopping', require('./routes/shopping'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/mealplan', require('./routes/mealPlan'));
app.use('/api/learning', require('./routes/learning'));
app.use('/api/experience', require('./routes/experience'));
app.use('/api/social', require('./routes/social'));

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('🔥 MongoDB connected');
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    app.listen(PORT, () => console.log(`⚠️ Server running on port ${PORT} (without DB)`));
  });
