// Paiement en ligne Stripe : ajoute le bouton, envoie le panier, affiche la confirmation.
// Utilise $, q, FOOD définis dans le script principal de index.html.
(function () {
  // 1. Bouton "Payer en ligne" sous "Préparer ma réservation"
  const wrap = document.createElement("p");
  wrap.innerHTML = '<button class="btn" id="pay" type="button">Payer en ligne (carte, Apple Pay)</button>';
  $("#go").parentElement.after(wrap);

  // 2. Textes mis à jour (paiement en ligne OU sur place)
  const o = $("#out").querySelector("p");
  if (o) o.textContent = "Vous préférez payer sur place ? Envoyez ce message à l’association par mail ou sur Instagram.";
  const r = document.querySelector("#resto p");
  if (r) r.textContent = "Ajoutez vos sandwichs et votre eau à votre réservation. Paiement en ligne ou sur place le jour de la partie.";

  // 3. Panier envoyé au serveur (identifiants + quantités, les prix sont recalculés côté serveur)
  function cartItems() {
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
    if (!items.length) { $("#err").textContent = "Rien à payer en ligne (panier vide ou déjà adhérent)."; return; }
    const v = id => $("#" + id).value.trim();
    if ($("#play").checked) {
      if (!v("pre") || !v("nom") || !v("age") || !v("tel") || v("mail1").indexOf("@") < 1) {
        $("#err").textContent = "Merci de remplir prénom, nom, âge, e-mail et téléphone."; return;
      }
    }
    $("#err").textContent = "";
    $("#pay").disabled = true;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          email: v("mail1"),
          name: (v("pre") + " " + v("nom")).trim(),
          phone: v("tel"),
          age: v("age"),
          pa: $("input[name=pa]:checked").value,
          sniper: $("input[name=sn]:checked").value
        })
      });
      const d = await res.json();
      if (d.url) location.href = d.url; else throw new Error(d.error || "Erreur");
    } catch (e) {
      $("#err").textContent = "Paiement indisponible pour le moment, utilisez l’envoi par mail.";
      $("#pay").disabled = false;
    }
  };

  // 4. Message au retour de Stripe
  const st = new URLSearchParams(location.search).get("paiement");
  if (st) {
    const b = document.createElement("div");
    b.setAttribute("role", "status");
    const ok = st === "ok";
    b.textContent = ok
      ? "Merci ! Votre paiement est confirmé. À bientôt sur le terrain."
      : "Paiement annulé : vous pouvez reprendre votre réservation quand vous voulez.";
    b.style.cssText = "position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top,0px));z-index:50;max-width:560px;margin:0 auto;padding:14px 18px;border-radius:8px;font-weight:500;color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35);cursor:pointer;background:" + (ok ? "#1F7A3A" : "#C8202B");
    b.onclick = () => b.remove();
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 10000);
    history.replaceState(null, "", location.pathname);
  }
})();
