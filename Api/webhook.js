import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false, // Necessário pro Stripe validar assinatura
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Erro de verificação:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const email = session.customer_details?.email;
    const valor = session.amount_total / 100;

    console.log(`💰 Pagamento confirmado: ${email} — R$${valor}`);

    // 👉 Aqui tu pode disparar e-mail, liberar acesso, etc.
  }

  res.status(200).json({ received: true });
}

// Função auxiliar
import { Readable } from "stream";
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

