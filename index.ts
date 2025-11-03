import {
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata,
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

  const collectionMint = generateSigner(umi);

  console.log("Creating NFT with mint address:", collectionMint.publicKey);

  const result = await createNft(umi, {
    mint: collectionMint,
    name: "Elixr",
    symbol: "ELX",
    uri: "https://raw.githubusercontent.com/DeepanshuMishraa/nft-mint/refs/heads/master/metadata.json?token=GHSAT0AAAAAADN3AAYM4SHWY6BMI6HDVZEM2IJAMNA",
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

main().catch((error) => {
  console.error(error);
});
