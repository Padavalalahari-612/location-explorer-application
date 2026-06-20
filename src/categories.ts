import { CategoryInfo } from "./types";

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "restaurants",
    label: "Restaurants",
    geoapifyCategory: "catering.restaurant",
    iconName: "Utensils",
    color: "rose-500",
  },
  {
    id: "cafes",
    label: "Cafes",
    geoapifyCategory: "catering.cafe",
    iconName: "Coffee",
    color: "amber-500",
  },
  {
    id: "hospitals",
    label: "Hospitals",
    geoapifyCategory: "healthcare.hospital",
    iconName: "Hospital",
    color: "red-500",
  },
  {
    id: "pharmacies",
    label: "Pharmacies",
    geoapifyCategory: "healthcare.pharmacy",
    iconName: "Pill",
    color: "emerald-500",
  },
  {
    id: "hotels",
    label: "Hotels",
    geoapifyCategory: "accommodation.hotel",
    iconName: "Hotel",
    color: "indigo-500",
  },
  {
    id: "atms",
    label: "ATMs",
    geoapifyCategory: "service.financial.atm",
    iconName: "Coins",
    color: "blue-500",
  },
  {
    id: "parks",
    label: "Parks",
    geoapifyCategory: "leisure.park",
    iconName: "Trees",
    color: "teal-500",
  },
  {
    id: "shopping_malls",
    label: "Shopping Malls",
    geoapifyCategory: "commercial.shopping_mall",
    iconName: "ShoppingBag",
    color: "violet-500",
  },
];

export function getCategoryById(id: string): CategoryInfo | undefined {
  return CATEGORIES.find((cat) => cat.id === id);
}

export function getCategoryByGeoapify(geoCategory: string): CategoryInfo | undefined {
  // geoapify category might be catering.restaurant.fine_dining etc. startsWith matches
  return CATEGORIES.find(
    (cat) =>
      geoCategory.startsWith(cat.geoapifyCategory) ||
      cat.geoapifyCategory.startsWith(geoCategory.split(".")[0])
  );
}
