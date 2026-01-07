import Vapi from "@vapi-ai/web";

const vapi = new Vapi(import.meta.env.VITE_VAPI_PUBLIC_KEY || "");

export const startVapiSession = async (assistantId: string) => {
  try {
    await vapi.start(assistantId);
  } catch (error) {
    console.error("Failed to start Vapi session:", error);
  }
};

export const stopVapiSession = () => {
  vapi.stop();
};

export const setMuted = (muted: boolean) => {
  vapi.setMuted(muted);
};

export default vapi;
