require("dotenv").config();
const express = require("express");
const cors = require("cors");
const passport = require("passport");
const { connectDB } = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const offersRoutes = require("./routes/offers.routes");
const userRoutes = require("./routes/user.routes");
const productRoutes = require("./routes/product.routes");
const orderRoutes = require("./routes/order.routes");
const customerRoutes = require("./routes/customer.routes");
const razorpayRoutes = require("./routes/razorpay.routes");
const contactRoutes = require("./routes/contact.routes");

// Connect to PostgreSQL and start server only after connection is established
connectDB().then(isConnected => {
  if (!isConnected) {
    console.log("WARNING: PostgreSQL not available. Some features may be limited.");
    process.exit(1);
  } else {
    console.log("SUCCESS: PostgreSQL connected successfully.");
  }

  const app = express();

  // Add this before the CORS configuration to handle localhost issues
  app.use((req, res, next) => {
    // Log all requests for debugging
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // Configure CORS
  const corsOrigins = [
    "http://localhost:3000", 
    "http://localhost:5000",
    "http://localhost:5001",
    "http://localhost:5006",
    "http://localhost:5173",
    `http://10.191.31.104:3000`,
    `http://10.191.31.104:5173`
  ];

  // For development, be more permissive
  const corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      // Check if origin is in whitelist
      if (corsOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        // In development, allow all localhost origins
        if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      }
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.json());
  app.use(passport.initialize());

  // Mount auth routes under /auth (removing duplicate mounting at root)
  app.use("/auth", authRoutes);

  // Mount offers routes
  app.use("/offers", offersRoutes);

  // Mount user routes
  app.use("/api", userRoutes);
  app.use("/api", productRoutes);

  // Mount admin routes
  app.use("/api/admin/orders", orderRoutes);
  app.use("/api/admin/customers", customerRoutes);

  // Mount Razorpay routes
  app.use("/api/razorpay", razorpayRoutes);

  // Mount contact routes
  app.use("/api/contact", contactRoutes);

  // Basic health check
  app.get("/", (req, res) => res.json({ status: "ok" }));

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res
      .status(err.status || 500)
      .json({ error: err.message || "Internal Server Error" });
  });

  const PORT = process.env.PORT || 3002;
  const server = app.listen(PORT, '0.0.0.0', () => console.log(`Server running on 0.0.0.0:${PORT}`));

  // Add error handling for the server
  server.on('error', (err) => {
    console.error('Server error:', err);
  });

  server.on('listening', () => {
    const address = server.address();
    console.log('Server is listening on:', address);
  });
}).catch(err => {
  console.error("ERROR: Failed to connect to PostgreSQL:", err);
  process.exit(1);
});