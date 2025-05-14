import * as anchor from '@coral-xyz/anchor';
import * as spl from '@solana/spl-token';
import { Commitvault } from '../target/types/commitvault';
import { assert } from 'chai';
import { SystemProgram } from '@solana/web3.js';

const ONE_SOL = 100_0000_000; // 1 SOL in lamports

const airdropToAddress = async (
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

describe('commitvault', () => {
	// Configure the client to use the local cluster.
	const provider = anchor.AnchorProvider.env();
	anchor.setProvider(provider);

	const program = anchor.workspace.commitvault as anchor.Program<Commitvault>;

	// vault default values
	const unlockStrategy = 0; // Cooldown
	const planHash = Array.from(Buffer.alloc(32, 0)); // Example hash
	const cooldownEnd = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30; // 30 days from now
	const mentor = anchor.web3.PublicKey.unique(); // Example mentor key

	// Find the PDA address for the vault account
	const getVaultPDA = (owner: anchor.web3.Keypair) => {
		return anchor.web3.PublicKey.findProgramAddressSync(
			[Buffer.from('vault'), owner.publicKey.toBuffer()],
			program.programId,
		);
	};

	// Call initialize function
	const initialize = async (
		owner: anchor.web3.Keypair,
		unlockStrategy: number,
		planHash: number[],
		cooldownEnd: number,
		mentor: anchor.web3.PublicKey,
	) => {
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

	it('Is initialized!', async () => {
		// Generate a new keypair for the user (owner)
		const owner = anchor.web3.Keypair.generate();

		// Request 10 SOL airdrop to the owner account
		await airdropToAddress(provider, owner.publicKey);

		const vaultAccount = await initialize(
			owner,
			unlockStrategy,
			planHash,
			cooldownEnd,
			mentor,
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

	it('Allows depositing token into the vault', async () => {
		// Generate new keypair
		const owner = anchor.web3.Keypair.generate();

		console.log(`Owner public key: ${owner.publicKey}`);

		// Request 10 SOL airdrop to the owner account
		await airdropToAddress(provider, owner.publicKey);

		// Create a new mint account for deposited token (e.g USDC)
		const mint = anchor.web3.Keypair.generate();
		const mintAuthority = anchor.web3.Keypair.generate();

		// Request airdrop to mint authority account, the ones going to create/own the token
		await airdropToAddress(provider, mintAuthority.publicKey);

		// Check the minimum balance for a mint account
		const requiredBalance =
			await provider.connection.getMinimumBalanceForRentExemption(
				spl.MINT_SIZE,
			);
		const createMintTx = new anchor.web3.Transaction().add(
			// Instruction 1: Create the account (token)
			SystemProgram.createAccount({
				fromPubkey: mintAuthority.publicKey,
				newAccountPubkey: mint.publicKey,
				space: spl.MINT_SIZE,
				lamports: requiredBalance,
				programId: spl.TOKEN_PROGRAM_ID,
			}),
			// Instruction 2: Initiate the mint
			spl.createInitializeMintInstruction(
				mint.publicKey,
				6, //Decimals
				mintAuthority.publicKey,
				null,
				spl.TOKEN_PROGRAM_ID,
			),
		);

		// Send and confirm the transaction for creating the token
		await provider.sendAndConfirm(createMintTx, [mintAuthority, mint]);
		console.log(`Create a new mint account: ${mint.publicKey}`);

		// Find the PDA address for the vault account
		const [vaultAccountPDA, _vaultBump] = getVaultPDA(owner);

		// initilize vault account
		await initialize(owner, unlockStrategy, planHash, cooldownEnd, mentor);

		// Get or create user's Associated Token Account (ATA) for the mint
		const userTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
			provider.connection,
			owner, // Payer
			mint.publicKey,
			owner.publicKey, // Owner of the ATA
		);
		console.log(`Owner ATA: ${userTokenAccount.address.toBase58()}`);

		// Explicitly derive the expected address of the vault's ATA
		const vaultATAAddress = await spl.getAssociatedTokenAddress(
			mint.publicKey, // Mint
			vaultAccountPDA, // Owner (the vault PDA)
			true, // allowOwnerOffCurve is true for PDAs
			spl.TOKEN_PROGRAM_ID,
			spl.ASSOCIATED_TOKEN_PROGRAM_ID,
		);
		console.log(`Derived Vault ATA Address: ${vaultATAAddress.toBase58()}`);

		// Explicitly create the vault ATA for the vault PDA before deposit
		const vaultATAInfo = await provider.connection.getAccountInfo(
			vaultATAAddress,
		);

		if (vaultATAInfo === null) {
			console.log('vault ATA does not exist, creating explicitly');
			const createATAInstruction = spl.createAssociatedTokenAccountInstruction(
				owner.publicKey, // payer
				vaultATAAddress,
				vaultAccountPDA,
				mint.publicKey,
				spl.TOKEN_PROGRAM_ID,
				spl.ASSOCIATED_TOKEN_PROGRAM_ID,
			);
			const createATATx = new anchor.web3.Transaction().add(
				createATAInstruction,
			);
			await program.provider.sendAndConfirm(createATATx, [owner]);
			console.log('Created vault ATA');
		} else {
			console.log('Vault ATA exist');
		}

		// Amount of tokens to mint (e.g 100 tokens, with 6 decimals)
		const amountToMint = new anchor.BN(100 * Math.pow(10, 6));

		// Mint tokens to the owner's ATA
		const mintToOwnerTx = new anchor.web3.Transaction().add(
			spl.createMintToInstruction(
				mint.publicKey,
				userTokenAccount.address,
				mintAuthority.publicKey,
				amountToMint.toNumber(),
				[],
				spl.TOKEN_PROGRAM_ID,
			),
		);
		// Send and confirm
		await provider.sendAndConfirm(mintToOwnerTx, [mintAuthority]);

		console.log(`Minted ${amountToMint} tokens to user's ATA`);

		const userTokenAccountInfoAfterMint = await spl.getAccount(
			provider.connection,
			userTokenAccount.address,
		);
		console.log(
			`User token account balance: ${userTokenAccountInfoAfterMint.amount.toString()}`,
		);

		// Ammount of tokens to deposit (e.g: 50 tokens)
		const amountToDeposit = new anchor.BN(50 * Math.pow(10, 6));

		// Fetch the user's token account info to verify its authority
		const userTokenAccountInfo = await spl.getAccount(
			provider.connection,
			userTokenAccount.address,
		);
		console.log(
			`User Token Account Authority: ${userTokenAccountInfo.owner.toBase58()}`,
		);

		// Ensure the user token account's authority is the owner
		assert.ok(
			userTokenAccountInfo.owner.equals(owner.publicKey),
			'User token account is not owned by the owner!',
		);

		console.log(
			`Calling deposit instruction with token amount: ${amountToDeposit}`,
		);

		// Get token balances BEFORE deposit
		const userTokenBalanceBeforeDeposit =
			await provider.connection.getTokenAccountBalance(
				userTokenAccount.address,
			);
		const vaultTokenBalanceBeforeDeposit =
			await provider.connection.getTokenAccountBalance(vaultATAAddress);

		// Deposit transaction
		const depositTx = await program.methods
			.deposit(amountToDeposit)
			.accounts({
				vaultAccount: vaultAccountPDA,
				owner: owner.publicKey,
				userTokenAccount: userTokenAccount.address,
				vaultTokenAccount: vaultATAAddress,
				tokenProgram: spl.TOKEN_PROGRAM_ID,
				associatedTokenProgram: spl.ASSOCIATED_TOKEN_PROGRAM_ID,
				systemProgram: anchor.web3.SystemProgram.programId,
				mint: mint.publicKey,
			})
			.signers([owner])
			.rpc();

		console.log(`Deposit transaciton signature ${depositTx}`);

		// Get token balances AFTER deposit
		const userTokenBalanceAfterDeposit =
			await provider.connection.getTokenAccountBalance(
				userTokenAccount.address,
			);
		const vaultTokenBalanceAfterDeposit =
			await provider.connection.getTokenAccountBalance(vaultATAAddress);

		console.log(
			`User token balance before: ${userTokenBalanceBeforeDeposit.value.amount}`,
		);
		console.log(
			`User token balance after: ${userTokenBalanceAfterDeposit.value.amount}`,
		);
		console.log(
			`Vault token balance before: ${vaultTokenBalanceBeforeDeposit.value.amount}`,
		);
		console.log(
			`Vault token balance after: ${vaultTokenBalanceAfterDeposit.value.amount}`,
		);

		// Assert the balance changes
		assert.strictEqual(
			Number(userTokenBalanceBeforeDeposit.value.amount) -
				Number(userTokenBalanceAfterDeposit.value.amount),
			amountToDeposit.toNumber(),
			'User balance should decrease by deposit amount',
		);
		assert.strictEqual(
			Number(vaultTokenBalanceBeforeDeposit.value.amount) +
				Number(vaultTokenBalanceAfterDeposit.value.amount),
			amountToDeposit.toNumber(),
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
