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

  const nft = createNft(umi, {
    mint: collectionMint,
    name: "Elixr",
    symbol: "ELX",
    uri: "",
    sellerFeeBasisPoints: percentAmount(0),
    isCollection: true,
  });

  await nft.sendAndConfirm(umi);

  const createdNft = await fetchDigitalAsset(umi, collectionMint.publicKey);

  console.log(
    `Collection Created: `,
    getExplorerLink("tx", createdNft.mint.publicKey, "devnet"),
  );
}
