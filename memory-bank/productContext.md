# Product Context: CommitVault

## Why this project exists

CommitVault is a Solana-based dApp designed to introduce a layer of **behavioral
accountability and intentionality** for users deploying capital on-chain. The
core idea is to bridge the gap between DeFi's rapid execution and the
psychological need for discipline and planning in financial decisions, thereby
aiming to reduce impulsive trading and foster more thoughtful capital
deployment.

## Problems it solves

- **Impulsive Trading:** Reduces decisions driven by FOMO, FUD, or immediate
  market sentiment.
- **Lack of Planning:** Encourages users to define objectives, risk tolerance,
  and strategy _before_ acting.
- **Accountability Gap:** Provides mechanisms (cooldown or mentor) to hold users
  accountable to their stated intentions.

## How it should work

CommitVault requires users to:

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

## User experience goals

The dApp should guide the user through the following workflow:

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
