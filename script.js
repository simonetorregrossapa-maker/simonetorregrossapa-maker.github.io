/* Simone Torregrossa · portfolio
   Il movimento delle scene usa GSAP + ScrollTrigger e Lenis (caricati prima, da CDN).
   Se non arrivano, o con movimento ridotto, la pagina resta ferma ma completa. */
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

  /* ========== Le scene che si muovono scorrendo ========== */
  (function film() {
    /* ---------- Barra in alto: prende il fondo appena lasci l'apertura ---------- */
    var barra = document.getElementById("barra");
    if (barra) {
      var segna = function () { barra.classList.toggle("is-giu", window.scrollY > 40); };
      segna();
      window.addEventListener("scroll", segna, { passive: true });
    }
  
    /* ---------- La frase che si accende: ogni parola nel suo span ---------- */
    var parole = [];
    document.querySelectorAll(".accende").forEach(function (el) {
      var testo = el.textContent.trim();
      el.textContent = "";
      var letto = document.createElement("span");
      letto.className = "sr";
      letto.textContent = testo;
      var visto = document.createElement("span");
      visto.setAttribute("aria-hidden", "true");
      testo.split(" ").forEach(function (p) {
        var w = document.createElement("span");
        w.textContent = p;
        visto.appendChild(w);
        visto.appendChild(document.createTextNode(" "));
        parole.push(w);
      });
      el.appendChild(letto);
      el.appendChild(visto);
    });
  
    /* ---------- Da qui in giù serve GSAP. Senza (o con movimento ridotto) la pagina resta ferma ma completa ---------- */
    var g = window.gsap, ST = window.ScrollTrigger;
    if (!g || !ST || riduci) return;
    g.registerPlugin(ST);
  
    /* Scorrimento morbido: Lenis muove la pagina, ScrollTrigger lo segue a ogni fotogramma */
    var lenis = null;
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1 });
      lenis.on("scroll", ST.update);
      g.ticker.add(function (t) { lenis.raf(t * 1000); });
      g.ticker.lagSmoothing(0);
      document.querySelectorAll('a[href^="#"]:not(.skip)').forEach(function (a) {
        a.addEventListener("click", function (e) {
          var id = a.getAttribute("href");
          var dove = id.length > 1 ? document.querySelector(id) : null;
          if (!dove) return;
          e.preventDefault();
          lenis.scrollTo(dove, { duration: 1.4 });
        });
      });
    }
  
    var mm = g.matchMedia();
  
    /* ---------- 2. Il marchio: il bollino ST cresce fino a riempire lo schermo di blu ---------- */
    var marchio = document.querySelector(".marchio");
    if (marchio) {
      var disco = marchio.querySelector(".marchio-disco");
      var st = marchio.querySelector(".marchio-st");
      var r0 = function () { return Math.min(window.innerWidth, window.innerHeight) * 0.075; };
      var r1 = function () { return Math.hypot(window.innerWidth, window.innerHeight) / 2 + 4; };
      var tlM = g.timeline({
        scrollTrigger: { trigger: marchio, start: "top top", end: "+=90%", pin: true, scrub: 0.4, invalidateOnRefresh: true }
      });
      tlM.fromTo(disco,
        { clipPath: function () { return "circle(" + r0() + "px at 50% 50%)"; } },
        { clipPath: function () { return "circle(" + r1() + "px at 50% 50%)"; }, ease: "power2.inOut", duration: 1 }, 0)
        /* La sigla parte grande quanto il bollino e cresce con lui */
        .fromTo(st,
          { scale: function () { return (r0() * 1.15) / st.offsetWidth; } },
          { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
        .fromTo(".marchio-riga", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power2.out" }, 0.75);
    }
  
    /* ---------- 3. Il muro: le colonne scorrono in versi opposti, sopra le tre frasi si danno il cambio ---------- */
    var muro = document.querySelector(".muro");
    if (muro) {
      muro.classList.add("is-film");
      var frasi = g.utils.toArray(".muro .frase");
      var tlW = g.timeline({
        scrollTrigger: { trigger: muro, start: "top top", end: "+=240%", pin: true, scrub: 0.6 }
      });
      var lunga = frasi.length + 0.4;
      g.utils.toArray(".muro-col").forEach(function (c, i) {
        tlW.fromTo(c, { yPercent: i % 2 ? -8 : 6 }, { yPercent: i % 2 ? 8 : -16, ease: "none", duration: lunga }, 0);
      });
      tlW.fromTo(".muro-scena", { scale: 1.12 }, { scale: 1, ease: "none", duration: lunga }, 0);
      g.set(frasi, { autoAlpha: 0, y: 60 });
      frasi.forEach(function (f, i) {
        tlW.to(f, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" }, i + 0.1);
        if (i < frasi.length - 1) tlW.to(f, { autoAlpha: 0, y: -60, duration: 0.3, ease: "power2.inOut" }, i + 0.75);
      });
      tlW.to(".muro-scorri", { autoAlpha: 0, duration: 0.2 }, frasi.length - 0.6);
    }
  
    /* ---------- 4. La frase si accende parola per parola mentre scorri ---------- */
    if (parole.length) {
      g.fromTo(parole, { opacity: 0.16 }, {
        opacity: 1, ease: "none", stagger: 0.1,
        scrollTrigger: { trigger: ".accende", start: "top 78%", end: "bottom 48%", scrub: true }
      });
    }
  
    /* ---------- 5. Il mirino: su computer il palco si ferma e Helm si racconta in quattro passi ---------- */
    mm.add("(min-width: 900px)", function () {
      var sez = document.querySelector(".mirino");
      if (!sez) return;
      sez.classList.add("is-film");
      var passi = g.utils.toArray(".mirino .passo");
      var schermi = g.utils.toArray(".mirino-tel img");
      var numero = sez.querySelector(".mir-n");
      var tc = sez.querySelector(".mir-tc");
      var due = function (n) { return (n < 10 ? "0" : "") + n; };
      g.set(passi.slice(1), { autoAlpha: 0 });
      g.set(schermi.slice(1), { autoAlpha: 0 });
      var tl = g.timeline({
        scrollTrigger: {
          trigger: ".mirino-palco", start: "top top", end: "+=" + passi.length * 85 + "%", pin: true, scrub: 0.5,
          onUpdate: function (s) {
            /* Il contatore della telecamera segue lo scorrimento, il numero dice a che passo sei */
            var fot = Math.round(s.progress * 24 * 25);
            tc.textContent = "00:00:" + due(Math.floor(fot / 25)) + ":" + due(fot % 25);
            var i = Math.max(0, Math.min(passi.length - 1, Math.floor(tl.time() - 0.15)));
            numero.textContent = due(i + 1);
          }
        }
      });
      for (var i = 1; i < passi.length; i++) {
        tl.to(passi[i - 1], { autoAlpha: 0, y: -40, duration: 0.3, ease: "power2.inOut" }, i)
          .fromTo(passi[i], { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" }, i + 0.15)
          .fromTo(schermi[i], { autoAlpha: 0, yPercent: 3 }, { autoAlpha: 1, yPercent: 0, duration: 0.35, ease: "power3.out" }, i + 0.05)
          .to(schermi[i - 1], { autoAlpha: 0, duration: 0.3, ease: "none" }, i + 0.1);
      }
      tl.to({}, { duration: 0.6 });
      return function () { sez.classList.remove("is-film"); };
    });
  
    /* ---------- 7. Il binario: la linea si riempie e le tappe si accendono una dopo l'altra ---------- */
    mm.add("(min-width: 861px)", function () {
      var tappe = g.utils.toArray(".tappa");
      var punti = g.utils.toArray(".punto");
      if (!tappe.length) return;
      g.set(tappe.slice(1), { opacity: 0.35 });
      g.set(punti.slice(1), { scale: 0.5, opacity: 0.4 });
      var tl = g.timeline({
        scrollTrigger: { trigger: ".binario-palco", start: "center center", end: "+=110%", pin: true, scrub: 0.5 }
      });
      tl.fromTo(".linea-piena", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 3 }, 0);
      for (var i = 1; i < tappe.length; i++) {
        tl.to(tappe[i], { opacity: 1, duration: 0.25, ease: "power2.out" }, i + 0.4)
          .to(punti[i], { scale: 1, opacity: 1, duration: 0.2, ease: "power2.out" }, i + 0.45);
      }
    });
  
    /* ---------- Entrate una volta sola: titoli, schede e righe salgono quando arrivano ---------- */
    g.utils.toArray(".titolo, .mirino-intro, .dichiara-giu, .voce, .finestra, .svc, .contact-title, .contact-lede").forEach(function (el) {
      g.from(el, {
        y: 36, autoAlpha: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });
    /* Sul telefono i passi di Helm entrano uno alla volta */
    mm.add("(max-width: 899px)", function () {
      g.utils.toArray(".passo").forEach(function (p) {
        g.from(p, { y: 40, autoAlpha: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 85%", once: true } });
      });
    });
  
    /* Le immagini cambiano le altezze: a pagina caricata si rimisurano i punti di ogni scena */
    window.addEventListener("load", function () { ST.refresh(); });
  })();

  /* ========== 6. I lavori: l'indice sceglie, la finestra mostra il lavoro all'opera ========== */
  (function indice() {
    var box = document.querySelector(".indice");
    if (!box) return;
    var voci = [].slice.call(box.querySelectorAll(".voce"));
    var scene = {};
    box.querySelectorAll(".scena").forEach(function (s) { scene[s.getAttribute("data-scena")] = s; });
    var vetro = box.querySelector(".finestra-vetro");
    var url = box.querySelector(".finestra-url");
    var dettaglio = box.querySelector(".dettaglio");
    var g = window.gsap;
    var anima = !!g && !riduci;
    var stretto = window.matchMedia("(max-width: 899px)");
    var attiva = null, film = null, inVista = true;

    /* Ogni scena è un piccolo film in loop. Senza GSAP, o con movimento ridotto, resta la composizione ferma e completa */
    var sposta = function (s) {
      var p = s.querySelector(".pagina");
      return function () { return -Math.max(0, p.offsetHeight - vetro.offsetHeight); };
    };
    var sale = function () { return { autoAlpha: 0, y: 8 }; };
    var registi = {
      casa: function (s, tl) {
        var p = s.querySelector(".pagina"), c = s.querySelector(".cursore"), a = s.querySelectorAll(".avvisi li");
        tl.set(a, sale()).set(p, { y: 0 })
          .fromTo(c, { autoAlpha: 0, x: 90, y: 70 }, { autoAlpha: 1, x: 0, y: 0, duration: 1.1, ease: "power3.out" }, 0.4)
          .to(c, { scale: 0.8, duration: 0.12, ease: "power2.out" }, 1.6)
          .to(c, { scale: 1, duration: 0.25, ease: "power2.out" }, 1.72)
          .to(a[0], { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, 1.9)
          .to(c, { autoAlpha: 0, duration: 0.3 }, 2.4)
          .to(p, { y: sposta(s), duration: 4.6, ease: "power2.inOut" }, 2.7)
          .to(a[1], { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, 4.3)
          .to(a[2], { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, 5.8)
          .to(a, { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.06, ease: "power2.out" }, 9.2)
          .to(p, { y: 0, duration: 1.6, ease: "power3.inOut" }, 9.4);
      },
      estetica: function (s, tl) {
        var p = s.querySelector(".pagina"), a = s.querySelectorAll(".avvisi li");
        tl.set(a, sale()).set(p, { y: 0 })
          .to(p, { y: sposta(s), duration: 8.5, ease: "power1.inOut" }, 0.6)
          .to(a[0], { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, 1.4)
          .to(a[1], { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, 3.8)
          .to(a[2], { autoAlpha: 1, y: 0, duration: 0.45, ease: "power3.out" }, 6.2)
          .to(a, { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.06, ease: "power2.out" }, 9.8)
          .to(p, { y: 0, duration: 1.6, ease: "power3.inOut" }, 10);
      },
      video: function (s, tl) {
        var r = s.querySelectorAll(".t-riga");
        tl.set(r, { autoAlpha: 0 })
          .fromTo(r[0], { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "steps(22)" }, 0.4);
        for (var i = 1; i < r.length; i++) {
          tl.fromTo(r[i], { autoAlpha: 0, x: -6 }, { autoAlpha: 1, x: 0, duration: 0.35, ease: "power2.out" }, 1.4 + i * 0.75);
        }
        tl.to(r, { autoAlpha: 0, duration: 0.3, ease: "power2.out" }, "+=2.6");
      },
      dashboard: function (s, tl) {
        var t = s.querySelectorAll(".app-scritto"), f = s.querySelectorAll(".app-campo");
        var salvato = s.querySelector(".app-salvato"), risposta = s.querySelector(".app-risposta");
        tl.set([salvato, risposta, f[1]], { autoAlpha: 0 })
          .fromTo(t[0], { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 2.2, ease: "steps(40)" }, 0.4)
          .fromTo(salvato, { autoAlpha: 0, y: 10, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, 3)
          .to(f[1], { autoAlpha: 1, duration: 0.3 }, 4)
          .fromTo(t[1], { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", duration: 1.3, ease: "steps(26)" }, 4.2)
          .fromTo(risposta, { autoAlpha: 0, y: 10, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" }, 5.9)
          .to([salvato, risposta, f[1]], { autoAlpha: 0, duration: 0.35, ease: "power2.out" }, 9.4)
          .set(t, { clipPath: "inset(0 100% 0 0)" });
      }
    };
    /* Le pagine dei siti scorrono giù e tornano su */
    var scorre = function (s, tl) {
      var p = s.querySelector(".pagina");
      tl.set(p, { y: 0 })
        .to(p, { y: sposta(s), duration: 6.5, ease: "power1.inOut" }, 0.8)
        .to(p, { y: 0, duration: 1.6, ease: "power3.inOut" }, "+=1.4");
    };

    var gira = function (nome) {
      if (film) { film.kill(); film = null; }
      if (!anima) return;
      var s = scene[nome];
      film = g.timeline({ repeat: -1, repeatDelay: 0.4, paused: !inVista });
      (registi[nome] || scorre)(s, film);
    };

    var scegli = function (nome, primo) {
      if (nome === attiva) return;
      var prima = attiva ? scene[attiva] : null;
      attiva = nome;
      voci.forEach(function (v) {
        var on = v.getAttribute("data-scena") === nome;
        v.classList.toggle("is-on", on);
        v.querySelector(".voce-testa").setAttribute("aria-pressed", on ? "true" : "false");
        if (on && dettaglio) {
          dettaglio.innerHTML = v.querySelector(".voce-corpo").innerHTML;
          if (anima && !primo) g.fromTo(dettaglio, { autoAlpha: 0, y: 6 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: "power3.out" });
        }
      });
      var s = scene[nome];
      url.textContent = s.getAttribute("data-url");
      s.classList.add("is-on");
      s.style.zIndex = 2;
      if (prima) prima.style.zIndex = 1;
      var chiudi = function () { if (prima && prima !== scene[attiva]) prima.classList.remove("is-on"); if (prima) prima.style.zIndex = ""; };
      /* La scena nuova scende come una tendina sopra la vecchia */
      if (anima && prima) {
        g.fromTo(s, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.45, ease: "power3.out", overwrite: true, onComplete: chiudi });
      } else chiudi();
      gira(nome);
    };

    /* Computer: si sceglie passando sopra (con un attimo di attesa, così attraversare la lista non fa lampeggiare), col clic o con la tastiera */
    voci.forEach(function (v) {
      var nome = v.getAttribute("data-scena"), testa = v.querySelector(".voce-testa"), attesa = null;
      testa.addEventListener("click", function () { scegli(nome); });
      testa.addEventListener("focus", function () { if (!stretto.matches) scegli(nome); });
      if (puntatore) {
        testa.addEventListener("pointerenter", function () { attesa = setTimeout(function () { scegli(nome); }, 90); });
        testa.addEventListener("pointerleave", function () { clearTimeout(attesa); });
      }
    });

    /* Telefono: la voce che passa a metà schermo sceglie la scena */
    if (vede) {
      var guarda = new IntersectionObserver(function (righe) {
        if (!stretto.matches) return;
        righe.forEach(function (r) { if (r.isIntersecting) scegli(r.target.getAttribute("data-scena")); });
      }, { rootMargin: "-58% 0px -40% 0px" });
      voci.forEach(function (v) { guarda.observe(v); });

      /* Il film gira solo quando la finestra si vede */
      new IntersectionObserver(function (e) {
        inVista = e[0].isIntersecting;
        if (film) inVista ? film.play() : film.pause();
      }).observe(vetro);
    }

    /* Un'immagine arrivata dopo cambia l'altezza della pagina: se è quella in scena, si rifà il film */
    box.querySelectorAll(".pagina img").forEach(function (im) {
      im.addEventListener("load", function () { if (attiva && scene[attiva].contains(im)) gira(attiva); });
    });

    /* Le altezze delle pagine cambiano col ridimensionamento: si rifà il film della scena attiva */
    var rifai = null;
    window.addEventListener("resize", function () { clearTimeout(rifai); rifai = setTimeout(function () { if (attiva) gira(attiva); }, 200); });

    var iniziale = (voci[0] && voci[0].getAttribute("data-scena")) || "casa";
    box.querySelectorAll(".scena.is-on").forEach(function (s) { s.classList.remove("is-on"); });
    scegli(iniziale, true);
  })();

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
