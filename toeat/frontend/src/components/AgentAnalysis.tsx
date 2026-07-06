/**
 * AgentAnalysis.tsx
 * Deficiency Coach — multi-step agent UI
 *
 * Calls /api/agent and renders each agent step transparently,
 * so judges can see the reasoning loop in action.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Loader } from "lucide-react";

interface AgentStep {
  step: number;
  name: string;
  description: string;
  output: any;
}

interface AgentResult {
  meal_description: string;
  agent_steps: AgentStep[];
  deficiency_risks: { nutrient: string; risk_level: string; reasoning: string }[];
  overall_risk: string;
  summary: string;
  suggestions: { action: string; food: string; emoji: string; targets: string[]; tip: string }[];
}

const RISK_COLOURS: Record<string, string> = {
  high:     "bg-red-50 border-red-200 text-red-700",
  moderate: "bg-amber-50 border-amber-200 text-amber-700",
  low:      "bg-green-50 border-green-200 text-green-700",
};

const RISK_BADGE: Record<string, string> = {
  high:     "bg-red-100 text-red-800",
  moderate: "bg-amber-100 text-amber-800",
  low:      "bg-green-100 text-green-800",
};

function StepCard({ step, index }: { step: AgentStep; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center shrink-0">
            {step.step}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">{step.name}</p>
            <p className="text-xs text-slate-500">{step.description}</p>
          </div>
        </div>
        {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              <StepOutput step={step} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepOutput({ step }: { step: AgentStep }) {
  const { output } = step;

  // Step 1: list of food strings
  if (step.step === 1 && Array.isArray(output)) {
    return (
      <div className="flex flex-wrap gap-2">
        {output.map((f: string) => (
          <span key={f} className="px-3 py-1 bg-green-50 border border-green-100 text-green-800 rounded-full text-xs font-semibold">
            {f}
          </span>
        ))}
      </div>
    );
  }

  // Step 2: USDA lookup results
  if (step.step === 2 && Array.isArray(output)) {
    return (
      <div className="space-y-2">
        {output.map((item: any) => (
          <div key={item.food} className="flex items-center gap-3 text-xs">
            {item.found
              ? <CheckCircle size={14} className="text-green-600 shrink-0" />
              : <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
            <span className="font-semibold text-slate-700">{item.food}</span>
            {item.found
              ? <span className="text-slate-400">→ {item.matched_to}</span>
              : <span className="text-amber-600">not found in USDA</span>}
          </div>
        ))}
      </div>
    );
  }

  // Step 3: risk analysis
  if (step.step === 3 && output?.deficiency_risks) {
    return (
      <div className="space-y-2">
        {output.deficiency_risks.map((r: any) => (
          <div key={r.nutrient} className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${RISK_COLOURS[r.risk_level] || "bg-slate-50 border-slate-200"}`}>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${RISK_BADGE[r.risk_level] || "bg-slate-100 text-slate-600"}`}>
              {r.risk_level}
            </span>
            <div>
              <span className="font-bold">{r.nutrient}</span>
              <p className="mt-0.5 opacity-80">{r.reasoning}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Step 4: suggestions
  if (step.step === 4 && Array.isArray(output)) {
    if (output.length === 0) {
      return <p className="text-xs text-green-700 font-semibold">✓ No critical gaps found — your diet looks well-balanced!</p>;
    }
    return (
      <div className="space-y-3">
        {output.map((s: any, i: number) => (
          <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-2xl shrink-0">{s.emoji}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{s.action}</span>
                <span className="text-sm font-bold text-slate-800">{s.food}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Helps: {s.targets?.join(", ")}</p>
              <p className="text-xs text-slate-600 mt-1">{s.tip}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <pre className="text-xs text-slate-500 overflow-auto">{JSON.stringify(output, null, 2)}</pre>;
}

export default function AgentAnalysis() {
  const [meal, setMeal] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "";

  const runAgent = async () => {
    if (!meal.trim()) return;
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const r = await fetch(`${API_URL}/api/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meal_description: meal }),
      });
      if (!r.ok) throw new Error("Agent request failed");
      const data = await r.json();
      setResult(data);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center">
            <Sparkles size={20} className="text-green-700" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Deficiency Coach</h2>
            <p className="text-xs text-slate-500">Describe your typical daily meals — the agent analyses your nutrient gaps</p>
          </div>
        </div>

        <textarea
          value={meal}
          onChange={e => setMeal(e.target.value)}
          placeholder="e.g. I usually eat dal, roti, spinach sabzi, curd, and an apple daily..."
          className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-slate-400"
          rows={3}
          maxLength={300}
        />

        <button
          type="button"
          onClick={runAgent}
          disabled={loading || !meal.trim()}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-3 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader size={16} className="animate-spin" /> Analysing with Agent...</>
          ) : (
            <><Sparkles size={16} /> Analyse My Diet</>
          )}
        </button>

        {error && <p className="text-xs text-red-600 text-center">{error}</p>}
      </div>

      {/* Agent Steps */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Summary banner */}
          <div className={`p-5 rounded-2xl border ${RISK_COLOURS[result.overall_risk] || "bg-slate-50 border-slate-200"}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${RISK_BADGE[result.overall_risk] || "bg-slate-100"}`}>
                {result.overall_risk} risk
              </span>
              <span className="text-xs font-bold text-slate-700">Overall Assessment</span>
            </div>
            <p className="text-sm text-slate-700">{result.summary}</p>
          </div>

          {/* Step-by-step transparency */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Agent Reasoning Steps</p>
            <div className="space-y-3">
              {result.agent_steps.map((step, i) => (
                <StepCard key={step.step} step={step} index={i} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
