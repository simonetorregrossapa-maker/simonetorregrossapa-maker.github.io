/* Simone Torregrossa · portfolio
   JavaScript senza dipendenze. */
(function () {
  "use strict";

  var GIORNO = 86400000;

  /* ---------- Barra in alto: il bordo compare quando scorri ---------- */
  var top = document.querySelector(".top");
  if (top) {
    var segna = function () { top.classList.toggle("is-scrolled", window.scrollY > 8); };
    segna();
    window.addEventListener("scroll", segna, { passive: true });
  }

  /* ---------- Titolo: una parola alla volta (solo per l'ingresso) ---------- */
  var titolo = document.querySelector(".hero-title");
  if (titolo) {
    var testo = titolo.textContent.trim();
    titolo.setAttribute("aria-label", testo);
    titolo.textContent = "";
    testo.split(" ").forEach(function (parola, i) {
      var w = document.createElement("span");
      w.className = "w";
      w.setAttribute("aria-hidden", "true");
      w.style.setProperty("--i", i);
      w.textContent = parola;
      titolo.appendChild(w);
      titolo.appendChild(document.createTextNode(" "));
    });
  }

  /* ---------- Giorni in produzione, contati da soli ---------- */
  document.querySelectorAll("[data-days-from]").forEach(function (el) {
    var p = el.getAttribute("data-days-from").split("-");
    var inizio = new Date(+p[0], +p[1] - 1, +p[2]);
    var d = new Date();
    var oggi = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var giorni = Math.round((oggi - inizio) / GIORNO);
    if (giorni > 0) el.textContent = giorni + " giorni";
  });
  var riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vede = "IntersectionObserver" in window;

  /* ---------- Fatti: i numeri contano da zero la prima volta che li vedi ---------- */
  var daContare = document.querySelectorAll("[data-count]");
  if (!riduci && vede && daContare.length) {
    var conta = function (el) {
      var m = el.textContent.match(/^(\d+)(.*)$/);
      if (!m) return;
      var fine = +m[1], coda = m[2], t0 = null, durata = 1400;
      var passo = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / durata);
        var e = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(fine * e) + coda;
        if (k < 1) requestAnimationFrame(passo);
      };
      /* Lo zero si scrive solo al primo fotogramma: se la scheda non disegna, resta il numero vero */
      requestAnimationFrame(passo);
    };
    var ioConta = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { conta(v.target); ioConta.unobserve(v.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    daContare.forEach(function (el) { ioConta.observe(el); });
  }

  var anno = document.getElementById("year");
  if (anno) anno.textContent = String(new Date().getFullYear());

  /* ---------- Schermate dei casi: si scoprono una volta ---------- */
  var daScoprire = document.querySelectorAll(".reveal-img");
  if (riduci || !vede) {
    daScoprire.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var ioImg = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add("is-in"); ioImg.unobserve(v.target); }
      });
    }, { rootMargin: "0px 0px -15% 0px" });
    daScoprire.forEach(function (el) { ioImg.observe(el); });
  }

  /* ---------- Helm: la schermata segue il punto che stai leggendo ---------- */
  var passi = Array.prototype.slice.call(document.querySelectorAll(".sh"));
  var foto = Array.prototype.slice.call(document.querySelectorAll(".shots .shot"));
  var telefono = document.querySelector(".sticky-phone");
  function accendi(n) {
    passi.forEach(function (p) { p.classList.toggle("is-on", p.getAttribute("data-shot") === String(n)); });
    /* Il quarto punto mostra la giornata da computer col telefono accanto */
    var quale = n < foto.length ? n : 0;
    foto.forEach(function (f, i) { f.classList.toggle("is-on", i === quale); });
    if (telefono) telefono.classList.toggle("is-on", n >= foto.length);
  }
  if (passi.length && foto.length) {
    accendi(0);
    if (vede) {
      var ioPassi = new IntersectionObserver(function (voci) {
        voci.forEach(function (v) {
          if (v.isIntersecting) accendi(+v.target.getAttribute("data-shot"));
        });
      }, { rootMargin: "-45% 0px -45% 0px" });
      passi.forEach(function (p) { ioPassi.observe(p); });
    }
  }

  /* ---------- Modulo contatti: controllo dei campi e invio con Web3Forms ---------- */
  var form = document.getElementById("contact-form");
  if (!form) return;
  var stato = document.getElementById("form-status");
  var invia = document.getElementById("submit-btn");
  var etichetta = invia ? invia.querySelector(".btn-label") : null;

  var regole = {
    name: function (v) { return v.trim().length >= 2 || "Scrivi il tuo nome."; },
    email: function (v) {
      if (!v.trim()) return "Scrivi la tua email, così ti posso rispondere.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Questa email non sembra completa: controlla la chiocciola e il punto.";
    },
    message: function (v) { return v.trim().length >= 10 || "Scrivi almeno una frase su cosa ti serve."; }
  };
  function errore(nome, msg) {
    var campo = form.elements[nome];
    var el = form.querySelector('[data-error-for="' + nome + '"]');
    if (el) el.textContent = msg || "";
    if (campo) { if (msg) campo.setAttribute("aria-invalid", "true"); else campo.removeAttribute("aria-invalid"); }
  }
  function controlla(nome) {
    var campo = form.elements[nome];
    if (!campo) return true;
    var r = regole[nome](campo.value);
    errore(nome, r === true ? "" : r);
    return r === true;
  }
  ["name", "email", "message"].forEach(function (nome) {
    var campo = form.elements[nome];
    if (!campo) return;
    campo.addEventListener("blur", function () { controlla(nome); });
    campo.addEventListener("input", function () { if (campo.getAttribute("aria-invalid") === "true") controlla(nome); });
  });
  function scrivi(msg, tipo) {
    if (!stato) return;
    stato.textContent = msg;
    stato.classList.remove("is-success", "is-error");
    if (tipo) stato.classList.add("is-" + tipo);
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.elements.botcheck && form.elements.botcheck.checked) return;
    var ok = ["name", "email", "message"].map(controlla).every(Boolean);
    if (!ok) {
      scrivi("Controlla i campi segnati in rosso.", "error");
      var primo = form.querySelector('[aria-invalid="true"]');
      if (primo) primo.focus();
      return;
    }
    if (invia) invia.disabled = true;
    if (etichetta) etichetta.textContent = "Invio in corso…";
    scrivi("", null);
    fetch(form.action, { method: "POST", headers: { Accept: "application/json" }, body: new FormData(form) })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (r) {
        if (r.ok && r.d.success) { form.reset(); scrivi("Messaggio inviato. Ti rispondo entro un giorno lavorativo.", "success"); }
        else scrivi("Il messaggio non è partito. Riprova tra poco o scrivimi a simone.torregrossa.pa@gmail.com.", "error");
      })
      .catch(function () { scrivi("Sembra che manchi la connessione. Riprova o scrivimi a simone.torregrossa.pa@gmail.com.", "error"); })
      .finally(function () {
        if (invia) invia.disabled = false;
        if (etichetta) etichetta.textContent = "Invia messaggio";
      });
  });
})();
