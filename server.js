const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000; // Railway assegna PORT automaticamente

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve index.html, style.css, script.js, ecc.

// Config DB (Railway fornisce DATABASE_URL)
let pool = null;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  console.log("✅ Connessione al database configurata");
} else {
  console.warn("⚠️ Nessuna DATABASE_URL trovata, DB non configurato!");
}

// Healthcheck
app.get("/health", async (req, res) => {
  try {
    if (!pool) return res.json({ ok: false, db: false });
    await pool.query("SELECT NOW()");
    res.json({ ok: true, db: true });
  } catch (err) {
    res.json({ ok: false, db: false, error: err.message });
  }
});

// Endpoint registrazione email
app.post("/register", async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Email non valida" });
  }

  try {
    await pool.query(
      "INSERT INTO iscritti2(email) VALUES($1) ON CONFLICT DO NOTHING",
      [email]
    );
    res.json({ message: `Grazie! Sei registrato con ${email}` });
  } catch (err) {
    console.error("❌ Errore DB:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Middleware per proteggere endpoint admin
function requireAdmin(req, res, next) {
  const secret = req.query.secret || req.headers["x-admin-secret"];
  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ message: "Accesso negato" });
  }
  next();
}

// Lista iscritti (admin)
app.get("/emails", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT email, created_at FROM iscritti2 ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Errore lettura DB:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Export JSON
app.get("/export.json", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT email, created_at FROM iscritti2 ORDER BY created_at DESC");
    res.setHeader("Content-Disposition", "attachment; filename=iscritti2.json");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Errore export JSON:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Export CSV
app.get("/export.csv", requireAdmin, async (req, res) => {
  try {
    const result = await pool.query("SELECT email, created_at FROM iscritti2 ORDER BY created_at DESC");
    const header = "email,created_at";
    const rows = result.rows.map(r =>
      `${r.email},${r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at}`
    );
    const csv = [header, ...rows].join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=iscritti2.csv");
    res.send(csv);
  } catch (err) {
    console.error("❌ Errore export CSV:", err);
    res.status(500).json({ message: "Errore server" });
  }
});

// Avvio server
app.listen(port, () => {
  console.log(`🚀 Server attivo sulla porta ${port}`);
});