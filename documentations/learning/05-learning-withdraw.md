# 05 - Learning: Token Withdrawal

This document summarizes the implementation of the `withdraw` instruction in the
CommitVault program, covering the necessary account constraints, unlock strategy
checks, and the Cross-Program Invocation (CPI) required to transfer tokens from
the vault's token account back to the user.

---

## `Withdraw` Accounts Struct (`#[derive(Accounts)]`)

The `Withdraw` struct defines the accounts required for the `withdraw`
instruction. Key points for this struct include:

- **`vault_account`**: The Program Derived Address (PDA) representing the user's
  vault. It requires `mut` for state changes, `seeds` and `bump` for PDA
  validation, and `has_one = owner @ crate::ErrorCode::Unauthorized` to ensure
  the vault belongs to the `owner` account provided in the context.
- **`owner`**: The user's wallet, which must sign the transaction. Defined as
  `Signer<'info>` for clarity and security.
- **`user_token_account`**: The user's token account where the withdrawn tokens
  will be sent. Requires `mut` and `token::authority = owner` to ensure the
  owner controls this account.
- **`vault_token_account`**: The token account holding the tokens within the
  vault. Requires `mut`, `token::authority = vault_account` (as the vault PDA is
  the authority), `token::mint = mint` to verify the token type, and
  `address = vault_account.token_vault` to ensure this is the specific token
  account linked to the vault.
- **`token_program`**: The SPL Token Program, required for performing token
  transfers via CPI.
- **`mint`**: The token mint account, needed for token account validation.

## `withdraw` Instruction Function (`pub fn withdraw(...)`)

The `withdraw` function contains the logic for the withdrawal process:

1. **Function Signature**: Takes `Context<Withdraw>` to access the accounts and
   `amount: u64` as the amount of tokens to withdraw.
2. **Vault Status Check**: An initial check (`if vault.status != 1`) ensures the
   vault is in an 'unlocked' state before proceeding.
3. **Unlock Strategy Implementation**: A `match` statement handles the different
   unlock strategies defined in the `VaultAccount`:
   - **Cooldown (strategy 0)**: Checks if the current timestamp
     (`Clock::get()?`) is past the `cooldown_end` time.
   - **Mentor Approval (strategy 1)**: Checks if `vault.mentor_approval_status`
     is `1` (approved).
   - Includes error handling for invalid strategies.
4. **CPI Token Transfer**: Performs a Cross-Program Invocation to the SPL Token
   Program's `transfer` instruction.
   - Constructs `signer_seeds` using the vault PDA's seeds (`b"vault"`,
     `owner.key()`, and the `bump_seed` obtained from
     `ctx.bumps.vault_account`).
   - Creates a `CpiContext` with the `vault_token_account` as the source,
     `user_token_account` as the destination, and the `vault_account` PDA as the
     authority.
   - Uses `.with_signer(signer_seeds)` to have the vault PDA sign the CPI.
   - Calls `token::transfer(cpi_ctx, amount)?` to execute the transfer.

## Error Handling (`#[error_code]`)

Custom error codes were added to provide specific feedback for different failure
scenarios, such as `VaultNotUnlocked`, `VaultStillLockedByCooldown`,
`MentorApprovalPendingOrRejected`, and `InvalidUnlockStrategy`.

---

This implementation ensures that tokens can only be withdrawn from the vault by
the owner, according to the defined unlock strategy, and correctly handles the
token transfer via a PDA-signed CPI.
