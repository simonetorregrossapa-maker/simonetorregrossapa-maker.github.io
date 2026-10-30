/* Simone Torregrossa · portfolio
   JavaScript senza dipendenze. */
(function () {
  "use strict";

  var GIORNO = 86400000;
  var riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var vede = "IntersectionObserver" in window;
  var puntatore = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ---------- Giorni in produzione, contati da soli ---------- */
  document.querySelectorAll("[data-days-from]").forEach(function (el) {
    var p = el.getAttribute("data-days-from").split("-");
    var inizio = new Date(+p[0], +p[1] - 1, +p[2]);
    var d = new Date();
    var oggi = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    var giorni = Math.round((oggi - inizio) / GIORNO);
    if (giorni > 0) el.textContent = giorni + " giorni";
  });

  /* ---------- Ora a Palermo, nel piede ---------- */
  var orologio = document.getElementById("clock");
  if (orologio) {
    var fmt = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
    var batti = function () { orologio.textContent = fmt.format(new Date()); };
    batti();
    setInterval(batti, 15000);
  }

  /* ---------- Il nome che scorre: gira da solo, scorrendo cambia verso ---------- */
  /* Due strisce (il nome pieno dietro e il contorno davanti) che si muovono insieme */
  var tracce = document.querySelectorAll(".marquee-track");
  var traccia = tracce[0];
  if (traccia && !riduci) {
    var x = 0, verso = -1, ultimoY = window.scrollY, prima = null, visibile = true;
    if (vede) {
      new IntersectionObserver(function (voci) {
        visibile = voci[0].isIntersecting;
        if (visibile) { prima = null; requestAnimationFrame(gira); }
      }).observe(traccia);
    }
    window.addEventListener("scroll", function () {
      var y = window.scrollY;
      if (y !== ultimoY) verso = y > ultimoY ? -1 : 1;
      ultimoY = y;
    }, { passive: true });
    var gira = function (t) {
      if (prima !== null) {
        var meta = traccia.scrollWidth / 2;
        x += verso * (t - prima) * 0.06;
        if (x <= -meta) x += meta;
        if (x > 0) x -= meta;
        for (var i = 0; i < tracce.length; i++) tracce[i].style.transform = "translate3d(" + x + "px,0,0)";
      }
      prima = t;
      if (visibile) requestAnimationFrame(gira);
    };
    if (!vede) requestAnimationFrame(gira);
  }

  /* ---------- Profondità scorrendo: lui resta piantato a terra, il nome gli sale dietro ----------
     Il contorno davanti sale con il nome, ma la sua maschera (la sagoma della foto) resta ferma:
     per questo la posizione della maschera si corregge dello stesso spostamento */
  var hero = document.querySelector(".hero");
  var fascia = document.querySelector(".marquee");
  var fronte = document.querySelector(".marquee-front");
  var figura = document.querySelector(".hero-figure");
  if (hero && fascia) {
    var sagoma = null, inAttesa = false;
    var misura = function () {
      if (!fronte || !figura) return;
      var h = hero.getBoundingClientRect(), f = figura.getBoundingClientRect();
      fronte.style.top = fascia.offsetTop + "px";
      fronte.style.height = fascia.offsetHeight + "px";
      sagoma = { x: f.left - h.left, y: f.top - h.top - fascia.offsetTop, w: f.width, h: f.height };
      var dim = sagoma.w + "px " + sagoma.h + "px";
      fronte.style.webkitMaskSize = dim; fronte.style.maskSize = dim;
    };
    var muovi = function () {
      inAttesa = false;
      var p = riduci ? 0 : Math.min(1, Math.max(0, window.scrollY / hero.offsetHeight));
      var dy = -p * 0.32 * fascia.offsetHeight;
      fascia.style.transform = "translate3d(0," + dy + "px,0)";
      if (fronte && sagoma) {
        fronte.style.transform = "translate3d(0," + dy + "px,0)";
        var pos = sagoma.x + "px " + (sagoma.y - dy) + "px";
        fronte.style.webkitMaskPosition = pos; fronte.style.maskPosition = pos;
      }
    };
    misura(); muovi();
    window.addEventListener("load", function () { misura(); muovi(); });
    window.addEventListener("resize", function () { misura(); muovi(); });
    if (!riduci) {
      window.addEventListener("scroll", function () {
        if (!inAttesa && window.scrollY < hero.offsetHeight * 1.2) { inAttesa = true; requestAnimationFrame(muovi); }
      }, { passive: true });
    }
  }

  /* ---------- Frase grande: parole in maschera ---------- */
  document.querySelectorAll(".split").forEach(function (el) {
    var testo = el.textContent.trim();
    el.setAttribute("aria-label", testo);
    el.textContent = "";
    testo.split(" ").forEach(function (parola, i) {
      var w = document.createElement("span");
      w.className = "w";
      w.setAttribute("aria-hidden", "true");
      var dentro = document.createElement("span");
      dentro.textContent = parola;
      dentro.style.setProperty("--i", i);
      w.appendChild(dentro);
      el.appendChild(w);
      el.appendChild(document.createTextNode(" "));
    });
  });

  /* ---------- Cose che si scoprono una volta, entrando nello schermo ---------- */
  var daScoprire = document.querySelectorAll(".reveal, .split");
  if (riduci || !vede) {
    daScoprire.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { v.target.classList.add("is-in"); io.unobserve(v.target); }
      });
    }, { rootMargin: "0px 0px -12% 0px" });
    daScoprire.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Numeri che contano da zero la prima volta che li vedi ---------- */
  var daContare = document.querySelectorAll("[data-count]");
  if (!riduci && vede && daContare.length) {
    var conta = function (el) {
      var m = el.textContent.match(/^(\d+)(.*)$/);
      if (!m) return;
      var fine = +m[1], coda = m[2], t0 = null, durata = 1400;
      /* Lo zero si scrive solo al primo fotogramma: se la scheda non disegna, resta il numero vero */
      var passo = function (t) {
        if (t0 === null) t0 = t;
        var k = Math.min(1, (t - t0) / durata);
        el.textContent = Math.round(fine * (1 - Math.pow(1 - k, 4))) + coda;
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    };
    var ioConta = new IntersectionObserver(function (voci) {
      voci.forEach(function (v) {
        if (v.isIntersecting) { conta(v.target); ioConta.unobserve(v.target); }
      });
    }, { rootMargin: "0px 0px -10% 0px" });
    daContare.forEach(function (el) { ioConta.observe(el); });
  }

  /* ---------- Bottoni tondi magnetici: seguono un po' il puntatore ---------- */
  if (puntatore && !riduci) {
    document.querySelectorAll(".magnet").forEach(function (b) {
      var dentro = b.querySelector(".magnet-in");
      var base = b.closest(".contact-line") ? "translateY(-50%) " : "";
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        b.style.transition = "transform 160ms var(--ease-out), background-color 220ms ease";
        b.style.transform = base + "translate(" + dx * 0.3 + "px," + dy * 0.3 + "px)";
        if (dentro) { dentro.style.transition = "transform 160ms var(--ease-out)"; dentro.style.transform = "translate(" + dx * 0.15 + "px," + dy * 0.15 + "px)"; }
      });
      b.addEventListener("pointerleave", function () {
        b.style.transition = "transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 220ms ease";
        b.style.transform = base;
        if (dentro) { dentro.style.transition = "transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)"; dentro.style.transform = ""; }
      });
    });
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
