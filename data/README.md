# Datos del itinerario

Cada dia vive en `data/days/day-XX.json`.

- `day-00.json`: Dia 0.
- `day-01.json`: Dia 1.
- `data/hidden/proposal-day-03.json`: version oculta del Dia 3.

Despues de editar cualquier JSON, correr:

```bash
npm run build:data
```

Ese comando valida los JSON y actualiza `data/itinerary.json`, que es el manifiesto que lee `index.html`.

`index.html` ya no guarda los dias completos. La pagina carga los datos con `fetch`, asi que debe abrirse desde GitHub Pages o un servidor local, no directamente con doble click como `file://`.
