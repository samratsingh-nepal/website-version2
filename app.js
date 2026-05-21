/**
 * app.js — Da Aloo Main Application Script
 *
 * Imported by:  index.html       (type="module")
 *               makecombo.html   (type="module")
 *
 * Responsibilities per page:
 *   index.html    → render category tabs, render menu items, wire customization
 *                   modal (variant picker), wire cart UI
 *   makecombo.html → render combo section cards, wire combo builder selections,
 *                    wire cart UI
 *
 * This file contains ZERO business logic — it only wires DOM events
 * to the CartManager API and the rendering helpers.
 */

import { MENU, CATEGORY_IMAGES, COMBO_ITEMS, findMenuItem, parsePrice } from "./menu-data.js";
import { CartManager } from "./cart.js";

// ─────────────────────────────────────────────
//  SHARED SINGLETON — one CartManager per page load
// ─────────────────────────────────────────────
const cart = new CartManager();

// ─────────────────────────────────────────────
//  PAGE ROUTER — detect which page we are on
// ─────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("currentYear").textContent = new Date().getFullYear();
  cart.syncBadge();

  if (document.getElementById("categoryTabs")) {
    initMenuPage();
  } else if (document.getElementById("comboBuilder")) {
    initComboPage();
  }
});

// ═══════════════════════════════════════════════
//  INDEX.HTML — MENU PAGE
// ═══════════════════════════════════════════════

function initMenuPage() {
  renderCategoryTabs();
  renderMenuItems();
  setupTabSwitching();
  setupSaveMenuButton();
  setupCartModal("index.html");
  setupCustomizationModal();
}

// ── Category Tab Rendering ──────────────────

function renderCategoryTabs() {
  const container = document.getElementById("categoryTabs");
  let isFirst = true;

  for (const [categoryName] of Object.entries(MENU)) {
    const tabId = slugify(categoryName);
    const btn   = document.createElement("button");
    btn.className = `category-tab${isFirst ? " active" : ""}`;
    btn.dataset.category = tabId;

    const imgSrc = CATEGORY_IMAGES[categoryName] ?? "";
    btn.innerHTML = `
      <div class="tab-content">
        <div class="tab-image">
          <img src="${imgSrc}"
               alt="${categoryName}"
               loading="lazy"
               onerror="this.parentElement.innerHTML='<div style=\'font-size:1.5rem;color:#666;\'>🍽️</div>'">
        </div>
        <span class="tab-text">${categoryName}</span>
      </div>`;

    container.appendChild(btn);
    isFirst = false;
  }
}

// ── Menu Item Rendering ─────────────────────

function renderMenuItems() {
  const container = document.getElementById("menuItems");
  let isFirst = true;

  for (const [categoryName, items] of Object.entries(MENU)) {
    const categoryId  = slugify(categoryName);
    const categoryDiv = document.createElement("div");
    categoryDiv.className = `category-content${isFirst ? " active" : ""}`;
    categoryDiv.id        = categoryId;

    let itemsHTML = "";

    for (const item of items) {
      const hasVariants = Boolean(item.variants?.length);
      const hasExtras   = Boolean(item.extras?.length);

      // Price display
      let displayPrice   = `Rs ${item.price}`;
      let dataPrice      = parsePrice(item.price);

      if (hasVariants) {
        const prices = item.variants.map(v => v.price);
        displayPrice = `Rs ${Math.min(...prices)} – ${Math.max(...prices)}`;
        dataPrice    = Math.min(...prices);
      }

      // Button config
      const btnText  = hasVariants ? "Choose Variant" : "Add to Cart";
      const btnIcon  = hasVariants ? "list-ul" : "plus";
      const btnClass = hasVariants ? "customize-btn" : "";

      itemsHTML += `
        <div class="menu-item-card">
          <div class="item-main-container">
            <div class="item-left">
              <h3 class="item-name">${item.name}</h3>
            </div>
            <div class="item-right">
              <div class="item-price">${displayPrice}</div>
            </div>
          </div>
          ${item.details ? `<div class="item-details">${item.details}</div>` : ""}
          <button class="add-to-cart-btn ${btnClass}"
                  data-name="${item.name}"
                  data-price="${dataPrice}"
                  data-has-variants="${hasVariants}"
                  data-has-extras="${hasExtras}">
            <i class="fas fa-${btnIcon}"></i> ${btnText}
          </button>
        </div>`;
    }

    categoryDiv.innerHTML = `
      <div class="category-header">
        <h2 class="category-title">${categoryName}</h2>
      </div>
      <div class="category-items">${itemsHTML}</div>`;

    container.appendChild(categoryDiv);
    isFirst = false;
  }

  // ── Add-to-cart event delegation ───────────
  document.addEventListener("click", e => {
    const btn = e.target.closest(".add-to-cart-btn");
    if (!btn) return;

    const name        = btn.dataset.name;
    const price       = parseInt(btn.dataset.price, 10);
    const hasVariants = btn.dataset.hasVariants === "true";

    if (hasVariants) {
      openVariantModal(name);
    } else {
      const itemData       = findMenuItem(name);
      const availableExtras = itemData?.extras ?? [];
      cart.add({ name, basePrice: price, availableExtras });
      cart.syncBadge();
      flashAddedFeedback(btn);
    }
  });
}

// ── Tab Switching ───────────────────────────

function setupTabSwitching() {
  const tabs     = document.querySelectorAll(".category-tab");
  const contents = document.querySelectorAll(".category-content");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      contents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.category)?.classList.add("active");
    });
  });
}

// ── Save Menu Button ────────────────────────

function setupSaveMenuButton() {
  const btn          = document.getElementById("saveMenuBtn");
  const notification = document.getElementById("saveNotification");
  if (!btn) return;

  btn.addEventListener("click", () => {
    notification?.classList.add("show");
    const link     = document.createElement("a");
    link.href      = "images/menu.jpg";
    link.download  = "da-aloo-menu.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => notification?.classList.remove("show"), 3000);
  });
}

// ── Variant Customization Modal ─────────────

/** @type {{ name: string, price: number, variants?: Array } | null} */
let _currentModalItem = null;

function openVariantModal(itemName) {
  const item = findMenuItem(itemName);
  if (!item) return;
  _currentModalItem = item;

  const modal    = document.getElementById("customizationModal");
  const titleEl  = document.getElementById("customizationItemName");
  const bodyEl   = document.getElementById("customizationBody");
  const priceEl  = document.getElementById("customTotalPrice");

  titleEl.textContent = `Select Variant for ${itemName}`;

  let html      = '<div class="customization-section"><h4>Select Variant</h4>';
  let basePrice = 0;

  item.variants.forEach((v, i) => {
    if (i === 0) basePrice = v.price;
    html += `
      <label class="variant-option">
        <input type="radio" name="variant"
               value="${v.name}"
               data-price="${v.price}"
               ${i === 0 ? "checked" : ""}>
        <span class="variant-name">${v.name}</span>
        <span class="variant-price">Rs ${v.price}</span>
      </label>`;
  });
  html += "</div>";

  bodyEl.innerHTML  = html;
  priceEl.textContent = basePrice;

  // Live price update as user selects radio
  bodyEl.querySelectorAll('input[name="variant"]').forEach(input => {
    input.addEventListener("change", () => {
      priceEl.textContent = input.dataset.price;
    });
  });

  modal.style.display = "block";
}

function closeVariantModal() {
  document.getElementById("customizationModal").style.display = "none";
  _currentModalItem = null;
}

function setupCustomizationModal() {
  const modal     = document.getElementById("customizationModal");
  const closeBtn  = document.getElementById("closeCustomization");
  const cancelBtn = document.getElementById("cancelCustomization");
  const addBtn    = document.getElementById("addToCartCustom");

  closeBtn?.addEventListener("click",  closeVariantModal);
  cancelBtn?.addEventListener("click", closeVariantModal);

  window.addEventListener("click", e => {
    if (e.target === modal) closeVariantModal();
  });

  addBtn?.addEventListener("click", () => {
    if (!_currentModalItem) return;

    const selected = document.querySelector('input[name="variant"]:checked');
    const variant  = selected
      ? { name: selected.value, price: parseInt(selected.dataset.price, 10) }
      : null;

    const price = variant?.price ?? parsePrice(_currentModalItem.price);
    cart.add({ name: _currentModalItem.name, basePrice: price, variant, extras: [] });
    cart.syncBadge();
    closeVariantModal();
  });
}

// ═══════════════════════════════════════════════
//  MAKECOMBO.HTML — COMBO BUILDER PAGE
// ═══════════════════════════════════════════════

function initComboPage() {
  renderComboSection("mainSection",       COMBO_ITEMS.main,       "main");
  renderComboSection("crispySideSection", COMBO_ITEMS.crispySide, "crispySide");
  renderComboSection("momoSection",       COMBO_ITEMS.momo,       "momo");
  setupComboBuilder();
  setupCartModal("makecombo.html");
}

// ── Combo Section Rendering ─────────────────

/** @type {{ main: Object|null, crispySide: Object|null, momo: Object|null }} */
const _comboSelection = { main: null, crispySide: null, momo: null };

function renderComboSection(containerId, items, sectionKey) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = items.map(item => `
    <div class="combo-item-card"
         data-id="${item.id}"
         data-name="${item.name}"
         data-price="${item.price}"
         data-section="${sectionKey}">
      <div class="combo-item-image">
        <img src="${item.image}"
             alt="${item.name}"
             loading="lazy"
             onerror="this.src='images/categories/default.jpg'">
      </div>
      <div class="combo-item-name">${item.name}</div>
      <div class="combo-item-price">Rs ${item.price}</div>
    </div>`
  ).join("");
}

function setupComboBuilder() {
  // Selection click delegation
  document.addEventListener("click", e => {
    const card = e.target.closest(".combo-item-card");
    if (!card) return;

    const section = card.dataset.section;
    const sibling = card.parentElement.querySelectorAll(".combo-item-card");
    sibling.forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    _comboSelection[section] = {
      name:  card.dataset.name,
      price: parseInt(card.dataset.price, 10),
    };

    updateComboSummary();
  });

  // Add combo to cart button
  document.getElementById("addComboBtn")?.addEventListener("click", addComboToCart);
}

function updateComboSummary() {
  const { main, crispySide, momo } = _comboSelection;
  const total = (main?.price ?? 0) + (crispySide?.price ?? 0) + (momo?.price ?? 0);

  const summaryEl = document.getElementById("comboSummary");
  const totalEl   = document.getElementById("comboTotal");

  if (summaryEl) {
    summaryEl.innerHTML = `
      <div>Main: ${main?.name ?? "—"}</div>
      <div>Crispy Side: ${crispySide?.name ?? "—"}</div>
      <div>Mo:Mo: ${momo?.name ?? "—"}</div>`;
  }
  if (totalEl) totalEl.textContent = `Rs ${total}`;
}

function addComboToCart() {
  const { main, crispySide, momo } = _comboSelection;

  if (!main || !crispySide || !momo) {
    alert("Please select one item from each section to build your combo.");
    return;
  }

  const total   = main.price + crispySide.price + momo.price;
  const details = `${main.name} + ${crispySide.name} + ${momo.name}`;

  cart.add({
    name:      "Da Aloo Combo",
    basePrice: total,
    details,
  });
  cart.syncBadge();

  // Reset selections
  document.querySelectorAll(".combo-item-card.selected").forEach(c => c.classList.remove("selected"));
  _comboSelection.main = _comboSelection.crispySide = _comboSelection.momo = null;
  updateComboSummary();

  alert("Combo added to cart! 🎉");
}

// ═══════════════════════════════════════════════
//  SHARED — CART MODAL (used by both pages)
// ═══════════════════════════════════════════════

/**
 * Wire up the shared cart modal and all its interactions.
 * @param {string} originPage — 'index.html' or 'makecombo.html'
 */
function setupCartModal(originPage) {
  const cartIcon    = document.getElementById("cartIcon");
  const cartModal   = document.getElementById("cartModal");
  const closeCart   = document.getElementById("closeCart");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const itemsEl     = document.getElementById("cartItems");
  const totalEl     = document.getElementById("cartTotal");

  if (!cartModal) return;

  const refresh = () => cart.renderCartUI(itemsEl, totalEl);

  // Open
  cartIcon?.addEventListener("click", () => {
    cartModal.style.display = "block";
    refresh();
  });

  // Close (X button)
  closeCart?.addEventListener("click", () => {
    cartModal.style.display = "none";
  });

  // Close (backdrop click)
  window.addEventListener("click", e => {
    if (e.target === cartModal) cartModal.style.display = "none";
  });

  // Proceed to checkout
  checkoutBtn?.addEventListener("click", () => {
    cart.proceedToCheckout(originPage);
  });

  // Event delegation — quantity / remove buttons
  itemsEl?.addEventListener("click", e => {
    cart.handleCartClick(e, () => {
      cart.syncBadge();
      refresh();
    });
  });

  // Event delegation — extras checkboxes / radios
  itemsEl?.addEventListener("change", e => {
    cart.handleCartChange(e, refresh);
  });
}

// ─────────────────────────────────────────────
//  UTILITIES
// ─────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().replace(/[ &\/]/g, "-");
}

function flashAddedFeedback(btn) {
  const original = btn.innerHTML;
  btn.innerHTML  = '<i class="fas fa-check"></i> Added!';
  btn.style.background = "#2ecc71";
  setTimeout(() => {
    btn.innerHTML        = original;
    btn.style.background = "";
  }, 1000);
}
