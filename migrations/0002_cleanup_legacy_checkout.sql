DROP TABLE IF EXISTS coupon_claims;
ALTER TABLE orders DROP COLUMN coupon_code;
ALTER TABLE orders DROP COLUMN discount_rupees;
