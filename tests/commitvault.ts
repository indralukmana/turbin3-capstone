import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Commitvault } from '../target/types/commitvault';
import { assert } from 'chai';

describe('commitvault', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.commitvault as Program<Commitvault>;

	it('Is initialized!', async () => {
		// Generate a new keypair for the user (owner)
		const owner = anchor.web3.Keypair.generate();

		// Request 10 SOL airdrop to the owner account
		await provider.connection.confirmTransaction(
			await provider.connection.requestAirdrop(owner.publicKey, 10000000000), // Airdrop 10 SOL
		);

		// Find the PDA address for the vault account
		const [vaultAccountPDA, _vaultBump] =
			anchor.web3.PublicKey.findProgramAddressSync(
				[Buffer.from('vault'), owner.publicKey.toBuffer()],
				program.programId,
			);

		// Define instruction arguments (example values)
		const unlockStrategy = 0; // Cooldown
		const planHash = Array.from(Buffer.alloc(32, 0)); // Example hash
		const cooldownEnd = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days from now
		const mentor = anchor.web3.PublicKey.unique(); // Example mentor key

		// Call initialize function
		const tx = await program.methods
			.initialize(unlockStrategy, planHash, new anchor.BN(cooldownEnd), mentor)
			.accounts({
				user: owner.publicKey, // The user account signing the transaction
			})
			.signers([owner])
			.rpc();

		console.log('Your transaction signature', tx);

		// Fetch the created vault account
		const vaultAccount = await program.account.vaultAccount.fetch(
			vaultAccountPDA,
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
		assert.ok(vaultAccount.mentor.equals(mentor));
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
