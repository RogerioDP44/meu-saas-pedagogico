export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).send('Método não permitido');
    const { idUsuario, plano } = req.body;
    const valor = plano === 'anual' ? 149.00 : 19.90;

    try {
        const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                items: [{
                    title: `Sismatic PRO - ${plano.toUpperCase()}`,
                    unit_price: Number(valor),
                    quantity: 1,
                    currency_id: "BRL"
                }],
                external_reference: idUsuario,
                back_urls: { success: "https://sismatic.com.br", failure: "https://sismatic.com.br" },
                auto_return: "approved"
            })
        });
        const data = await response.json();
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}