import { Keypair, PublicKey, SendOptions } from '@solana/web3.js';
import { Wallet } from '../wallet';
import { Connection } from '../Connection';
import { Transaction } from '@metaplex-foundation/mpl-core';

/** Parameters for {@link sendTransaction} **/
export interface SendTransactionParams {
  connection: Connection;
  wallet: Wallet;
  txs: Transaction[];
  signers?: Keypair[];
  options?: SendOptions;
  feePayer?: PublicKey;  //MrChaos
}

/**
 * Sign and send transactions for validation
 * @return This action returns the resulting transaction id once it has been executed
 */
export const sendTransaction = async ({
  connection,
  wallet,
  txs,
  signers = [],
  options,
  feePayer // MrChaos
}: SendTransactionParams): Promise<string> => {
  let tx = Transaction.fromCombined(txs, { feePayer: feePayer ?? wallet.publicKey});  // MrChaos
  tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;

  if (signers.length) {
    tx.partialSign(...signers);
  }
  tx = await wallet.signTransaction(tx);
  console.log("********* web3j-deprecated:sendTransaction - before sendRawTransaction");
  console.log("********* web3j-deprecated:sendTransaction - before sendRawTransaction : signers");
  signers.forEach(signer => {
    console.log("Signer : ",signer.publicKey.toBase58());
  });
  tx.signatures.forEach(signature => {
    console.log("Signer Of TX : ",signature.publicKey.toBase58());
  });
  console.log("********* web3j-deprecated:sendTransaction - before sendRawTransaction - Instructions");  
  tx.instructions.forEach(ins => {
    console.log("******************* Ins Program:",ins.programId.toBase58());
    ins.keys.forEach(k => {
      console.log("Key : ",k.pubkey.toBase58(),", isSigner : ",k.isSigner, ", isWrite : ", k.isWritable);
    });
  });

  console.log("********* web3j-deprecated:sendTransaction - before sendRawTransaction : verify signature=",tx.verifySignatures());
  
  return connection.sendRawTransaction(tx.serialize(), options);
};
