# Sofia Manfrini — Portfolio

Portfolio di Sofia Manfrini: graphic design, fotografia e social media management.

Sito statico (HTML, CSS, JavaScript) pubblicato con GitHub Pages.

## Aggiornare i lavori

I lavori vengono generati dalla cartella `progetti/` (non inclusa nel repository):

```
progetti/
  foto/     <lavoro>/  immagini, PDF, zip + info.txt
  social/   <lavoro>/
  grafica/  <lavoro>/
```

```bash
python3 genera_portfolio.py
```

Lo script ottimizza le immagini in `assets/lavori/` e aggiorna `lavori.js`.
