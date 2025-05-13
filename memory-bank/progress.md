# Progress: CommitVault

## What works

Core vault initialization, token deposit, and token withdrawal (with placeholder
checks for unlock status/strategy) have been implemented and are working.
Testing for the `initialize` instruction (Curriculum Topic 5a) is complete.

## What's left to build

The behavioral gate logic for unlocking the vault is the main remaining part to
build. This includes:

- Implementing the `submit_plan` instruction.
- Implementing the full logic for `unlock_vault_cooldown` (or integrating it
  into `withdraw`).
- Implementing the full suite of mentor instructions (`mentor_approve`,
  `mentor_reject`, timeout handling, mentor change/mode switch).
- Defining and testing specific error codes for all new functionalities.
- Writing and completing tests for the `deposit` and `withdraw` instructions
  (Curriculum Topics 5b and 5c).

## Current status

Core fund movement is in place; behavioral gate logic and comprehensive testing
are the next major implementation phases.

## Known issues

There are no explicitly mentioned known issues in the provided information,
other than the placeholder checks for unlock status/strategy in the current
withdrawal implementation.

## Evolution of project decisions

The project is following a structured learning roadmap
(`documentations/00-curriculum.md`), indicating a planned evolution of features
and technical implementation based on a progressive understanding of Solana and
Anchor concepts. The decision to store investment plans off-chain with an
on-chain hash is a key design choice driven by cost and flexibility
considerations. The inclusion of both Solo and Mentor modes reflects a decision
to offer different behavioral accountability mechanisms.
