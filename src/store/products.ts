/**
 * Store catalog. Prices and availability are placeholder — replace when real
 * checkout is wired up. The discriminated-union tier shape stays the same
 * regardless of the eventual commerce backend (Shopify, Stripe, Etsy, etc.).
 */

import type { DeviceType } from "../ble/protocol";

export interface PaidTier {
  kind: "finished" | "kit";
  label: string;
  price: string;
  status: "available" | "preorder" | "soon";
  description: string;
  includes: string[];
}

export interface DiyTier {
  kind: "diy";
  label: string;
  partsListUrl: string;
  firmwareUrl: string;
  description: string;
  includes: string[];
}

export type ProductTier = PaidTier | DiyTier;

export function isPaidTier(t: ProductTier): t is PaidTier {
  return t.kind === "finished" || t.kind === "kit";
}

export function isDiyTier(t: ProductTier): t is DiyTier {
  return t.kind === "diy";
}

export interface Product {
  id: string;
  relic: DeviceType;
  name: string;
  tagline: string;
  description: string;
  features: string[];
  accent: "rune" | "ember" | "glow";
  tiers: [PaidTier, PaidTier, DiyTier];
}

/** Returns the lowest paid-tier price for display on index cards. */
export function startingPrice(product: Product): string {
  const paid = product.tiers.filter(isPaidTier);
  return paid[paid.length - 1]?.price ?? "Free";
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
      "Aged brass casing, ~70 mm diameter",
      "Bluetooth Low Energy 5.0",
      "Onboard magnetometer for ambient mode",
      "Rechargeable via USB-C, ~12 hours per charge",
    ],
    accent: "rune",
    tiers: [
      {
        kind: "finished",
        label: "Ready to play",
        price: "$149",
        status: "preorder",
        description:
          "Fully assembled, calibrated, and tested. Arrives ready to bond with the app. Includes USB-C cable, velvet pouch, and quick-start card.",
        includes: [
          "Finished brass compass with glass face",
          "Pre-flashed firmware, calibrated",
          "USB-C charging cable",
          "Velvet carry pouch",
          "Quick-start card",
        ],
      },
      {
        kind: "kit",
        label: "Build it yourself",
        price: "$89",
        status: "preorder",
        description:
          "All the parts, a step-by-step guide, and our firmware pre-loaded on the microcontroller. About two hours with basic soldering skills.",
        includes: [
          "Brass compass shell (unassembled)",
          "Pre-flashed microcontroller",
          "PCB, magnetometer, motor driver",
          "Hardware bag: screws, standoffs, glass",
          "Illustrated assembly guide",
        ],
      },
      {
        kind: "diy",
        label: "Open plans",
        partsListUrl: "https://github.com/JasonSchneider/TabletopRelics/blob/main/docs/diy/compass-bom.md",
        firmwareUrl: "https://github.com/JasonSchneider/TabletopRelics/blob/main/docs/diy/compass-firmware.md",
        description:
          "Full bill of materials, schematics, and firmware source. Source everything yourself or print the case. No cost, no waitlist.",
        includes: [
          "Bill of materials (common components)",
          "KiCad schematics and PCB files",
          "3D-printable case files",
          "Arduino firmware (MIT licence)",
          "Community Discord access",
        ],
      },
    ],
  },
  {
    id: "haunted-lantern",
    relic: "lantern",
    name: "Haunted Lantern",
    tagline: "A flickering flame that responds to footsteps and breath.",
    description:
      "Wrought-iron frame, frosted glass, and a programmable RGB flame that flickers, gusts, dims, or snuffs at the DM's command. Built-in microphone lets it react to ambient sound — a held breath, a sudden shout, a whispered name.",
    features: [
      "Wrought-iron frame, ~180 mm tall",
      "Programmable RGB flame with motion-driven flicker",
      "Bluetooth LE 5.0 + ambient microphone",
      "Four built-in effects: flicker, ghost, wind, snuff",
      "Rechargeable USB-C, ~8 hours per charge",
    ],
    accent: "ember",
    tiers: [
      {
        kind: "finished",
        label: "Ready to play",
        price: "$179",
        status: "preorder",
        description:
          "Assembled and tested. The flame is calibrated to the four built-in modes out of the box — bond it with the app and you're running in minutes.",
        includes: [
          "Finished wrought-iron lantern",
          "Pre-flashed firmware, effects calibrated",
          "USB-C charging cable",
          "Protective sleeve for transport",
          "Quick-start card",
        ],
      },
      {
        kind: "kit",
        label: "Build it yourself",
        price: "$109",
        status: "preorder",
        description:
          "The frame arrives welded; you wire and flash the electronics. About three hours. Soldering required — a good intermediate project.",
        includes: [
          "Welded wrought-iron frame with glass",
          "Pre-flashed microcontroller",
          "RGB LED assembly, microphone board",
          "Wiring harness and connectors",
          "Illustrated assembly guide",
        ],
      },
      {
        kind: "diy",
        label: "Open plans",
        partsListUrl: "https://github.com/JasonSchneider/TabletopRelics/blob/main/docs/diy/lantern-bom.md",
        firmwareUrl: "https://github.com/JasonSchneider/TabletopRelics/blob/main/docs/diy/lantern-firmware.md",
        description:
          "Source the frame from a craft supplier, buy the electronics off the shelf, flash our firmware. Full schematics and code included.",
        includes: [
          "Bill of materials with supplier links",
          "Wiring diagrams and schematics",
          "3D-printable mount files",
          "Arduino firmware (MIT licence)",
          "Community Discord access",
        ],
      },
    ],
  },
  {
    id: "fairy-stones",
    relic: "fairy-stones",
    name: "Fairy Stones",
    tagline: "A constellation of glowing pebbles that talk to each other.",
    description:
      "Seven river-tumbled stones with embedded LEDs and a tiny BLE radio in each. Scatter them across the table and they find each other — synchronized glow patterns, leader/follower roles, and proximity-aware twinkling.",
    features: [
      "Set of seven stones, ~30–40 mm each",
      "Mesh networking — stones talk directly to each other",
      "Four built-in patterns: breathe, twinkle, chase, off",
      "Wireless charging tray included",
      "Bluetooth LE 5.0 with one stone acting as gateway",
    ],
    accent: "glow",
    tiers: [
      {
        kind: "finished",
        label: "Ready to play",
        price: "$129",
        status: "soon",
        description:
          "Seven finished stones, charged and paired as a set. The gateway stone bonds with the app; the others follow automatically.",
        includes: [
          "Seven finished resin stones",
          "Gateway stone pre-flashed and paired",
          "Wireless charging tray",
          "Velvet pouch (fits all seven)",
          "Quick-start card",
        ],
      },
      {
        kind: "kit",
        label: "Build it yourself",
        price: "$79",
        status: "soon",
        description:
          "Cast your own stones around our electronics modules. Resin casting is the main skill needed — we walk you through it.",
        includes: [
          "Seven electronics modules (pre-flashed)",
          "Resin casting guide and mold files",
          "Wireless charging coils and tray kit",
          "Pigment sampler for stone tinting",
          "Illustrated assembly guide",
        ],
      },
      {
        kind: "diy",
        label: "Open plans",
        partsListUrl: "https://github.com/JasonSchneider/TabletopRelics/blob/main/docs/diy/stones-bom.md",
        firmwareUrl: "https://github.com/JasonSchneider/TabletopRelics/blob/main/docs/diy/stones-firmware.md",
        description:
          "Source your own stones (river rocks, resin pours, whatever you like), embed the electronics, and flash the mesh firmware.",
        includes: [
          "Bill of materials for seven nodes",
          "PCB design files (Qi charging included)",
          "Mesh network firmware (MIT licence)",
          "Resin casting tips and mold files",
          "Community Discord access",
        ],
      },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getFeaturedProducts(limit = 3): Product[] {
  return PRODUCTS.slice(0, limit);
}
