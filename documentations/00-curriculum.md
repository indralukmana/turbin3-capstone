# 00 - CommitVault Solana dApp Curriculum Baseline (Optimized for Building)

Personal learning curriculum for building a Solana dApp called CommitVault.

## 🏁 Baseline Goals

- Build a functional CommitVault dApp on Solana.
- Understand the practical application of Solana/Anchor concepts through
  implementation.
- Develop skills in smart contract development, testing, and integration.

## 📚 Core Building Roadmap (Learn by Doing) -

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
    - [x] Add checks for vault status ('unlocked') and unlock strategy
          conditions.
  - See: [05-learning-withdraw.md](./05-learning-withdraw.md)
- [x] 5. Initialize and Deposit - Testing and Debugging
  - [x] 5a. Test the `initialize` instruction.
  - [x] 5b. Test the `deposit` instruction:
    - [x] Verify token balance changes in user and vault ATAs.
    - [x] Verify `vault_account.token_vault` is correctly updated.
- [x] 6. Behavioral Gates & Vault State Management: Plan Hash
  - [x] 6a. Implement `submit_plan(ctx, plan_hash: [u8; 32])` instruction:
    - [x] Define `#[derive(Accounts)]` for `submit_plan`. (User signs, mutates
          `vault_account`)
    - [x] Implement `submit_plan` function to update `vault_account.plan_hash`.
    - [x] If `unlock_strategy` is Cooldown (0)
    - [x] If `unlock_strategy` is Mentor (1)
  - [x] 6b. Test `submit_plan` .
- [ ] 7. Behavioral Gates & Vault State Management: Mentor Approval
  - [x] 7a. Implement `mentor_approve(ctx)` instruction:
    - [x] Define `#[derive(Accounts)]`. (Mentor signs, `has_one = mentor` on
          `vault_account`, mutates `vault_account`).
    - [x] Set `vault_account.mentor_approval_status = 1` (approved).
    - [x] If `unlock_strategy` is Mentor (1) and other conditions met (e.g.,
          plan submitted), set `vault_account.status = 1` (unlocked).
    - [x] Test mentor approval.
  - [ ] 7b. Implement `mentor_reject(ctx)` instruction:
    - [ ] Define `#[derive(Accounts)]`. (Mentor signs, `has_one = mentor`,
          mutates `vault_account`).
    - [ ] Set `vault_account.mentor_approval_status = 2` (rejected).
    - [ ] Ensure `vault_account.status` remains `0` (locked) or resets if
          necessary.
  - [ ] 7c. Implement `change_mentor(ctx, new_mentor: Pubkey)` or
        `switch_to_solo_mode(ctx)` (Post-timeout actions)
    - [ ] Define respective `#[derive(Accounts)]`. (User/Owner signs, mutates
          `vault_account`).
    - [ ] These would be callable if `mentor_approval_status` is `0` or `2` and
          the cooldown period has passed.
  - [ ] 7e. Test all mentor-related instructions and state changes.
  - [ ] 8. Comprehensive Withdraw Tests:
    - [ ] Test successful withdrawal (cooldown met, vault status = 1).
    - [ ] Test successful withdrawal (mentor approved, vault status = 1).
    - [ ] Test failure: attempt to withdraw before cooldown (vault status = 0 or
          1 but time not met).
    - [ ] Test failure: attempt to withdraw without mentor approval (vault
          status = 0 or 1 but approval not met).
    - [ ] Test failure: attempt to withdraw from a vault where status is still 0
          (locked).
    - [ ] Test failure: attempt to withdraw by a non-owner.
- [ ] 9. Error Handling
  - [ ] 8a. Review and refine custom errors in Anchor for all new instructions.
  - [ ] 8b. Ensure comprehensive error checks for edge cases and invalid states
        in all instructions.
- [ ] 9. Off-chain Plan Storage Integration (Conceptual/Frontend Focus)
  - [ ] 9a. Understand how the on-chain program interacts with the off-chain
        database (via plan hash).
  - [ ] 9b. (Focus shifts to frontend/backend for actual integration).
- [ ] 10. Frontend Integration
  - [ ] 10a. Learn how to connect a frontend (e.g., React) to your Solana
        program using Anchor client.
  - [ ] 10b. Build UI for vault creation, plan submission, status display, and
        withdrawal.
  - [ ] 10c. Build Mentor UI for reviewing and approving plans.

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
- [04-learning-cpi-deposit.md](./04-learning-cpi-deposit.md) — CPI and Token
  Deposit
- [05-learning-withdraw.md](./05-learning-withdraw.md) — Token Withdrawal
- [architecture.md](./architecture.md) — Project architecture overview
- [user-story.md](./user-story.md) — User perspective and goals
