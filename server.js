const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000; // Railway imposta PORT

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve index.html, style.css, script.js, ecc.

// Config database (Railway fornisce DATABASE_URL automaticamente)
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // richiesto da Railway
  });
  console.log("✅ Connessione al database configurata");
} else {
  console.warn("⚠️ Nessuna DATABASE_URL trovata, DB non configurato!");
}

// Endpoint registrazione email
app.post("/register", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email richiesta" });
  }

  try {
    if (pool) {
      await pool.query(
        "CREATE TABLE IF NOT EXISTS iscritti (id SERIAL PRIMARY KEY, email TEXT UNIQUE)"
      );
      await pool.query("INSERT INTO iscritti(email) VALUES($1) ON CONFLICT DO NOTHING", [email]);
    }
    res.json({ message: `Grazie! Sei registrato con ${email}` });
  } catch (err) {
    console.error("❌ Errore DB:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Endpoint admin: lista email (protetta da segreto)
app.get("/emails", async (req, res) => {
  const secret = req.query.secret;
  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Accesso negato" });
  }

  try {
    const result = await pool.query("SELECT * FROM iscritti ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Errore lettura DB:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Avvio server
app.listen(port, () => {
  console.log(`🚀 Server attivo sulla porta ${port}`);
});