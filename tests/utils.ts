import * as anchor from '@coral-xyz/anchor';
import { Commitvault } from '../target/types/commitvault';

const ONE_SOL = 100_0000_000; // 1 SOL in lamports

export const airdropToAddress = async (
	provider: anchor.AnchorProvider,
	addressToAirdrop: anchor.web3.PublicKey,
	airdropAmount?: number,
) => {
	// const solBalanceBefore = await provider.connection.getBalance(
	// 	addressToAirdrop,
	// );
	// console.log(
	// 	`BEFORE: SOL balance of ${addressToAirdrop.toBase58()}: ${
	// 		solBalanceBefore / anchor.web3.LAMPORTS_PER_SOL
	// 	} SOL`,
	// );

	const amount = airdropAmount ? airdropAmount : ONE_SOL;

	const airdropSignature = await provider.connection.requestAirdrop(
		addressToAirdrop,
		amount,
	);
	const latestBlockhash = await provider.connection.getLatestBlockhash();
	await provider.connection.confirmTransaction({
		signature: airdropSignature,
		blockhash: latestBlockhash.blockhash,
		lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
	});

	// const solBalanceAfter = await provider.connection.getBalance(
	// 	addressToAirdrop,
	// );
	// console.log(
	// 	`AFTER: SOL balance of ${addressToAirdrop.toBase58()}: ${
	// 		solBalanceAfter / anchor.web3.LAMPORTS_PER_SOL
	// 	} SOL`,
	// );

	return {
		airdropSignature,
	};
};

// Find the PDA address for the vault account
export const getVaultPDA = (owner: anchor.web3.Keypair) => {
	const { program } = getProgram();
	return anchor.web3.PublicKey.findProgramAddressSync(
		[Buffer.from('vault'), owner.publicKey.toBuffer()],
		program.programId,
	);
};

export const getProgram = () => {
	// Configure the client to use the local cluster.
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.commitvault as anchor.Program<Commitvault>;

	return { program, provider };
};

export const getVaultDefaultValues = () => {
	// vault default values
	const unlockStrategy = 0; // Cooldown
	const planHash = Array.from(Buffer.alloc(32, 0)); // Example hash
	// const cooldownEnd = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 1; // 1 days from now. Cannot be reasonably used for testing on solana-test-validator.
	const cooldownEnd = Math.floor(Date.now() / 1000) + 3; // 3 second from now. For testing on solana-test-validator.
	const mentor = anchor.web3.Keypair.generate();
	const mentorTimeout = Math.floor(Date.now() / 1000) + 3; // 3 second from now. For testing on solana-test-validator.

	return { unlockStrategy, planHash, cooldownEnd, mentor, mentorTimeout };
};

/**
 * This is unreliable time simulation. A much better way to simulate time is using Solana
 * Bankrun test framework. This is just a placeholder for the current solana-test-validator.
 * The current test work can't be used for testing time in precise way.
 *
 * https://solana.com/developers/guides/advanced/testing-with-jest-and-bankrun
 *
 */
export const simulateTimePassing = async (provider: anchor.AnchorProvider) => {
	const beforeSlot = await provider.connection.getSlot();
	const beforeTime = await provider.connection.getBlockTime(beforeSlot);
	console.log(`Before time: ${new Date(beforeTime * 1000)}`);

	const slotAdvancement = 10;
	for (let i = 0; i < slotAdvancement; i++) {
		await airdropToAddress(provider, anchor.web3.PublicKey.unique());
	}

	// Verify time advancement
	const afterSlot = await provider.connection.getSlot();
	const afterTime = await provider.connection.getBlockTime(afterSlot);

	console.log(`After time: ${new Date(afterTime * 1000)}`);
	console.log(`Slots advanced: ${afterSlot - beforeSlot}`);
	console.log(`Time advanced: ${afterTime - beforeTime} seconds`);
};
