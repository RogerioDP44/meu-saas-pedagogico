export default async function handler(req, res) {
  const { tema } = req.body;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "És um mentor pedagógico especialista na BNCC (Brasil). Gera um plano de aula estruturado." },
          { role: "user", content: `Gera um plano de aula sobre: ${tema}` }
        ]
      })
    });
    const data = await response.json();
    res.status(200).json(data.choices[0].message.content);
  } catch (e) {
    res.status(500).json("Erro ao ligar à OpenAI.");
  }
}