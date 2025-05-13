# Tech Context: CommitVault

## Technologies Used

- **Solana:** The blockchain platform the dApp is built on.
- **Anchor:** A framework for Solana program development, simplifying common
  tasks and providing a clear structure.
- **Rust:** The programming language used for the on-chain Solana program.
- **TypeScript:** Used for writing off-chain tests and potentially for the
  frontend application.
- **SPL Token Program:** Solana's standard for fungible tokens, used for
  handling USDC/SOL deposits and withdrawals.
- **Mermaid:** Used for generating diagrams to visualize project structure and
  workflows.

## Development Setup

- **Anchor CLI:** Used for building, testing, and deploying the Solana program.
- **Node.js and Yarn:** Used for managing project dependencies and running
  tests.
- **VS Code:** The recommended IDE, likely with extensions for Rust, Solana, and
  Anchor development.

## Technical Constraints

- **On-chain Program Size:** Solana programs have size limits, necessitating
  efficient code and potentially offloading data or logic off-chain.
- **Compute Budget:** On-chain operations consume compute units; complex logic
  needs to be optimized.
- **Account Size Limits:** Solana accounts have size limits, influencing how
  much data can be stored on a single account like `VaultAccount`.
- **Transaction Size Limits:** Solana transactions have size limits, impacting
  the complexity of instructions and the number of accounts that can be
  included.

## Dependencies

- `anchor-lang`: Core Anchor framework dependency for the Solana program.
- `anchor-spl`: Anchor's library for interacting with Solana's SPL programs
  (like the Token program).
- `@coral-xyz/anchor`: TypeScript client library for interacting with Anchor
  programs from off-chain code (used in tests).
- `mocha`, `chai`: Testing frameworks used for off-chain program tests.

## Tool Usage Patterns

- **Anchor Build:** Compiling the Rust program to BPF.
- **Anchor Test:** Running off-chain TypeScript tests against a local validator
  or devnet. Note: Non-deprecated transaction confirmation in tests requires
  using `confirmTransaction` with `blockhash` and `lastValidBlockHeight`.
- **Anchor Deploy:** Deploying the program to a Solana cluster.
- **Yarn/NPM:** Managing Node.js dependencies for tests and frontend.
- **Mermaid:** Generating diagrams from text definitions.

## Development Process

This project emphasizes a "learning by doing" approach. The user will write the
code themselves based on explanations and examples provided. Tool usage will
focus on providing necessary information and verifying results rather than
directly modifying code files.

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
