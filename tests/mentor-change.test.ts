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
import { BN } from 'bn.js';

describe('commitvault - mentor change', () => {
	const { program, provider } = getProgram();
	const { mentorTimeout, planHash, cooldownEnd, mentor } =
		getVaultDefaultValues();

	it('allows mentor change', async () => {
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

		// Assert initial mentor is still the same
		assert.ok(
			updatedVaultAccount.mentor.equals(mentor.publicKey),
			'Initial mentor should still be the same',
		);

		const newMentor = anchor.web3.Keypair.generate();

		await program.methods
			.changeMentor(newMentor.publicKey, new BN(mentorTimeout))
			.accounts({
				vaultAccount: vaultAccountPDA,
				owner: owner.publicKey,
			} as any)
			.signers([owner])
			.rpc();

		// Assert the new mentor is set
		const changedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		assert.ok(
			changedVaultAccount.mentor.equals(newMentor.publicKey),
			'New mentor should be set',
		);

		// Assert the mentor approval status is pending
		assert.strictEqual(
			changedVaultAccount.mentorApprovalStatus,
			0,
			'Mentor approval status should be pending',
		);
		// Assert the vault is still locked
		assert.strictEqual(
			changedVaultAccount.status,
			0,
			'Vault should still be locked after mentor change',
		);
	}); // end it block
});
