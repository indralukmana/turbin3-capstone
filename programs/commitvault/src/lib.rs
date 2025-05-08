#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("3gmuFz3ysgVSCUp1SvMYRyCHFU6iEx2VdpyM4CTPG5Bs");

#[program]
pub mod commitvault {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        unlock_strategy: u8,
        plan_hash: [u8; 32],
        cooldown_end: i64,
        mentor: Pubkey,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault_account;
        vault.owner = *ctx.accounts.user.key;
        vault.status = 0; // initial locked
        vault.unlock_strategy = unlock_strategy;
        vault.token_vault = Pubkey::default();
        vault.plan_hash = plan_hash;
        vault.cooldown_end = cooldown_end;
        vault.mentor = mentor;
        vault.mentor_approval_status = 0; // initial pending

        msg!("Greetings from: {:?}", ctx.program_id);

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // Create the CpiContext for the token transfer
        let cpi_accounts = SplTransfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // Perform token transfer
        token::transfer(cpi_ctx, amount)?;

        // Update the vault account with the token vault address
        let vault = &mut ctx.accounts.vault_account;
        vault.token_vault = ctx.accounts.vault_token_account.key();

        msg!("Deposited {} tokens", amount);

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()>{

        let vault = &ctx.accounts.vault_account;

        // Check if the vault is unlocked
        if vault.status != 1 {
            return Err(crate::ErrorCode::VaultNotUnlocked.into());
        }

        match vault.unlock_strategy {
            0 => { // Cooldown strategy
                let clock = Clock::get()?;
                if clock.unix_timestamp < vault.cooldown_end {
                    return Err(crate::ErrorCode::VaultStillLockedByCooldown.into());
                }
            }
            1 => {
                if vault.mentor_approval_status != 1 {
                    return Err(crate::ErrorCode::MentorApprovalPendingOrRejected.into());
                }
            }
            _ => {
                return Err(crate::ErrorCode::InvalidUnlockStrategy.into());
            }
        }

        // Get the vault's bump seed for signing CPI
        let bump_seed = ctx.bumps.vault_account;
        let vault_seeds = &[
            b"vault",
            ctx.accounts.owner.key.as_ref(),
            &[bump_seed],
        ];
        let signer_seeds = &[&vault_seeds[..]];

        // Create the CPI context for token transfer
        let cpi_accounts = SplTransfer {
            from: ctx.accounts.vault_token_account.to_account_info(), // vault token account
            to: ctx.accounts.user_token_account.to_account_info(), // the user/vault owner token account
            authority: ctx.accounts.vault_account.to_account_info(), // the vault PDA as authority
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts).with_signer(signer_seeds);

        // perform token transfer
        token::transfer(cpi_ctx, amount)?;

        Ok(())

    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut, signer)]
    /// CHECK: This is the user paying for the vault account creation
    pub user: AccountInfo<'info>,

    #[account(
        init, // create the account,
        payer = user, // who pays for the account creation
        space = 8 + std::mem::size_of::<VaultAccount>(),
        seeds = [b"vault", user.key().as_ref()],
        bump
    )]
    pub vault_account: Account<'info, VaultAccount>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct VaultAccount {
    pub owner: Pubkey,
    pub status: u8,          // 0 = locked, 1 = unlocked
    pub unlock_strategy: u8, // 0 = cooldown, 1 = mentor approval
    pub token_vault: Pubkey,
    pub plan_hash: [u8; 32],
    pub cooldown_end: i64, // solo mode cooldown in Unix timestamp
    pub mentor: Pubkey,
    pub mentor_approval_status: u8, // 0 = pending, 1 = approved, 2 = rejected, 3 = timeout
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    // CHECK: The user that is depositing tokens
    pub user: AccountInfo<'info>, // The user's wallet, need to sign

    #[account(
        mut, // The user's account balance will change so it is mutable,
        token::mint = mint, // ensure this token account holds the correct token type
        token::authority = user, //ensure the user is the authority over this token account
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        init_if_needed, // Create the ATA if it doesn't exist, simplifying user flow (doesnt need separate action to create the ATA)
        payer = user, // User pays for creation if needed
        token::mint = mint, // Ensure the correct token type
        token::authority = vault_account, // Ensure the vault PDA is the authority over this
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>, // The SPL token program itself

    // CHECK: required for init_if_needed
    #[account(address = anchor_spl::associated_token::ID)]
    pub associated_token_program: Program<'info, AssociatedToken>,

    pub system_program: Program<'info, System>,

    pub mint: Account<'info, Mint>, // The token mint account
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
        has_one = owner @ crate::ErrorCode::Unauthorized, 
    )]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign

    #[account(
        mut, // The user's account balance will change so it is mutable,
        token::mint = mint, // ensure this token account holds the correct token type
        token::authority = owner, //ensure the user is the authority over this token account
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = mint, // Ensure this token account holds the correct token type
        token::authority = vault_account, // Ensure the vault PDA is the authority over this
        address = vault_account.token_vault, // Use 'address' to verify the account's public key
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>, // The SPL token program itself

    pub mint: Account<'info, Mint>, // The token mint account
}

#[error_code]
pub enum ErrorCode {
    #[msg("You are not authorized to perform this action.")]
    Unauthorized,

    #[msg("The vault is not unlocked")]
    VaultNotUnlocked,

    #[msg("The vault still locked by cooldown")]
    VaultStillLockedByCooldown,

    #[msg("Mentor has not approved")]
    MentorApprovalPendingOrRejected,

    #[msg("Not valid unlock")]
    InvalidUnlockStrategy
}
