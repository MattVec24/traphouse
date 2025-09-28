const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

// Railway assegna automaticamente la porta tramite la variabile PORT
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve index.html, style.css, script.js, immagini ecc.

// Configurazione Database (Railway fornisce DATABASE_URL)
let pool = null;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // necessario su Railway
  });
}

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

// Endpoint per vedere tutte le email registrate
app.get("/emails", async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ message: "DB non configurato" });
    }
    const result = await pool.query("SELECT * FROM iscritti ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Errore DB:", err);
    res.status(500).json({ message: "Errore server" });
  }
});



// /emails (JSON) — protetto
app.get("/emails", async (req, res) => {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Accesso negato" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, email, created_at FROM iscritti ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("Errore DB:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// /export (CSV) — protetto
app.get("/export", async (req, res) => {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Accesso negato" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT id, email, created_at FROM iscritti ORDER BY created_at DESC"
    );
    let csv = "id,email,created_at\n";
    rows.forEach(r => {
      csv += `${r.id},"${String(r.email).replace(/\"/g,'\"\"')}",${r.created_at.toISOString()}\n`;
    });
    res.header("Content-Type", "text/csv");
    res.attachment("iscritti.csv");
    res.send(csv);
  } catch (err) {
    console.error("Errore export:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Avvio del server
app.listen(port, () => {
  console.log(`✅ Server attivo sulla porta ${port}`);
});