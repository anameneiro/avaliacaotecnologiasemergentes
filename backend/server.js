// ============================================================
//  CIA CAP — Back-end
//  Node.js + Express + sql.js (SQLite sem compilação)
//  Instalar: npm install
//  Rodar:    node server.js
// ============================================================

const express = require("express");
const cors    = require("cors");
const path    = require("path");
const fs      = require("fs");
const initSqlJs = require("sql.js");

const app    = express();
const PORT   = 3000;
const DB_PATH = path.join(__dirname, "fechamentos.db");

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

// ── Banco de dados ───────────────────────────────────────────
let db;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS fechamentos (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_rota      TEXT    NOT NULL,
      valor_cartela  REAL    DEFAULT 0,
      vendidas       INTEGER DEFAULT 0,
      devolvidas     INTEGER DEFAULT 0,
      dinheiro       REAL    DEFAULT 0,
      pix            REAL    DEFAULT 0,
      deposito       REAL    DEFAULT 0,
      moedas         REAL    DEFAULT 0,
      despesas       TEXT    DEFAULT '[]',
      total_recebido REAL    DEFAULT 0,
      total_despesas REAL    DEFAULT 0,
      saldo          REAL    DEFAULT 0,
      valor_a_pagar  REAL    DEFAULT 0,
      diferenca      REAL    DEFAULT 0,
      criado_em      TEXT    DEFAULT (datetime('now','localtime'))
    )
  `);
  saveDB();
  console.log("  Banco de dados pronto.");
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// ── Helpers ──────────────────────────────────────────────────
function rowsToObjects(stmt) {
  const cols = stmt.getColumnNames();
  const rows = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    row.despesas = JSON.parse(row.despesas || "[]");
    rows.push(row);
  }
  stmt.free();
  return rows;
}

// ── CRUD ─────────────────────────────────────────────────────

// CREATE
app.post("/fechamentos", (req, res) => {
  const { nome_rota, valor_cartela, vendidas, devolvidas,
          dinheiro, pix, deposito, moedas, despesas,
          total_recebido, total_despesas, saldo } = req.body;

  if (!nome_rota?.trim())
    return res.status(400).json({ erro: "Nome da rota é obrigatório." });

  db.run(
    `INSERT INTO fechamentos
       (nome_rota, valor_cartela, vendidas, devolvidas, dinheiro, pix,
        deposito, moedas, despesas, total_recebido, total_despesas, saldo)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [ nome_rota.trim(), valor_cartela||0, vendidas||0, devolvidas||0,
      dinheiro||0, pix||0, deposito||0, moedas||0,
      JSON.stringify(despesas||[]),
      total_recebido||0, total_despesas||0, saldo||0 ]
  );
  saveDB();

  const id = db.exec("SELECT last_insert_rowid() as id")[0].values[0][0];
  const novo = rowsToObjects(db.prepare("SELECT * FROM fechamentos WHERE id=?", [id]))[0];
  res.status(201).json(novo);
});

// READ ALL
app.get("/fechamentos", (req, res) => {
  const rows = rowsToObjects(
    db.prepare("SELECT * FROM fechamentos ORDER BY criado_em DESC")
  );
  res.json(rows);
});

// READ ONE
app.get("/fechamentos/:id", (req, res) => {
  const rows = rowsToObjects(
    db.prepare("SELECT * FROM fechamentos WHERE id=?", [req.params.id])
  );
  if (!rows.length) return res.status(404).json({ erro: "Não encontrado." });
  res.json(rows[0]);
});

// UPDATE
app.put("/fechamentos/:id", (req, res) => {
  const existe = db.exec(`SELECT id FROM fechamentos WHERE id=${req.params.id}`);
  if (!existe.length) return res.status(404).json({ erro: "Não encontrado." });

  const { nome_rota, valor_cartela, vendidas, devolvidas,
          dinheiro, pix, deposito, moedas, despesas,
          total_recebido, total_despesas, saldo } = req.body;

  db.run(
    `UPDATE fechamentos SET
       nome_rota=?, valor_cartela=?, vendidas=?, devolvidas=?,
       dinheiro=?, pix=?, deposito=?, moedas=?, despesas=?,
       total_recebido=?, total_despesas=?, saldo=?
     WHERE id=?`,
    [ nome_rota?.trim()||"", valor_cartela||0, vendidas||0, devolvidas||0,
      dinheiro||0, pix||0, deposito||0, moedas||0,
      JSON.stringify(despesas||[]),
      total_recebido||0, total_despesas||0, saldo||0,
      req.params.id ]
  );
  saveDB();

  const atualizado = rowsToObjects(
    db.prepare("SELECT * FROM fechamentos WHERE id=?", [req.params.id])
  )[0];
  res.json(atualizado);
});

// DELETE
app.delete("/fechamentos/:id", (req, res) => {
  const existe = db.exec(`SELECT id FROM fechamentos WHERE id=${req.params.id}`);
  if (!existe.length) return res.status(404).json({ erro: "Não encontrado." });
  db.run("DELETE FROM fechamentos WHERE id=?", [req.params.id]);
  saveDB();
  res.json({ mensagem: "Excluído com sucesso." });
});

// ── Iniciar ───────────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n  CIA CAP — acesse http://localhost:${PORT}\n`);
  });
});
