import { mintV1 } from "@metaplex-foundation/mpl-core-candy-machine";
import {
  generateSigner,
  publicKey,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";

// Function to mint an NFT from an existing Candy Machine
export async function mintNftFromCandyMachine({
  umiInstance,
  candyMachineId,
  coreCollection,
  minterWallet,
}: {
  umiInstance: any;
  candyMachineId: string;
  coreCollection: string;
  minterWallet: any;
}) {
  try {
    // Set up the asset to be minted
    const asset = generateSigner(umiInstance);

    // Build and send the mint transaction
    await transactionBuilder()
      .add(setComputeUnitLimit(umiInstance, { units: 300_000 }))
      .add(
        mintV1(umiInstance, {
          candyMachine: publicKey(candyMachineId),
          asset,
          collection: publicKey(coreCollection),
          owner: minterWallet.publicKey,
        })
      )
      .sendAndConfirm(umiInstance);

    // console.log("NFT Minted Successfully:", asset.publicKey.toString());
  } catch (error) {
    console.error("Error minting NFT from Candy Machine:", error);
    throw new Error("Failed to mint NFT from Candy Machine");
  }
}
