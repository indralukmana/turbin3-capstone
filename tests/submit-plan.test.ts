import * as anchor from '@coral-xyz/anchor';
import * as spl from '@solana/spl-token';
import { Commitvault } from '../target/types/commitvault';
import { assert } from 'chai';
import { SystemProgram } from '@solana/web3.js';
import {
	airdropToAddress,
	getProgram,
	getVaultDefaultValues,
	getVaultPDA,
} from './utils';
import { initializeVault, setupVaultWithDeposit } from './utils.methods';

describe('commitvault - submit plan', () => {
	const { program, provider } = getProgram();
	const { unlockStrategy, planHash, cooldownEnd, mentor } =
		getVaultDefaultValues();

	it('allows submitting a plan', async () => {
		const { owner, vaultAccountPDA, vaultATAAddress } =
			await setupVaultWithDeposit({
				provider,
				program,
				unlockStrategy,
				planHash,
				cooldownEnd,
			});

		// Initial plan hash hasn't changed yet
		const vaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);

		// Assert the initial plan hash
		assert.deepEqual(
			vaultAccount.planHash,
			planHash,
			'Initial plan hash should match the initial plan hash',
		);

		// Submit a new plan hash
		const newPlanHash = Array.from(Buffer.alloc(32, 1)); // Test new hash

		await program.methods
			.submitPlan(newPlanHash)
			.accounts({
				vaultAccount: vaultAccountPDA,
				tokenVault: vaultATAAddress,
				owner: owner.publicKey,
			})
			.signers([owner])
			.rpc();

		// Fetch the updated vault account
		const updatedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		// Assert the updated plan hash
		assert.deepEqual(
			updatedVaultAccount.planHash,
			newPlanHash,
			'Updated plan hash should match the new plan hash',
		);
	}); // end of `it` block

	it('allows submitting a plan in solo mode - cooldown unlock strategy', async () => {
		const { owner, vaultAccountPDA, vaultATAAddress } =
			await setupVaultWithDeposit({
				provider,
				program,
				unlockStrategy: 0,
				planHash,
				cooldownEnd,
			});

		const vaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);

		// is the vault in cooldown mode?
		assert.strictEqual(
			vaultAccount.unlockStrategy,
			0,
			'Vault should be in cooldown mode',
		);

		// Submit a new plan hash
		const newPlanHash = Array.from(Buffer.alloc(32, 1)); // Test new hash
		await program.methods
			.submitPlan(newPlanHash)
			.accounts({
				vaultAccount: vaultAccountPDA,
				tokenVault: vaultATAAddress,
				owner: owner.publicKey,
			})
			.signers([owner])
			.rpc();

		// Fetch the updated vault account
		const updatedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		// Assert the updated plan hash
		assert.deepEqual(
			updatedVaultAccount.planHash,
			newPlanHash,
			'Updated plan hash should match the new plan hash',
		);
		// Assert the vault is unlocked
		assert.strictEqual(
			updatedVaultAccount.status,
			1,
			'Vault should be unlocked',
		);
	}); // end of `it` block

	it('allows submitting a plan in mentor mode - approval unlock strategy', async () => {
		const { owner, vaultAccountPDA, vaultATAAddress } =
			await setupVaultWithDeposit({
				provider,
				program,
				unlockStrategy: 1,
				planHash,
				cooldownEnd,
				mentor,
			});

		const vaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);

		// is the vault in mentor mode?
		assert.strictEqual(
			vaultAccount.unlockStrategy,
			1,
			'Vault should be in mentor mode',
		);

		const newPlanHash = Array.from(Buffer.alloc(32, 1)); // Test new hash
		await program.methods
			.submitPlan(newPlanHash)
			.accounts({
				vaultAccount: vaultAccountPDA,
				tokenVault: vaultATAAddress,
				owner: owner.publicKey,
			})
			.signers([owner])
			.rpc();

		// Assert the updated plan hash
		const updatedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		assert.deepEqual(
			updatedVaultAccount.planHash,
			newPlanHash,
			'Updated plan hash should match the new plan hash',
		);
		// Assert the vault is locked
		assert.strictEqual(updatedVaultAccount.status, 0, 'Vault should be locked');
	});
});
