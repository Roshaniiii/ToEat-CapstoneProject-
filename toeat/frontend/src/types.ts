/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Nutrient identifiers
export enum NutrientType {
  IRON = "Iron",
  VITAMIN_D = "Vitamin D",
  VITAMIN_B12 = "Vitamin B12",
  CALCIUM = "Calcium",
  FOLATE = "Folate"
}

// Diet restrictions of user
export type DietType = "veg" | "non-veg" | "vegan";

// Food structure returned by AI/API
export interface FoodItem {
  id?: string;
  name: string;
  emoji: string;
  reason: string;
  nutrient_content: string; // descriptive content, e.g., "6.2 mg per 100g" or "High"
  bioavailability_tip?: string;
  blockers?: string;
}

// Guidance returned for a deficiency
export interface DeficiencyGuidance {
  deficiency: NutrientType;
  diet: DietType;
  recommended: FoodItem[];
  limit: FoodItem[];
  tip: string;
  specialNote?: string; // Special note for Vegans on B12/Vit D
}

// Search result structure
export interface SearchResult {
  found: boolean;
  name: string;
  emoji: string;
  usdaData?: {
    fdcId: number;
    description: string;
    nutrients: {
      name: string;
      value: number;
      unit: string;
    }[];
  };
  deficiencies_helped: {
    nutrient: NutrientType;
    explanation: string;
    hasSignificantAmount: boolean;
  }[];
  bioavailability_tip: string;
  absorption_enhancers: string;
  absorption_blockers: string;
}

// ICMR standards for RDI (Indian standards)
export interface RDIDetail {
  nutrient: NutrientType;
  value: string;
  unit: string;
  vegSourceNote: string;
  veganSourceNote: string;
  nonVegSourceNote: string;
  icmrReference: string;
}
