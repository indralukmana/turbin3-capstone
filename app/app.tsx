import { Toaster } from "sonner";
import { useState } from "react";
import { CreateVaultModal } from "./components/create-vault-modal";
import { VaultList } from "./components/vault-list";
import { MentorReview } from "./components/mentor-review";

export default function App() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isMentorView, setIsMentorView] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-surface-900 text-gray-100">
      <header className="sticky top-0 z-10 bg-surface-800/80 backdrop-blur-sm p-4 flex justify-between items-center border-b border-surface-700/50">
        <h2 className="text-xl font-black text-primary-300 hover:text-primary-200 transition-colors">
          CommitVault
        </h2>
        <div className="flex gap-4 items-center">
          {!isMentorView && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="btn-primary animate-float"
            >
              Create New Vault
            </button>
          )}
          <button
            onClick={() => setIsMentorView(!isMentorView)}
            className="btn-outline"
          >
            {isMentorView ? "Switch to User View" : "Switch to Mentor View"}
          </button>
        </div>
      </header>
      <main className="flex-1 p-8">
        <div className="w-full max-w-6xl mx-auto">
          <h1 className="text-4xl font-black mb-8">
            {isMentorView ? "Mentor Dashboard" : "Your Vaults"}
          </h1>
          {!isMentorView ? <VaultList /> : <MentorReview />}
        </div>
      </main>
      <CreateVaultModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <Toaster 
        theme="dark" 
        toastOptions={{
          className: "!bg-surface-800 !border !border-surface-700/50",
        }}
      />
    </div>
  );
}
