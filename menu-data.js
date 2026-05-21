/**
 * menu-data.js — Da Aloo Menu Data Module
 * Single source of truth for all menu items and combo builder data.
 * To update a price or add an item, edit ONLY this file.
 *
 * Data shapes:
 *   Simple item  → { name, price }
 *   Variant item → { name, price, variants: [{ name, price }] }
 *   Extras item  → { name, price, extras: [{ name, price, type?, group? }] }
 *   Combo item   → { id, name, price, image }
 */

// ─────────────────────────────────────────────
//  MAIN MENU
//  Used by: index.html / app.js
// ─────────────────────────────────────────────
export const MENU = {
  "Aloo Fries": [
    { name: "Aloo Fries Medium",           price: 80  },
    { name: "Aloo Fries Large",            price: 130 },
    { name: "Cajun & Garlic Fries",        price: 170 },
    { name: "Chili Fries",                 price: 180 },
    { name: "Spicy Buff Sausage Fries",    price: 190 },
    { name: "Cheesy Fries",                price: 190 },
    { name: "Chicken Makhani Fries",       price: 220 },
  ],

  "Da Aloo Special": [
    { name: "Battered Fries",   price: 180 },
    { name: "Fried Pizza Ball", price: 200 },
  ],

  "Spirals": [
    { name: "Aloo's Spiral",  price: 60, extras: [{ name: "Extra Sauce", price: 20 }] },
    { name: "Cheesy Spiral",  price: 80, extras: [{ name: "Extra Sauce", price: 20 }] },
    { name: "Battered Spiral",price: 80, extras: [{ name: "Extra Sauce", price: 20 }] },
  ],

  "Katti Roll": [
    { name: "Aloo Chat Katti Roll",         price: 120, extras: [{ name: "Add Egg", price: 30 }] },
    { name: "Spicy Buff Sausage Katti Roll",price: 160, extras: [{ name: "Add Egg", price: 30 }] },
    { name: "Paneer Katti Roll",            price: 170, extras: [{ name: "Add Egg", price: 30 }] },
    { name: "Tandoori Chicken Katti Roll",  price: 190, extras: [{ name: "Add Egg", price: 30 }] },
  ],

  "Mo:Mo": [
    {
      name: "Aloo Mo:Mo",
      variants: [
        { name: "Steam",  price: 100 },
        { name: "Kothey", price: 120 },
        { name: "Fried",  price: 130 },
        { name: "Jhol",   price: 140 },
        { name: "Chilli", price: 150 },
      ],
    },
    {
      name: "Paneer Mo:Mo",
      variants: [
        { name: "Steam",  price: 140 },
        { name: "Kothey", price: 150 },
        { name: "Fried",  price: 160 },
        { name: "Jhol",   price: 170 },
        { name: "Chilli", price: 180 },
      ],
    },
    {
      name: "Buff Mo:Mo",
      variants: [
        { name: "Steam",  price: 130 },
        { name: "Kothey", price: 140 },
        { name: "Fried",  price: 150 },
        { name: "Jhol",   price: 160 },
        { name: "Chilli", price: 180 },
      ],
    },
    {
      name: "Chicken Mo:Mo",
      variants: [
        { name: "Steam",  price: 160 },
        { name: "Kothey", price: 170 },
        { name: "Fried",  price: 180 },
        { name: "Jhol",   price: 190 },
        { name: "Chilli", price: 200 },
      ],
    },
  ],

  "Burger": [
    { name: "Aloo Tikki Burger", price: 160, extras: [{ name: "Add Cheese", price: 50 }] },
    { name: "Chicken Burger",    price: 220, extras: [{ name: "Add Cheese", price: 50 }] },
    { name: "Spicy Buff Burger", price: 210, extras: [{ name: "Add Cheese", price: 50 }] },
  ],

  "Sandwich": [
    { name: "Veg Sandwich",     price: 140 },
    { name: "Chicken Sandwich", price: 180 },
  ],

  "Keema Noodles": [
    { name: "Paneer Keema Noodles",  price: 180 },
    { name: "Chicken Keema Noodles", price: 200 },
    { name: "Buff Keema Noodles",    price: 180 },
  ],

  "Fried Rice": [
    { name: "Veg Fried Rice",    price: 120 },
    { name: "Chicken Fried Rice",price: 180 },
    { name: "Buff Fried Rice",   price: 160 },
    { name: "Mixed Fried Rice",  price: 200 },
  ],

  "Chowmein": [
    { name: "Veg Chowmein",    price: 110 },
    { name: "Chicken Chowmein",price: 170 },
    { name: "Buff Chowmein",   price: 150 },
    { name: "Mixed Chowmein",  price: 190 },
  ],

  "Snacks": [
    { name: "Chicken Chilly",        price: 280 },
    { name: "Buff Chilly",           price: 270 },
    { name: "Paneer Chilly",         price: 270 },
    { name: "Chicken Sausage Chilly",price: 190 },
    { name: "Buff Sausage Chilly",   price: 180 },
    {
      name: "Sausage",
      price: 50, // display minimum; variants carry exact prices
      variants: [
        { name: "Buff",    price: 50 },
        { name: "Chicken", price: 60 },
      ],
    },
    { name: "Chicken Nuggets", price: 250 },
  ],

  "Chicken Wings": [
    { name: "Buffalo Hot Wings",   price: 360, details: "3 pcs" },
    { name: "Crunchy Wings",       price: 360, details: "3 pcs" },
    { name: "Cheesy Garlic Wings", price: 380, details: "3 pcs" },
  ],

  "Rice or Roti Meal": [
    {
      name: "Butter Chicken Curry",
      price: 210,
      extras: [
        { name: "With Rice", price: 0, type: "radio", group: "serving" },
        { name: "With Roti", price: 0, type: "radio", group: "serving" },
      ],
    },
    {
      name: "Tandoori Chicken Curry",
      price: 200,
      extras: [
        { name: "With Rice", price: 0, type: "radio", group: "serving" },
        { name: "With Roti", price: 0, type: "radio", group: "serving" },
      ],
    },
    {
      name: "Masala Paneer Curry",
      price: 200,
      extras: [
        { name: "With Rice", price: 0, type: "radio", group: "serving" },
        { name: "With Roti", price: 0, type: "radio", group: "serving" },
      ],
    },
    {
      name: "Aloo Curry",
      price: 160,
      extras: [
        { name: "With Rice", price: 0, type: "radio", group: "serving" },
        { name: "With Roti", price: 0, type: "radio", group: "serving" },
      ],
    },
  ],

  "Cold Drinks": [
    { name: "Coke / Fanta / Sprite", price: 80  },
    { name: "Cold Coffee",           price: 120 },
    { name: "Ice Mint Lemonade",     price: 140 },
    { name: "Green Apple Mojito",    price: 150 },
    { name: "Blue Lagoon",           price: 160 },
    { name: "Peach Ice Tea",         price: 160 },
    { name: "Strawberry Lemonade",   price: 160 },
    { name: "Sweet Lassi",           price: 100 },
  ],

  "Hot Drinks": [
    { name: "Masala Black Tea",      price: 30  },
    { name: "Masala Milk Tea",       price: 50  },
    { name: "Lemon Tea",             price: 40  },
    { name: "Suja (Butter Milk Tea)",price: 70  },
    { name: "Hot Lemon",             price: 100 },
    { name: "Americano",             price: 80  },
    { name: "Cappuccino",            price: 100 },
    { name: "Hot Chocolate",         price: 100 },
  ],
};

// ─────────────────────────────────────────────
//  CATEGORY IMAGES
//  Used by: app.js (tab rendering)
// ─────────────────────────────────────────────
export const CATEGORY_IMAGES = {
  "Aloo Fries":       "images/categories/aloo-fries.jpg",
  "Da Aloo Special":  "images/categories/special.jpg",
  "Spirals":          "images/categories/spirals.jpg",
  "Katti Roll":       "images/categories/katti-roll.jpg",
  "Mo:Mo":            "images/categories/momo.jpg",
  "Burger":           "images/categories/burger.jpg",
  "Sandwich":         "images/categories/sandwich.jpg",
  "Keema Noodles":    "images/categories/keema-noodles.jpg",
  "Fried Rice":       "images/categories/fried-rice.jpg",
  "Chowmein":         "images/categories/chowmein.jpg",
  "Snacks":           "images/categories/snacks.jpg",
  "Chicken Wings":    "images/categories/chicken-wings.jpg",
  "Rice or Roti Meal":"images/categories/rice-roti.jpg",
  "Cold Drinks":      "images/categories/cold-drinks.jpg",
  "Hot Drinks":       "images/categories/hot-drinks.jpg",
};

// ─────────────────────────────────────────────
//  COMBO BUILDER ITEMS
//  Used by: makecombo.html / app.js (combo page)
// ─────────────────────────────────────────────
export const COMBO_ITEMS = {
  main: [
    { id: 1,  name: "Sandwich",   price: 85,  image: "images/categories/sandwich.jpg"    },
    { id: 2,  name: "Fried Rice", price: 90,  image: "images/categories/fried-rice.jpg"  },
    { id: 3,  name: "Chowmein",   price: 90,  image: "images/categories/chowmein.jpg"    },
    { id: 10, name: "Burger",     price: 95,  image: "images/categories/burger.jpg"      },
    { id: 11, name: "Pasta",      price: 100, image: "images/categories/pasta.jpg"       },
  ],
  crispySide: [
    { id: 4,  name: "Chicken Nuggets", price: 110, image: "images/categories/chicken-nuggets.jpg" },
    { id: 5,  name: "Paneer Nuggets",  price: 100, image: "images/categories/paneer-nuggets.jpg"  },
    { id: 6,  name: "Battered Fries",  price: 75,  image: "images/categories/battered-fries.jpg"  },
    { id: 12, name: "Potato Wedges",   price: 80,  image: "images/categories/wedges.jpg"           },
    { id: 13, name: "Onion Rings",     price: 85,  image: "images/categories/onion-rings.jpg"      },
  ],
  momo: [
    { id: 7, name: "Chicken Mo:Mo", price: 110, image: "images/categories/momohalf.png"    },
    { id: 8, name: "Paneer Mo:Mo",  price: 100, image: "images/categories/paneer-momo.jpg" },
    { id: 9, name: "Aloo Mo:Mo",    price: 90,  image: "images/categories/aloo-momo.jpg"   },
  ],
};

// ─────────────────────────────────────────────
//  UTILITY: Find any menu item by name
// ─────────────────────────────────────────────
export function findMenuItem(name) {
  for (const items of Object.values(MENU)) {
    const found = items.find(item => item.name === name);
    if (found) return found;
  }
  return null;
}

// ─────────────────────────────────────────────
//  UTILITY: Parse price (handles "50-60" ranges)
// ─────────────────────────────────────────────
export function parsePrice(price) {
  if (typeof price === "number") return price;
  if (typeof price === "string" && price.includes("-")) {
    return parseInt(price.split("-")[0], 10);
  }
  return parseInt(price, 10) || 0;
}
