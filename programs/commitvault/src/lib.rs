#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

declare_id!("GoXMpXZ1V2uFnECsAgZjWGjiexUXz279oKD6T39zVtdm");

#[program]
pub mod commitvault {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        unlock_strategy: u8,
        plan_hash: [u8; 32],
        cooldown_end: i64,
        mentor: Pubkey,
        mentor_timeout: i64,
    ) -> Result<()> {
        let vault = &mut ctx.accounts.vault_account;
        vault.owner = *ctx.accounts.owner.key;
        vault.status = 0; // initial locked
        vault.unlock_strategy = unlock_strategy;
        vault.token_vault = Pubkey::default();
        vault.plan_hash = plan_hash;
        vault.cooldown_end = cooldown_end;
        vault.mentor = mentor;
        vault.mentor_timeout = mentor_timeout;
        vault.mentor_approval_status = 0; // initial pending

        msg!("Greetings from: {:?}", ctx.program_id);

        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        // Create the CpiContext for the token transfer
        let cpi_accounts = SplTransfer {
            from: ctx.accounts.user_token_account.to_account_info(),
            to: ctx.accounts.vault_token_account.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
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

    pub fn submit_plan(ctx: Context<SubmitPlan>, plan_hash: [u8; 32]) -> Result<()> {
        let vault = &mut ctx.accounts.vault_account;
        vault.plan_hash = plan_hash;

        if vault.unlock_strategy == 0 {
            vault.status = 1; // unlock the vault
        } else if vault.unlock_strategy == 1 {
            vault.mentor_approval_status = 0; // reset mentor approval status
            msg!("Mentor approval resetted for new plan");
        } else {
            return Err(ErrorCode::InvalidUnlockStrategy.into());
        }

        msg!("Plan submitted with hash: {:?}", plan_hash);

        Ok(())
    }

    pub fn mentor_approve(ctx: Context<MentorApprove>) -> Result<()> {
        let vault = &mut ctx.accounts.vault_account;

        // Check if the mentor is the same as the one in the vault account
        if ctx.accounts.mentor.key() != vault.mentor {
            return Err(ErrorCode::WrongMentor.into());
        }

        // Check if the plan is submitted
        if vault.plan_hash == [0; 32] {
            return Err(ErrorCode::NoPlanSubmitted.into());
        }

        // Approve the plan
        vault.mentor_approval_status = 1; // approved
        vault.status = 1; // unlock the vault

        msg!("Mentor approved the plan");

        Ok(())
    }

    pub fn mentor_reject(ctx: Context<MentorReject>) -> Result<()> {
        let vault = &mut ctx.accounts.vault_account;

        // Check if the mentor is the same as the one in the vault account
        if ctx.accounts.mentor.key() != vault.mentor {
            return Err(ErrorCode::WrongMentor.into());
        }

        // Check if the plan is submitted
        if vault.plan_hash == [0; 32] {
            return Err(ErrorCode::NoPlanSubmitted.into());
        }

        // Reject the plan
        vault.mentor_approval_status = 2; // rejected

        msg!("Mentor rejected the plan");

        Ok(())
    }

    pub fn change_mentor(ctx: Context<ChangeMentor>, new_mentor: Pubkey, mentor_timeout: i64) -> Result<()> {
        let vault = &mut ctx.accounts.vault_account;

        // Check if the new mentor is different from the current one
        if vault.mentor == new_mentor {
            return Err(ErrorCode::MentorNotChanged.into());
        }

        // Change the mentor
        vault.mentor = new_mentor;
        vault.mentor_timeout = mentor_timeout;
        vault.mentor_approval_status = 0; // reset mentor approval status
        vault.status = 0; // lock the vault

        msg!("Mentor changed to: {:?}", new_mentor);

        Ok(())
    }

    pub fn switch_to_solo_mode(ctx: Context<SwitchToSoloMode>, cooldown_end: i64) -> Result<()> {
        let vault = &mut ctx.accounts.vault_account;

        // Check if in mentor approval mode
        if vault.unlock_strategy != 1 {
            return Err(ErrorCode::InvalidUnlockStrategy.into());
        }

        // Switch to solo mode
        vault.unlock_strategy = 0; // cooldown strategy
        vault.mentor_approval_status = 0; // reset mentor approval status
        vault.status = 0; // lock the vault
        vault.cooldown_end = cooldown_end;

        msg!("Switched to solo mode");

        Ok(())
    }

}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut, signer)]
    pub owner: Signer<'info>,

    #[account(
        init, // create the account,
        payer = owner, // who pays for the account creation
        space = 8 + std::mem::size_of::<VaultAccount>(),
        seeds = [b"vault", owner.key().as_ref()],
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
    pub mentor_timeout: i64, // mentor timeout in Unix timestamp
    pub mentor: Pubkey,
    pub mentor_approval_status: u8, // 0 = pending, 1 = approved, 2 = rejected
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign

    #[account(
        mut, // The user's account balance will change so it is mutable,
        token::mint = mint, // ensure this token account holds the correct token type
        token::authority = owner, //ensure the owner is the authority over this token account
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        // TODO: There seems to be issue with init_if_needed, comment for now
        // init_if_needed, // Create the ATA if it doesn't exist, simplifying user flow (doesnt need separate action to create the ATA)
        // payer = owner, // Owner pays for creation if needed
        mut, // The vault ATA must already exist and is mutable
        token::mint = mint, // Ensure the correct token type
        token::authority = vault_account, // Ensure the vault PDA is the authority over this
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    #[account(address = anchor_spl::token::ID)]
    pub token_program: Program<'info, Token>, // The SPL token program itself

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

#[derive(Accounts)]
pub struct SubmitPlan<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
        has_one = owner @ crate::ErrorCode::Unauthorized, 
    )]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign
}

#[derive(Accounts)]
pub struct MentorApprove<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
        has_one = owner @ crate::ErrorCode::Unauthorized,
    )]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    /// CHECK: The owner wallet is only used to verify the PDA
    #[account()]
    pub owner: AccountInfo<'info>, // The vault owner wallet, need to sign

    #[account(mut, signer)]
    pub mentor: Signer<'info>, // The user's wallet, need to sign
}

#[derive(Accounts)]
pub struct MentorReject<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
        has_one = owner @ crate::ErrorCode::Unauthorized,
    )]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    /// CHECK: The owner wallet is only used to verify the PDA
    #[account()]
    pub owner: AccountInfo<'info>, // The vault owner wallet, need to sign

    #[account(mut, signer)]
    pub mentor: Signer<'info>, // The user's wallet, need to sign
}

#[derive(Accounts)]
pub struct ChangeMentor<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
        has_one = owner @ crate::ErrorCode::Unauthorized, 
    )]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign
}


#[derive(Accounts)]
pub struct SwitchToSoloMode<'info> {
    #[account(
        mut,
        seeds = [b"vault", owner.key().as_ref()],
        bump,
        has_one = owner @ crate::ErrorCode::Unauthorized, 
    )]
    pub vault_account: Account<'info, VaultAccount>, // The vault PDA

    #[account(mut, signer)]
    pub owner: Signer<'info>, // The user's wallet, need to sign
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

    #[msg("Mentor has not been changed")]
    MentorNotChanged,

    #[msg("Mentor is not the same as the one in the vault account")]
    WrongMentor,

    #[msg("No plan submitted")]
    NoPlanSubmitted,

    #[msg("Not valid unlock")]
    InvalidUnlockStrategy
}
