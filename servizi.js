/* Simone Torregrossa · pagine servizio
   GSAP + ScrollTrigger + Lenis arrivano prima, da CDN. Se non arrivano, o con movimento ridotto,
   la pagina resta ferma ma completa: nessun contenuto parte nascosto senza script. */
(function () {
  "use strict";

  var riduci = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var GIORNO = 86400000;

  /* Giorni in produzione, contati da soli */
  document.querySelectorAll("[data-days-from]").forEach(function (el) {
    var p = el.getAttribute("data-days-from").split("-");
    var inizio = new Date(+p[0], +p[1] - 1, +p[2]);
    var d = new Date();
    var giorni = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - inizio) / GIORNO);
    if (giorni > 0) el.textContent = giorni + " giorni";
  });

  /* La barra prende il fondo appena si scende */
  var barra = document.getElementById("barra");
  if (barra) {
    var segna = function () { barra.classList.toggle("is-giu", window.scrollY > 24); };
    segna();
    window.addEventListener("scroll", segna, { passive: true });
  }

  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (riduci || !gsap || !ST) {
    /* Fermo: la composizione dritta, le scene complete */
    document.querySelectorAll(".compo-palco").forEach(function (el) { el.style.transform = "none"; });
    return;
  }
  gsap.registerPlugin(ST);

  /* Scorrimento morbido, come nella home */
  if (window.Lenis) {
    var lenis = new window.Lenis({ lerp: 0.11, anchors: { offset: -70 } });
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var OUT = "expo.out";
  var sotto = function (el) { return el.getBoundingClientRect().top > window.innerHeight * 0.92; };

  /* 1. La composizione dell'apertura sale e si raddrizza mentre scorri */
  document.querySelectorAll(".compo-palco").forEach(function (el) {
    gsap.fromTo(el, { rotateX: 16, scale: 0.94 }, {
      rotateX: 0, scale: 1, ease: "none",
      scrollTrigger: { trigger: el, start: "top 92%", end: "top 22%", scrub: 0.6 }
    });
  });

  /* 2. I titoli di sezione escono da sotto una linea (maschera), una volta sola */
  document.querySelectorAll(".sez-titolo").forEach(function (el) {
    if (!sotto(el) || el.closest(".sparsi.is-viva")) return;
    gsap.fromTo(el, { clipPath: "inset(0 0 100% 0)", y: 30 }, {
      clipPath: "inset(0 0 -20% 0)", y: 0, duration: 1.1, ease: OUT,
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
  });

  /* 3. Righe e schede salgono in fila, poco sfasate */
  var gruppi = [".scene", ".cose", ".limiti", ".faq", ".altri", ".tappe", ".intanto"];
  gruppi.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (g) {
      var figli = Array.prototype.filter.call(g.children, sotto);
      if (!figli.length) return;
      gsap.set(figli, { opacity: 0, y: 26 });
      ST.batch(figli, {
        start: "top 90%", once: true,
        onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: OUT, stagger: 0.06, overwrite: true }); }
      });
    });
  });

  /* 4. Le schermate si scoprono dal basso, con un filo di zoom che si assesta */
  document.querySelectorAll("[data-scopri]").forEach(function (el) {
    if (!sotto(el)) return;
    var img = el.querySelector("img");
    gsap.fromTo(el, { clipPath: "inset(18% 0 0 0 round 14px)", y: 40 }, {
      clipPath: "inset(0% 0 0 0 round 14px)", y: 0, duration: 1.3, ease: OUT,
      scrollTrigger: { trigger: el, start: "top 88%", once: true }
    });
    if (img) gsap.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1.6, ease: OUT, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });

  /* 5. Il binario delle tappe si riempie scorrendo */
  document.querySelectorAll(".linea-piena").forEach(function (el) {
    gsap.fromTo(el, { scaleX: 0 }, {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: el.closest(".sez") || el, start: "top 60%", end: "bottom 80%", scrub: 0.5 }
    });
  });

  /* ---------- Pezzo firma, gestionale: i posti sparsi si raccolgono in una schermata ---------- */
  var sparsi = document.querySelector(".sparsi");
  if (sparsi) {
    sparsi.classList.add("is-viva");
    var palco = sparsi.querySelector(".sparsi-palco");
    var fogli = sparsi.querySelectorAll(".foglietto");
    var testa = sparsi.querySelector(".sparsi-testa");
    var fine = sparsi.querySelector(".sparsi-fine");
    var tl = gsap.timeline({
      scrollTrigger: { trigger: palco, start: "top top", end: "+=150%", pin: true, scrub: 0.7, anticipatePin: 1 }
    });
    gsap.set(fine, { opacity: 0, scale: 0.86, y: 40 });
    fogli.forEach(function (f) { gsap.set(f, { xPercent: -50, yPercent: -50, rotate: parseFloat(f.style.getPropertyValue("--r")) || 0 }); });
    tl.to({}, { duration: 0.25 });
    fogli.forEach(function (f, i) {
      var r = f.getBoundingClientRect(), p = palco.getBoundingClientRect();
      var dx = p.left + p.width / 2 - (r.left + r.width / 2);
      var dy = p.top + p.height * 0.58 - (r.top + r.height / 2);
      tl.to(f, { x: dx, y: dy, scale: 0.4, rotate: 0, opacity: 0, duration: 0.6, ease: "power2.in" }, 0.25 + i * 0.04);
    });
    tl.to(testa, { opacity: 0, y: -30, duration: 0.35, ease: "power1.in" }, 0.45);
    tl.to(fine, { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.7);
    tl.to({}, { duration: 0.3 });
  }

  /* ---------- Pezzo firma, WhatsApp: la chat si scrive un messaggio alla volta ---------- */
  var dialogo = document.querySelector(".dialogo");
  if (dialogo) {
    var computer = window.matchMedia("(min-width: 901px)").matches;
    dialogo.classList.add("is-viva");
    if (computer) dialogo.classList.add("is-fissa");
    var corpo = dialogo.querySelector(".chat-corpo");
    var rullo = dialogo.querySelector(".chat-rullo");
    var pezzi = Array.prototype.slice.call(rullo.children);
    var ore = dialogo.querySelectorAll(".intanto li");
    /* I puntini stanno dove arriverà la risposta, senza spostare niente */
    var scrive = rullo.querySelector(".scrive");
    if (scrive && scrive.nextElementSibling) scrive.style.top = scrive.nextElementSibling.offsetTop + "px";
    var cs = getComputedStyle(corpo);
    var visibile = corpo.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var spinta = 0;
    var accendi = function (n) {
      ore.forEach(function (li) { li.classList.toggle("is-on", +li.getAttribute("data-passo") <= n); });
    };
    gsap.set(pezzi, { opacity: 0, y: 14, scale: 0.96 });
    var tl2 = gsap.timeline({
      scrollTrigger: computer
        ? { trigger: dialogo, start: "top top", end: "+=170%", pin: true, scrub: 0.6, anticipatePin: 1 }
        : { trigger: dialogo.querySelector(".chat"), start: "top 70%", end: "bottom 60%", scrub: 0.6 }
    });
    Array.prototype.forEach.call(pezzi, function (el, i) {
      var t = i * 0.5;
      /* Come in una chat vera: quando il nuovo messaggio non ci sta, i vecchi salgono */
      if (computer) {
        var serve = Math.max(0, el.offsetTop + el.offsetHeight - visibile);
        if (serve > spinta) { tl2.to(rullo, { y: -serve, duration: 0.3, ease: "power2.out" }, t); spinta = serve; }
      }
      if (el.classList.contains("scrive")) {
        tl2.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.2, ease: OUT }, t);
        tl2.to(el, { opacity: 0, duration: 0.12 }, t + 0.38);
      } else {
        tl2.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: OUT }, t);
      }
      var passo = el.getAttribute("data-passo");
      if (passo) tl2.call(accendi, [+passo], t);
    });
    tl2.call(accendi, [0], 0);
  }

  /* ---------- Pezzo firma, prenotazioni: la finestra mostra il sistema che stai leggendo ---------- */
  var sistemi = document.querySelector(".sistemi");
  if (sistemi && window.matchMedia("(min-width: 901px)").matches) {
    sistemi.classList.add("is-viva");
    var voci = sistemi.querySelectorAll(".sistema");
    var viste = sistemi.querySelectorAll(".sistemi-vista img");
    var scegli = function (i) {
      voci.forEach(function (v, j) { v.classList.toggle("is-on", i === j); });
      viste.forEach(function (v, j) { v.classList.toggle("is-on", i === j); });
    };
    voci.forEach(function (v, i) {
      ST.create({ trigger: v, start: "top 60%", end: "bottom 40%", onToggle: function (s) { if (s.isActive) scegli(i); } });
    });
    scegli(0);
  }

  /* Le immagini caricate dopo cambiano le altezze: si rimisura */
  window.addEventListener("load", function () { ST.refresh(); });
})();
