# Da Aloo — Modular JS Refactor: Integration Guide

## File structure after refactor

```
/
├── index.html
├── makecombo.html
├── location.html
├── about.html
├── offers.html
├── style.css
└── js/
    ├── menu-data.js   ← single source of truth for all menu / combo data
    ├── cart.js        ← CartManager class (state, persistence, rendering)
    ├── order.js       ← kitchen hours checker + WhatsApp payload compiler
    └── app.js         ← page router + UI rendering (imports the three above)
```

Place all four `.js` files in a `/js/` subfolder beside your HTML files.

---

## 1 · index.html changes

### Remove
The entire `<script>` block that contains `const MENU = { … }` and all the
inline JS (roughly lines 139–1030). Keep every HTML element — only the script
block is deleted.

### Add (just before `</body>`)
```html
<script type="module" src="js/app.js"></script>
```

That single tag replaces ~900 lines of inline JavaScript. `app.js` detects
`#categoryTabs` and runs `initMenuPage()` automatically.

---

## 2 · makecombo.html changes

### Remove
The entire `<script>` block containing `const COMBO_ITEMS = { … }` and all
the inline cart/combo JS (roughly lines 1302–end of script).
Keep every HTML element.

### Add (just before `</body>`)
```html
<script type="module" src="js/app.js"></script>
```

`app.js` detects `#comboBuilder` and runs `initComboPage()` automatically.
Make sure the combo section containers have these IDs in your HTML:

```html
<div id="comboBuilder">          <!-- outer wrapper — used as page detector -->
  <div id="mainSection">...</div>
  <div id="crispySideSection">...</div>
  <div id="momoSection">...</div>
</div>
<div id="comboSummary"></div>
<div id="comboTotal"></div>
<button id="addComboBtn">Add Combo to Cart</button>
```

---

## 3 · location.html changes

### Remove
The `formatOrderMessage()` and `sendOrderToWhatsApp()` functions from the
inline `<script>` block. Keep the Leaflet map init code (`initMap`, GPS logic,
`isLiveLocation`, `hasMarkerBeenDragged`).

### Add a landmark input field in the HTML (before the confirm button)
```html
<div style="margin: 1rem 0;">
  <label for="landmarkInput" style="font-weight:600; display:block; margin-bottom:6px;">
    📍 Nearest House No. / Landmark
  </label>
  <input id="landmarkInput"
         type="text"
         placeholder="e.g. Near Blue House, opposite the school gate"
         style="width:100%; padding:10px 14px; border-radius:10px;
                border:2px solid #ccc; font-size:1rem; font-family:inherit;">
</div>
```

### Replace the confirm button's click handler
```html
<script type="module">
  import { placeOrder }    from './js/order.js';
  import { CartManager }   from './js/cart.js';

  const cartManager = new CartManager();

  document.getElementById('confirmLocationBtn')
    .addEventListener('click', () => {
      placeOrder({
        markerLatLng:        marker ? marker.getLatLng() : null,
        isLiveLocation:      isLiveLocation,
        hasMarkerBeenDragged:hasMarkerBeenDragged,
        landmark:            document.getElementById('landmarkInput').value,
        cartManager,
      });
    });
</script>
```

> `marker`, `isLiveLocation`, and `hasMarkerBeenDragged` are the same
> variables already declared in your existing Leaflet init script — they are
> accessible in the module because the module script runs after the Leaflet
> script in the same page scope.

---

## 4 · Updating prices or adding menu items

Open **`js/menu-data.js`** only. Every other file reads from it.

```js
// Increase Cheesy Fries from 190 → 210:
{ name: "Cheesy Fries", price: 210 },

// Add a new item to Aloo Fries:
{ name: "Truffle Fries", price: 250 },
```

Save → deploy. Done. No HTML files need to change.

---

## 5 · Updating kitchen hours

Open **`js/order.js`** and edit the `KITCHEN_CONFIG.HOURS` block:

```js
HOURS: {
  0: null,                                       // Sunday — closed
  1: { open: "10:00", close: "21:00" },
  …
  5: { open: "10:00", close: "22:00" },          // Friday — close later
  6: { open: "11:00", close: "22:00" },          // Saturday — open later
},
```

All times are in **Nepal Standard Time (UTC+5:45)** — no timezone conversion
needed on your end.

---

## Quick-reference: module exports

| Module | Exports |
|---|---|
| `menu-data.js` | `MENU`, `CATEGORY_IMAGES`, `COMBO_ITEMS`, `findMenuItem(name)`, `parsePrice(price)` |
| `cart.js` | `CartManager` class |
| `order.js` | `placeOrder(params)`, `checkKitchenStatus()`, `compileOrderMessage(...)`, `KITCHEN_CONFIG` |
| `app.js` | (no exports — side-effect module, runs on `DOMContentLoaded`) |
