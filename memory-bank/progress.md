# Progress: CommitVault

## What works

Core vault initialization, token deposit, and token withdrawal (with placeholder
checks for unlock status/strategy) have been implemented and are working.
Testing for the `initialize` instruction (Curriculum Topic 5a) is complete.

## What's left to build

The behavioral gate logic for unlocking the vault is the main remaining part to
build. This includes:

- Implementing the full logic for `unlock_vault_cooldown` (or integrating it
  into `withdraw`).
- Implementing the full suite of mentor instructions (`mentor_approve`,
  `mentor_reject`, timeout handling, mentor change/mode switch).
- Defining and testing specific error codes for all new functionalities.
- Writing and completing tests for the `deposit` and `withdraw` instructions
  (Curriculum Topics 5b and 5c).

## Status

Completed topic 6 in the 00-curriculum.md

## Known issues

Cooldown need to be simulated by passing time in the test. The
solana-test-validator howeverd doesn't support this. Will need to change to
Solana Bankrun for proper testing.

## Evolution of project decisions

The project is following a structured learning roadmap
(`documentations/00-curriculum.md`), indicating a planned evolution of features
and technical implementation based on a progressive understanding of Solana and
Anchor concepts. The decision to store investment plans off-chain with an
on-chain hash is a key design choice driven by cost and flexibility
considerations. The inclusion of both Solo and Mentor modes reflects a decision
to offer different behavioral accountability mechanisms.
