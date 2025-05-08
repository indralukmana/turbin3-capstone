# 00 - CommitVault Solana dApp Curriculum Baseline (Optimized for Building)

Welcome to your learning journey! This doc is your evolving curriculum and
roadmap for building, understanding, and mastering a Solana/Anchor dApp
(CommitVault). Revise and update this as you grow!

---

## 🏁 Baseline Goals

- Build a functional CommitVault dApp on Solana.
- Understand the practical application of Solana/Anchor concepts through
  implementation.
- Develop skills in smart contract development, testing, and integration.

---

## 📚 Core Building Roadmap (Learn by Doing)

- [x] 1. VaultAccount & Basic Account Constraints
  - [x] 1a. Understand the VaultAccount structure and purpose.
  - [x] 1b. Learn about basic Anchor account constraints (`#[account(...)]`).
  - [x] 1c. Apply basic account constraints in `Initialize` struct.
  - See: [01-learning-vaultaccount.md](./01-learning-vaultaccount.md)
- [x] 2. Initialization
  - [x] 2a. Understand the initialization process (creating the VaultAccount
        PDA).
  - [x] 2b. Learn about basic PDA derivation (`seeds`, `bump`).
  - [x] 2c. Implement the `initialize` instruction in `lib.rs`.
  - [x] 2d. Define the `#[derive(Accounts)]` struct for `initialize`.
  - See: [02-learning-initialize.md](./02-learning-initialize.md),
    [03-learning-pda.md](./03-learning-pda.md)
- [x] 3. Cross-Program Invocations (CPI) & Token Deposit
  - [x] 3a. Understand what CPI is and why it's needed (for SPL tokens).
  - [x] 3b. Learn how to perform CPI in Anchor.
  - [x] 3c. Understand SPL Tokens and Associated Token Accounts (ATAs).
  - [x] 3d. Implement the `deposit` instruction:
    - [x] Define `#[derive(Accounts)]` for `deposit`.
    - [x] Implement `deposit` function using CPI to transfer tokens to the
          vault's ATA.
  - See: [04-learning-cpi-deposit.md](./04-learning-cpi-deposit.md)
- [x] 4. Token Withdrawal
  - [x] 4a. Implement the `withdraw` instruction:
    - [x] Define `#[derive(Accounts)]` for `withdraw`.
    - [x] Implement `withdraw` function using CPI to transfer tokens from the
          vault's ATA.
    - [x] Add checks for vault status ('unlocked').
  - See: [05-learning-withdraw.md](./05-learning-withdraw.md)
- [ ] 5. Behavioral Gates: Plan Hash & Cooldown
  - [ ] 5a. Implement the `submit_plan_hash` instruction:
    - [ ] Define `#[derive(Accounts)]` for `submit_plan_hash`.
    - [ ] Implement `submit_plan_hash` function to store the hash and update
          status.
  - [ ] 5b. Implement cooldown logic:
    - [ ] Add checks in `withdraw` or a separate instruction to verify
          `cooldown_end`.
- [ ] 6. Behavioral Gates: Mentor Approval
  - [ ] 6a. Implement mentor approval/rejection instructions:
    - [ ] Define `#[derive(Accounts)]` for `mentor_approve` and `mentor_reject`.
    - [ ] Implement functions, including mentor signature verification.
    - [ ] Update `mentor_approval_status`.
  - [ ] 6b. Implement mentor timeout logic.
- [ ] 7. Error Handling
  - [ ] 7a. Learn how to define custom errors in Anchor.
  - [ ] 7b. Implement error checks for various scenarios.
- [ ] 8. Off-chain Plan Storage Integration (Conceptual/Frontend Focus)
  - [ ] 8a. Understand how the on-chain program interacts with the off-chain
        database (via plan hash).
  - [ ] 8b. (Focus shifts to frontend/backend for actual integration).
- [ ] 9. Frontend Integration
  - [ ] 9a. Learn how to connect a frontend (e.g., React) to your Solana program
        using Anchor client.
  - [ ] 9b. Build UI for vault creation, plan submission, status display, and
        withdrawal.
  - [ ] 9c. Build Mentor UI for reviewing and approving plans.
- [ ] 10. Testing and Debugging
  - [ ] 10a. Expand tests to cover all implemented instructions.
  - [ ] 10b. Learn debugging techniques.

---

## ✨ Enrichment Topics (Deep Dive & Exploration)

- [ ] E1. PDA Deep Dive
  - Explore more advanced PDA patterns.
  - Practice deriving PDAs using the Solana CLI or tests.
  - See: [03-learning-pda.md](./03-learning-pda.md)
- [ ] E2. Advanced Account Constraints & Validation
  - Learn about more complex account validation techniques in Anchor.
- [ ] E3. Security Review and Best Practices
  - Review common Solana security pitfalls.
  - Apply best practices to your code.
- [ ] E4. Gas Optimization
  - Learn how to write efficient Solana programs to minimize transaction costs.
- [ ] E5. Program Upgradability
  - Understand how to make your Solana program upgradable.

---

## 🔗 Reference Docs

- [01-learning-vaultaccount.md](./01-learning-vaultaccount.md) — VaultAccount
  structure and initialization
- [02-learning-initialize.md](./02-learning-initialize.md) — Initialization
  process
- [03-learning-pda.md](./03-learning-pda.md) — Program Derived Addresses
- [architecture.md](./architecture.md) — Project architecture overview
- [user-story.md](./user-story.md) — User perspective and goals
- (add more as you go)

---

## 📝 Notes & Future Revisions

- Revise this file as you discover new concepts or want to reorder priorities
- Add links to new learning docs as you create them
- Use this as your "table of contents" for your CommitVault journey

---

**Tip:** Check off topics as you master them! (｡•̀ᴗ-)✧
