import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getPendingPlans, updatePlan, type Plan } from "../lib/storage";

export function MentorReview() {
  const [pendingPlans, setPendingPlans] = useState<Plan[]>([]);

  const refreshPlans = () => {
    setPendingPlans(getPendingPlans());
  };

  useEffect(() => {
    refreshPlans();
  }, []);

  const handleReview = async (planId: string, status: "approved" | "rejected") => {
    try {
      updatePlan(planId, {
        status,
        reviewedBy: "demo-mentor",
        reviewedAt: Date.now(),
      });
      refreshPlans();
      toast.success(`Plan ${status} successfully`);
    } catch (error) {
      toast.error("Failed to review plan");
    }
  };

  if (!pendingPlans.length) {
    return (
      <div className="text-center text-gray-400 mt-8">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
        No plans pending review.
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {pendingPlans.map((plan) => (
        <div key={plan._id} className="card">
          <div className="p-4 flex-1">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg text-coral-400 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Plan from {plan.ownerAddress.slice(0, 8)}...
              </h3>
              <span className="badge badge-pending flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pending
              </span>
            </div>
            <p className="text-sm text-turquoise-400 font-mono break-all flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              {plan.hash.slice(0, 20)}...
            </p>
          </div>
          <div className="p-4 border-t border-gray-700/50 flex gap-2">
            <button
              onClick={() => handleReview(plan._id, "rejected")}
              className="flex-1 px-4 py-2 border-2 border-coral-500 text-coral-400 rounded-md
                       hover:bg-coral-500/10 transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
            <button
              onClick={() => handleReview(plan._id, "approved")}
              className="flex-1 px-4 py-2 bg-lime-400 text-gray-900 rounded-md font-semibold
                       hover:bg-lime-300 transition-colors duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Approve
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
