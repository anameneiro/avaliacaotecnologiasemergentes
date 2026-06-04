// ============================================================
//  Testes automatizados — CIA CAP Back-end
//  Executar: node server.test.js
//  (sem dependências externas, usa apenas Node.js puro)
// ============================================================

const http = require("http");
const { execSync } = require("child_process");
const fs = require("fs");

// ── Utilitários ──────────────────────────────────────────────
const BASE = "http://localhost:3000";
let passed = 0;
let failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log("  PASSOU:", label);
    passed++;
  } else {
    console.error("  FALHOU:", label);
    failed++;
  }
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: "localhost",
      port: 3000,
      path,
      method,
      headers: { "Content-Type": "application/json" },
    };
    const req = http.request(opts, (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Suíte de testes ──────────────────────────────────────────
async function runTests() {
  console.log("\n  CIA CAP — Testes Automatizados");
  console.log("  ================================\n");

  let idCriado;

  // TESTE 1: Criar fechamento válido
  console.log("[ CREATE ]");
  const r1 = await request("POST", "/fechamentos", {
    nome_rota: "Rota Teste Automatizado",
    valor_cartela: 10,
    vendidas: 5,
    devolvidas: 1,
    dinheiro: 30,
    pix: 10,
    deposito: 0,
    moedas: 0,
    despesas: [{ descricao: "Gasolina", valor: 5 }],
    total_recebido: 40,
    total_despesas: 5,
    saldo: 35,
    valor_a_pagar: 50,
    diferenca: -15,
  });
  assert("POST /fechamentos retorna status 201", r1.status === 201);
  assert("Resposta contém id", typeof r1.body.id === "number");
  assert("Nome da rota está correto", r1.body.nome_rota === "Rota Teste Automatizado");
  assert("Despesas foram salvas", Array.isArray(r1.body.despesas) && r1.body.despesas.length === 1);
  idCriado = r1.body.id;

  // TESTE 2: Rejeitar sem nome da rota
  console.log("\n[ VALIDAÇÃO ]");
  const r2 = await request("POST", "/fechamentos", { nome_rota: "" });
  assert("POST sem nome_rota retorna status 400", r2.status === 400);
  assert("Resposta de erro contém campo 'erro'", typeof r2.body.erro === "string");

  // TESTE 3: Listar todos os fechamentos
  console.log("\n[ READ ALL ]");
  const r3 = await request("GET", "/fechamentos");
  assert("GET /fechamentos retorna status 200", r3.status === 200);
  assert("Retorna array", Array.isArray(r3.body));
  assert("Array contém o registro criado", r3.body.some(f => f.id === idCriado));

  // TESTE 4: Buscar por ID
  console.log("\n[ READ ONE ]");
  const r4 = await request("GET", "/fechamentos/" + idCriado);
  assert("GET /fechamentos/:id retorna status 200", r4.status === 200);
  assert("Retorna o registro correto", r4.body.id === idCriado);
  assert("Campo nome_rota presente", r4.body.nome_rota === "Rota Teste Automatizado");

  // TESTE 5: Buscar ID inexistente
  const r5 = await request("GET", "/fechamentos/999999");
  assert("GET com ID inexistente retorna 404", r5.status === 404);

  // TESTE 6: Atualizar fechamento
  console.log("\n[ UPDATE ]");
  const r6 = await request("PUT", "/fechamentos/" + idCriado, {
    nome_rota: "Rota Teste Atualizada",
    valor_cartela: 10, vendidas: 6, devolvidas: 1,
    dinheiro: 40, pix: 20, deposito: 0, moedas: 0,
    despesas: [], total_recebido: 60,
    total_despesas: 0, saldo: 60,
    valor_a_pagar: 60, diferenca: 0,
  });
  assert("PUT /fechamentos/:id retorna status 200", r6.status === 200);
  assert("Nome foi atualizado", r6.body.nome_rota === "Rota Teste Atualizada");
  assert("Valor foi atualizado", r6.body.vendidas === 6);

  // TESTE 7: Atualizar ID inexistente
  const r7 = await request("PUT", "/fechamentos/999999", { nome_rota: "X" });
  assert("PUT com ID inexistente retorna 404", r7.status === 404);

  // TESTE 8: Deletar fechamento
  console.log("\n[ DELETE ]");
  const r8 = await request("DELETE", "/fechamentos/" + idCriado);
  assert("DELETE /fechamentos/:id retorna status 200", r8.status === 200);
  assert("Mensagem de confirmação presente", typeof r8.body.mensagem === "string");

  // TESTE 9: Confirmar que foi deletado
  const r9 = await request("GET", "/fechamentos/" + idCriado);
  assert("Registro deletado retorna 404 ao buscar", r9.status === 404);

  // TESTE 10: Deletar ID inexistente
  const r10 = await request("DELETE", "/fechamentos/999999");
  assert("DELETE com ID inexistente retorna 404", r10.status === 404);

  // ── Resultado ────────────────────────────────────────────────
  console.log("\n  ================================");
  console.log(`  Resultado: ${passed} passaram | ${failed} falharam`);
  console.log("  ================================\n");

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error("\n  Erro ao executar testes:", err.message);
  console.error("  Verifique se o servidor está rodando em http://localhost:3000\n");
  process.exit(1);
});
