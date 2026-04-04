"use client";

import { useEffect, useState } from "react";
import sdk from "@farcaster/miniapp-sdk";
import { useMiniApp } from "@neynar/react";
import { useEggFlow } from "~/hooks/useEggFlow";
import ConnectScreen from "~/components/screens/ConnectScreen";
import GenerateScreen from "~/components/screens/GenerateScreen";

export default function App() {
  const { isSDKLoaded, context } = useMiniApp();
  const flow = useEggFlow();
  const [prompted, setPrompted] = useState(false);

  // Signal ready to Farcaster SDK
  useEffect(() => {
    if (isSDKLoaded) {
      sdk.actions.ready();
    }
  }, [isSDKLoaded]);

  // One-time prompt to add mini app
  useEffect(() => {
    if (!isSDKLoaded || !context || prompted) return;
    if (context.client.added) return;
    setPrompted(true);
    sdk.actions.addMiniApp().catch(console.error);
  }, [isSDKLoaded, context, prompted]);

  const safeArea = context?.client?.safeAreaInsets;

  // Render current screen based on flow state
  const renderScreen = () => {
    switch (flow.state) {
      case "connect":
        return <ConnectScreen onConnected={flow.onConnected} />;
      case "generate":
        return (
          <GenerateScreen
            onGenerated={flow.onGenerated}
            onError={flow.onError}
          />
        );
      case "preview":
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-vintage-black/60 text-lg">Preview screen coming soon...</p>
          </div>
        );
      case "minting":
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-8 h-8 border-2 border-vintage-black border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-vintage-black/70 font-bold tracking-widest">MINTING...</p>
            </div>
          </div>
        );
      case "success":
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-success text-lg font-bold">Minted successfully!</p>
          </div>
        );
      case "error":
        return (
          <div className="flex-1 flex flex-col items-center justify-center space-y-4">
            <p className="text-error text-lg">{flow.error}</p>
            <button
              onClick={flow.reset}
              className="px-6 py-3 border-2 border-vintage-black bg-vintage-black text-paper font-bold tracking-widest"
            >
              START OVER
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen bg-paper flex flex-col"
      style={{
        paddingTop: safeArea?.top ?? 0,
        paddingBottom: safeArea?.bottom ?? 0,
        paddingLeft: safeArea?.left ?? 0,
        paddingRight: safeArea?.right ?? 0,
      }}
    >
      {/* Header ornate border */}
      <div className="w-full">
        <img
          src="/assets/header.png"
          alt="Header decoration"
          className="w-full h-auto"
        />
      </div>

      {/* Container with side borders */}
      <div className="relative flex-1 flex flex-col">
        {/* Left side ornamental border */}
        <div className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none">
          <img
            src="/assets/side-left.png"
            alt=""
            className="w-[50px] h-full object-fill"
          />
        </div>

        {/* Right side ornamental border */}
        <div className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none">
          <img
            src="/assets/side-right.png"
            alt=""
            className="w-[50px] h-full object-fill"
          />
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col px-14">
          {renderScreen()}
        </div>
      </div>

      {/* Bottom decorative line divider */}
      <div className="w-full flex justify-center py-2">
        <img
          src="/assets/Line5.png"
          alt=""
          className="w-[90%] h-auto"
        />
      </div>

      {/* Custom bottom border - fresh design, not using footer.png */}
      <div className="w-full px-4 pb-4">
        <div className="border-t-2 border-vintage-black pt-3 flex items-center justify-center gap-3">
          <div className="h-[2px] flex-1 bg-vintage-black/20" />
          <span className="text-vintage-black/40 text-xs font-bold tracking-[0.3em] uppercase">
            Easter Egg Mint
          </span>
          <div className="h-[2px] flex-1 bg-vintage-black/20" />
        </div>
      </div>
    </div>
  );
}
