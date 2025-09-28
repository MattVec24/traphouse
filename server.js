const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000; // ✅ Railway usa la variabile PORT

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve index.html, style.css, ecc.

// Config database (Railway fornisce DATABASE_URL)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // richiesto da Railway
    })
  : null;

// Endpoint registrazione email
app.post("/register", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email richiesta" });
  }

  try {
    if (pool) {
      await pool.query("INSERT INTO iscritti(email) VALUES($1)", [email]);
    }
    res.json({ message: `Grazie! Sei registrato con ${email}` });
  } catch (err) {
    console.error("Errore DB:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Avvio server
app.listen(port, () => {
  console.log(`✅ Server attivo sulla porta ${port}`);
});