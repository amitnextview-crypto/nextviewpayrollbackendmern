require('dotenv').config();
const express = require('express');
const PORT = process.env.PORT || 5500;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");
const dbConnection = require('./configs/db-config');
const authRoute = require('./routes/auth-route');
const adminRoute = require('./routes/admin-route');
const employeeRoute = require('./routes/employee-route');
const leaderRoute = require('./routes/leader-route');
const errorMiddleware = require('./middlewares/error-middleware');
const ErrorHandler = require('./utils/error-handler');
const {auth, authRole} = require('./middlewares/auth-middleware');
const payrollPolicyRoutes = require('./routes/payrollPolicyRoutes');
const cron = require("node-cron");
const userController = require("./controllers/user-controller");


const app = express();

// Database Connection
dbConnection();
const {CLIENT_URL} = process.env;
console.log(CLIENT_URL);

app.set("trust proxy", 1);

// 🔥 Global Preflight FIX
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.CLIENT_URL || "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");  // FIX

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);  // IMPORTANT FOR RENDER
  }

  next();
});


app.use(cors({
  origin: [
    process.env.CLIENT_URL,
    "http://localhost:3000"
  ],
   methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,                // allow cookies/auth headers
}));

cron.schedule(
  '0 07 15 * * *',
  () => {
    console.log("⏰ Running Auto Attendance at 10:30 AM IST...");
    userController.autoMarkAttendanceForAll();
  },
  {
    timezone: "Asia/Kolkata"
  }
);



//Configuration
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// ✅ Mount routes
app.use('/api/auth', authRoute);
app.use('/api/admin', auth, authRole(['admin']), adminRoute);
app.use('/api/admin', auth, authRole(['admin']), payrollPolicyRoutes);
app.use('/api/employee', auth, authRole(['employee','leader']), employeeRoute);
app.use('/api/leader', auth, authRole(['leader']), leaderRoute);

// ... your existing middlewares (bodyParser, cookieParser, sessions, passport, etc.)
const path = require('path');
// ✅ Serve uploaded images statically
app.use('/storage', express.static(path.join(__dirname, 'storage')));

//Middlewares;
app.use((req,res,next)=>
{
    return next(ErrorHandler.notFound('The Requested Resources Not Found'));
});

app.use(errorMiddleware)



// ✅ Show all registered routes (including nested ones)
const listRoutes = (path, layer) => {
  if (layer.route) {
    // Direct routes
    const routePath = path + layer.route.path;
    const methods = Object.keys(layer.route.methods)
      .map(m => m.toUpperCase())
      .join(', ');
    console.log(`🛠 ${methods} ${routePath}`);
  } else if (layer.name === 'router' && layer.handle.stack) {
    // Nested routers (e.g. /api/admin)
    layer.handle.stack.forEach(subLayer => {
      listRoutes(path + (layer.regexp?.source === '^\\/?$' ? '' : layer.regexp.source.replace(/\\\//g, '/').replace(/\^|\$|\?/g, '')), subLayer);
    });
  }
};

// Call this *after* all your app.use(...)
if (app._router && app._router.stack) {
  console.log('\n📜 Registered Routes:\n');
  app._router.stack.forEach(layer => listRoutes('', layer));
  console.log('\n🚀 Server running on port', PORT, '\n');
}



app.listen(PORT,()=>console.log(`Listening On Port : ${PORT}`));
