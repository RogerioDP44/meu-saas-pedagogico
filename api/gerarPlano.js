export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

    try {
        const { tema } = req.body;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "Você é um mentor pedagógico especialista na BNCC para Educação Infantil e Fundamental I. Gere planos de aula completos, criativos e bem estruturados." },
                    { role: "user", content: `Gere um plano de aula completo sobre: ${tema}` }
                ],
                temperature: 0.7
            })
        });

        const data = await response.json();
        return res.status(200).json(data.choices[0].message.content);
    } catch (error) {
        return res.status(500).json({ error: "Erro ao conectar com a OpenAI" });
    }
}