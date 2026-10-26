// Prix en centimes, vérifiés côté serveur (impossible à falsifier depuis le navigateur)
const PRICES = {
  part: { name: "Participation à la partie",     amount: 500 },
  adh:  { name: "Adhésion annuelle",             amount: 2000 },
  loc:  { name: "Location de matériel",          amount: 1500 },
  jb:   { name: "Sandwich jambon beurre salade", amount: 300 },
  pl:   { name: "Sandwich poulet",               amount: 300 },
  eau:  { name: "Eau Cristaline 1 L",            amount: 100 }
};

export async function onRequestPost({ request, env }) {
  const json = (o, s = 200) =>
    new Response(JSON.stringify(o), { status: s, headers: { "Content-Type": "application/json" } });

  if (!env.STRIPE_SECRET_KEY) return json({ error: "Clé Stripe manquante" }, 500);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Requête invalide" }, 400); }
  const { items = [], email, name, phone, age, pa, sniper } = body;
  const origin = new URL(request.url).origin;

  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("locale", "fr");
  p.set("success_url", origin + "/?paiement=ok");
  p.set("cancel_url", origin + "/?paiement=annule");
  if (email)  p.set("customer_email", String(email).slice(0, 200));
  if (name)   p.set("metadata[nom]", String(name).slice(0, 100));
  if (phone)  p.set("metadata[tel]", String(phone).slice(0, 30));
  if (age)    p.set("metadata[age]", String(age).slice(0, 3));
  if (pa)     p.set("metadata[pa]", String(pa).slice(0, 5));
  if (sniper) p.set("metadata[sniper]", String(sniper).slice(0, 5));

  let i = 0;
  for (const it of items) {
    const d = PRICES[it.id];
    const qty = Math.min(20, parseInt(it.qty) || 0);
    if (!d || qty < 1) continue;
    p.set(`line_items[${i}][quantity]`, qty);
    p.set(`line_items[${i}][price_data][currency]`, "eur");
    p.set(`line_items[${i}][price_data][unit_amount]`, d.amount);
    p.set(`line_items[${i}][price_data][product_data][name]`, d.name);
    i++;
  }
  if (!i) return json({ error: "Panier vide" }, 400);

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + env.STRIPE_SECRET_KEY,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: p
  });
  const s = await r.json();
  return r.ok ? json({ url: s.url }) : json({ error: s.error && s.error.message }, 400);
}
