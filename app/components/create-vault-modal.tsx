import { useState } from "react";
import { toast } from "sonner";
import { createVault, TOKENS, type TokenInfo } from "../lib/storage";

export function CreateVaultModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"solo" | "mentor">("solo");
  const [mentorAddress, setMentorAddress] = useState("");
  const [cooldownPeriod, setCooldownPeriod] = useState(24);
  const [balance, setBalance] = useState(0);
  const [selectedToken, setSelectedToken] = useState<TokenInfo>(TOKENS[0]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (mode === "mentor" && !mentorAddress) {
        toast.error("Mentor address is required for mentor mode");
        return;
      }
      if (balance <= 0) {
        toast.error("Please enter a valid deposit amount");
        return;
      }

      createVault({
        ownerAddress: "demo-address",
        mentorAddress: mode === "mentor" ? mentorAddress : undefined,
        cooldownPeriod: cooldownPeriod * 3600000,
        balance,
        token: selectedToken,
        mode,
        status: "active",
      });

      toast.success("Vault created successfully!");
      setMode("solo");
      setMentorAddress("");
      setCooldownPeriod(24);
      setBalance(0);
      setSelectedToken(TOKENS[0]);
      onClose();
    } catch (error) {
      toast.error("Failed to create vault");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Create New Vault</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Vault Mode
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setMode("solo")}
                className={`flex-1 px-4 py-2 rounded-md ${
                  mode === "solo"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                Solo Mode
              </button>
              <button
                type="button"
                onClick={() => setMode("mentor")}
                className={`flex-1 px-4 py-2 rounded-md ${
                  mode === "mentor"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-700 text-gray-300"
                }`}
              >
                Mentor Mode
              </button>
            </div>
          </div>

          {mode === "mentor" && (
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Mentor Address
              </label>
              <input
                type="text"
                value={mentorAddress}
                onChange={(e) => setMentorAddress(e.target.value)}
                className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Token
            </label>
            <div className="grid grid-cols-2 gap-2">
              {TOKENS.map((token) => (
                <button
                  key={token.address}
                  type="button"
                  onClick={() => setSelectedToken(token)}
                  className={`px-4 py-2 rounded-md flex items-center justify-center ${
                    selectedToken.symbol === token.symbol
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {token.symbol}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Deposit Amount ({selectedToken.symbol})
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              min="0"
              step={1 / Math.pow(10, selectedToken.decimals)}
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Cooldown Period (hours)
            </label>
            <input
              type="number"
              value={cooldownPeriod}
              onChange={(e) => setCooldownPeriod(Number(e.target.value))}
              min="1"
              className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-600 rounded-md hover:bg-gray-700 text-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
