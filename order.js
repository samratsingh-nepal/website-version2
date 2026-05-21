/**
 * order.js — Da Aloo Order Validator & WhatsApp Payload Compiler
 * Used exclusively by: location.html
 *
 * Responsibilities:
 *   1. Operational hours gate  — prevent orders when kitchen is closed
 *   2. Location payload build  — handle live GPS, dragged-pin, or no-location cases
 *   3. Landmark input          — accept a free-text delivery landmark from the user
 *   4. WhatsApp message format — compile a clean, beautifully aligned order message
 *   5. Post-order teardown     — clear cart and redirect back to the origin page
 *
 * Dependencies: cart.js (CartManager)
 */

import { CartManager } from "./cart.js";

// ─────────────────────────────────────────────
//  CONFIGURATION BLOCK
//  Edit this object to change kitchen hours.
//  All times are in 24-hour Nepal Standard Time (UTC+5:45).
// ─────────────────────────────────────────────
export const KITCHEN_CONFIG = {
  /** WhatsApp number to send orders to (international format, no +). */
  WHATSAPP_NUMBER: "9779847375984",

  /**
   * Hours keyed by JS day index: 0 = Sunday … 6 = Saturday.
   * Set a day to null to mark it as fully closed.
   */
  HOURS: {
    0: { open: "10:00", close: "21:00" }, // Sunday
    1: { open: "10:00", close: "21:00" }, // Monday
    2: { open: "10:00", close: "21:00" }, // Tuesday
    3: { open: "10:00", close: "21:00" }, // Wednesday
    4: { open: "10:00", close: "21:00" }, // Thursday
    5: { open: "10:00", close: "21:30" }, // Friday  (slightly later close)
    6: { open: "10:00", close: "21:30" }, // Saturday
  },

  /** Timezone offset in minutes from UTC for Nepal (UTC+5:45 = 345 min). */
  TZ_OFFSET_MINUTES: 345,
};

// ─────────────────────────────────────────────
//  OPERATIONAL HOURS CHECKER
// ─────────────────────────────────────────────

/**
 * Returns the current Nepal time as a Date object.
 * @returns {Date}
 */
function getNepalTime() {
  const utcMs   = Date.now();
  const nepalMs = utcMs + KITCHEN_CONFIG.TZ_OFFSET_MINUTES * 60_000;
  return new Date(nepalMs);
}

/**
 * Parse "HH:MM" time string to { hours, minutes }.
 * @param {string} str
 */
function parseTime(str) {
  const [hours, minutes] = str.split(":").map(Number);
  return { hours, minutes };
}

/**
 * Check whether the kitchen is currently open.
 *
 * @returns {{ isOpen: boolean, message: string }}
 */
export function checkKitchenStatus() {
  const now     = getNepalTime();
  const dayIdx  = now.getUTCDay(); // 0-6, where 0 = Sunday
  const todayHours = KITCHEN_CONFIG.HOURS[dayIdx];

  if (!todayHours) {
    return {
      isOpen: false,
      message: "We are closed today. Please visit us another day! 🙏",
    };
  }

  const openTime  = parseTime(todayHours.open);
  const closeTime = parseTime(todayHours.close);

  const nowMinutes   = now.getUTCHours() * 60 + now.getUTCMinutes();
  const openMinutes  = openTime.hours  * 60 + openTime.minutes;
  const closeMinutes = closeTime.hours * 60 + closeTime.minutes;

  if (nowMinutes < openMinutes) {
    return {
      isOpen: false,
      message: `We open at ${todayHours.open} (Nepal time). Please come back soon! 🕙`,
    };
  }

  if (nowMinutes >= closeMinutes) {
    return {
      isOpen: false,
      message: `Kitchen is now closed (closes at ${todayHours.close}). See you tomorrow! 🌙`,
    };
  }

  return { isOpen: true, message: "" };
}

// ─────────────────────────────────────────────
//  WHATSAPP MESSAGE COMPILER
// ─────────────────────────────────────────────

/**
 * Build the formatted WhatsApp plain-text message.
 *
 * @param {CartItem[]} items       — cart items array
 * @param {string}     locationText — human-readable label for the delivery pin
 * @param {string}     locationLink — Google Maps URL (or "No location sent")
 * @param {string}     landmark     — free-text landmark / nearest house no.
 * @returns {string}
 */
export function compileOrderMessage(items, locationText, locationLink, landmark) {
  const nepal = getNepalTime();
  const dateStr = nepal.toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });
  const timeStr = nepal.toLocaleTimeString("en-NP", {
    hour: "2-digit", minute: "2-digit", hour12: true,
  });

  const DIVIDER = "━━━━━━━━━━━━━━━━━━━━━";

  let message = `🍟 *DA ALOO — NEW ORDER*\n`;
  message    += `${DIVIDER}\n`;
  message    += `📅 ${dateStr}  🕐 ${timeStr}\n`;
  message    += `${DIVIDER}\n\n`;

  message    += `🛒 *ORDER DETAILS*\n\n`;

  let grandTotal = 0;

  if (items.length === 0) {
    message += "_(no items)_\n";
  } else {
    items.forEach((item, i) => {
      // ── Line total ──────────────────────────
      let lineTotal;
      if (item.totalPrice !== undefined) {
        lineTotal = item.totalPrice; // already qty × (base + extras)
      } else if (item.price !== undefined) {
        lineTotal = item.price * (item.quantity || 1);
      } else {
        lineTotal = 0;
      }
      grandTotal += lineTotal;

      const qty = item.quantity || 1;

      // ── Item header line ────────────────────
      message += `${i + 1}. *${qty}× ${item.name}*`;

      if (item.variant) {
        message += ` — _${item.variant.name}_`;
      }
      message += "\n";

      // ── Extras ──────────────────────────────
      if (item.extras?.length > 0) {
        const extraNames = item.extras.map(e => e.name).join(", ");
        message += `   ➕ Extras: ${extraNames}\n`;
      }

      // ── Combo details ───────────────────────
      if (item.details) {
        message += `   📦 Includes: ${item.details}\n`;
      }

      // ── Subtotal ────────────────────────────
      message += `   💰 Rs ${lineTotal}\n\n`;
    });
  }

  message += `${DIVIDER}\n`;
  message += `💵 *TOTAL: Rs ${grandTotal}*\n`;
  message += `${DIVIDER}\n\n`;

  // ── Delivery section ───────────────────────
  message += `📍 *DELIVERY DETAILS*\n`;

  if (locationLink && locationLink !== "No location sent") {
    message += `   📌 ${locationText || "Pin dropped"}\n`;
    message += `   🗺️ ${locationLink}\n`;
  } else {
    message += `   ⚠️ No map location shared\n`;
  }

  if (landmark?.trim()) {
    message += `   🏠 Landmark: ${landmark.trim()}\n`;
  }

  message += `\n${DIVIDER}\n`;
  message += `_Please confirm this order. Thank you!_ 🙏`;

  return message;
}

// ─────────────────────────────────────────────
//  CHECKOUT ORCHESTRATOR
// ─────────────────────────────────────────────

/**
 * Main checkout function wired to the "Order on WhatsApp" button.
 *
 * @param {Object} params
 * @param {Object|null} params.markerLatLng  — Leaflet LatLng (marker.getLatLng())
 * @param {boolean}     params.isLiveLocation
 * @param {boolean}     params.hasMarkerBeenDragged
 * @param {string}      params.landmark      — from the manual input field
 * @param {CartManager} params.cartManager
 */
export function placeOrder({
  markerLatLng,
  isLiveLocation,
  hasMarkerBeenDragged,
  landmark,
  cartManager,
}) {
  // ── 1. Kitchen status gate ─────────────────
  const kitchenStatus = checkKitchenStatus();
  if (!kitchenStatus.isOpen) {
    alert(`⏰ ${kitchenStatus.message}`);
    return;
  }

  // ── 2. Cart guard ──────────────────────────
  if (cartManager.isEmpty) {
    alert("Your cart is empty! Please add items before ordering.");
    return;
  }

  // ── 3. Map guard ───────────────────────────
  if (!markerLatLng) {
    alert("Map is still loading. Please wait a moment and try again.");
    return;
  }

  // ── 4. Resolve location strings ────────────
  let locationText = "";
  let locationLink = "No location sent";

  if (isLiveLocation && !hasMarkerBeenDragged) {
    // Case A: GPS fix, pin not moved
    const { lat, lng } = markerLatLng;
    locationLink = _mapsUrl(lat, lng);
    locationText = "Live GPS Location";

  } else if (!isLiveLocation && !hasMarkerBeenDragged) {
    // Case B: No GPS, pin not moved → no location
    locationText = "Not provided";
    locationLink = "No location sent";

  } else {
    // Case C: Pin was dragged (manual selection)
    const { lat, lng } = markerLatLng;
    locationLink = _mapsUrl(lat, lng);
    locationText = "Manually Selected Location";
  }

  // ── 5. Compile message ─────────────────────
  const message     = compileOrderMessage(
    cartManager.items,
    locationText,
    locationLink,
    landmark
  );
  const encoded     = encodeURIComponent(message);
  const waUrl       = `https://wa.me/${KITCHEN_CONFIG.WHATSAPP_NUMBER}?text=${encoded}`;

  // ── 6. Clear cart & redirect ───────────────
  cartManager.clear();

  window.open(waUrl, "_blank");

  // Return to the page the user ordered from
  setTimeout(() => {
    window.location.href = CartManager.getOriginPage();
  }, 500);
}

// ─────────────────────────────────────────────
//  PRIVATE UTILITIES
// ─────────────────────────────────────────────

function _mapsUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}
