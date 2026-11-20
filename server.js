require("dotenv").config();
const path = require("path");
const express = require("express");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");
const { gerarPassado } = require("./geradorDePassados");

const app = express();
// Na Vercel o app fica atrás de proxy; sem isso o rate limit enxerga o IP errado
app.set("trust proxy", 1);
app.use(express.json({ limit: "50kb" }));
// Serve SÓ a pasta public
app.use(express.static(path.join(__dirname, "public")));

// Evita abuso: cada chamada custa dinheiro e dispara e-mail
app.use("/api/", rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }));

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

app.post("/api/gerar-passado", async (req, res) => {
  try {
    const { email, respostas } = req.body;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      return res.status(400).json({ erro: "E-mail inválido." });
    }
    if (!Array.isArray(respostas) || respostas.length === 0 || respostas.length > 30) {
      return res.status(400).json({ erro: "Respostas inválidas." });
    }
    const limpas = respostas.map((r) => ({
      pergunta: String(r.pergunta).slice(0, 300),
      resposta: String(r.resposta).slice(0, 1000),
    }));

    const texto = await gerarPassado(limpas);

    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Seu novo passado chegou",
      text: texto,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Não foi possível criar seu passado agora." });
  }
});

// Local: sobe o servidor normalmente. Na Vercel: apenas exporta o app.
if (require.main === module) {
  app.listen(process.env.PORT || 3000, () =>
    console.log(`Rodando em http://localhost:${process.env.PORT || 3000}`)
  );
}

module.exports = app;
