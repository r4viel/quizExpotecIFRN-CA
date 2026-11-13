const form = document.getElementById("quiz");
const resultado = document.getElementById("resultado");
const msg = document.getElementById("msg");

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const botao = form.querySelector("button[type=submit]");
  const email = form.email.value.trim();

  const respostas = [...form.querySelectorAll(".pergunta")]
    .map((div) => {
      const pergunta = div.querySelector(".enunciado").textContent.trim();
      const marcada = div.querySelector("input:checked");
      const texto = div.querySelector("textarea");
      const resposta = marcada ? marcada.value : texto ? texto.value.trim() : "";
      return { pergunta, resposta };
    })
    .filter((r) => r.resposta);

  botao.disabled = true;
  botao.textContent = "Criando seu passado...";

  try {
    const resp = await fetch("/api/gerar-passado", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, respostas }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(data.erro || "Erro desconhecido.");
    msg.textContent = `Pronto! Enviamos seu novo passado para ${email}.`;
  } catch (err) {
    msg.textContent = err.message;
  } finally {
    resultado.hidden = false;
    resultado.scrollIntoView({ behavior: "smooth" });
    botao.disabled = false;
    botao.textContent = "Criar meu passado";
  }
});
