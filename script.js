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
  var traccia = document.querySelector(".marquee-track");
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
        traccia.style.transform = "translate3d(" + x + "px,0,0)";
      }
      prima = t;
      if (visibile) requestAnimationFrame(gira);
    };
    if (!vede) requestAnimationFrame(gira);
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
})();
