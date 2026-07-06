/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Sparkles, AlertCircle, HeartCrack, Layers } from "lucide-react";
import { FoodItem } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface FoodDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  food: {
    name: string;
    emoji: string;
    nutrient_content: string;
    reason: string;
    bioavailability_tip?: string;
    blockers?: string;
    usdaNutrients?: { name: string; value: number; unit: string }[];
    deficienciesHelped?: { nutrient: string; explanation: string }[];
  } | null;
}

export default function FoodDetailModal({ isOpen, onClose, food }: FoodDetailModalProps) {
  if (!isOpen || !food) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.4 }}
          className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 z-10 flex flex-col max-h-[90vh]"
        >
          {/* Top header with large emoji */}
          <div className="bg-green-50/50 p-6 flex items-start justify-between border-b border-green-100/30">
            <div className="flex gap-4 items-center">
              <span className="text-5xl shrink-0 pointer-events-none select-none" role="img" aria-label={food.name}>
                {food.emoji || "🥗"}
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-tight">
                  {food.name}
                </h3>
                <span className="inline-block mt-1 text-xs text-green-800 bg-green-100/70 border border-green-100 px-2.5 py-1 rounded-full font-bold">
                  {food.nutrient_content || "Nutrient-Dense"}
                </span>
              </div>
            </div>
            <button
              id="close-modal-btn"
              type="button"
              onClick={onClose}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 p-2 rounded-full shadow-xs transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-6">
            {/* Deficiency context / why it helps */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers size={14} className="text-green-600" />
                Why It Helps Deficiencies
              </h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200/60 font-sans font-normal">
                {food.reason}
              </p>
            </div>

            {/* Render direct USDA Nutrition details if present */}
            {food.usdaNutrients && food.usdaNutrients.filter(n => n.value > 0).length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Key Nutrient Content (Per 100g)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {food.usdaNutrients.map((nut) => (
                    <div
                      key={nut.name}
                      className={`p-3 rounded-2xl border flex justify-between items-center ${
                        nut.value > 0
                          ? "bg-green-50/30 border-green-100/50 text-green-900"
                          : "bg-slate-50/50 border-slate-200/60 text-slate-400"
                      }`}
                    >
                      <span className="text-xs font-bold text-slate-700">{nut.name}</span>
                      <span className={`text-xs font-bold ${nut.value > 0 ? "text-green-700 font-mono" : "text-slate-400"}`}>
                        {nut.value > 0 ? `${nut.value} ${nut.unit}` : "0 / Low"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* List of deficiencies helped explicitly if passed */}
            {food.deficienciesHelped && food.deficienciesHelped.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Contribution Profiles
                </h4>
                <div className="space-y-2.5">
                  {food.deficienciesHelped.map((def) => (
                    <div key={def.nutrient} className="bg-green-50/10 border border-green-100/40 rounded-2xl p-3.5 space-y-1">
                      <span className="text-xs font-bold text-green-800 flex items-center gap-1">
                        ✦ {def.nutrient} Contribution
                      </span>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans font-normal">
                        {def.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bioavailability guidance */}
            {food.bioavailability_tip && (
              <div className="bg-green-50/50 border border-green-100/60 p-4 rounded-2xl flex gap-3">
                <Sparkles size={20} className="text-green-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-green-900 block">
                    Bioavailability Tip (Uptake Booster)
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {food.bioavailability_tip}
                  </p>
                </div>
              </div>
            )}

            {/* Blockers guidance (framed politely and constructively) */}
            <div className="bg-amber-50/40 border border-amber-100 p-4 rounded-2xl flex gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-semibold text-amber-900 block">
                  Optimized Timing & Blockers
                </span>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {food.blockers || "Keep this food spaced by 1 hour from polyphenols (strong teas, dark roast coffee) or high calcium supplements to ensure uninhibited natural adsorption."}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom disclaimer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 leading-tight">
              Values parsed from USDA FoodData Central and expert Gemini models. Ensure nutritional pairings align with your physical requirements or medical guidelines.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
