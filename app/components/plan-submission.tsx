import { useState } from "react";
import { toast } from "sonner";
import { createPlan } from "../lib/storage";

export function PlanSubmission({ 
  vaultId,
  onPlanSubmitted
}: { 
  vaultId: string;
  onPlanSubmitted: () => void;
}) {
  const [plan, setPlan] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const calculateHash = async (text: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plan.trim()) {
      toast.error("Please enter a plan");
      return;
    }

    try {
      const hash = await calculateHash(plan);
      createPlan({
        vaultId,
        ownerAddress: "demo-address",
        hash,
        status: "pending",
      });
      toast.success("Plan submitted successfully!");
      setPlan("");
      setIsExpanded(false);
      onPlanSubmitted();
    } catch (error) {
      toast.error("Failed to submit plan");
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="btn-secondary w-full flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Submit New Plan
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-turquoise-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Submit Plan
        </h3>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            rows={4}
            className="input-primary w-full"
            placeholder="Enter your plan here..."
          />
        </div>
        <button type="submit" className="btn-secondary w-full flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Submit Plan
        </button>
      </form>
    </div>
  );
}
