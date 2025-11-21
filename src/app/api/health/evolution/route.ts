import { NextResponse } from "next/server";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

async function checkEvolutionConnectivity() {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    return { status: "not_configured", error: "Missing required environment variables" };
  }

  try {
    const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
    });

    if (response.ok) {
      return { status: "healthy", error: null };
    }
    return { status: "error", error: `HTTP ${response.status}: ${response.statusText}` };
  } catch (error) {
    return {
      status: "unreachable",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function GET() {
  const connectivity = await checkEvolutionConnectivity();

  const checks = {
    timestamp: new Date().toISOString(),
    environment: {
      EVOLUTION_API_URL: {
        configured: !!EVOLUTION_API_URL,
        value: EVOLUTION_API_URL ? `${EVOLUTION_API_URL.substring(0, 20)}...` : null,
      },
      EVOLUTION_API_KEY: {
        configured: !!EVOLUTION_API_KEY,
        value: EVOLUTION_API_KEY ? "***" + EVOLUTION_API_KEY.slice(-4) : null,
      },
    },
    connectivity,
  };

  const allHealthy =
    checks.environment.EVOLUTION_API_URL.configured &&
    checks.environment.EVOLUTION_API_KEY.configured &&
    checks.connectivity.status === "healthy";

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      ...checks,
    },
    { status: allHealthy ? 200 : 503 },
  );
}
