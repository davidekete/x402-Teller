import { describe, it, expect, beforeEach, mock } from "bun:test";
import { Facilitator, DEFAULT_MIN_CONFIRMATIONS } from "../src/index";

const TEST_PRIVATE_KEY = "5JqY7hZqJZQZ8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z";
const TEST_PUBLIC_KEY = "FakePublicKey1111111111111111111111111111";

// Mock the x402 module
const mockVerify = mock(() => Promise.resolve({ isValid: true, payer: "SolanaAddress123" }));
const mockSettle = mock(() =>
  Promise.resolve({
    success: true,
    transaction: "5abc123...",
    network: "solana-devnet",
    payer: "SolanaAddress123",
  })
);
const mockCreateSigner = mock(() => Promise.resolve({}));

// Mock the x402 imports
mock.module("x402/facilitator", () => ({
  verify: mockVerify,
  settle: mockSettle,
}));

mock.module("x402/types", () => ({
  createSigner: mockCreateSigner,
  SupportedSVMNetworks: ["solana", "solana-devnet"],
}));

describe("Facilitator - Constructor", () => {
  it("constructs successfully with valid Solana options", () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    expect(facilitator).toBeDefined();
    expect(facilitator.solanaPublicKey).toBeDefined();
  });

  it("constructs with custom minConfirmations", () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
      minConfirmations: 3,
    });

    expect(facilitator).toBeDefined();
  });

  it("uses default minConfirmations when not specified", () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    expect(DEFAULT_MIN_CONFIRMATIONS).toBe(1);
    expect(facilitator).toBeDefined();
  });

  it("constructs with multiple Solana networks", () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet", "solana"],
    });

    expect(facilitator).toBeDefined();
  });

  it("throws if constructed with empty networks array", () => {
    expect(() => {
      new Facilitator({
        solanaPrivateKey: TEST_PRIVATE_KEY,
        solanaFeePayer: TEST_PUBLIC_KEY,
        networks: [],
      });
    }).toThrow("at least one network is required");
  });

  it("throws if constructed without solanaPrivateKey", () => {
    expect(() => {
      new Facilitator({
        solanaPrivateKey: "" as any,
        solanaFeePayer: TEST_PUBLIC_KEY,
        networks: ["solana-devnet"],
      });
    }).toThrow("solanaPrivateKey is required");
  });

  it("throws if constructed without solanaFeePayer", () => {
    expect(() => {
      new Facilitator({
        solanaPrivateKey: TEST_PRIVATE_KEY,
        solanaFeePayer: "" as any,
        networks: ["solana-devnet"],
      });
    }).toThrow("solanaFeePayer is required");
  });
});

describe("Facilitator.listSupportedKinds", () => {
  it("returns supported kinds for single Solana network", () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    const result = facilitator.listSupportedKinds();

    expect(result).toHaveProperty("kinds");
    expect(Array.isArray(result.kinds)).toBe(true);
    expect(result.kinds.length).toBe(1);

    const first = result.kinds[0];
    expect(first.x402Version).toBe(1);
    expect(first.scheme).toBe("exact");
    expect(first.network).toBe("solana-devnet");
    expect(first.extra?.feePayer).toBe(TEST_PUBLIC_KEY);
  });

  it("returns multiple kinds for multiple Solana networks", () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet", "solana"],
    });

    const result = facilitator.listSupportedKinds();
    expect(result.kinds.length).toBe(2);

    expect(result.kinds[0].network).toBe("solana-devnet");
    expect(result.kinds[1].network).toBe("solana");
  });
});

describe("Facilitator.verifyPayment", () => {
  beforeEach(() => {
    mockVerify.mockClear();
    mockCreateSigner.mockClear();
  });

  it("returns valid:true when x402Verify returns isValid:true", async () => {
    mockVerify.mockResolvedValueOnce({
      isValid: true,
      payer: "SolanaAddress123",
    });

    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    const result = await facilitator.verifyPayment(
      { signature: "5abc..." },
      { network: "solana-devnet" }
    );

    expect(result.isValid).toBe(true);
    expect(result.payer).toBe("SolanaAddress123");
    expect(mockCreateSigner).toHaveBeenCalledWith("solana-devnet", TEST_PRIVATE_KEY);
    expect(mockVerify).toHaveBeenCalledTimes(1);
  });

  it("returns valid:false for unsupported network", async () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    const result = await facilitator.verifyPayment(
      { signature: "5abc..." },
      { network: "solana" } // Not in networks array
    );

    expect(result.isValid).toBe(false);
    expect(mockVerify).not.toHaveBeenCalled();
  });

  it("passes correct parameters to x402Verify", async () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    const payload = { signature: "5abc...", amount: "100" };
    const requirements = { network: "solana-devnet", expectedAmount: "100" };

    await facilitator.verifyPayment(payload, requirements);

    expect(mockVerify).toHaveBeenCalledWith(
      expect.anything(), // signer
      payload,
      requirements,
      undefined // config
    );
  });
});

describe("Facilitator.settlePayment", () => {
  beforeEach(() => {
    mockSettle.mockClear();
    mockCreateSigner.mockClear();
  });

  it("returns success:true and transaction when x402Settle succeeds", async () => {
    mockSettle.mockResolvedValueOnce({
      success: true,
      transaction: "5xyz789...",
      network: "solana-devnet",
      payer: "SolanaAddress123",
    });

    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    const result = await facilitator.settlePayment(
      { amount: "100" },
      { network: "solana-devnet" }
    );

    expect(result.success).toBe(true);
    expect(result.transaction).toBe("5xyz789...");
    expect(mockCreateSigner).toHaveBeenCalledWith("solana-devnet", TEST_PRIVATE_KEY);
    expect(mockSettle).toHaveBeenCalledTimes(1);
  });

  it("returns success:false when x402Settle fails", async () => {
    mockSettle.mockResolvedValueOnce({
      success: false,
      transaction: "",
      network: "solana-devnet",
      payer: "SolanaAddress123",
    });

    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    const result = await facilitator.settlePayment(
      { amount: "100" },
      { network: "solana-devnet" }
    );

    expect(result.success).toBe(false);
  });

  it("returns success:false for unsupported network", async () => {
    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    const result = await facilitator.settlePayment(
      { amount: "100" },
      { network: "ethereum" }
    );

    expect(result.success).toBe(false);
    expect(result.errorReason).toBe("Only Solana networks are supported");
    expect(mockSettle).not.toHaveBeenCalled();
  });

  it("uses the configured solanaPrivateKey for signing", async () => {
    mockSettle.mockResolvedValueOnce({
      success: true,
      transaction: "5signed...",
      network: "solana-devnet",
      payer: "SolanaAddress123",
    });

    const facilitator = new Facilitator({
      solanaPrivateKey: TEST_PRIVATE_KEY,
      solanaFeePayer: TEST_PUBLIC_KEY,
      networks: ["solana-devnet"],
    });

    await facilitator.settlePayment(
      { amount: "100" },
      { network: "solana-devnet" }
    );

    expect(mockCreateSigner).toHaveBeenCalledWith("solana-devnet", TEST_PRIVATE_KEY);
  });
});
