# System Patterns: CommitVault

## System Architecture

The CommitVault system consists of on-chain and off-chain components. The core
logic and state management reside in the on-chain Solana program. Off-chain
components handle user interfaces, investment plan storage, and potentially
mentor review mechanisms.

## Key Technical Decisions

- **Solana Program:** The core logic is implemented as a Solana program using
  Anchor.
- **Program Derived Addresses (PDAs):** `VaultAccount` is a PDA, controlling the
  vault's associated token account. This is a key pattern for program ownership
  of accounts on Solana.
- **Cross-Program Invocations (CPIs):** Used for interacting with the SPL Token
  program to handle token deposits and withdrawals.
- **Off-chain Plan Storage:** Investment plans are stored off-chain for
  flexibility and to avoid high on-chain storage costs. A cryptographic hash of
  the plan is stored on-chain for integrity verification.
- **Unlock Strategies:** Two distinct on-chain enforced strategies: time-based
  cooldown and mentor approval via on-chain signature verification.

## Design Patterns in Use

- **Program Derived Addresses (PDAs):** Used for the `VaultAccount` to enable
  the program to control the associated token account.
- **Account Validation:** Anchor handles significant account validation,
  reducing boilerplate. Additional custom validation is implemented in the
  program logic.
- **State Management:** The `VaultAccount` struct manages the state of the
  vault, including ownership, deposited amount, unlock strategy, plan hash, and
  unlock status.

## Component Relationships

- **CommitVault Program:** Interacts with the SPL Token program via CPIs.
- **`VaultAccount` PDA:** Owned by the CommitVault program, controls the vault's
  associated token account.
- **Associated Token Account (ATA):** Holds the user's deposited tokens,
  controlled by the `VaultAccount` PDA.
- **User Wallet:** Initiates transactions and owns the ATA before deposit.
- **Mentor (in Mentor Mode):** Interacts with the program to approve or reject
  plans via signed transactions.

## Critical Implementation Paths

- **Vault Initialization:** Creating the `VaultAccount` PDA and its associated
  token account.
- **Token Deposit:** Transferring tokens from the user's ATA to the vault's ATA,
  signed by the user.
- **Plan Submission:** Storing the hash of the off-chain plan on the
  `VaultAccount`.
- **Unlock Strategy Enforcement:** Implementing the logic for cooldown checks
  and mentor signature verification.
- **Token Withdrawal:** Transferring tokens from the vault's ATA back to the
  user's ATA, signed by the `VaultAccount` PDA.

## Workflow Overview (User Journey)

1. User **initializes** their CommitVault, choosing an unlock strategy (cooldown
   or mentor) and setting relevant parameters (cooldown duration, mentor's
   public key).
2. User **deposits** USDC/SOL into their vault.
3. User creates their investment plan (off-chain) and **submits its hash** to
   their on-chain vault (`submit_plan` instruction).
4. **Unlock Gate Processing:**
   - **Solo Mode:** A cooldown period starts. The user must wait until
     `cooldown_end`. They might then call an `unlock_vault_cooldown` instruction
     (or this logic is in `withdraw`).
   - **Mentor Mode:** The designated mentor reviews the plan (via an off-chain
     mechanism).
     - Mentor calls `mentor_approve` (on-chain).
     - Mentor calls `mentor_reject` (on-chain).
     - If mentor is unresponsive, user calls `request_mentor_timeout_action`
       after a period, potentially then `change_mentor` or
       `switch_to_solo_mode`.
5. Once all conditions for the chosen strategy are met and the vault status is
   "unlocked", the user can **withdraw** their funds.

## Project Structure & File Purpose

- **`programs/commitvault/`**: Contains the on-chain Solana program (smart
  contract).
  - `src/lib.rs`: The core Rust code defining the CommitVault program logic,
    instructions, account structures, and error codes. This is the heart of the
    on-chain application.
  - `Cargo.toml`: Rust package manager file, defines dependencies for the
    on-chain program (like `anchor-lang`, `anchor-spl`).
  - `Xargo.toml`: Used for building Rust `std` for BPF target (Solana's on-chain
    environment).
- **`tests/`**: Contains off-chain tests for the smart contract.
  - `commitvault.ts`: TypeScript file using Anchor's client library to interact
    with and test the deployed `commitvault` program. Essential for verifying
    program correctness.
- **`documentations/`**: A comprehensive suite of learning materials and project
  design documents. **This is a standout feature of the project.**
  - `00-curriculum.md`: Your self-guided learning roadmap for building the
    project. _Excellent for understanding progress and planned features._
  - `01-learning-vaultaccount.md` to `05-learning-withdraw.md`: Detailed,
    step-by-step explanations of core Solana/Anchor concepts as they are applied
    in CommitVault (e.g., PDAs, CPIs, account initialization). These are
    tutorial-style notes.
  - `architecture.md`: High-level design of the system, including on-chain and
    off-chain components, state transitions, and data flows.
  - `user-story.md`: Defines the target users, their needs, and how CommitVault
    addresses them.
- **`diagrams/`**: Contains Mermaid (text-based) diagrams illustrating various
  aspects of the project, like:
  - High-level overview, state transitions, PDA/token account relationships,
    mentor flows, external dependencies, UI structure ideas. These are
    invaluable for quick visual understanding.
- **`migrations/`**: Standard Anchor directory for deployment scripts.
  - `deploy.ts`: Script used by Anchor to deploy the program (often simple for
    basic deploys).
- **Root Directory Files:**
  - `Anchor.toml`: Main configuration file for the Anchor project (defines
    program IDs, cluster, provider, test scripts).
  - `Cargo.toml`: Workspace-level Rust configuration.
  - `package.json`: Node.js project manifest (dependencies for testing like
    `@coral-xyz/anchor`, `mocha`, `chai`).
  - `tsconfig.json`: TypeScript compiler configuration.
  - `.gitignore`, `.prettierignore`, `.yarnrc.yml`: Standard tooling
    configuration for version control, code formatting, and package management.
