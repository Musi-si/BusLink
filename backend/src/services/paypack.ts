import axios, { AxiosInstance, AxiosError } from "axios";
import crypto from "crypto";
import { addSeconds, isBefore } from "date-fns";
import AppError from "@/utils/AppError";

const config = {
  PAYPACK_CLIENT_ID: process.env.PAYPACK_CLIENT_ID || "",
  PAYPACK_CLIENT_SECRET: process.env.PAYPACK_CLIENT_SECRET || "",
  PAYPACK_WEBHOOK_SECRET: process.env.PAYPACK_WEBHOOK_SECRET || "",
};

interface PaypackAuthResponse {
  access: string;
  refresh: string;
  expires: number;
}
interface CashinParams {
  number: string;
  amount: number;
}
interface CashinResponse {
  ref: string;
  status: string;
  amount: number;
  provider: string;
  kind: "CASHIN";
  created_at: string;
}

class PaypackService {
  private axiosInstance: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiresAt: Date | null = null;
  private isRefreshingToken = false;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: "https://payments.paypack.rw/api",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });
  }

  public async cashin(params: CashinParams): Promise<CashinResponse> {
    if (params.amount < 100) {
      throw new AppError("Payment amount must be at least 100 RWF.", 400);
    }
    if (!/^07\d{8}$/.test(params.number)) {
      throw new AppError(
        "Invalid Rwandan phone number format. Must be 07XXXXXXXX.",
        400
      );
    }

    const token = await this.getValidAccessToken();

    try {
      console.log(
        `[INFO] Initiating Paypack cash-in for amount: ${params.amount}`
      );
      const response = await this.axiosInstance.post<CashinResponse>(
        "/transactions/cashin",
        { amount: params.amount, number: params.number },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Webhook-Mode": "production",
          },
        }
      );
      console.log(
        `[INFO] Paypack cash-in initiated successfully. Ref: ${response.data.ref}`
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error, "Cash-in failed");
    }
  }

  public verifyWebhookSignature(
    signature: string | undefined,
    rawBody: Buffer
  ): boolean {
    if (!signature) {
      console.warn(
        "[WARN] Webhook received without 'x-paypack-signature' header."
      );
      throw new AppError("Missing webhook signature.", 403);
    }

    try {
      const expectedSignature = crypto
        .createHmac("sha256", config.PAYPACK_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("base64");

      const sigBuffer = Buffer.from(signature);
      const expectedSigBuffer = Buffer.from(expectedSignature);

      if (
        sigBuffer.length !== expectedSigBuffer.length ||
        !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)
      ) {
        console.warn(
          `[WARN] Invalid webhook signature. Received: ${signature}`
        );
        throw new AppError("Invalid webhook signature.", 401);
      }
      return true;
    } catch (error) {
      console.error(
        "[ERROR] Error during webhook signature verification.",
        error
      );
      throw new AppError("Could not verify webhook signature.", 500);
    }
  }

  private async getValidAccessToken(): Promise<string> {
    if (this.isRefreshingToken && this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    if (
      this.accessToken &&
      this.tokenExpiresAt &&
      isBefore(new Date(), addSeconds(this.tokenExpiresAt, -60))
    ) {
      return this.accessToken;
    }

    console.log(
      "[INFO] Paypack access token is expired or missing. Authenticating..."
    );
    this.isRefreshingToken = true;
    this.tokenRefreshPromise = this.authenticate();

    try {
      return await this.tokenRefreshPromise;
    } finally {
      this.isRefreshingToken = false;
      this.tokenRefreshPromise = null;
    }
  }

  private async authenticate(): Promise<string> {
    try {
      const response = await this.axiosInstance.post<PaypackAuthResponse>(
        "/auth/agents/authorize",
        {
          client_id: config.PAYPACK_CLIENT_ID,
          client_secret: config.PAYPACK_CLIENT_SECRET,
        }
      );

      const { access, expires } = response.data;
      if (!access) {
        throw new Error(
          "Authentication response did not include an access token."
        );
      }

      this.accessToken = access;
      this.tokenExpiresAt = new Date(expires * 1000);

      console.log(
        `[INFO] Successfully authenticated with Paypack. Token expires at: ${this.tokenExpiresAt.toISOString()}`
      );
      return this.accessToken;
    } catch (error) {
      this.accessToken = null;
      this.tokenExpiresAt = null;
      this.handleApiError(error, "Paypack authentication failed");
    }
  }

  private handleApiError(error: unknown, context: string): never {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{
        message?: string;
        error?: any;
        details?: any;
      }>;
      const status = axiosError.response?.status || 500;
      const message =
        axiosError.response?.data?.message ||
        axiosError.response?.data?.error ||
        JSON.stringify(axiosError.response?.data?.details) ||
        axiosError.message;

      console.error(`[ERROR] Paypack API Error: ${context}`, {
        status,
        message,
        responseData: axiosError.response?.data,
      });
      throw new AppError(`Payment Provider Error: ${message}`, status);
    }

    console.error(
      `[ERROR] Non-Axios Error in Paypack Service: ${context}`,
      error
    );
    throw new AppError(
      (error as Error).message || "An unknown error occurred.",
      500
    );
  }
}

function createPaypackService(): PaypackService {
  if (!config.PAYPACK_CLIENT_ID || !config.PAYPACK_CLIENT_SECRET) {
    throw new Error(
      "Paypack service is not configured. Missing API credentials."
    );
  }
  if (!config.PAYPACK_WEBHOOK_SECRET) {
    throw new Error(
      "Paypack service is not configured. Missing Webhook Secret."
    );
  }
  return new PaypackService();
}

export const paypackService = createPaypackService();
