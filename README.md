# CommitVault 🚀

CommitVault is a Solana-based decentralized application (dApp) designed to
introduce a "behavioral gating layer" to DeFi. It encourages more intentional
capital deployment by requiring users to create and commit to an investment plan
_before_ they can access their locked funds. This aims to reduce impulsive
trading and foster financial discipline.

**Value Proposition:** Most DeFi tools focus on execution speed and yield.
CommitVault fills a gap by using self-imposed rules (cooldowns) and peer review
(mentor approval) to reduce impulsive trades, reinforce planning, and bring
intention into capital flow.

## 🎯 Core Problem Solved

- Reduces impulsive or emotional financial decisions.
- Promotes structured financial planning and discipline.
- Introduces a novel behavioral primitive into on-chain UX.

## ✨ Key Features

1. **Vault Creation & Management:**
   - Users initialize a personal `VaultAccount` (Program Derived Address - PDA).
   - Choose an **unlock strategy**:
     - **Solo Mode (Cooldown):** Requires a predefined cooldown period (e.g., 24
       hours) after submitting an investment plan before funds can be withdrawn.
     - **Mentor Mode:** Requires an assigned mentor to review and approve the
       investment plan.
2. **Token Deposit & Withdrawal:**
   - Users deposit SPL tokens (e.g., USDC, SOL) into their `VaultAccount`.
   - Withdrawal is only possible after the behavioral gates (plan submission +
     cooldown/mentor approval) are satisfied.
3. **Investment Plan Submission:**
   - Users create a detailed investment plan (full plan stored off-chain for
     flexibility and cost).
   - A hash of this plan is submitted and stored on-chain in the `VaultAccount`
     for verification.
4. **Mentor Interaction (Mentor Mode):**
   - Assign a mentor (another Solana wallet address) to the vault.
   - Mentors can review submitted plans, provide off-chain feedback, and
     approve/reject the plan via an on-chain transaction.
   - A timeout mechanism (e.g., 72 hours) allows users to resubmit to a new
     mentor or switch modes if the current mentor is unresponsive.
   - Users can change their assigned mentor.
5. **Mode Switching:**
   - Users can switch their vault from Mentor Mode to Solo Mode (initiating a
     new cooldown period if a plan is active).

## 🧭 High Level DApp Plan

```mermaid
graph TD
   A[User Wallet] -.-> Z[Optionally Setup Mentor Wallet] -.-> B
   A -->|Deposit USDC/SOL| B[Vault Smart Contract]
   A --> C[UI: Set Behavioral Gates]

   C --> D[Gate 1: Mindset Check - Checkbox or Form]
   C --> E[Gate 2: Investment Plan - Off-chain DB]
   C --> F[Gate 3: Optional Mentor Approval]

   E --> DB[(Off-chain Database)]
   F --> G[Mentor Wallet Signs Approval]
   DB --> H{All Gates Complete?}

   D --> H
   G --> H

   H -- Yes --> I[Unlock Button Enabled]
   I --> J[User Withdraws via Frontend]
   J --> B
   B -->|Release Funds| A

   H -- No --> K[Vault Remains Locked]
```

## 🏗️ Architecture Overview

CommitVault consists of on-chain and conceptual off-chain components:

- **On-Chain (Solana):**
  - **`commitvault` Program:** The main Anchor smart contract containing all
    core logic.
  - **`VaultAccount` (PDA):** Stores individual user vault state, including
    owner, status, unlock strategy, token vault address, plan hash, cooldown
    details, and mentor information.
  - **Token Vault (ATA/PDA):** An Associated Token Account controlled by the
    `VaultAccount` PDA, holding the deposited SPL tokens.
- **Off-Chain (Conceptual):**
  - **Plan Database:** A service to store the detailed, structured investment
    plans. The on-chain program only verifies a hash of this plan.
  - **Frontend Application:** A user interface for interacting with CommitVault
    (creating vaults, submitting plans, managing deposits/withdrawals) and for
    mentors to review plans.

For a detailed breakdown, see the
[Architecture Document](./documentations/architecture.md).

## 🛠️ Technology Stack

- **Blockchain:** Solana
- **Smart Contract Framework:** Anchor (Rust)
- **Token Standard:** SPL Token
- **Testing:** TypeScript, Mocha, Chai
- **Diagramming:** Mermaid.js

## 🚀 Getting Started

### Prerequisites

- Solana CLI:
  [Installation Guide](https://docs.solana.com/cli/install-solana-cli-tools)
- Anchor Framework:
  [Installation Guide](https://www.anchor-lang.com/docs/installation)
- Node.js & Yarn

### Installation & Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/indralukmana/turbin3-capstone
   cd commitvault
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Build the Anchor program:**

   ```bash
   anchor build
   ```

4. **Set up your local validator (optional, for local testing):** Ensure your
   `Anchor.toml` points to `localnet` and your Solana config points to
   localhost:

   ```bash
   solana config set --url localhost
   ```

   Start the local validator in a separate terminal:

   ```bash
   solana-test-validator
   ```

5. **Deploy the program:** The `migrations/deploy.ts` script is a basic
   placeholder. You can deploy using the standard Anchor command:

   ```bash
   anchor deploy
   ```

   This will deploy the program to the cluster specified in `Anchor.toml`
   (default localnet) and update `programs.localnet.commitvault` with the new
   program ID.

## ⚙️ How It Works (User Flow)

1. **Initialize Vault:** The user calls the `initialize` instruction, creating
   their `VaultAccount` PDA and setting the initial `unlock_strategy` (Solo or
   Mentor), `cooldown_end` (if Solo), and `mentor` address (if Mentor).
2. **Deposit Funds:** The user calls `deposit` to transfer SPL tokens into the
   vault's associated token account.
3. **Submit Plan:**
   - The user drafts their investment plan (off-chain).
   - A hash of this plan is submitted on-chain via the `submit_plan`
     instruction.
   - If in Solo mode, the vault's `status` may be set to unlocked (pending
     cooldown completion).
   - If in Mentor mode, the `mentor_approval_status` is reset to `pending`.
4. **Fulfill Gate Conditions:**
   - **Solo Mode:** The user waits for the `cooldown_end` timestamp to pass.
   - **Mentor Mode:** The assigned mentor calls `mentor_approve`. If the mentor
     rejects (`mentor_reject`) or times out, the user can `change_mentor` or
     `switch_to_solo_mode`.
5. **Withdraw Funds:** Once the vault `status` is `unlocked` (all conditions
   met), the user can call `withdraw` to retrieve their funds.

## ✅ Running Tests

Execute the test suite using the Anchor CLI:

```bash
anchor test
```

This command (as configured in `Anchor.toml`) will run the TypeScript tests
located in the `tests/` directory.

## 📂 Project Structure

```txt
.
├── diagrams/               # Mermaid diagrams for architecture and flows
├── documentations/         # Detailed documentation and learning curriculum
├── migrations/             # Deployment scripts (basic)
├── programs/
│   └── commitvault/        # Anchor smart contract source (Rust)
│       ├── src/lib.rs
│       └── Cargo.toml
├── tests/                  # Integration tests (TypeScript)
├── .gitignore
├── .prettierignore
├── .yarnrc.yml
├── Anchor.toml             # Anchor project configuration
├── Cargo.toml              # Workspace Cargo file
├── package.json            # Node.js project dependencies
└── tsconfig.json           # TypeScript configuration
```

## 📚 Documentation & Learning

This project places a strong emphasis on learning and clear documentation.

- **[Architecture Deep Dive](./documentations/architecture.md)**
- **[User Stories](./documentations/user-story.md)**
- **Learning Curriculum:** A step-by-step guide to understanding the
  Solana/Anchor concepts used in building CommitVault.
  - [00-curriculum.md](./documentations/learning/00-curriculum.md) (Roadmap)
  - [01-learning-vaultaccount.md](./documentations/learning/01-learning-vaultaccount.md)
  - [02-learning-initialize.md](./documentations/learning/02-learning-initialize.md)
  - [03-learning-pda.md](./documentations/learning/03-learning-pda.md)
  - [04-learning-cpi-deposit.md](./documentations/learning/04-learning-cpi-deposit.md)
  - [05-learning-withdraw.md](./documentations/learning/05-learning-withdraw.md)

## Latest deployed program ID

- **devnet**
  - `commitvault`:
    - Program Id:
      [GoXMpXZ1V2uFnECsAgZjWGjiexUXz279oKD6T39zVtdm](https://explorer.solana.com/address/GoXMpXZ1V2uFnECsAgZjWGjiexUXz279oKD6T39zVtdm?cluster=devnet)
    - Signature:
      [3sAhicbYKVyTsnvZk7NKZV13UwUt4BZaqv3affcJg6jVVzpUBueooxxMj5Z3f4aMWQFaaRbhgp4qEwaVsgGHFG83](https://explorer.solana.com/tx/3sAhicbYKVyTsnvZk7NKZV13UwUt4BZaqv3affcJg6jVVzpUBueooxxMj5Z3f4aMWQFaaRbhgp4qEwaVsgGHFG83?cluster=devnet)
      (15 May 2025 22:18)
    - [Deployment history](./documentations/deployments/deploy-history.md)

## 🗺️ Future Work / Roadmap

- **Frontend UI Development:** Build a React (or similar) frontend for user
  interaction and mentor dashboards.
  - [Frontend Product Requirements Document](./documentations/frontend-prd.md)
- **Off-chain Plan Database Integration:** Implement a backend service to store
  and manage the detailed investment plans.

The core solana program has achieved its MVP, but the frontend and off-chain
components are still in the conceptual phase. Next step of the project is to
build the frontend UI and integrate it with the on-chain program.

## 📜 License

This project is licenced under the Apache License 2.0. See the
[LICENSE](./LICENSE) file for details.
