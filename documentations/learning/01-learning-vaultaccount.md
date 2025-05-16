# Learning: VaultAccount in CommitVault

## What is Initialization?

Initialization in Solana/Anchor is the process of creating and setting up a new
on-chain account (like your VaultAccount) and setting its initial values. This
is usually the first thing your users do (e.g., "create vault").

## VaultAccount Structure

```txt
+------------------+
|   VaultAccount   |
+------------------+
| owner            |
| status           |
| unlock_strategy  |
| token_vault      |
| plan_hash        |
| cooldown_end     |
| mentor           |
| mentor_approval  |
+------------------+
```

## Field-by-Field Breakdown

- `owner: Pubkey` - The user who owns this vault
- `status: u8` - 0 = locked, 1 = unlocked
- `unlock_strategy: u8` - 0 = cooldown, 1 = mentor approval
- `token_vault: Pubkey` - The on-chain token vault address
- `plan_hash: [u8; 32]` - Hash of the off-chain plan (e.g., SHA-256)
- `cooldown_end: i64` - When the cooldown ends (Unix timestamp)
- `mentor: Pubkey` - Mentor's wallet address (if in mentor mode)
- `mentor_approval_status: u8` - 0 = pending, 1 = approved, 2 = rejected, 3 =
  timeout

## Why Start Here?

- Initialization is the first thing your users will do ("create vault")
- Teaches you about accounts, PDAs, and how Anchor manages state
- Defines what data your program will store

## Personal Gotcha

- When a user interacts with the program for the first time, creating a
  `VaultAccount` is the essential first action. This account represents their
  personal vault and all behavioral gates. Every user starts their journey here!
