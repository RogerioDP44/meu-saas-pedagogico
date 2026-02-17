export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: "Método não permitido" });

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
                    { role: "system", content: "Você é um mentor pedagógico. Gere planos de aula estruturados pela BNCC." },
                    { role: "user", content: `Gere um plano de aula completo sobre: ${tema}` }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            // Retorna o erro exato da OpenAI para diagnóstico
            return res.status(response.status).json({ error: data.error.message });
        }

        return res.status(200).json(data.choices[0].message.content);

    } catch (error) {
        return res.status(500).json({ error: "Erro interno no servidor de IA." });
    }
}