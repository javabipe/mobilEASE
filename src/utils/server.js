import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";

dotenv.config();
const app = express();
const port = 3000;

app.use(cors({
  origin: 'https://faec.falagov.com.br',
  exposedHeaders: ['Content-Type'],
  credentials: true,
}));
const jsonParser = bodyParser.json();
app.listen(port, () => console.log(`Server is running on port ${port}`));

app.post('/send', jsonParser, (req, res) => {
  res.header('Access-Control-Allow-Origin', 'https://faec.falagov.com.br');
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header('Access-Control-Allow-Headers', 'Content-Type');

  const user = process.env.MAIL_HOST;
  const pass = process.env.MAIL_PASS;

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: { user, pass },
    tls: {
      // Adicionando esta linha para permitir credenciais
      rejectUnauthorized: false,
    },
  });

  transporter.sendMail({
    from: user,
    to: req.body.to,
    replyTo: user,
    subject: req.body.subject,
    html: req.body.html,
  }).then(info => res.send(info))
    .catch(error => res.send(error));
});
