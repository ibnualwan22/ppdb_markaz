"use client";

import { createContext, useContext, useEffect, useState } from "react";
import PusherClient from "pusher-js";

interface PusherContextType {
  pusherClient: PusherClient | null;
}

const PusherContext = createContext<PusherContextType>({ pusherClient: null });

export const usePusher = () => {
  return useContext(PusherContext).pusherClient;
};

export const PusherProvider = ({ children }: { children: React.ReactNode }) => {
  const [pusherClient, setPusherClient] = useState<PusherClient | null>(null);

  useEffect(() => {
    // Enable pusher logging - don't include this in production
    // PusherClient.logToConsole = true;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.error("Missing Pusher environment variables");
      return;
    }

    const pusher = new PusherClient(key, {
      cluster: cluster,
    });

    setPusherClient(pusher);

    return () => {
      pusher.disconnect();
    };
  }, []);

  return (
    <PusherContext.Provider value={{ pusherClient }}>
      {children}
    </PusherContext.Provider>
  );
};
