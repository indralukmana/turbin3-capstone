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
