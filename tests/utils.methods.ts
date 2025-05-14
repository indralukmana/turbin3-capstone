import { Commitvault } from '../target/types/commitvault';
import { airdropToAddress, getProgram, getVaultPDA } from './utils';
import * as anchor from '@coral-xyz/anchor';
import * as spl from '@solana/spl-token';

export const initializeVault = async (
	owner: anchor.web3.Keypair,
	unlockStrategy: number,
	planHash: number[],
	cooldownEnd: number,
	mentor: anchor.web3.PublicKey,
) => {
	const { program } = getProgram();
	const tx = await program.methods
		.initialize(unlockStrategy, planHash, new anchor.BN(cooldownEnd), mentor)
		.accounts({
			owner: owner.publicKey, // The user account signing the transaction
		})
		.signers([owner])
		.rpc();

	console.log('Your transaction signature', tx);

	const [vaultAccountPDA] = getVaultPDA(owner);

	// Fetch the created vault account
	const vaultAccount = await program.account.vaultAccount.fetch(
		vaultAccountPDA,
	);

	return vaultAccount;
};

interface setupVaultWithDepositParams {
	provider: anchor.AnchorProvider;
	program: anchor.Program<Commitvault>;
	amountToDeposit: number;
	unlockStrategy: number;
	planHash: number[];
	cooldownEnd: number;
	mentor: anchor.web3.PublicKey;
}

interface setupVaultWithDepositReturn {
	vaultAccountPDA: anchor.web3.PublicKey;
	vaultATAAddress: anchor.web3.PublicKey;
	owner: anchor.web3.Keypair;
	mint: anchor.web3.Keypair;
	mintAuthority: anchor.web3.Keypair;
	userTokenAccount: spl.Account;
	userTokenBalanceBeforeDeposit: anchor.web3.RpcResponseAndContext<anchor.web3.TokenAmount>;
	vaultTokenBalanceBeforeDeposit: anchor.web3.RpcResponseAndContext<anchor.web3.TokenAmount>;
	userTokenBalanceAfterDeposit: anchor.web3.RpcResponseAndContext<anchor.web3.TokenAmount>;
	vaultTokenBalanceAfterDeposit: anchor.web3.RpcResponseAndContext<anchor.web3.TokenAmount>;
}

/**
 * Sets up a vault with a deposited amount for testing.
 * - Creates owner keypair, mints, ATAs, initializes vault, performs deposit.
 * - Returns all relevant keys/accounts for further test assertions.
 */
export async function setupVaultWithDeposit({
	provider,
	program,
	amountToDeposit,
	unlockStrategy = 0,
	planHash = Array(32).fill(1), // Replace with actual hash if needed
	cooldownEnd = Math.floor(Date.now() / 1000) + 3600,
	mentor = anchor.web3.Keypair.generate().publicKey,
}: setupVaultWithDepositParams): Promise<setupVaultWithDepositReturn> {
	// 1. Create owner keypair and airdrop SOL
	const owner = anchor.web3.Keypair.generate();
	await airdropToAddress(provider, owner.publicKey);

	// 2. Create mint and mint authority
	const mint = anchor.web3.Keypair.generate();
	const mintAuthority = anchor.web3.Keypair.generate();
	await airdropToAddress(provider, mintAuthority.publicKey);

	const requiredBalance =
		await provider.connection.getMinimumBalanceForRentExemption(spl.MINT_SIZE);
	const createMintTx = new anchor.web3.Transaction().add(
		anchor.web3.SystemProgram.createAccount({
			fromPubkey: mintAuthority.publicKey,
			newAccountPubkey: mint.publicKey,
			space: spl.MINT_SIZE,
			lamports: requiredBalance,
			programId: spl.TOKEN_PROGRAM_ID,
		}),
		spl.createInitializeMintInstruction(
			mint.publicKey,
			6, // decimals
			mintAuthority.publicKey,
			null,
			spl.TOKEN_PROGRAM_ID,
		),
	);
	await provider.sendAndConfirm(createMintTx, [mintAuthority, mint]);

	// 3. Create user's ATA and mint tokens
	const userTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
		provider.connection,
		owner, // payer
		mint.publicKey,
		owner.publicKey,
	);
	await spl.mintTo(
		provider.connection,
		mintAuthority,
		mint.publicKey,
		userTokenAccount.address,
		mintAuthority,
		amountToDeposit,
	);

	// 4. Derive vault PDA and ATA
	const [vaultAccountPDA] = anchor.web3.PublicKey.findProgramAddressSync(
		[Buffer.from('vault'), owner.publicKey.toBuffer()],
		program.programId,
	);
	const vaultATAAddress = await spl.getAssociatedTokenAddress(
		mint.publicKey,
		vaultAccountPDA,
		true,
		spl.TOKEN_PROGRAM_ID,
		spl.ASSOCIATED_TOKEN_PROGRAM_ID,
	);

	// 5. Initialize vault
	await program.methods
		.initialize(unlockStrategy, planHash, new anchor.BN(cooldownEnd), mentor)
		.accounts({
			vaultAccount: vaultAccountPDA,
			owner: owner.publicKey,
			systemProgram: anchor.web3.SystemProgram.programId,
		} as any)
		.signers([owner])
		.rpc();

	// 6. Create vault ATA if needed
	const vaultATAInfo = await provider.connection.getAccountInfo(
		vaultATAAddress,
	);
	if (!vaultATAInfo) {
		const createATAIx = spl.createAssociatedTokenAccountInstruction(
			owner.publicKey,
			vaultATAAddress,
			vaultAccountPDA,
			mint.publicKey,
			spl.TOKEN_PROGRAM_ID,
			spl.ASSOCIATED_TOKEN_PROGRAM_ID,
		);
		await provider.sendAndConfirm(
			new anchor.web3.Transaction().add(createATAIx),
			[owner],
		);
	}

	// Get token balances BEFORE deposit
	const userTokenBalanceBeforeDeposit =
		await provider.connection.getTokenAccountBalance(userTokenAccount.address);
	const vaultTokenBalanceBeforeDeposit =
		await provider.connection.getTokenAccountBalance(vaultATAAddress);

	// 7. Deposit tokens
	await program.methods
		.deposit(new anchor.BN(amountToDeposit))
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

	// Get token balances AFTER deposit
	const userTokenBalanceAfterDeposit =
		await provider.connection.getTokenAccountBalance(userTokenAccount.address);
	const vaultTokenBalanceAfterDeposit =
		await provider.connection.getTokenAccountBalance(vaultATAAddress);

	// 8. Return everything for assertions
	return {
		owner,
		mint,
		mintAuthority,
		userTokenAccount,
		vaultAccountPDA,
		vaultATAAddress,
		userTokenBalanceBeforeDeposit,
		vaultTokenBalanceBeforeDeposit,
		userTokenBalanceAfterDeposit,
		vaultTokenBalanceAfterDeposit,
	};
}
