"use client";

import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { EASTER_EGG_ABI, EASTER_EGG_ADDRESS } from "~/lib/contract";
import { APP_CHAIN_ID } from "~/lib/config";

/**
 * Hook for minting an Easter Egg NFT.
 *
 * Wraps wagmi's writeContractAsync + useWaitForTransactionReceipt to provide
 * a simple `mint(tokenURI)` function with full transaction lifecycle states.
 *
 * Setting `chainId` in the write call ensures wagmi prompts a chain switch
 * if the user's wallet is connected to the wrong network.
 */
export function useMintEgg() {
  const {
    writeContractAsync,
    data: txHash,
    isPending,
    error: writeError,
    reset,
  } = useWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess,
    isError: isConfirmError,
    error: confirmError,
  } = useWaitForTransactionReceipt({ hash: txHash });

  const mint = async (tokenURI: string) => {
    await writeContractAsync({
      address: EASTER_EGG_ADDRESS,
      abi: EASTER_EGG_ABI,
      functionName: "mint",
      args: [tokenURI],
      chainId: APP_CHAIN_ID,
    });
  };

  return {
    mint,
    isPending, // tx submitted to wallet, waiting for user signature
    isConfirming, // tx sent, waiting for on-chain confirmation
    isSuccess, // tx confirmed on-chain
    isError: !!writeError || isConfirmError,
    error: writeError || confirmError,
    txHash,
    reset, // reset state for retry
  };
}
