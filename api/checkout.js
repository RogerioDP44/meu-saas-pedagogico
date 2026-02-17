export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { idUsuario, plano } = req.body;
  const valor = plano === 'anual' ? 199.90 : 29.90;

  try {
    const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.MP_ACCESS_TOKEN}`, // A chave fica escondida aqui
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [{
          title: `Sismatic PRO - ${plano.toUpperCase()}`,
          unit_price: valor,
          quantity: 1,
          currency_id: "BRL"
        }],
        external_reference: idUsuario, // O ID que vem do seu script.js
        back_urls: {
          success: "https://sismatic.com.br",
          pending: "https://sismatic.com.br",
          failure: "https://sismatic.com.br"
        },
        auto_return: "approved"
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}