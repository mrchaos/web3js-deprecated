import { Connection, PublicKey } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Wallet } from '../wallet';
import {
  Edition,
  EditionMarker,
  MasterEdition,
  Metadata,
  MintNewEditionFromMasterEditionViaToken,
} from '@metaplex-foundation/mpl-token-metadata';
import { Account } from '@metaplex-foundation/mpl-core';
import BN from 'bn.js';
import { prepareTokenAccountAndMintTxs } from './shared';
import { sendTransaction } from './transactions';

export interface MintEditionFromMasterParams {
  connection: Connection;
  wallet: Wallet;
  masterEditionMint: PublicKey;
  updateAuthority?: PublicKey;
  feePayer? : PublicKey;
}

export interface MintEditionFromMasterResponse {
  txId: string;
  mint: PublicKey;
  metadata: PublicKey;
  edition: PublicKey;
}

export const mintEditionFromMaster = async (
  { connection, wallet, masterEditionMint, updateAuthority,feePayer } = {} as MintEditionFromMasterParams, // MrChaos
): Promise<MintEditionFromMasterResponse> => {
  const masterPDA = await MasterEdition.getPDA(masterEditionMint);
  const masterMetaPDA = await Metadata.getPDA(masterEditionMint);
  const masterInfo = await Account.getInfo(connection, masterPDA);
  const masterData = new MasterEdition(masterPDA, masterInfo).data;

  //take the current outstanding supply and increment by 1
  const editionValue = masterData.supply.add(new BN(1));

  const { mint, createMintTx, createAssociatedTokenAccountTx, mintToTx } = 
  (feePayer === undefined || feePayer == null) ? 
      await prepareTokenAccountAndMintTxs(connection, wallet.publicKey)
      : await prepareTokenAccountAndMintTxs(connection, wallet.publicKey,feePayer); // MrChaos


  const tokenAccount = await Token.getAssociatedTokenAddress(
    ASSOCIATED_TOKEN_PROGRAM_ID,
    TOKEN_PROGRAM_ID,
    masterEditionMint,
    wallet.publicKey,
  );

  const metadataPDA = await Metadata.getPDA(mint.publicKey);
  const editionMarker = await EditionMarker.getPDA(masterEditionMint, editionValue);
  const editionPDA = await Edition.getPDA(mint.publicKey);

  const newEditionFromMasterTx = new MintNewEditionFromMasterEditionViaToken(
    { feePayer: feePayer ?? wallet.publicKey },
    {
      edition: editionPDA, //empty, created inside program
      metadata: metadataPDA, //empty, created inside program
      updateAuthority: updateAuthority ?? wallet.publicKey,
      mint: mint.publicKey,
      mintAuthority: wallet.publicKey,
      masterEdition: masterPDA,
      masterMetadata: masterMetaPDA,
      editionMarker, // empty if this is the 1st limited edition being created
      tokenOwner: wallet.publicKey,
      tokenAccount,
      editionValue,
    },
  );

  const txId = await sendTransaction({
    connection,
    signers: [mint],
    txs: [createMintTx, createAssociatedTokenAccountTx, mintToTx, newEditionFromMasterTx],
    feePayer: feePayer, // MrChaos
    wallet,
  });

  return {
    txId,
    mint: mint.publicKey,
    metadata: metadataPDA,
    edition: editionPDA,
  };
};
