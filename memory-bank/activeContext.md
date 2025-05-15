# Active Context: CommitVault

## Current work focus

The current focus is on implementing the behavioral gate logic for unlocking the
vault, specifically the plan submission, cooldown timer, and mentor approval
mechanisms. We are currently debugging an "unknown signer" error in the
`submit_plan` test.

## Recent changes

Core vault initialization, token deposit, and token withdrawal (with placeholder
checks for unlock status/strategy) have been implemented. Testing for the
`initialize` instruction (Curriculum Topic 5a) is complete. Added the
`SubmitPlan` struct and `submit_plan` function to
`programs/commitvault/src/lib.rs`. Added tests for `submit_plan` in
`tests/submit.test.ts`.

## Next steps

Based on the curriculum and current status, the next steps are:

- Implementing the full logic for `unlock_vault_cooldown` (or integrating it
  into `withdraw`).
- Implementing the full suite of mentor instructions (`mentor_approve`,
  `mentor_reject`, timeout handling, mentor change/mode switch).
- Defining and testing specific error codes for all new functionalities.

## Active decisions and considerations

- How to handle off-chain plan storage and retrieval for mentor review.
- The specific implementation details of the cooldown timer and how it interacts
  with the Solana clock.
- The mechanism for mentors to provide on-chain approval (signature
  verification).
- Handling potential mentor unresponsiveness and allowing users to change
  mentors or switch strategies.
- Debugging the "unknown signer" error in the `submit_plan` test by adding
  logging to both the test and the program to compare public keys.

## Important patterns and preferences

- Strong emphasis on learning by doing, with the user writing the code based on
  provided examples and explanations.
- Detailed documentation is maintained to support the learning process.
- Use of Mermaid diagrams for visualizing complex flows and structures.
- Following Anchor best practices for Solana program development.

## Learnings and project insights

- Understanding of Solana account models, PDAs, and CPIs through the initial
  implementation of deposit and withdrawal.
- Appreciation for the importance of off-chain components and how they interact
  with the on-chain program.
- Recognition of the complexity involved in implementing the behavioral gate
  logic and the need for careful design and testing.

## For New Eyes - Key Takeaways

- **Purpose:** Behavioral finance on Solana – making users more intentional.
- **Core Mechanics:** Lock funds, commit to a plan (hash on-chain), unlock via
  cooldown or mentor approval.
- **Structure:** Well-organized Anchor project with excellent, detailed
  documentation and diagrams focused on a learning journey.
- **Tech:** Solana, Anchor (Rust), TypeScript (tests).
- **Status:** Core fund movement is in place; currently debugging the
  `submit_plan` instruction test. The `documentations/00-curriculum.md` is the
  best place to see the up-to-date plan.
