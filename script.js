/* ============================================================
   Simone Torregrossa — Portfolio
   Vanilla JS · nessuna dipendenza
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Anno corrente nel footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- Header: bordo all'inizio dello scroll ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  if (toggle && menu) {
    var closeMenu = function () {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Apri il menu");
    };
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    });
    // Chiudi al click su un link o con Esc
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ---------- Reveal on scroll (IntersectionObserver) ---------- */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     Form di contatto — validazione + invio Web3Forms
     ============================================================ */
  var form = document.getElementById("contact-form");
  if (!form) return;

  var statusEl = document.getElementById("form-status");
  var submitBtn = document.getElementById("submit-btn");
  var btnLabel = submitBtn ? submitBtn.querySelector(".btn-label") : null;

  var validators = {
    name: function (v) { return v.trim().length >= 2 || "Inserisci il tuo nome."; },
    email: function (v) {
      if (!v.trim()) return "Inserisci la tua email.";
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Inserisci un'email valida.";
    },
    message: function (v) { return v.trim().length >= 10 || "Scrivi almeno qualche parola."; }
  };

  function setError(name, msg) {
    var field = form.elements[name];
    var errEl = form.querySelector('[data-error-for="' + name + '"]');
    if (errEl) errEl.textContent = msg || "";
    if (field) {
      if (msg) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
    }
  }

  function validateField(name) {
    var field = form.elements[name];
    if (!field) return true;
    var result = validators[name](field.value);
    if (result === true) { setError(name, ""); return true; }
    setError(name, result);
    return false;
  }

  // Validazione su blur (non a ogni tasto)
  ["name", "email", "message"].forEach(function (name) {
    var field = form.elements[name];
    if (!field) return;
    field.addEventListener("blur", function () { validateField(name); });
    field.addEventListener("input", function () {
      if (field.getAttribute("aria-invalid") === "true") validateField(name);
    });
  });

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.remove("is-success", "is-error");
    if (type) statusEl.classList.add("is-" + type);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot: se compilato, fingi successo e fermati
    if (form.elements["botcheck"] && form.elements["botcheck"].checked) return;

    var ok = ["name", "email", "message"].map(validateField).every(Boolean);
    if (!ok) {
      setStatus("Controlla i campi evidenziati.", "error");
      var firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    var accessKey = form.elements["access_key"] ? form.elements["access_key"].value : "";
    if (!accessKey || accessKey === "YOUR_WEB3FORMS_ACCESS_KEY") {
      setStatus("Form non ancora configurato: manca la Web3Forms access key.", "error");
      return;
    }

    // Stato di caricamento
    if (submitBtn) submitBtn.disabled = true;
    if (btnLabel) btnLabel.textContent = "Invio in corso…";
    setStatus("", null);

    fetch(form.action, {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form)
    })
      .then(function (res) { return res.json().then(function (d) { return { ok: res.ok, data: d }; }); })
      .then(function (r) {
        if (r.ok && r.data.success) {
          form.reset();
          setStatus("Messaggio inviato. Ti rispondo a breve, grazie!", "success");
        } else {
          setStatus((r.data && r.data.message) || "Qualcosa è andato storto. Riprova o scrivimi via email.", "error");
        }
      })
      .catch(function () {
        setStatus("Errore di rete. Controlla la connessione o scrivimi via email.", "error");
      })
      .finally(function () {
        if (submitBtn) submitBtn.disabled = false;
        if (btnLabel) btnLabel.textContent = "Invia messaggio";
      });
  });
})();
