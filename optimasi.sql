CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_product_nama_trgm ON "Product" USING gin (nama gin_trgm_ops);