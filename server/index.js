require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.CLIENT_URL, // e.g., https://your-frontend.vercel.app
].filter(Boolean);
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/recipes", require("./routes/recipes"));
app.use("/api/illustrations", require("./routes/illustrations"));
app.use("/api/pantry", require("./routes/pantry"));
app.use("/api/mealhistory", require("./routes/mealHistory"));
app.use("/api/shopping", require("./routes/shopping"));
app.use("/api/mealplan", require("./routes/mealPlan"));
app.use("/api/analytics", require("./routes/analytics"));
app.use("/api/learning", require("./routes/learning"));
app.use("/api/experience", require("./routes/experience"));
app.use("/api/social", require("./routes/social"));

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("🔥 MongoDB connected");
    app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    app.listen(PORT, () =>
      console.log(`⚠️ Server running on port ${PORT} (without DB)`),
    );
  });
