# Project Brief: CommitVault

## What is CommitVault? (The Gist & Purpose)

CommitVault is a Solana-based dApp designed to introduce a layer of **behavioral
accountability and intentionality** for users deploying capital on-chain.
Instead of immediate, potentially impulsive transactions, CommitVault requires
users to:

- **Lock funds** (USDC/SOL) into a personal, program-controlled vault.
- **Commit to an investment plan.** The detailed plan is stored off-chain for
  flexibility and cost, while its cryptographic hash is stored on-chain for
  verification.
- **Adhere to a chosen unlock strategy:**
  - **Solo Mode:** A self-imposed time-based cooldown period must pass after
    plan submission before funds can be withdrawn. This enforces emotional
    distance.
  - **Mentor Mode:** An assigned mentor must review the user's plan (off-chain)
    and provide an on-chain approval (via signature) before funds can be
    withdrawn. This adds a layer of social accountability and expert guidance.

The core idea is to bridge the gap between DeFi's rapid execution and the
psychological need for discipline and planning in financial decisions, thereby
aiming to reduce impulsive trading and foster more thoughtful capital
deployment.

## Problem It Solves

- **Impulsive Trading:** Reduces decisions driven by FOMO, FUD, or immediate
  market sentiment.
- **Lack of Planning:** Encourages users to define objectives, risk tolerance,
  and strategy _before_ acting.
- **Accountability Gap:** Provides mechanisms (cooldown or mentor) to hold users
  accountable to their stated intentions.

## Key On-Chain Features (Implemented & Planned)

- **Vault Initialization:** Creating a personal `VaultAccount` PDA.
- **Token Deposit:** Transferring SPL tokens into the vault's associated token
  account (ATA), controlled by the `VaultAccount` PDA.
- **Token Withdrawal:** Transferring SPL tokens out of the vault's ATA, _only
  after_ unlock conditions are met and signed by the vault PDA.
- **(Planned/In Progress) Plan Submission:** Storing a `plan_hash` on-chain.
- **(Planned/In Progress) Unlock Strategy Enforcement:**
  - Cooldown timer checks.
  - Mentor approval/rejection signature verification.
  - Mentor timeout handling.
- **(Planned/In Progress) Vault State Management:** Updating vault status
  (locked/unlocked) based on completed gates.
