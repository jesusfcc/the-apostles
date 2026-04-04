"use client";

import { useState, useCallback } from "react";
import type { EggTraits } from "~/lib/traits";

export type FlowState =
  | "connect"
  | "generate"
  | "preview"
  | "minting"
  | "success"
  | "error";

interface EggFlowData {
  traits: EggTraits | null;
  imageBase64: string | null;
  txHash: string | null;
  tokenURI: string | null;
  imageURI: string | null;
  error: string | null;
}

const INITIAL_DATA: EggFlowData = {
  traits: null,
  imageBase64: null,
  txHash: null,
  tokenURI: null,
  imageURI: null,
  error: null,
};

export function useEggFlow() {
  const [state, setState] = useState<FlowState>("connect");
  const [data, setData] = useState<EggFlowData>(INITIAL_DATA);

  const onConnected = useCallback(() => {
    setState("generate");
  }, []);

  const onGenerated = useCallback((traits: EggTraits, imageBase64: string) => {
    setData((prev) => ({ ...prev, traits, imageBase64 }));
    setState("preview");
  }, []);

  const startMinting = useCallback(() => {
    setState("minting");
  }, []);

  const onMetadataUploaded = useCallback(
    (tokenURI: string, imageURI: string) => {
      setData((prev) => ({ ...prev, tokenURI, imageURI }));
    },
    []
  );

  const regenerate = useCallback(() => {
    setData((prev) => ({
      ...prev,
      traits: null,
      imageBase64: null,
      error: null,
    }));
    setState("generate");
  }, []);

  const onMinted = useCallback((txHash: string) => {
    setData((prev) => ({ ...prev, txHash }));
    setState("success");
  }, []);

  const onError = useCallback((msg: string) => {
    setData((prev) => ({ ...prev, error: msg }));
    setState("error");
  }, []);

  const reset = useCallback(() => {
    setState("connect");
    setData(INITIAL_DATA);
  }, []);

  return {
    state,
    ...data,
    onConnected,
    onGenerated,
    startMinting,
    onMetadataUploaded,
    onMinted,
    onError,
    regenerate,
    reset,
  };
}
