import { useState, useEffect } from "react";
import { getVaultsByOwner, type Vault } from "../lib/storage";
import { PlanSubmission } from "./plan-submission";

export function VaultList() {
  const [vaults, setVaults] = useState<Vault[]>([]);

  const refreshVaults = () => {
    setVaults(getVaultsByOwner("demo-address"));
  };

  useEffect(() => {
    refreshVaults();
  }, []);

  if (!vaults.length) {
    return (
      <div className="text-center text-gray-400 mt-8">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        No vaults found. Create one to get started!
      </div>
    );
  }

  const formatBalance = (balance: number, decimals: number) => {
    return balance.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {vaults.map((vault) => (
        <div key={vault._id} className="card flex flex-col">
          <div className="p-4 flex-1">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-bold text-lg text-coral-400 flex items-center gap-2">
                  {vault.mode === "mentor" ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                  {vault.mode === "mentor" ? "Mentor" : "Solo"} Vault
                </h3>
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Created {new Date(vault.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className="badge badge-success flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {vault.status}
              </span>
            </div>
            <div className="space-y-2 text-sm text-gray-400">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Balance:
                </span>
                <span className="font-medium text-turquoise-400">
                  {formatBalance(vault.balance, vault.token.decimals)} {vault.token.symbol}
                </span>
              </div>
              {vault.mentorAddress && (
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Mentor:
                  </span>
                  <span className="font-mono text-lime-400">
                    {vault.mentorAddress.slice(0, 8)}...
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cooldown:
                </span>
                <span className="text-coral-400">
                  {Math.round(vault.cooldownPeriod / 3600000)} hours
                </span>
              </div>
            </div>
          </div>
          <div className="p-4 mt-auto border-t border-gray-700/50">
            <PlanSubmission vaultId={vault._id} onPlanSubmitted={refreshVaults} />
          </div>
        </div>
      ))}
    </div>
  );
}
