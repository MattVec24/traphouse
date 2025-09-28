const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve i file in public/

// Endpoint finto per salvare email (in futuro useremo DB)
app.post("/register", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email richiesta" });
  }
  res.json({ message: `Grazie! Sei registrato con ${email}` });
});

// Avvio server
app.listen(port, () => {
  console.log(`✅ Server attivo su http://localhost:${port}`);
});