import {
  createNft,
  mplTokenMetadata,
  transferV1,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  airdropIfRequired,
  getKeypairFromFile,
  getExplorerLink,
} from "@solana-developers/helpers";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { clusterApiUrl, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,
} from "@metaplex-foundation/umi";

async function main() {
  const connection = new Connection(clusterApiUrl("devnet"));
  const keypair = await getKeypairFromFile();
  const umi = createUmi(connection.rpcEndpoint);

  umi.use(mplTokenMetadata());

  await airdropIfRequired(
    connection,
    keypair.publicKey,
    1 * LAMPORTS_PER_SOL,
    0.5 * LAMPORTS_PER_SOL,
  );

  console.log("user with public key:", keypair.publicKey.toBase58());

  const user = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
  umi.use(keypairIdentity(user));

  const choices = process.argv;

  switch (choices[2]) {
    case "mint":
      await mintNft(umi);
      break;
    case "send":
      await sendNFT(umi, keypair, connection);
      break;
    default:
      console.error("Error: Invalid command!");
      process.exit(1);
  }
}

async function mintNft(umi: any) {
  const collectionMint = generateSigner(umi);

  console.log("Creating NFT with mint address:", collectionMint.publicKey);

  const result = await createNft(umi, {
    mint: collectionMint,
    name: "Astral Circuit Sovereign",
    symbol: "AST",
    uri: "https://phh5ur14gr.ufs.sh/f/a1wYTWuoYzdPOdLPDjNKgwNaImZbHtfzePkp6nyABJXGRVQ7",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  }).sendAndConfirm(umi);

  console.log("NFT created successfully!");

  const signature = Buffer.from(result.signature).toString("base64");
  console.log("Transaction signature:", signature);

  console.log(`\nCollection Created!`);
  console.log(
    `Explorer Link: ${getExplorerLink("address", collectionMint.publicKey, "devnet")}`,
  );
}

async function sendNFT(umi: any, keypair: any, connection: any) {
  const [receiverAddress, nftMintAddress] = process.argv.slice(3);

  if (!receiverAddress || !nftMintAddress) {
    console.error(
      "Error: Missing arguments! Usage: bun run index.ts send <receiverAddress> <nftMintAddress>",
    );
    process.exit(1);
  }

  const balance = await connection.getBalance(keypair.publicKey);

  console.log(`Your Current SOL Balance: ${balance / LAMPORTS_PER_SOL} SOL`);

  const user = umi.eddsa.createKeypairFromSecretKey(keypair.secretKey);
  umi.use(keypairIdentity(user));

  const receiverUmi = publicKey(receiverAddress);
  const nftMintUmi = publicKey(nftMintAddress);

  console.log(`Transferring NFT to ${receiverAddress}`);

  const result = await transferV1(umi, {
    mint: nftMintUmi,
    authority: umi.identity,
    tokenOwner: user.publicKey,
    destinationOwner: receiverUmi,
    tokenStandard: 0,
  }).sendAndConfirm(umi);

  console.log("NFT Transfer Successful!");
  console.log(`Transaction Signature: ${result.signature}`);
  console.log(
    `Explorer Link: ${getExplorerLink("tx", result.signature.toString(), "devnet")}`,
  );
}

main().catch((error) => {
  console.error(error);
});
