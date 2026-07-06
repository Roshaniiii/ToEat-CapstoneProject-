/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { NutrientType, DietType, RDIDetail } from "../types";
import { Info, Leaf, HelpCircle, CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface DailyIntakeProps {
  initialDiet: DietType;
}

// ICMR 2020 Guidelines reference data
const rdiData: RDIDetail[] = [
  {
    nutrient: NutrientType.IRON,
    value: "19 - 29",
    unit: "mg",
    vegSourceNote: "Spinach, lentils, soybeans, amaranth. Plant-based non-heme iron requires Vitamin C to absorb.",
    veganSourceNote: "Beans, leafy greens, sesame seeds, quinoa. Always pair with lemon or citrus foods.",
    nonVegSourceNote: "Organ meats, mutton, fish, eggs. High absorption rate (heme iron).",
    icmrReference: "ICMR-NIN 2020: 19 mg/day for adult men, 29 mg/day for adult women (reproductive age)."
  },
  {
    nutrient: NutrientType.VITAMIN_D,
    value: "600",
    unit: "IU (15 mcg)",
    vegSourceNote: "Fortified milk, paneer, and direct exposure to natural sunlight.",
    veganSourceNote: "Direct natural sunlight exposure, UV-exposed mushrooms, and fortified plant milks.",
    nonVegSourceNote: "Fatty fish (salmon, mackerel), egg yolks, fortified foods, and natural sunlight.",
    icmrReference: "ICMR-NIN 2020: 600 IU (15 mcg) daily for healthy adults with outdoor exposure."
  },
  {
    nutrient: NutrientType.VITAMIN_B12,
    value: "2.2",
    unit: "mcg",
    vegSourceNote: "Milk, yogurt, cheese, and fortified cereals. Readily accessible in dairy products.",
    veganSourceNote: "Fortified yeast, fortified cereals, and plant milks. Food alone may be insufficient; medical consultation is highly encouraged.",
    nonVegSourceNote: "Meat, fish, poultry, eggs, and dairy products. Abundant in animal tissues.",
    icmrReference: "ICMR-NIN 2020: 2.2 mcg/day for normal men and women."
  },
  {
    nutrient: NutrientType.CALCIUM,
    value: "1000",
    unit: "mg",
    vegSourceNote: "Milk, paneer, curd, ragi (finger millet), sesame seeds, almonds.",
    veganSourceNote: "Ragi, sesame seeds (til), chia seeds, soy milk, broccoli, tofu.",
    nonVegSourceNote: "Dairy products, small fish with bones (e.g., sardines), eggs, sesame seeds.",
    icmrReference: "ICMR-NIN 2020: 1000 mg/day for all normal adult men and women."
  },
  {
    nutrient: NutrientType.FOLATE,
    value: "300",
    unit: "mcg",
    vegSourceNote: "Spinach, mustard greens, kidney beans (rajma), chickpeas (chana), beetroots.",
    veganSourceNote: "Bengal gram, leafy greens, oranges, asparagus, avocado, lentils.",
    nonVegSourceNote: "Liver, poultry, eggs, leafy vegetables, pulses.",
    icmrReference: "ICMR-NIN 2020: 300 mcg/day for normal adults. Pregnant women require up to 570 mcg/day."
  }
];

export default function DailyIntake({ initialDiet }: DailyIntakeProps) {
  const [diet, setDiet] = useState<DietType>(initialDiet);
  const [gender, setGender] = useState<"male" | "female">("female");

  const getDietSourceNote = (item: RDIDetail) => {
    if (diet === "vegan") return item.veganSourceNote;
    if (diet === "veg") return item.vegSourceNote;
    return item.nonVegSourceNote;
  };

  const getAdjustedRValue = (item: RDIDetail) => {
    if (item.nutrient === NutrientType.IRON) {
      return gender === "male" ? "19" : "29";
    }
    return item.value;
  };

  return (
    <div id="daily-intake-section" className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-xs">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
          Daily Intake Guidance
          <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full font-bold">
            ICMR Standards
          </span>
        </h2>
        <p className="text-slate-500 text-sm mt-1 leading-relaxed">
          Indian Council of Medical Research (ICMR) Recommended Daily Intake (RDI) for adult nutrition.
        </p>

        {/* Adjusting parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* Diet selector tab */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Diet Type
            </label>
            <div className="grid grid-cols-3 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
              {(["veg", "non-veg", "vegan"] as DietType[]).map((t) => (
                <button
                  key={t}
                  id={`rdi-diet-${t}`}
                  type="button"
                  onClick={() => setDiet(t)}
                  className={`py-2 px-3 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                    diet === t
                      ? "bg-green-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {t === "veg" ? "Veg" : t === "vegan" ? "Vegan" : "Non-Veg"}
                </button>
              ))}
            </div>
          </div>

          {/* Gender selector */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Biological sex (Relevant for Iron values)
            </label>
            <div className="grid grid-cols-2 bg-slate-50 p-1 rounded-xl border border-slate-200/60">
              <button
                id="rdi-gender-female"
                type="button"
                onClick={() => setGender("female")}
                className={`py-2 px-3 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                  gender === "female"
                    ? "bg-green-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Female
              </button>
              <button
                id="rdi-gender-male"
                type="button"
                onClick={() => setGender("male")}
                className={`py-2 px-3 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                  gender === "male"
                    ? "bg-green-600 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Male
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of RDI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rdiData.map((item, idx) => (
          <motion.div
            key={item.nutrient}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between hover:border-green-400 hover:shadow-xs transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">{item.nutrient}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-1 leading-snug">{item.icmrReference}</p>
                </div>
                <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-xl font-bold text-center shrink-0 border border-green-100">
                  <span className="text-xl leading-none">{getAdjustedRValue(item)}</span>
                  <span className="text-xs font-bold ml-0.5">{item.unit}</span>
                </div>
              </div>

              {/* Specific Source advice */}
              <div className="mt-5 space-y-3">
                <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Ideal Food Categories ({diet === "veg" ? "Vegetarian" : diet === "vegan" ? "Vegan" : "Non-Vegetarian"})
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans font-normal">
                    {getDietSourceNote(item)}
                  </p>
                </div>
              </div>
            </div>

            {/* Supplemental Alert for vegans on B12 or D */}
            {diet === "vegan" && (item.nutrient === NutrientType.VITAMIN_B12 || item.nutrient === NutrientType.VITAMIN_D) && (
              <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-2.5 flex gap-2 items-start text-yellow-900 text-[11px] leading-relaxed font-normal">
                <Info size={14} className="text-yellow-600 shrink-0 mt-0.5" />
                <span>
                  Food alone may not be sufficient on a strict vegan diet. Consider speaking to a physician about diagnostic tests and supplements.
                </span>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Advisory block */}
      <div className="bg-green-50/50 border border-green-100 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="bg-green-100 text-green-800 rounded-xl p-2.5 shrink-0">
          <HelpCircle size={22} className="text-green-700" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">Special notes on Indian Bioavailability</h4>
          <p className="text-xs text-slate-600 leading-relaxed mt-1 font-normal font-sans">
            Standard Indian diets are highly grain-based and rich in phytates (found in grain husks) and polyphenols (found in tea and coffee), which significantly inhibit non-heme iron and calcium absorption. To optimize uptake, always squeeze lemons onto food or accompany mineral-rich meals with Vitamin C, and keep tea or coffee separated by at least 1-2 hours from rich meals!
          </p>
        </div>
      </div>
    </div>
  );
}
