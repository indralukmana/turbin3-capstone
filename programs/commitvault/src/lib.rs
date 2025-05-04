#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("3gmuFz3ysgVSCUp1SvMYRyCHFU6iEx2VdpyM4CTPG5Bs");

#[program]
pub mod commitvault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
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

    Ok(())
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
