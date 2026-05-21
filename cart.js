/**
 * cart.js — Da Aloo CartManager
 * Encapsulates all cart state, persistence, and UI sync.
 * Import this module on every page that touches the cart.
 *
 * Usage:
 *   import { CartManager } from './cart.js';
 *   const cart = new CartManager();
 *   cart.add({ name, basePrice, variant, extras, availableExtras });
 */

const STORAGE_KEY     = "daAlooCart";
const ORIGIN_KEY      = "daAlooOrigin";
const FALLBACK_STORE  = sessionStorage; // used when localStorage quota is exceeded

// ─────────────────────────────────────────────
//  CartItem shape (for documentation)
// ─────────────────────────────────────────────
/**
 * @typedef {Object} CartItem
 * @property {string}   name            — Display name of the item
 * @property {number}   basePrice       — Unit price before extras
 * @property {Object|null} variant      — e.g. { name: "Steam", price: 100 }
 * @property {Array}    extras          — Currently selected extras
 * @property {Array}    availableExtras — All possible extras (for in-cart UI)
 * @property {number}   quantity
 * @property {number}   totalPrice      — (basePrice + extrasSum) × quantity
 * @property {string}   [details]       — Optional string (used by combo items)
 * @property {number}   [price]         — Alias used by combo items (= basePrice)
 */

export class CartManager {
  // ── Constructor ────────────────────────────
  constructor() {
    /** @type {CartItem[]} */
    this._items = [];
    this._load();
  }

  // ─────────────────────────────────────────
  //  PUBLIC READ API
  // ─────────────────────────────────────────

  /** Returns a shallow copy of the cart array (never mutate directly). */
  get items() {
    return [...this._items];
  }

  /** Total number of individual units across all cart lines. */
  get totalQuantity() {
    return this._items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /** Grand total in Rs. */
  get grandTotal() {
    return this._items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  get isEmpty() {
    return this._items.length === 0;
  }

  // ─────────────────────────────────────────
  //  MUTATION API
  // ─────────────────────────────────────────

  /**
   * Add an item to the cart.
   * Items with no availableExtras are merged (quantity++) on duplicate.
   * Items WITH availableExtras are always added as separate lines so the
   * user can have one Katti Roll with egg and one without.
   *
   * @param {Object} params
   * @param {string}     params.name
   * @param {number}     params.basePrice
   * @param {Object|null} [params.variant=null]
   * @param {Array}      [params.extras=[]]
   * @param {Array}      [params.availableExtras=[]]
   * @param {string}     [params.details]          — combo item label
   */
  add({ name, basePrice, variant = null, extras = [], availableExtras = [], details }) {
    const extrasSum  = this._sumExtras(extras);
    const totalPrice = (basePrice + extrasSum) * 1; // qty=1 on creation

    const newItem = {
      name,
      basePrice,
      variant,
      extras:          [...extras],
      availableExtras: [...availableExtras],
      quantity:        1,
      totalPrice,
      ...(details ? { details } : {}),
      // combo-page compat alias
      price: basePrice,
    };

    // Only merge when there are no potential extras (simple items like Coke)
    if (availableExtras.length === 0) {
      const idx = this._findIndex(newItem);
      if (idx > -1) {
        this._adjustQuantity(idx, 1);
        this._persist();
        return;
      }
    }

    this._items.push(newItem);
    this._persist();
  }

  /**
   * Increase or decrease the quantity of a cart line.
   * Pass delta=-1 on the last unit to remove the line entirely.
   *
   * @param {number} index — cart line index
   * @param {number} delta — +1 or -1
   * @returns {boolean}    — false if line was removed
   */
  adjustQuantity(index, delta) {
    this._guardIndex(index);
    const newQty = this._items[index].quantity + delta;

    if (newQty < 1) {
      this._items.splice(index, 1);
      this._persist();
      return false; // line removed
    }

    this._adjustQuantity(index, delta);
    this._persist();
    return true;
  }

  /**
   * Remove a cart line unconditionally.
   * @param {number} index
   */
  remove(index) {
    this._guardIndex(index);
    this._items.splice(index, 1);
    this._persist();
  }

  /**
   * Toggle a checkbox extra on a cart line and recalculate totals.
   * @param {number} index
   * @param {{ name: string, price: number }} extra
   * @param {boolean} checked
   */
  toggleExtra(index, extra, checked) {
    this._guardIndex(index);
    const item = this._items[index];

    if (checked) {
      if (!item.extras.some(e => e.name === extra.name)) {
        item.extras.push({ name: extra.name, price: extra.price });
      }
    } else {
      item.extras = item.extras.filter(e => e.name !== extra.name);
    }

    this._recalcTotal(index);
    this._persist();
  }

  /**
   * Set a radio-group extra on a cart line (clears the previous selection
   * in the same group) and recalculate totals.
   * @param {number} index
   * @param {{ name: string, price: number, group: string }} extra
   */
  selectRadioExtra(index, extra) {
    this._guardIndex(index);
    const item = this._items[index];

    // Clear all extras that belong to this radio group
    item.extras = item.extras.filter(e => {
      const meta = item.availableExtras.find(ae => ae.name === e.name);
      return !meta || meta.group !== extra.group;
    });

    item.extras.push({ name: extra.name, price: extra.price });
    this._recalcTotal(index);
    this._persist();
  }

  /** Wipe the entire cart (called after order is sent). */
  clear() {
    this._items = [];
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      FALLBACK_STORE.removeItem(STORAGE_KEY);
    }
  }

  // ─────────────────────────────────────────
  //  NAVIGATION HELPERS
  // ─────────────────────────────────────────

  /**
   * Save the current page as the post-order redirect target,
   * persist the cart, then navigate to location.html.
   * @param {string} originPage — e.g. 'index.html' or 'makecombo.html'
   */
  proceedToCheckout(originPage = "index.html") {
    if (this.isEmpty) {
      alert("Your cart is empty!");
      return;
    }
    try {
      localStorage.setItem(ORIGIN_KEY, originPage);
    } catch (_) { /* non-fatal */ }

    this._persist();
    window.location.href = "location.html";
  }

  /** Read back the origin page saved during checkout. */
  static getOriginPage() {
    return localStorage.getItem(ORIGIN_KEY) || "index.html";
  }

  // ─────────────────────────────────────────
  //  UI SYNC
  // ─────────────────────────────────────────

  /**
   * Update every element with id="cartBadge" on the current page.
   * Call this after any mutation.
   */
  syncBadge() {
    const badge = document.getElementById("cartBadge");
    if (badge) badge.textContent = this.totalQuantity;
  }

  /**
   * Render the full cart UI into the given container element.
   * Mirrors the original updateCartDisplay() logic, decoupled from globals.
   *
   * @param {HTMLElement} cartItemsEl   — #cartItems
   * @param {HTMLElement} cartTotalEl   — #cartTotal
   */
  renderCartUI(cartItemsEl, cartTotalEl) {
    if (!cartItemsEl) return;

    if (this.isEmpty) {
      cartItemsEl.innerHTML = `
        <div class="empty-cart-message" style="display:block;">
          <i class="fas fa-shopping-cart"></i>
          <p>Your cart is empty</p>
        </div>`;
      if (cartTotalEl) cartTotalEl.textContent = "Total: Rs 0";
      return;
    }

    let html  = "";
    let total = 0;

    this._items.forEach((item, index) => {
      total += item.totalPrice;

      // Variant label
      const variantHtml = item.variant
        ? `<div class="cart-item-variant">Variant: ${item.variant.name}</div>`
        : "";

      // Extras (checkboxes + radio groups)
      let extrasHtml = "";
      if (item.availableExtras?.length > 0) {
        // Group by radio group key
        const groups = {};
        item.availableExtras.forEach(opt => {
          const key = opt.group || "default";
          (groups[key] = groups[key] || []).push(opt);
        });

        extrasHtml = '<div class="cart-extras-options">';
        Object.values(groups).forEach(group => {
          const isRadio    = group[0].type === "radio";
          const groupName  = group[0].group || "extras";
          extrasHtml += `<div class="extras-group ${isRadio ? "radio-group" : ""}">`;

          group.forEach(opt => {
            const checked = item.extras.some(e => e.name === opt.name);
            const priceLabel = opt.price > 0 ? ` (+Rs ${opt.price})` : "";

            if (isRadio) {
              extrasHtml += `
                <label class="cart-extra-label">
                  <input type="radio"
                         class="extra-radio"
                         name="extra-${index}-${groupName}"
                         data-index="${index}"
                         data-name="${opt.name}"
                         data-price="${opt.price}"
                         data-group="${groupName}"
                         ${checked ? "checked" : ""}>
                  ${opt.name}${priceLabel}
                </label>`;
            } else {
              extrasHtml += `
                <label class="cart-extra-label">
                  <input type="checkbox"
                         class="extra-checkbox"
                         data-index="${index}"
                         data-name="${opt.name}"
                         data-price="${opt.price}"
                         ${checked ? "checked" : ""}>
                  ${opt.name}${priceLabel}
                </label>`;
            }
          });
          extrasHtml += "</div>";
        });
        extrasHtml += "</div>";
      }

      html += `
        <div class="cart-item">
          <div class="cart-item-info">
            <div class="cart-item-name">${item.name} × ${item.quantity}</div>
            ${variantHtml}
            ${extrasHtml}
            ${item.details
              ? `<div class="cart-item-details" style="font-size:.75rem;color:#666;">${item.details}</div>`
              : ""}
            <div class="cart-item-price">Rs ${item.totalPrice}</div>
          </div>
          <div class="cart-item-controls">
            <button class="quantity-btn" data-index="${index}" data-action="decrease">−</button>
            <span class="quantity-display">${item.quantity}</span>
            <button class="quantity-btn" data-index="${index}" data-action="increase">+</button>
            <button class="remove-btn" data-index="${index}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>`;
    });

    cartItemsEl.innerHTML = html;
    if (cartTotalEl) cartTotalEl.textContent = `Total: Rs ${total}`;
  }

  // ─────────────────────────────────────────
  //  EVENT DELEGATION HANDLERS
  //  Wire these up once per page in app.js
  // ─────────────────────────────────────────

  /**
   * Handle click events inside the #cartItems container.
   * Covers quantity +/- buttons and the remove (trash) button.
   * @param {Event} e
   * @param {Function} onUpdate — callback after mutation (re-render)
   */
  handleCartClick(e, onUpdate) {
    const qtyBtn    = e.target.closest(".quantity-btn");
    const removeBtn = e.target.closest(".remove-btn");

    if (qtyBtn) {
      const index  = parseInt(qtyBtn.dataset.index, 10);
      const action = qtyBtn.dataset.action; // "increase" | "decrease"
      this.adjustQuantity(index, action === "increase" ? 1 : -1);
      this.syncBadge();
      onUpdate?.();
    }

    if (removeBtn) {
      const index = parseInt(removeBtn.dataset.index, 10);
      if (confirm("Remove item?")) {
        this.remove(index);
        this.syncBadge();
        onUpdate?.();
      }
    }
  }

  /**
   * Handle change events inside the #cartItems container.
   * Covers extra checkboxes and radio buttons.
   * @param {Event} e
   * @param {Function} onUpdate — callback after mutation (re-render)
   */
  handleCartChange(e, onUpdate) {
    const el = e.target;

    if (el.classList.contains("extra-checkbox")) {
      this.toggleExtra(
        parseInt(el.dataset.index, 10),
        { name: el.dataset.name, price: parseInt(el.dataset.price, 10) },
        el.checked
      );
      onUpdate?.();
    }

    if (el.classList.contains("extra-radio")) {
      this.selectRadioExtra(
        parseInt(el.dataset.index, 10),
        {
          name:  el.dataset.name,
          price: parseInt(el.dataset.price, 10),
          group: el.dataset.group,
        }
      );
      onUpdate?.();
    }
  }

  // ─────────────────────────────────────────
  //  PRIVATE HELPERS
  // ─────────────────────────────────────────

  _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
               ?? FALLBACK_STORE.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure every item has an availableExtras array (migration guard)
        this._items = parsed.map(item => ({
          ...item,
          availableExtras: item.availableExtras ?? [],
          extras:          item.extras          ?? [],
        }));
      }
    } catch (err) {
      console.error("[CartManager] Failed to load cart:", err);
      this._items = [];
    }
  }

  _persist() {
    const serialised = JSON.stringify(this._items);
    try {
      localStorage.setItem(STORAGE_KEY, serialised);
    } catch (_) {
      // Quota exceeded — fall back to sessionStorage (cart survives tab, not restart)
      try { FALLBACK_STORE.setItem(STORAGE_KEY, serialised); } catch (__) { /* give up */ }
    }
  }

  /** Returns the index of an identical item already in the cart, or -1. */
  _findIndex(newItem) {
    return this._items.findIndex(
      item =>
        item.name === newItem.name &&
        JSON.stringify(item.variant) === JSON.stringify(newItem.variant) &&
        JSON.stringify(item.extras)  === JSON.stringify(newItem.extras)
    );
  }

  _adjustQuantity(index, delta) {
    this._items[index].quantity += delta;
    this._recalcTotal(index);
  }

  _recalcTotal(index) {
    const item = this._items[index];
    const extrasSum = this._sumExtras(item.extras);
    item.totalPrice = (item.basePrice + extrasSum) * item.quantity;
    // Keep the combo-compat alias in sync
    item.price = item.basePrice;
  }

  _sumExtras(extras = []) {
    return extras.reduce((sum, e) => sum + (e.price ?? 0), 0);
  }

  _guardIndex(index) {
    if (index < 0 || index >= this._items.length) {
      throw new RangeError(`[CartManager] Invalid cart index: ${index}`);
    }
  }
}
