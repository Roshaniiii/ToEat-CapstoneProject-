/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { NutrientType, DietType, FoodItem, DeficiencyGuidance, SearchResult } from "./types";
import DailyIntake from "./components/DailyIntake";
import FoodDetailModal from "./components/FoodDetailModal";
import AgentAnalysis from "./components/AgentAnalysis";
import {
  Sparkles,
  Search,
  BookOpen,
  Apple,
  Info,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  Flame,
  ArrowLeft,
  ChevronDown,
  Bot
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Pre-defined detailed descriptions for the 5 selected deficiencies
const deficienciesConfig = [
  {
    type: NutrientType.IRON,
    emoji: "🩸",
    title: "Iron",
    sub: "Fe Deficiency",
    desc: "Essential for producing hemoglobin, which carries oxygen throughout your red blood cells.",
    commonSymptoms: "Chronic fatigue, pale skin, cold hands/feet, brittle nails, weakness."
  },
  {
    type: NutrientType.VITAMIN_D,
    emoji: "☀️",
    title: "Vitamin D",
    sub: "Calciferol Deficiency",
    desc: "Crucial for optimal calcium absorption, keeping bones, teeth, and immune function strong.",
    commonSymptoms: "Bone pain, muscle cramps, regular infections, sluggish energy."
  },
  {
    type: NutrientType.VITAMIN_B12,
    emoji: "🧠",
    title: "Vitamin B12",
    sub: "Cobalamin Deficiency",
    desc: "Vital for neurological system maintenance, nerve health, and healthy red blood cell counts.",
    commonSymptoms: "Numbness or tingling in limbs, mental fog, sore tongue, balance issues."
  },
  {
    type: NutrientType.CALCIUM,
    emoji: "🦴",
    title: "Calcium",
    sub: "Ca Deficiency",
    desc: "The critical mineral foundation for skeletal integrity, muscle contractions, and nerve signaling.",
    commonSymptoms: "Muscle spasms, weak teeth, brittle bones, numbness in fingers."
  },
  {
    type: NutrientType.FOLATE,
    emoji: "🍃",
    title: "Folate",
    sub: "Vit B9 Deficiency",
    desc: "Required for cellular division, amino acid synthesis, and healthy prenatal fetal growth.",
    commonSymptoms: "Mouth sores, fatigue, gray hair, poor concentration, digestive changes."
  }
];

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<"guide" | "intake" | "agent">("guide");
  const [currentFlow, setCurrentFlow] = useState<"none" | "deficiency" | "search">("none");

  // Core state
  const [selectedDeficiency, setSelectedDeficiency] = useState<NutrientType | null>(null);
  const [diet, setDiet] = useState<DietType>("veg");
  const [guidanceLoading, setGuidanceLoading] = useState(false);
  const [guidanceResult, setGuidanceResult] = useState<DeficiencyGuidance | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);

  // Modal / Detail state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalFood, setModalFood] = useState<any | null>(null);

  // Fetch deficiency guidance
  const fetchGuidance = async (def: NutrientType) => {
    setSelectedDeficiency(def);
    setGuidanceLoading(true);
    setGuidanceResult(null);
    setCurrentFlow("deficiency");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/deficiency`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deficiency: def, diet }),
      });

      if (!response.ok) {
        throw new Error("Failed to load guidance");
      }

      const resData = await response.json();
      setGuidanceResult(resData);
    } catch (err) {
      console.error(err);
    } finally {
      setGuidanceLoading(false);
    }
  };

  // Run food search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchResult(null);
    setCurrentFlow("search");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSearchLoading(false);
    }
  };

  // Open modal for a card item
  const openFoodDetail = (food: FoodItem, defContext?: string) => {
    setModalFood({
      name: food.name,
      emoji: food.emoji,
      nutrient_content: food.nutrient_content,
      reason: food.reason,
      bioavailability_tip: food.bioavailability_tip,
      blockers: food.blockers
    });
    setIsModalOpen(true);
  };

  // Open modal directly from search result helper
  const openSearchResultDetail = () => {
    if (!searchResult) return;
    setModalFood({
      name: searchResult.name,
      emoji: searchResult.emoji,
      nutrient_content: "Direct USDA Analyzed",
      reason: `This food is analyzed using standard USDA measurements. Below are the values for the 5 target micro-nutrients.`,
      bioavailability_tip: searchResult.bioavailability_tip,
      blockers: searchResult.absorption_blockers,
      usdaNutrients: searchResult.usdaData?.nutrients,
      deficienciesHelped: searchResult.deficiencies_helped.map(d => ({
        nutrient: d.nutrient,
        explanation: d.explanation
      }))
    });
    setIsModalOpen(true);
  };

  const handleBackToLanding = () => {
    setCurrentFlow("none");
    setSelectedDeficiency(null);
    setGuidanceResult(null);
    setSearchResult(null);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-green-100 selection:text-green-800 antialiased text-slate-800">
      {/* HEADER NAV BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100/90 shadow-xs backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBackToLanding}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
          >
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800 flex items-center">
              ToEat
              <span className="text-green-600 font-extrabold text-lg">.</span>
            </span>
          </button>

          {/* Navigation links matching Design template */}
          <nav className="flex gap-6 text-sm font-semibold text-slate-500">
            <button
              type="button"
              onClick={() => {
                setCurrentTab("guide");
                handleBackToLanding();
              }}
              className={`pb-1 transition-all cursor-pointer ${
                currentTab === "guide" && currentFlow === "none"
                  ? "text-green-600 border-b-2 border-green-600"
                  : "hover:text-slate-800"
              }`}
            >
              Check Deficiency
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentTab("guide");
                setCurrentFlow("none");
                setTimeout(() => {
                  const element = document.getElementById("search-input");
                  if (element) element.focus();
                }, 100);
              }}
              className={`pb-1 transition-all cursor-pointer ${
                currentFlow === "search" ? "text-green-600 border-b-2 border-green-600" : "hover:text-slate-800"
              }`}
            >
              Search Food
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("intake")}
              className={`pb-1 transition-all cursor-pointer ${
                currentTab === "intake" ? "text-green-600 border-b-2 border-green-600" : "hover:text-slate-800"
              }`}
            >
              Daily Intake (RDI)
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab("agent")}
              className={`pb-1 transition-all cursor-pointer flex items-center gap-1 ${
                currentTab === "agent" ? "text-green-600 border-b-2 border-green-600" : "hover:text-slate-800"
              }`}
            >
              <Bot size={14} /> Coach Agent
            </button>
          </nav>
        </div>
      </header>

      {/* CORE WRAPPER */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 pb-24">
        {currentTab === "agent" ? (
          <AgentAnalysis />
        ) : currentTab === "guide" ? (
          <div>
            {currentFlow === "none" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col lg:flex-row gap-12 items-start"
              >
                {/* Left Column: Settings & Hero */}
                <div className="w-full lg:w-1/3 flex flex-col justify-between space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                        Smart Nutrition
                      </span>
                      <h1 className="text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
                        Know exactly <br className="hidden lg:inline" /> what to eat.
                      </h1>
                      <p className="text-slate-500 text-base leading-relaxed">
                        Personalized clinical deficiency guidance. Zero tracking, zero calorie counting—pure nutrient fixing based on scientific standards.
                      </p>
                    </div>

                    {/* Diet Toggle */}
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Your Diet Preference
                      </span>
                      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/60 shadow-xs">
                        {(["veg", "non-veg", "vegan"] as DietType[]).map((t) => (
                          <button
                            key={t}
                            id={`diet-selector-${t}`}
                            type="button"
                            onClick={() => setDiet(t)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                              diet === t
                                ? "bg-green-600 text-white shadow-sm"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            {t === "veg" ? "Veg" : t === "vegan" ? "Vegan" : "Non-Veg"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Featured Search Entry Card */}
                  <div className="p-6 bg-green-50/70 border border-green-100 rounded-2xl relative overflow-hidden shadow-xs">
                    <div className="relative z-10 space-y-3">
                      <h3 className="text-green-800 font-bold text-sm tracking-tight flex items-center gap-1.5">
                        <Search size={16} />
                        Quick Search Any Food
                      </h3>
                      <form onSubmit={handleSearchSubmit} className="flex gap-2">
                        <input
                          id="search-input"
                          type="text"
                          placeholder="Search e.g. Spinach, salmon"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="flex-1 bg-white text-xs border border-green-200/80 rounded-xl px-3 py-2.5 focus:outline-none focus:border-green-500 font-sans shadow-xs text-slate-800 placeholder-slate-400"
                        />
                        <button
                          id="search-submit-btn"
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Find
                        </button>
                      </form>
                      <p className="text-[10px] text-green-700/70">
                        Checks USDA FoodData Central & explains absorption helpers
                      </p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-green-100 rounded-full opacity-40"></div>
                  </div>
                </div>

                {/* Right Column: Deficiency Selector Cards */}
                <div className="w-full lg:w-2/3 flex flex-col space-y-4">
                  <div className="flex justify-between items-end">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Select a Deficiency</h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Deficiency Cards 1 to 4 */}
                    {deficienciesConfig.slice(0, 4).map((def) => {
                      const bgColors = {
                        [NutrientType.IRON]: "bg-red-50 text-red-600",
                        [NutrientType.VITAMIN_D]: "bg-amber-50 text-amber-600",
                        [NutrientType.VITAMIN_B12]: "bg-blue-50 text-blue-600",
                        [NutrientType.CALCIUM]: "bg-slate-50 text-slate-600",
                        [NutrientType.FOLATE]: "bg-green-50 text-green-600"
                      };

                      return (
                        <motion.button
                          key={def.type}
                          id={`btn-deficiency-${def.type.toLowerCase().replace(" ", "-")}`}
                          onClick={() => fetchGuidance(def.type)}
                          whileHover={{ y: -3 }}
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                          className="group bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-green-400 hover:shadow-md transition-all cursor-pointer text-left flex flex-col justify-between h-48 relative overflow-hidden"
                        >
                          <div>
                            <div className={`w-12 h-12 ${bgColors[def.type]} rounded-xl flex items-center justify-center mb-4 text-2xl shadow-xs`}>
                              {def.emoji}
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-1 tracking-tight group-hover:text-green-600 transition-colors">
                              {def.title}
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed font-sans font-normal">
                              {def.desc}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block mt-2">
                            Check Foods →
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Highlights Folate as clean horizontal ribbon selector matching Design template */}
                  {deficienciesConfig.slice(4, 5).map((def) => (
                    <motion.button
                      key={def.type}
                      id={`btn-deficiency-${def.type.toLowerCase().replace(" ", "-")}`}
                      onClick={() => fetchGuidance(def.type)}
                      whileHover={{ scale: 1.01 }}
                      className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs hover:border-green-400 hover:shadow-md cursor-pointer transition-all text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl shadow-xs">
                          {def.emoji}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 tracking-tight">{def.title} (B9)</h4>
                          <p className="text-xs text-slate-500 font-normal mt-0.5">{def.desc}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100 shrink-0">
                        Check Foods
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* FLOW A - DEFICIENCY RESULTS DISPLAY */}
            {currentFlow === "deficiency" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBackToLanding}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs font-semibold bg-white border border-slate-200/70 rounded-full px-4 py-2 shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Back to Selector
                </button>

                {/* Loading State */}
                {guidanceLoading && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <RefreshCw className="animate-spin text-green-600" size={32} />
                    <p className="text-slate-500 font-semibold text-xs">Curating nutritional guidance using Gemini...</p>
                  </div>
                )}

                {/* Guidance content loaded */}
                {!guidanceLoading && guidanceResult && (
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                            {deficienciesConfig.find(d => d.type === guidanceResult.deficiency)?.emoji}
                          </span>
                          <div>
                            <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                              {guidanceResult.deficiency} Guide
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">Standard clinical nutrition profiles</p>
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-xl font-sans font-normal pt-2">
                          {deficienciesConfig.find(d => d.type === guidanceResult.deficiency)?.desc}
                        </p>
                      </div>

                      <div className="bg-green-50/70 border border-green-100 rounded-2xl px-5 py-4 shrink-0 flex flex-col justify-center text-center">
                        <span className="text-[10px] text-green-700 uppercase tracking-widest font-bold">Filtered Diet</span>
                        <span className="text-sm font-black text-green-800 mt-1 capitalize">
                          {guidanceResult.diet === "veg" ? "Pure Veg" : guidanceResult.diet === "vegan" ? "Vegan" : "Non-Veg"}
                        </span>
                      </div>
                    </div>

                    {/* Vegan Alert Banner */}
                    {guidanceResult.specialNote && (
                      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-4 flex gap-3 text-yellow-900">
                        <AlertTriangle size={20} className="text-yellow-600 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-extrabold text-yellow-950">System Suggestion</h4>
                          <p className="text-xs leading-relaxed font-sans mt-0.5 font-normal">
                            {guidanceResult.specialNote}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bioavailability Key Tip */}
                    <div className="bg-green-50/80 border border-green-100 rounded-2xl p-5 flex gap-3 items-center">
                      <div className="bg-green-100 text-green-800 rounded-xl p-2 shrink-0">
                        <Sparkles size={20} className="text-green-700" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-green-900 uppercase tracking-wide">Optimal Food Synergy</h4>
                        <p className="text-xs text-green-800 leading-relaxed font-semibold mt-0.5">
                          {guidanceResult.tip}
                        </p>
                      </div>
                    </div>

                    {/* Lists Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* RECOMMENDED list */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-green-800 uppercase tracking-widest flex items-center gap-1.5">
                            ✅ Recommended Foods To Eat
                          </h3>
                          <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-bold">
                            Booster
                          </span>
                        </div>

                        <div className="space-y-3">
                          {guidanceResult.recommended.map((food, i) => (
                            <motion.button
                              key={food.name + i}
                              type="button"
                              onClick={() => openFoodDetail(food)}
                              whileHover={{ scale: 1.01 }}
                              className="w-full text-left bg-white border border-slate-200/80 hover:border-green-400 p-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex gap-3 items-start"
                            >
                              <span className="text-2xl shrink-0 pointer-events-none select-none">{food.emoji || "🥗"}</span>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">{food.name}</h4>
                                  <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-semibold font-mono">
                                    {food.nutrient_content}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-2">
                                  {food.reason}
                                </p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* LIMIT list */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold text-amber-800 uppercase tracking-widest flex items-center gap-1.5">
                            ❌ Timing & Absorption Blockers
                          </h3>
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                            Timing
                          </span>
                        </div>

                        <div className="space-y-3">
                          {guidanceResult.limit.map((food, i) => (
                            <motion.button
                              key={food.name + i}
                              type="button"
                              onClick={() => openFoodDetail(food)}
                              whileHover={{ scale: 1.01 }}
                              className="w-full text-left bg-white border border-slate-200/80 hover:border-amber-400 p-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex gap-3 items-start"
                            >
                              <span className="text-2xl shrink-0 pointer-events-none select-none">{food.emoji || "☕"}</span>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-slate-800 tracking-tight">{food.name}</h4>
                                  <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold font-mono">
                                    {food.nutrient_content || "Absorption Block"}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed font-sans line-clamp-2">
                                  {food.reason}
                                </p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* FLOW B - DIRECT SEARCH RESULTS */}
            {currentFlow === "search" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleBackToLanding}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs font-semibold bg-white border border-slate-200/80 rounded-full px-4 py-2 shadow-xs transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  Back to Selector
                </button>

                {/* Loading Spinner */}
                {searchLoading && (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <RefreshCw className="animate-spin text-green-600" size={32} />
                    <p className="text-slate-500 font-semibold text-xs">Querying USDA Databases & Mapping Bio-Values...</p>
                  </div>
                )}

                {/* Loaded Output */}
                {!searchLoading && searchResult && (
                  <div className="space-y-6">
                    {/* Scenario 1: Food found successfully */}
                    {searchResult.found ? (
                      <div className="space-y-6">
                        {/* Summary Header */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm">
                          <div className="flex items-start justify-between flex-wrap gap-4">
                            <div className="flex gap-4 items-center">
                              <span className="text-5xl shrink-0 pointer-events-none select-none">{searchResult.emoji || "🥑"}</span>
                              <div>
                                <span className="text-[10px] text-green-700 bg-green-50 border border-green-100 px-3 py-1 rounded-full font-bold">
                                  USDA Matches Found
                                </span>
                                <h2 className="text-xl font-bold text-slate-800 tracking-tight leading-snug mt-1.5 truncate max-w-sm">
                                  {searchResult.name}
                                </h2>
                              </div>
                            </div>

                            <button
                              id="search-view-details-btn"
                              type="button"
                              onClick={openSearchResultDetail}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-green-700 shadow-sm transition-all cursor-pointer"
                            >
                              View Bioavailability Details
                            </button>
                          </div>

                          {/* Quick nutrient summary pills */}
                          {searchResult.usdaData && (
                            <div className="mt-6 border-t border-slate-100 pt-5 space-y-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                                Raw Nutrients Identified per 100g
                              </span>
                              <div className="flex flex-wrap gap-2.5">
                                {searchResult.usdaData.nutrients.map((n) => (
                                  <div
                                    key={n.name}
                                    className={`px-3 py-1.5 rounded-xl text-xs border ${
                                      n.value > 0
                                        ? "bg-slate-50 border-slate-200 text-slate-800 font-semibold"
                                        : "bg-slate-50/40 border-slate-100 text-slate-400 font-normal"
                                    }`}
                                  >
                                    <span className="font-semibold">{n.name}</span>:{" "}
                                    {n.value > 0 ? `${n.value} ${n.unit}` : "None"}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Deficiencies Addressed Explanation */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Deficiency-Solving Capability
                          </h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {searchResult.deficiencies_helped.map((def) => (
                              <div
                                key={def.nutrient}
                                className={`p-5 rounded-2xl border transition-all ${
                                  def.hasSignificantAmount
                                    ? "bg-green-50/20 border-green-100/50 text-green-900"
                                    : "bg-white border-slate-200 text-slate-500"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-slate-800">
                                    {def.nutrient}
                                  </span>
                                  {def.hasSignificantAmount ? (
                                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                                      High Concentration
                                    </span>
                                  ) : (
                                    <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                                      Trace / Low
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-600 mt-2 leading-relaxed font-sans font-normal">
                                  {def.explanation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Bioavailability Block */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Bioavailability suggestion */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-xs">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                              Optimized Bioavailability
                            </span>
                            <p className="text-xs text-slate-600 leading-relaxed font-normal font-sans">
                              {searchResult.bioavailability_tip}
                            </p>
                          </div>

                          {/* Enhancers and Blockers */}
                          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                            <div>
                              <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest block">
                                Optimal Enhancement Pairs
                              </span>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-sans">
                                {searchResult.absorption_enhancers || "Pair with ascorbic acids (citrus, parsley) during dietary intakes."}
                              </p>
                            </div>
                            <div className="border-t border-slate-100 pt-2">
                              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block">
                                Avoid Simultaneously
                              </span>
                              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-sans">
                                {searchResult.absorption_blockers || "Do not wash down with black tea, espresso, or highly concentrated mineral supplements."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Scenario 2: Food not found inside USDA databases */
                      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm text-center max-w-lg mx-auto space-y-4">
                        <div className="bg-amber-50 text-amber-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                          <AlertTriangle size={32} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-slate-800">No Full Data Match Found</h3>
                          <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-sm mx-auto">
                            {searchResult.fallback_message}
                          </p>
                        </div>
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSearchQuery("");
                              setCurrentFlow("none");
                            }}
                            className="text-xs text-green-700 bg-green-50 hover:bg-green-100 px-4 py-2 rounded-xl transition-all font-semibold border border-green-100"
                          >
                            Try Another Term
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        ) : (
          /* TAB B - STATIC/EDUCATIONAL RDI CONTENT */
          <DailyIntake initialDiet={diet} />
        )}
        {/* Agent tab rendered above via early return */}
      </main>

      {/* FOOTER BAR WITH INTEGRATED DISCLAIMER AND ACTIONS */}
      <footer className="mt-auto px-8 py-6 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 pb-28 md:pb-6">
        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shrink-0"></span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              API Connected: ICMR Standards
            </span>
          </div>
          <p className="text-[10px] text-slate-400 max-w-[600px] leading-relaxed italic">
            <strong>Medical Disclaimer:</strong> This app is for informational purposes only and is not a substitute for professional medical advice. Always speak with a physician or healthcare specialist before changing diets or taking supplements.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              setCurrentTab("intake");
              const el = document.getElementById("daily-intake-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors rounded-full cursor-pointer"
          >
            Standards
          </button>
        </div>
      </footer>
    </div>
  );

}
