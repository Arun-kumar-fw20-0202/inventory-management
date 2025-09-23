require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const compression = require("compression");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");

// Custom Middlewares
const errorHandler = require("./src/middleware/errorHandler");

// Import Routes
const productRoutes = require("./src/routes/productRoutes");
const tenantRoutes = require("./src/routes/tenantRoutes");
const { authRouter } = require("./src/routes/authRoutes");
const { AllRoutes } = require("./src/routes/all-routes");

const app = express();

// =====================
// 🔹 Global Middlewares
// =====================
app.use(helmet()); // Security headers

const corsOptions = {
  origin: true,
  // origin: ["http://localhost:3009"],
  credentials: true,
  // hastag symbol `#` in the URL
};

app.use(cors(corsOptions)); // Configurable CORS
app.use(cookieParser()); // Parse cookies
app.use(express.json({ limit: "10mb" })); // Parse JSON payloads
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(compression()); // Gzip responses
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev")); // Logging only in dev
}

// =====================
// 🔹 Rate Limiter
// =====================
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." },
});
app.use("/api", limiter);

// =====================
// 🔹 Routes
// =====================
app.use("/api/v1", AllRoutes);
// app.use("/api/v1/products", productRoutes);
// app.use("/api/v1/tenants", tenantRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "Inventory Management API Running 🚀" });
});

// =====================
// 🔹 Error Handling
// =====================
app.use(errorHandler);

// =====================
// 🔹 MongoDB Connection
// =====================
   mongoose.connect(process.env.MONGO_DB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 20, // Connection pool for scaling
   })
   .then(() => {
      console.log("✅ MongoDB Connected");
      // Start server only after DB connection
      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
         console.log(`🚀 Server running on port ${PORT}`);
      });
   })
   .catch((err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
      process.exit(1);
   });
