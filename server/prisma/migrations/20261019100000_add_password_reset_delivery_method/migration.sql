ALTER TABLE "password_reset_codes"
ADD COLUMN "deliveryMethod" TEXT NOT NULL DEFAULT 'email';