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
    { feePayer: feePayer===undefined ? owner : feePayer },
    {
      newAccountPubkey: mint.publicKey,
      lamports: mintRent,
    },
  );

  const recipient = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    mint.publicKey,
    owner,
  );

  const createAssociatedTokenAccountTx = new CreateAssociatedTokenAccount(
    { feePayer: feePayer===undefined ? owner : feePayer },
    {
      associatedTokenAddress: recipient,
      splTokenMintAddress: mint.publicKey,
    },
  );

  const mintToTx = new MintTo(
    { feePayer: feePayer===undefined ? owner : feePayer },
    {
      mint: mint.publicKey,
      dest: recipient,
      amount: 1,
    },
  );

  return { mint, createMintTx, createAssociatedTokenAccountTx, mintToTx, recipient };
}
