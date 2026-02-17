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
                    { role: "system", content: "Você é um mentor pedagógico. Responda apenas com o texto do plano de aula, sem saudações." },
                    { role: "user", content: `Gere um plano de aula BNCC sobre: ${tema}` }
                ]
            })
        });

        const data = await response.json();
        // Retorna apenas a string de texto para o front-end
        return res.status(200).json(data.choices[0].message.content);
    } catch (error) {
        return res.status(500).json("Erro ao gerar conteúdo.");
    }
}