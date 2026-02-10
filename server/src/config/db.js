const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // Add your MySQL password if set
  database: "arauf_crm_main",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
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