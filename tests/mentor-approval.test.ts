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

describe('commitvault - mentor approval', () => {
	const { program, provider } = getProgram();
	const { unlockStrategy, planHash, cooldownEnd, mentor } =
		getVaultDefaultValues();

	it('allows mentor approval', async () => {
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

		// Assert the mentor approval status is pending
		assert.strictEqual(
			updatedVaultAccount.mentorApprovalStatus,
			0,
			'Mentor approval status should be pending',
		);

		await program.methods
			.mentorApprove()
			.accounts({
				vaultAccount: vaultAccountPDA,
				mentor: mentor.publicKey,
				owner: owner.publicKey,
			} as any)
			.signers([mentor])
			.rpc();

		// Assert the mentor approval status is approved
		const approvedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		assert.strictEqual(
			approvedVaultAccount.mentorApprovalStatus,
			1,
			'Mentor approval status should be approved',
		);
		// Assert the vault is unlocked
		assert.strictEqual(
			approvedVaultAccount.status,
			1,
			'Vault should be unlocked after mentor approval',
		);
	}); // end it block

	it('allows mentor rejection', async () => {
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

		// Assert the mentor approval status is pending
		assert.strictEqual(
			updatedVaultAccount.mentorApprovalStatus,
			0,
			'Mentor approval status should be pending',
		);

		await program.methods
			.mentorReject()
			.accounts({
				vaultAccount: vaultAccountPDA,
				mentor: mentor.publicKey,
				owner: owner.publicKey,
			} as any)
			.signers([mentor])
			.rpc();

		// Assert the mentor approval status is rejected
		const rejectedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		assert.strictEqual(
			rejectedVaultAccount.mentorApprovalStatus,
			2,
			'Mentor approval status should be rejected',
		);

		// Assert the vault is  locked
		assert.strictEqual(
			rejectedVaultAccount.status,
			0,
			'Vault should still be locked after mentor rejection',
		);
	}); // end it block
});
