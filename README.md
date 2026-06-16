# Sito portfolio — Simone Torregrossa

Sito statico, mobile-first, senza dipendenze (solo HTML/CSS/JS).
Pronto da pubblicare su GitHub Pages.

---

## ⚠️ Prima di pubblicare: 4 cose da personalizzare

Cerca questi segnaposto e sostituiscili (sono tutti marcati con `TODO` nel codice):

| Cosa | Dove | Valore attuale (da cambiare) |
|------|------|------------------------------|
| **Web3Forms access key** | `index.html` → `<input name="access_key">` | `YOUR_WEB3FORMS_ACCESS_KEY` |
| **URL LinkedIn** | `index.html` (sezione contatti + JSON-LD) | `https://www.linkedin.com/in/simone-torregrossa` |
| **URL GitHub** | `index.html` (sezione contatti + JSON-LD) | `https://github.com/simonetorregrossa` |
| **URL del sito** | `index.html` (canonical, Open Graph, JSON-LD), `robots.txt`, `sitemap.xml` | `https://simonetorregrossa.github.io/` |

La **email** è già impostata: `simone.torregrossa.pa@gmail.com`.

### Come ottenere la Web3Forms access key (gratis, 1 minuto)
1. Vai su <https://web3forms.com>
2. Inserisci la tua email → ricevi la **access key** via mail
3. Incollala in `index.html` al posto di `YOUR_WEB3FORMS_ACCESS_KEY`

Finché la key non è impostata, il form mostra un messaggio chiaro e non invia nulla.

---

## Provare il sito in locale

Non serve installare nulla: il sito è statico. Due modi:

**A. Doppio click** su `index.html` (si apre nel browser).

**B. Con un piccolo server locale** (consigliato — il form e i font si comportano come online):

```bash
# dalla cartella del progetto
python3 -m http.server 8000
```

Poi apri <http://localhost:8000>.

---

## Pubblicare su GitHub Pages

1. Crea un repository su GitHub. Per avere l'indirizzo `https://<tuo-username>.github.io`
   chiama il repo **esattamente** `<tuo-username>.github.io`.
   (In alternativa un nome qualsiasi → il sito sarà su `https://<tuo-username>.github.io/<nome-repo>/`.)

2. Carica i file:

   ```bash
   cd portfolio
   git init
   git add .
   git commit -m "Sito portfolio"
   git branch -M main
   git remote add origin https://github.com/<tuo-username>/<nome-repo>.git
   git push -u origin main
   ```

3. Su GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**,
   branch `main`, cartella `/ (root)`. Salva.

4. Dopo 1–2 minuti il sito è online. Aggiorna l'URL nei segnaposto sopra se è diverso da quello previsto.

> Nota: se usi un repo con sottocartella (`/<nome-repo>/`), aggiorna gli URL assoluti
> di Open Graph e canonical di conseguenza.

---

## Struttura dei file

```
portfolio/
├── index.html          Pagina unica (hero, competenze, progetto, chi sono, contatti)
├── styles.css          Stile (palette editoriale, mobile-first)
├── script.js           Menu mobile, animazioni, validazione + invio form
├── robots.txt          SEO
├── sitemap.xml         SEO
├── .nojekyll           Evita l'elaborazione Jekyll su GitHub Pages
└── assets/
    ├── favicon.svg     Monogramma ST
    ├── og-cover.png    Anteprima social (1200×630)
    └── og-cover.svg    Sorgente vettoriale dell'anteprima
```

---

## SEO incluso

- `<title>` e meta description ottimizzati
- Open Graph + Twitter Card (anteprima `assets/og-cover.png`)
- Schema.org **Person** (JSON-LD) con `areaServed: Italia`
- HTML semantico, `robots.txt`, `sitemap.xml`, `lang="it"`

## Design

- Tema chiaro editoriale: serif **Playfair Display** (titoli) + **Inter** (testo) + **JetBrains Mono** (etichette/tech)
- Palette sobria e professionale: grafite/navy su bianco freddo + un solo accento (navy `#1F4E79`)
- Mobile-first, animazioni d'ingresso leggere, `prefers-reduced-motion` rispettato
- Accessibilità: skip-link, focus visibili, contrasti AA, validazione form con messaggi vicino ai campi

---

### Nota sul progetto in evidenza
Il "Sistema di prenotazione con automazione recensioni" è presentato — correttamente —
come **progetto personale/demo costruito da te**, non come lavoro per un cliente reale.
Il testo è già scritto in modo onesto: se in futuro diventa un lavoro commissionato,
potrai aggiornare quella sezione.
