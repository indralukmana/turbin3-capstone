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

describe('commitvault - deposit', () => {
	const { program, provider } = getProgram();
	const { unlockStrategy, planHash, cooldownEnd, mentor, mentorTimeout } =
		getVaultDefaultValues();

	it('allows depositing token into the vault', async () => {
		const amountToDeposit = 100 * Math.pow(10, 6);

		const {
			userTokenBalanceBeforeDeposit,
			userTokenBalanceAfterDeposit,
			vaultTokenBalanceBeforeDeposit,
			vaultTokenBalanceAfterDeposit,
			vaultAccountPDA,
			vaultATAAddress,
		} = await setupVaultWithDeposit({
			provider,
			program,
			amountToDeposit,
			unlockStrategy,
			planHash,
			cooldownEnd,
			mentor,
			mentorTimeout,
		});

		// Assert the balance changes
		assert.strictEqual(
			Number(userTokenBalanceBeforeDeposit.value.amount) -
				Number(userTokenBalanceAfterDeposit.value.amount),
			amountToDeposit,
			'User balance should decrease by deposit amount',
		);
		assert.strictEqual(
			Number(vaultTokenBalanceBeforeDeposit.value.amount) +
				Number(vaultTokenBalanceAfterDeposit.value.amount),
			amountToDeposit,
			'Vault token balance should increase by deposit amount',
		);

		// Assert the vault state and check if it is recorded properly
		const vaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);

		assert.ok(
			vaultATAAddress.equals(vaultAccount.tokenVault),
			'Vault account tokenVault should reflect the correct token vault address',
		);
	}); // end of `it` block
});
