import * as anchor from '@coral-xyz/anchor';
import { Commitvault } from '../target/types/commitvault';

const ONE_SOL = 100_0000_000; // 1 SOL in lamports

export const airdropToAddress = async (
	provider: anchor.AnchorProvider,
	addressToAirdrop: anchor.web3.PublicKey,
) => {
	// const solBalanceBefore = await provider.connection.getBalance(
	// 	addressToAirdrop,
	// );
	// console.log(
	// 	`BEFORE: SOL balance of ${addressToAirdrop.toBase58()}: ${
	// 		solBalanceBefore / anchor.web3.LAMPORTS_PER_SOL
	// 	} SOL`,
	// );

	const airdropSignature = await provider.connection.requestAirdrop(
		addressToAirdrop,
		ONE_SOL,
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
	const cooldownEnd = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days from now
	const mentor = anchor.web3.PublicKey.unique(); // Example mentor key

	return { unlockStrategy, planHash, cooldownEnd, mentor };
};
