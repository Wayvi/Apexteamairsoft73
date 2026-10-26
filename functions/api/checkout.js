function cartItems(){
  const it = [];
  if ($("#play").checked) {
    const s = $("input[name=st]:checked").value;
    if (s === "part") it.push({ id: "part", qty: 1 });
    if (s === "adh")  it.push({ id: "adh",  qty: 1 });
    if ($("#loc").checked) it.push({ id: "loc", qty: 1 });
  }
  FOOD.forEach(f => { if (q[f.id]) it.push({ id: f.id, qty: q[f.id] }); });
  return it;
}

$("#pay").onclick = async () => {
  const items = cartItems();
  if (!items.length) { $("#err").textContent = "Votre panier est vide."; return; }
  if ($("#play").checked) {
    const v = id => $("#"+id).value.trim();
    if (!v("pre")||!v("nom")||!v("age")||!v("tel")||v("mail1").indexOf("@")<1){
      $("#err").textContent = "Merci de remplir prénom, nom, âge, e-mail et téléphone."; return;
    }
  }
  $("#err").textContent = "";
  $("#pay").disabled = true;
  try {
    const r = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        email: $("#mail1").value.trim(),
        name: ($("#pre").value + " " + $("#nom").value).trim(),
        phone: $("#tel").value.trim()
      })
    });
    const d = await r.json();
    if (d.url) location.href = d.url; else throw new Error(d.error);
  } catch (e) {
    $("#err").textContent = "Paiement indisponible, utilisez l’envoi par mail.";
    $("#pay").disabled = false;
  }
};
