const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "srv1624.hstgr.io",
  database: "u115615899_arauf_crm",
  user: "u115615899_arauf_crm",
  password: "Admindeveloper@1234", // Add your MySQL password if set
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test connection
db.getConnection()
  .then((connection) => {
    console.debug("✅ Connected to MySQL Database: arauf_crm_main");
    connection.release();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

module.exports = db;