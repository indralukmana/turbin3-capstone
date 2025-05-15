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
import { initializeVault } from './utils.methods';

describe('commitvault - initialize', () => {
	const { program, provider } = getProgram();
	const { unlockStrategy, planHash, cooldownEnd, mentor, mentorTimeout } =
		getVaultDefaultValues();

	it('can be initialized', async () => {
		// Generate a new keypair for the user (owner)
		const owner = anchor.web3.Keypair.generate();

		// Request 10 SOL airdrop to the owner account
		await airdropToAddress(provider, owner.publicKey);

		const vaultAccount = await initializeVault(
			owner,
			unlockStrategy,
			planHash,
			cooldownEnd,
			mentor.publicKey,
			mentorTimeout,
		);

		// Assert the initial state of the vault account
		assert.equal(vaultAccount.owner.toBase58(), owner.publicKey.toBase58());
		// Check if the initial is locked
		assert.equal(vaultAccount.status, 0);
		// Check the unlock strategy
		assert.equal(vaultAccount.unlockStrategy, unlockStrategy);
		// Check cooldownEnd
		assert.equal(vaultAccount.cooldownEnd.toNumber(), cooldownEnd);
		// check planHash
		assert.deepEqual(vaultAccount.planHash, planHash);
		// check mentor address
		assert.ok(vaultAccount.mentor.equals(mentor.publicKey));
		// check mentor approval
		assert.equal(vaultAccount.mentorApprovalStatus, 0);
		// check the tokenVault address
		assert.ok(
			vaultAccount.tokenVault.equals(
				new anchor.web3.PublicKey(Buffer.alloc(32, 0)),
			),
		); // Check tokenVault is zeroed
	});
});
