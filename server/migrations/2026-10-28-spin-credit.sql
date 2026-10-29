-- Spin & Win store credit.
-- Import once in phpMyAdmin on a database that already has the shop tables.
-- Fresh installs get the same tables from schema.sql and can skip this file.
-- Safe to run again: new tables are created only if missing, and the orders column is added only once.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS spins (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid VARCHAR(128) NOT NULL,
  spun_on DATE NOT NULL,
  reel_1 VARCHAR(16) NOT NULL,
  reel_2 VARCHAR(16) NOT NULL,
  reel_3 VARCHAR(16) NOT NULL,
  payout DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY spins_user_day (user_uid, spun_on),
  KEY spins_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_credit (
  user_uid VARCHAR(128) NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_credit_ledger (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_uid VARCHAR(128) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  reason VARCHAR(32) NOT NULL,
  spin_id BIGINT UNSIGNED NULL,
  order_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY credit_user_created (user_uid, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET @hh_credit_col := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'orders'
    AND COLUMN_NAME = 'credit_applied'
);
SET @hh_credit_sql := IF(
  @hh_credit_col = 0,
  'ALTER TABLE orders ADD COLUMN credit_applied DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER shipping',
  'SELECT 1'
);
PREPARE hh_credit_stmt FROM @hh_credit_sql;
EXECUTE hh_credit_stmt;
DEALLOCATE PREPARE hh_credit_stmt;
