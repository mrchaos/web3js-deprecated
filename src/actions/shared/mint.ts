import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  MintLayout,
  Token,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import { CreateAssociatedTokenAccount, CreateMint, MintTo } from '../../transactions';
import { Transaction } from '@metaplex-foundation/mpl-core';

interface MintTxs {
  mint: Keypair;
  // recipient ATA
  recipient: PublicKey;
  createMintTx: Transaction;
  createAssociatedTokenAccountTx: Transaction;
  mintToTx: Transaction;
}

export async function prepareTokenAccountAndMintTxs(
  connection: Connection,
  owner: PublicKey,
  feePayer?: PublicKey
): Promise<MintTxs> {
  const mint = Keypair.generate();
  const mintRent = await connection.getMinimumBalanceForRentExemption(MintLayout.span);
  const createMintTx = new CreateMint(
    { feePayer: feePayer ?? owner}, // MrChaos
    {
      newAccountPubkey: mint.publicKey,
      lamports: mintRent,
      decimals: 0, // MrChaos
      owner: owner,  // MrChaos
      freezeAuthority: owner // MrChaos
    },
  );

  const recipient = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint.publicKey,
    owner,
  );

  const createAssociatedTokenAccountTx = new CreateAssociatedTokenAccount(
    { feePayer: feePayer ?? owner },
    {
      associatedTokenAddress: recipient,
      walletAddress: owner,  // MrChaos
      splTokenMintAddress: mint.publicKey,
    },
  );

  const mintToTx = new MintTo(
    { feePayer: feePayer ?? owner},
    {
      mint: mint.publicKey,
      dest: recipient,
      authority: owner, // MrChaos
      amount: 1,
    },
  );

  return { mint, createMintTx, createAssociatedTokenAccountTx, mintToTx, recipient };
}
