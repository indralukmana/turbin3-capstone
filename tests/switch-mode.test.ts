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

describe('commitvault - switch mode', () => {
	const { program, provider } = getProgram();
	const { mentorTimeout, planHash, cooldownEnd, mentor } =
		getVaultDefaultValues();

	it('allows switching to solo mode', async () => {
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

		await program.methods
			.switchToSoloMode(new BN(cooldownEnd))
			.accounts({
				vaultAccount: vaultAccountPDA,
				owner: owner.publicKey,
			})
			.signers([owner])
			.rpc();

		// Assert the updated unlock strategy
		const updatedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);

		assert.strictEqual(
			updatedVaultAccount.unlockStrategy,
			0,
			'Vault should be in solo mode',
		);

		// Assert the vault is locked
		assert.strictEqual(updatedVaultAccount.status, 0, 'Vault should be locked');
		// Assert the mentor approval status is pending
		assert.strictEqual(
			updatedVaultAccount.mentorApprovalStatus,
			0,
			'Mentor approval status should be pending',
		);
		// Assert the cooldown end is updated
		assert.strictEqual(
			updatedVaultAccount.cooldownEnd.toNumber(),
			cooldownEnd,
			'Cooldown end should be updated',
		);
	}); // end it block
});
