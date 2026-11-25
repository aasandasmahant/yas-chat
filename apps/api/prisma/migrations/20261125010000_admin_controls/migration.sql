CREATE TABLE "SystemSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);
CREATE TABLE "IntegrationSecret" (
  "provider" TEXT NOT NULL,
  "encryptedPayload" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "IntegrationSecret_pkey" PRIMARY KEY ("provider")
);
INSERT INTO "SystemSetting" ("key", "value", "updatedAt") VALUES
('monetization', '{"audioCalls":{"enabled":false,"monthlyPrice":99,"currency":"INR"},"videoCalls":{"enabled":false,"monthlyPrice":199,"currency":"INR"},"ads":{"homeBanner":false,"productBanner":false,"chatBanner":false,"persistentPanel":false,"audioCall":false,"videoCall":false},"payments":{"checkoutEnabled":false,"provider":"razorpay"}}'::jsonb, CURRENT_TIMESTAMP);
