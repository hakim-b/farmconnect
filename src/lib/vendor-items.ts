import { SymbolView } from "expo-symbols";

import type { FarmType } from "@/lib/types";

export type ItemKind = "produce" | "meat" | "animal" | "activity";

type SF = Parameters<typeof SymbolView>[0]["name"];

export const ITEM_KIND: Record<
  ItemKind,
  {
    label: string;
    blurb: string;
    icon: SF;
    table: "products" | "slaughter_offerings" | "activities";
  }
> = {
  produce: {
    label: "Produce",
    blurb: "Fruit, vegetables, eggs, honey — sold by the item or by weight.",
    icon: { ios: "carrot.fill", android: "agriculture", web: "agriculture" },
    table: "products",
  },
  meat: {
    label: "Meat",
    blurb: "Packaged cuts, sold by weight.",
    icon: { ios: "fork.knife", android: "content_cut", web: "content_cut" },
    table: "products",
  },
  animal: {
    label: "Animal for slaughter",
    blurb: "A whole animal a customer books to have slaughtered.",
    icon: { ios: "hare.fill", android: "pets", web: "pets" },
    table: "slaughter_offerings",
  },
  activity: {
    label: "Farm activity",
    blurb: "A tour, fruit-picking, or a visit customers can book.",
    icon: {
      ios: "figure.walk",
      android: "directions_walk",
      web: "directions_walk",
    },
    table: "activities",
  },
};

/** Which kinds of item this farm can offer, based on the type chosen at setup. */
export function itemKindsForFarm(type: FarmType): ItemKind[] {
  switch (type) {
    case "slaughter_only":
      return ["meat", "animal", "activity"];
    case "produce_and_meats":
      return ["produce", "meat", "activity"];
    case "mixed":
      return ["produce", "meat", "animal", "activity"];
    default:
      return ["produce", "meat", "activity"];
  }
}

export const PRODUCE_UNITS = ["each", "kg", "dozen", "bunch"] as const;
export type ProduceUnit = (typeof PRODUCE_UNITS)[number];

export function money(amount: number) {
  return `$${Number(amount).toFixed(2)}`;
}
