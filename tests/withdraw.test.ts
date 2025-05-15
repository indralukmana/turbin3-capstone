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
	simulateTimePassing,
} from './utils';
import { initializeVault, setupVaultWithDeposit } from './utils.methods';
import { BN } from 'bn.js';

describe('commitvault - withdraw', () => {
	const { program, provider } = getProgram();
	const { unlockStrategy, planHash, cooldownEnd, mentor } =
		getVaultDefaultValues();

	const amountToDeposit = 100 * Math.pow(10, 6);

	it('solo mode - disallows withdrawing before plan submission from the vault even when cooldown is met', async () => {
		const {
			userTokenAccount,
			vaultAccountPDA,
			vaultATAAddress,
			userTokenBalanceAfterDeposit,
			userTokenBalanceBeforeDeposit,
			vaultTokenBalanceBeforeDeposit,
			owner,
			mint,
		} = await setupVaultWithDeposit({
			amountToDeposit,
			unlockStrategy,
			cooldownEnd,
			planHash,
			program,
			provider,
		});

		await simulateTimePassing(provider);

		try {
			await program.methods
				.withdraw(new BN(amountToDeposit))
				.accounts({
					vaultAccount: vaultAccountPDA,
					owner: owner.publicKey,
					userTokenAccount: userTokenAccount.address,
					vaultTokenAccount: vaultATAAddress,
					tokenProgram: spl.TOKEN_PROGRAM_ID,
					associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: anchor.web3.SystemProgram.programId,
					mint: mint.publicKey,
				} as any)
				.signers([owner])
				.rpc();
		} catch (error) {
			const vaultAccount = await program.account.vaultAccount.fetch(
				vaultAccountPDA,
			);
			const vaultPlanHash = vaultAccount.planHash;
			assert.deepEqual(
				vaultPlanHash,
				planHash,
				'Vault plan hash should not be changed',
			);

			const vaultStatus = vaultAccount.status;
			assert.equal(vaultStatus, 0, 'Vault status should be 0 (locked)');

			// Cooldown has passed
			const vaultCooldownEnd = vaultAccount.cooldownEnd.toNumber();
			const afterSlot = await provider.connection.getSlot();
			const afterTime = await provider.connection.getBlockTime(afterSlot);

			assert.isTrue(
				afterTime >= vaultCooldownEnd,
				'Vault cooldown end should be greater than or equal to current time',
			);
		}
	});

	it('solo mode - allows withdraw after plan submitted and when cooldown has passed', async () => {
		const {
			userTokenAccount,
			vaultAccountPDA,
			vaultATAAddress,
			userTokenBalanceAfterDeposit,
			userTokenBalanceBeforeDeposit,
			vaultTokenBalanceBeforeDeposit,
			owner,
			mint,
		} = await setupVaultWithDeposit({
			amountToDeposit,
			unlockStrategy,
			cooldownEnd,
			planHash,
			program,
			provider,
		});

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
		const vaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		const vaultPlanHash = vaultAccount.planHash;
		assert.deepEqual(
			vaultPlanHash,
			newPlanHash,
			'Vault plan hash should be updated',
		);
		const vaultStatus = vaultAccount.status;
		assert.equal(vaultStatus, 1, 'Vault status should be unlocked');

		await simulateTimePassing(provider);

		await program.methods
			.withdraw(new BN(amountToDeposit))
			.accounts({
				vaultAccount: vaultAccountPDA,
				owner: owner.publicKey,
				userTokenAccount: userTokenAccount.address,
				vaultTokenAccount: vaultATAAddress,
				tokenProgram: spl.TOKEN_PROGRAM_ID,
				associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
				systemProgram: anchor.web3.SystemProgram.programId,
				mint: mint.publicKey,
			} as any)
			.signers([owner])
			.rpc();

		// 4. Assert that the withdrawal is successful and token balances are updated correctly.
		const userTokenBalanceAfterWithdraw =
			await provider.connection.getTokenAccountBalance(
				userTokenAccount.address,
			);

		const vaultTokenBalanceAfterWithdraw =
			await provider.connection.getTokenAccountBalance(vaultATAAddress);
		assert.equal(
			Number(userTokenBalanceAfterWithdraw.value.amount),
			Number(userTokenBalanceBeforeDeposit.value.amount) +
				Number(userTokenBalanceAfterDeposit.value.amount),
			'User token balance after withdraw is incorrect',
		);

		assert.equal(
			Number(vaultTokenBalanceAfterWithdraw.value.amount),
			Number(vaultTokenBalanceBeforeDeposit.value.amount) -
				Number(userTokenBalanceAfterDeposit.value.amount),
			'Vault token balance after withdraw is incorrect',
		);
	});

	it('solo mode - disallows withdrawing before cooldown', async () => {
		const { userTokenAccount, vaultAccountPDA, vaultATAAddress, owner, mint } =
			await setupVaultWithDeposit({
				amountToDeposit,
				unlockStrategy,
				cooldownEnd,
				planHash,
				program,
				provider,
			});

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
		const vaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		const vaultPlanHash = vaultAccount.planHash;
		assert.deepEqual(
			vaultPlanHash,
			newPlanHash,
			'Vault plan hash should be updated',
		);
		const vaultStatus = vaultAccount.status;
		assert.equal(vaultStatus, 1, 'Vault status should be unlocked');

		try {
			await program.methods
				.withdraw(new BN(amountToDeposit))
				.accounts({
					vaultAccount: vaultAccountPDA,
					owner: owner.publicKey,
					userTokenAccount: userTokenAccount.address,
					vaultTokenAccount: vaultATAAddress,
					tokenProgram: spl.TOKEN_PROGRAM_ID,
					associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: anchor.web3.SystemProgram.programId,
					mint: mint.publicKey,
				} as any)
				.signers([owner])
				.rpc();
		} catch (error) {
			assert.isTrue(
				error.toString().includes('VaultStillLockedByCooldown'),
				'Expected error: VaultStillLockedByCooldown',
			);
		}
	});

	it('mentor mode - disallows withdrawing without mentor approval', async () => {
		const { userTokenAccount, vaultAccountPDA, vaultATAAddress, owner, mint } =
			await setupVaultWithDeposit({
				amountToDeposit,
				unlockStrategy: 1,
				cooldownEnd,
				planHash,
				program,
				provider,
				mentor,
				mentorTimeout: 1,
			});

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
		const vaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		const vaultPlanHash = vaultAccount.planHash;
		assert.deepEqual(
			vaultPlanHash,
			newPlanHash,
			'Vault plan hash should be updated',
		);
		const vaultStatus = vaultAccount.status;
		assert.equal(
			vaultStatus,
			0,
			'Vault status should still be locked waiting for mentor approval',
		);

		try {
			await program.methods
				.withdraw(new BN(amountToDeposit))
				.accounts({
					vaultAccount: vaultAccountPDA,
					owner: owner.publicKey,
					userTokenAccount: userTokenAccount.address,
					vaultTokenAccount: vaultATAAddress,
					tokenProgram: spl.TOKEN_PROGRAM_ID,
					associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: anchor.web3.SystemProgram.programId,
					mint: mint.publicKey,
				} as any)
				.signers([owner])
				.rpc();
		} catch (error) {
			assert.isTrue(
				error.toString().includes('MentorApprovalPendingOrRejected'),
				'Expected error: MentorApprovalPendingOrRejected',
			);
		}
	});

	it('mentor mode - allows withdraw after plan mentor approved', async () => {
		const {
			userTokenAccount,
			vaultAccountPDA,
			vaultATAAddress,
			userTokenBalanceAfterDeposit,
			userTokenBalanceBeforeDeposit,
			vaultTokenBalanceBeforeDeposit,
			owner,
			mint,
		} = await setupVaultWithDeposit({
			amountToDeposit,
			unlockStrategy: 1,
			cooldownEnd,
			planHash,
			program,
			provider,
			mentor,
			mentorTimeout: 1,
		});

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

		const updatedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		const vaultPlanHash = updatedVaultAccount.planHash;
		assert.deepEqual(
			vaultPlanHash,
			newPlanHash,
			'Vault plan hash should be updated',
		);
		const vaultStatus = updatedVaultAccount.status;
		assert.equal(vaultStatus, 0, 'Vault status should be locked');

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

		await program.methods
			.withdraw(new BN(amountToDeposit))
			.accounts({
				vaultAccount: vaultAccountPDA,
				owner: owner.publicKey,
				userTokenAccount: userTokenAccount.address,
				vaultTokenAccount: vaultATAAddress,
				tokenProgram: spl.TOKEN_PROGRAM_ID,
				associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
				systemProgram: anchor.web3.SystemProgram.programId,
				mint: mint.publicKey,
			} as any)
			.signers([owner])
			.rpc();

		// 4. Assert that the withdrawal is successful and token balances are updated correctly.
		const userTokenBalanceAfterWithdraw =
			await provider.connection.getTokenAccountBalance(
				userTokenAccount.address,
			);

		const vaultTokenBalanceAfterWithdraw =
			await provider.connection.getTokenAccountBalance(vaultATAAddress);
		assert.equal(
			Number(userTokenBalanceAfterWithdraw.value.amount),
			Number(userTokenBalanceBeforeDeposit.value.amount) +
				Number(userTokenBalanceAfterDeposit.value.amount),
			'User token balance after withdraw is incorrect',
		);

		assert.equal(
			Number(vaultTokenBalanceAfterWithdraw.value.amount),
			Number(vaultTokenBalanceBeforeDeposit.value.amount) -
				Number(userTokenBalanceAfterDeposit.value.amount),
			'Vault token balance after withdraw is incorrect',
		);
	});

	it('disallow withdrawal by wrong owner', async () => {
		const {
			userTokenAccount,
			vaultAccountPDA,
			vaultATAAddress,
			userTokenBalanceAfterDeposit,
			vaultTokenBalanceAfterDeposit,
			owner,
			mint,
		} = await setupVaultWithDeposit({
			amountToDeposit,
			unlockStrategy: 1,
			cooldownEnd,
			planHash,
			program,
			provider,
			mentor,
			mentorTimeout: 1,
		});

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

		const updatedVaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
		);
		const vaultPlanHash = updatedVaultAccount.planHash;
		assert.deepEqual(
			vaultPlanHash,
			newPlanHash,
			'Vault plan hash should be updated',
		);
		const vaultStatus = updatedVaultAccount.status;
		assert.equal(vaultStatus, 0, 'Vault status should be locked');

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

		try {
			const wrongOwner = anchor.web3.Keypair.generate();
			await program.methods
				.withdraw(new BN(amountToDeposit))
				.accounts({
					vaultAccount: vaultAccountPDA,
					owner: wrongOwner.publicKey,
					userTokenAccount: userTokenAccount.address,
					vaultTokenAccount: vaultATAAddress,
					tokenProgram: spl.TOKEN_PROGRAM_ID,
					associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
					systemProgram: anchor.web3.SystemProgram.programId,
					mint: mint.publicKey,
				} as any)
				.signers([wrongOwner])
				.rpc();
		} catch (error) {
			assert.isTrue(
				error.toString().includes('ConstraintSeeds'),
				'Expected error: ConstraintSeeds',
			);
		}

		// Assert that the withdrawal is unsuccessful and token balances still same.
		const vaultTokenBalanceAfterWithdraw =
			await provider.connection.getTokenAccountBalance(vaultATAAddress);

		assert.equal(
			Number(vaultTokenBalanceAfterWithdraw.value.amount),
			Number(vaultTokenBalanceAfterDeposit.value.amount),
			'Vault token balance after withdraw is incorrect',
		);
	});
});
