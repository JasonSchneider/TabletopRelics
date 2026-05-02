/**
 * Store catalog. The placeholder prices and availability flags below
 * are intentionally fake — replace them when real pricing and checkout
 * are wired up. The shape stays the same regardless of the eventual
 * commerce backend (Shopify, Stripe, Etsy embed, etc.).
 */

import type { DeviceType } from "../ble/protocol";

export interface Product {
  id: string;
  /** Which relic this product is. Used for routing back to its controls. */
  relic: DeviceType;
  name: string;
  tagline: string;
  description: string;
  /** Bullets of what's in the box / what the relic can do. */
  features: string[];
  /** Display price (string so we can show "TBD", ranges, etc.). */
  price: string;
  /** Tint used on the product card and CTA. */
  accent: "rune" | "ember" | "glow";
  /** "available" = buy now, "preorder" = pre-order, "soon" = waitlist. */
  status: "available" | "preorder" | "soon";
}

export const PRODUCTS: Product[] = [
  {
    id: "magic-compass",
    relic: "compass",
    name: "Magic Compass",
    tagline: "A brass needle that points wherever the story needs.",
    description:
      "Hand-finished brass body with a glass face and a magnetic needle that obeys you, not the earth. Pairs with the Tabletop Relics app to point at quest markers, hidden enemies, or whatever bearing you whisper to it.",
    features: [
      "Aged brass casing, ~70mm diameter",
      "Bluetooth Low Energy 5.0",
      "Onboard magnetometer for ambient mode",
      "Rechargeable via USB-C, ~12 hours per charge",
      "Works with iOS, Android, and desktop browsers",
    ],
    price: "$149",
    accent: "rune",
    status: "preorder",
  },
  {
    id: "haunted-lantern",
    relic: "lantern",
    name: "Haunted Lantern",
    tagline: "A flickering flame that responds to footsteps and breath.",
    description:
      "Wrought-iron frame, frosted glass, and a programmable RGB flame that flickers, gusts, dims, or snuffs at the DM's command. Built-in microphone lets it react to ambient sound — a held breath, a sudden shout, a whispered name.",
    features: [
      "Wrought-iron frame, ~180mm tall",
      "Programmable RGB flame with motion-driven flicker",
      "Bluetooth LE 5.0 + ambient microphone",
      "Four built-in effects: flicker, ghost, wind, snuff",
      "Rechargeable USB-C, ~8 hours per charge",
    ],
    price: "$179",
    accent: "ember",
    status: "preorder",
  },
  {
    id: "fairy-stones",
    relic: "fairy-stones",
    name: "Fairy Stones — Set of Seven",
    tagline: "A constellation of glowing pebbles that talk to each other.",
    description:
      "Seven river-tumbled stones with embedded LEDs and a tiny BLE radio in each. Scatter them across the table and they find each other — synchronized glow patterns, leader/follower roles, and proximity-aware twinkling.",
    features: [
      "Set of seven stones, ~30–40mm each",
      "Mesh networking — stones talk directly to each other",
      "Four built-in patterns: breathe, twinkle, chase, off",
      "Wireless charging tray included",
      "Bluetooth LE 5.0 with one stone acting as gateway",
    ],
    price: "$129",
    accent: "glow",
    status: "soon",
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getFeaturedProducts(limit = 3): Product[] {
  return PRODUCTS.slice(0, limit);
}
