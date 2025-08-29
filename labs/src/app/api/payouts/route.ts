import crypto from "crypto";
import { type NextRequest, NextResponse } from "next/server";
import axios, { type AxiosError } from "axios";
import { env } from "@/env";

type QuoteResponse = {
  data: {
    quoteId: string;
  };
};

type InitializeResponse = {
  data: {
    quoteId: string;
  };
};

type IncomingPayload = {
  name: string;
  phoneNumber: string;
};

export async function POST(req: NextRequest) {
  const incoming = (await req.json()) as IncomingPayload;
  const { data: quote } = await axios.post<QuoteResponse>(
    "https://api.bitnob.co/api/v1/payouts/quotes",
    {
      source: "offchain",
      fromAsset: "usdt",
      toCurrency: "ngn",
      settlementAmount: 100000,
    },
    { headers: { Authorization: `Bearer ${env.BITNOB_SECRET_KEY}` } },
  );

  await axios.post<InitializeResponse>(
    "https://api.bitnob.co/api/v1/payouts/initialize",
    {
      quoteId: quote.data.quoteId,
      customerId: "e22795d9-23f6-48e6-8b30-be5718abd876",
      country: "NG",
      reference: crypto.randomUUID(),
      beneficiary: {
        type: "BANK",
        bankCode: "100004",
        accountNumber: incoming.phoneNumber,
      },
      paymentReason: "Bitnob Nigeria Payout"
    },
    { headers: { Authorization: `Bearer ${env.BITNOB_SECRET_KEY}` } },
  );

  try {
    const response = await axios.post(
      "https://api.bitnob.co/api/v1/payouts/finalize",
      { quoteId: quote.data.quoteId },
      { headers: { Authorization: `Bearer ${env.BITNOB_SECRET_KEY}` } },
    );

    console.log("🚀 ~ POST ~ response:", response.data);
  } catch (error) {
    const err = error as AxiosError;
    console.log("🚀 ~ POST ~ err.message:", err.toJSON());
  }

  return NextResponse.json({
    message: "you should receive a notification soon",
  });
}
