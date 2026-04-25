CREATE SCHEMA IF NOT EXISTS app;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION app.hash_password(p_password TEXT)
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT crypt(p_password, gen_salt('bf', 12));
$$;

CREATE OR REPLACE FUNCTION app.replace_password(p_account_id BIGINT, p_new_password TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE app.account
  SET password_hash = app.hash_password(p_new_password)
  WHERE account_id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'account not found (account_id=%)', p_account_id;
  END IF;
END;
$$;

-- ============================================================
-- Core domain schema for Court Management
-- Notes:
-- - All objects live under schema "app"
-- - Most status fields are stored as TEXT for flexibility
-- ============================================================

-- ----------------------------
-- Auth / Identity
-- ----------------------------
CREATE TABLE IF NOT EXISTS app.account (
  account_id BIGSERIAL PRIMARY KEY,
  -- login name (unique)
  username TEXT NOT NULL UNIQUE,
  -- store hash only (never store raw password)
  password_hash TEXT NOT NULL,
  -- authorization role (e.g. ADMIN/EMPLOYEE/CUSTOMER)
  role TEXT NOT NULL,
  -- account lifecycle status (e.g. ACTIVE/DISABLED)
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------
-- Membership / Loyalty
-- ----------------------------
CREATE TABLE IF NOT EXISTS app.member_level (
  member_level_id BIGSERIAL PRIMARY KEY,
  -- display name (e.g. Bronze/Silver/Gold)
  level_name TEXT NOT NULL UNIQUE,
  -- points range inclusive
  min_points INTEGER NOT NULL,
  max_points INTEGER NOT NULL,
  benefits TEXT,
  description TEXT,
  member_level_status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT member_level_points_range CHECK (min_points <= max_points)
);

CREATE TABLE IF NOT EXISTS app.customer (
  customer_id BIGSERIAL PRIMARY KEY,
  -- 1-1 mapping between account and customer
  account_id BIGINT NOT NULL UNIQUE REFERENCES app.account(account_id),
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  -- derived from points via trigger (can still be overridden if needed)
  member_level_id BIGINT REFERENCES app.member_level(member_level_id),
  points INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT customer_points_non_negative CHECK (points >= 0)
);

-- ----------------------------
-- Staff / Scheduling
-- ----------------------------
CREATE TABLE IF NOT EXISTS app.employee (
  employee_id BIGSERIAL PRIMARY KEY,
  -- 1-1 mapping between account and employee
  account_id BIGINT NOT NULL UNIQUE REFERENCES app.account(account_id),
  full_name TEXT NOT NULL,
  phone TEXT,
  position TEXT
);

CREATE TABLE IF NOT EXISTS app.shift (
  shift_id BIGSERIAL PRIMARY KEY,
  shift_name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  description TEXT,
  shift_status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT shift_time_range CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS app.employee_shift (
  -- logical week identifier (chosen by application)
  week_id INTEGER NOT NULL,
  -- day of week: 1..7
  day SMALLINT NOT NULL,
  employee_id BIGINT NOT NULL REFERENCES app.employee(employee_id) ON DELETE CASCADE,
  shift_id BIGINT NOT NULL REFERENCES app.shift(shift_id) ON DELETE CASCADE,
  PRIMARY KEY (week_id, day, employee_id, shift_id),
  CONSTRAINT employee_shift_day_range CHECK (day BETWEEN 1 AND 7)
);

-- ----------------------------
-- Courts / Pricing
-- ----------------------------
CREATE TABLE IF NOT EXISTS app.court_type (
  court_type_id BIGSERIAL PRIMARY KEY,
  court_type_name TEXT NOT NULL UNIQUE,
  description TEXT,
  court_type_status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app.court (
  court_id BIGSERIAL PRIMARY KEY,
  court_name TEXT NOT NULL UNIQUE,
  court_type_id BIGINT NOT NULL REFERENCES app.court_type(court_type_id),
  surface_type TEXT,
  space_type TEXT,
  player_count INTEGER,
  status TEXT NOT NULL DEFAULT 'AVAILABLE',
  description TEXT,
  address TEXT
);

CREATE TABLE IF NOT EXISTS app.time_slot (
  slot_id BIGSERIAL PRIMARY KEY,
  slot_name TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  time_slot_status TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT time_slot_time_range CHECK (start_time < end_time)
);

CREATE TABLE IF NOT EXISTS app.pricelist (
  price_id BIGSERIAL PRIMARY KEY,
  -- usually one price per court type
  court_type_id BIGINT NOT NULL UNIQUE REFERENCES app.court_type(court_type_id),
  price NUMERIC(12, 2) NOT NULL,
  CONSTRAINT pricelist_price_non_negative CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS app.day_type (
  day_type_id BIGSERIAL PRIMARY KEY,
  day_type_name TEXT NOT NULL UNIQUE,
  description TEXT,
  day_type_status TEXT NOT NULL DEFAULT 'ACTIVE',
  -- percent adjustment applied on top of base pricelist price (e.g. 20 => +20%)
  adjust_percent NUMERIC(6, 2) NOT NULL DEFAULT 0
);

-- ----------------------------
-- Booking
-- ----------------------------
CREATE TABLE IF NOT EXISTS app.booking (
  booking_id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES app.customer(customer_id),
  court_id BIGINT NOT NULL REFERENCES app.court(court_id),
  -- employee that created/handled the booking (optional)
  employee_id BIGINT REFERENCES app.employee(employee_id),
  -- the date the court is booked for
  booking_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  -- required only when status=CANCELLED (enforced by trigger)
  cancel_reason TEXT,
  -- computed by triggers (booking_detail + booking_service)
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  deposit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT booking_amounts_non_negative CHECK (total_amount >= 0 AND deposit_amount >= 0)
);

CREATE TABLE IF NOT EXISTS app.booking_detail (
  booking_detail_id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES app.booking(booking_id) ON DELETE CASCADE,
  slot_id BIGINT NOT NULL REFERENCES app.time_slot(slot_id),
  -- price row chosen at booking time
  price_id BIGINT NOT NULL REFERENCES app.pricelist(price_id),
  -- day type (weekday/weekend/holiday...) to apply adjust_percent
  day_type_id BIGINT NOT NULL REFERENCES app.day_type(day_type_id),
  -- avoid duplicate slot in the same booking
  CONSTRAINT booking_detail_unique_slot UNIQUE (booking_id, slot_id)
);

-- ----------------------------
-- Services / Inventory
-- ----------------------------
CREATE TABLE IF NOT EXISTS app.service (
  service_id BIGSERIAL PRIMARY KEY,
  service_name TEXT NOT NULL UNIQUE,
  unit TEXT,
  service_price NUMERIC(12, 2) NOT NULL,
  -- inventory for physical items; triggers ensure it never goes negative
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT service_price_non_negative CHECK (service_price >= 0),
  CONSTRAINT service_stock_non_negative CHECK (stock_quantity >= 0)
);

CREATE TABLE IF NOT EXISTS app.booking_service (
  detail_service_id BIGSERIAL PRIMARY KEY,
  booking_id BIGINT NOT NULL REFERENCES app.booking(booking_id) ON DELETE CASCADE,
  service_id BIGINT NOT NULL REFERENCES app.service(service_id),
  quantity INTEGER NOT NULL,
  -- computed from quantity * service.service_price
  total_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  CONSTRAINT booking_service_qty_positive CHECK (quantity > 0),
  CONSTRAINT booking_service_unique_service UNIQUE (booking_id, service_id)
);

-- ----------------------------
-- Payment & Promotions
-- ----------------------------
CREATE TABLE IF NOT EXISTS app.payment (
  payment_id BIGSERIAL PRIMARY KEY,
  -- 1-1: one payment record per booking
  booking_id BIGINT NOT NULL UNIQUE REFERENCES app.booking(booking_id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL,
  refund NUMERIC(12, 2) NOT NULL DEFAULT 0,
  method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'PENDING',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT payment_amounts_non_negative CHECK (amount >= 0 AND refund >= 0)
);

CREATE TABLE IF NOT EXISTS app.promotion (
  promo_id BIGSERIAL PRIMARY KEY,
  promo_name TEXT NOT NULL UNIQUE,
  discount_percent NUMERIC(5, 2) NOT NULL,
  max_value NUMERIC(12, 2),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  promo_status TEXT NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT promotion_discount_range CHECK (discount_percent BETWEEN 0 AND 100),
  CONSTRAINT promotion_date_range CHECK (start_date <= end_date),
  CONSTRAINT promotion_max_value_non_negative CHECK (max_value IS NULL OR max_value >= 0)
);

CREATE TABLE IF NOT EXISTS app.coupon_usage (
  usage_id BIGSERIAL PRIMARY KEY,
  promo_id BIGINT NOT NULL REFERENCES app.promotion(promo_id),
  booking_id BIGINT NOT NULL REFERENCES app.booking(booking_id) ON DELETE CASCADE,
  used_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_id BIGINT NOT NULL REFERENCES app.customer(customer_id),
  -- avoid using same promotion twice on the same booking
  CONSTRAINT coupon_usage_unique UNIQUE (promo_id, booking_id)
);

-- ----------------------------
-- Feedback & Auditing
-- ----------------------------
CREATE TABLE IF NOT EXISTS app.court_rating (
  rating_id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES app.customer(customer_id) ON DELETE CASCADE,
  court_id BIGINT NOT NULL REFERENCES app.court(court_id) ON DELETE CASCADE,
  score SMALLINT NOT NULL,
  comment TEXT,
  rating_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT court_rating_score_range CHECK (score BETWEEN 1 AND 5),
  -- one rating per customer per court
  CONSTRAINT court_rating_unique UNIQUE (customer_id, court_id)
);

CREATE OR REPLACE FUNCTION app.court_rating_leaderboard(
  p_limit INTEGER DEFAULT 10,
  p_min_ratings INTEGER DEFAULT 1,
  p_court_type_id BIGINT DEFAULT NULL
)
RETURNS TABLE (
  rank BIGINT,
  court_id BIGINT,
  court_name TEXT,
  court_type_id BIGINT,
  avg_score NUMERIC(4, 2),
  rating_count BIGINT,
  last_rating_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  WITH agg AS (
    SELECT
      c.court_id,
      c.court_name,
      c.court_type_id,
      ROUND(AVG(cr.score)::numeric, 2) AS avg_score,
      COUNT(*)::bigint AS rating_count,
      MAX(cr.rating_time) AS last_rating_at
    FROM app.court c
    JOIN app.court_rating cr ON cr.court_id = c.court_id
    WHERE (p_court_type_id IS NULL OR c.court_type_id = p_court_type_id)
    GROUP BY c.court_id, c.court_name, c.court_type_id
    HAVING COUNT(*) >= GREATEST(p_min_ratings, 1)
  )
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY a.avg_score DESC, a.rating_count DESC, a.last_rating_at DESC, a.court_id ASC
    )::bigint AS rank,
    a.court_id,
    a.court_name,
    a.court_type_id,
    a.avg_score,
    a.rating_count,
    a.last_rating_at
  FROM agg a
  ORDER BY rank
  LIMIT GREATEST(p_limit, 1);
$$;

CREATE TABLE IF NOT EXISTS app.activity_log (
  log_id BIGSERIAL PRIMARY KEY,
  -- actor_id is intentionally not a foreign key to support multiple actor types
  actor_id BIGINT,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  description TEXT
);

-- ============================================================
-- Triggers / Derived data
-- ============================================================

-- Auto-assign member_level_id based on points.
CREATE OR REPLACE FUNCTION app.customer_assign_member_level()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  matched_level_id BIGINT;
BEGIN
  -- choose the "best" active level whose range contains NEW.points
  SELECT ml.member_level_id
    INTO matched_level_id
  FROM app.member_level ml
  WHERE ml.member_level_status = 'ACTIVE'
    AND NEW.points BETWEEN ml.min_points AND ml.max_points
  ORDER BY ml.min_points DESC
  LIMIT 1;

  IF matched_level_id IS NOT NULL THEN
    NEW.member_level_id = matched_level_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_assign_member_level ON app.customer;
CREATE TRIGGER trg_customer_assign_member_level
BEFORE INSERT OR UPDATE OF points
ON app.customer
FOR EACH ROW
EXECUTE FUNCTION app.customer_assign_member_level();

-- Keep booking_service.total_price in sync and manage service stock.
CREATE OR REPLACE FUNCTION app.booking_service_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  unit_price NUMERIC(12, 2);
  current_stock INTEGER;
  diff_qty INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- lock the service row to prevent overselling under concurrent writes
    SELECT service_price, stock_quantity
      INTO unit_price, current_stock
    FROM app.service
    WHERE service_id = NEW.service_id
    FOR UPDATE;

    IF current_stock < NEW.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for service_id=% (have %, need %)', NEW.service_id, current_stock, NEW.quantity;
    END IF;

    -- consume inventory
    UPDATE app.service
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE service_id = NEW.service_id;

    -- compute derived total
    NEW.total_price = NEW.quantity * unit_price;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.service_id <> OLD.service_id THEN
      -- revert old inventory consumption
      UPDATE app.service
      SET stock_quantity = stock_quantity + OLD.quantity
      WHERE service_id = OLD.service_id;

      -- consume inventory for the new service_id
      SELECT service_price, stock_quantity
        INTO unit_price, current_stock
      FROM app.service
      WHERE service_id = NEW.service_id
      FOR UPDATE;

      IF current_stock < NEW.quantity THEN
        RAISE EXCEPTION 'Insufficient stock for service_id=% (have %, need %)', NEW.service_id, current_stock, NEW.quantity;
      END IF;

      UPDATE app.service
      SET stock_quantity = stock_quantity - NEW.quantity
      WHERE service_id = NEW.service_id;

      NEW.total_price = NEW.quantity * unit_price;
      RETURN NEW;
    END IF;

    -- same service_id: adjust by diff quantity
    SELECT service_price, stock_quantity
      INTO unit_price, current_stock
    FROM app.service
    WHERE service_id = NEW.service_id
    FOR UPDATE;

    diff_qty = NEW.quantity - OLD.quantity;
    IF diff_qty > 0 AND current_stock < diff_qty THEN
      RAISE EXCEPTION 'Insufficient stock for service_id=% (have %, need %)', NEW.service_id, current_stock, diff_qty;
    END IF;

    UPDATE app.service
    SET stock_quantity = stock_quantity - diff_qty
    WHERE service_id = NEW.service_id;

    -- recompute derived total
    NEW.total_price = NEW.quantity * unit_price;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    -- return inventory on delete
    UPDATE app.service
    SET stock_quantity = stock_quantity + OLD.quantity
    WHERE service_id = OLD.service_id;
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_service_before_write ON app.booking_service;
CREATE TRIGGER trg_booking_service_before_write
BEFORE INSERT OR UPDATE OR DELETE
ON app.booking_service
FOR EACH ROW
EXECUTE FUNCTION app.booking_service_before_write();

-- Recalculate booking.total_amount from:
-- - booking_detail: price * (1 + adjust_percent/100)
-- - booking_service: total_price
CREATE OR REPLACE FUNCTION app.recalc_booking_total(p_booking_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  detail_total NUMERIC(12, 2);
  service_total NUMERIC(12, 2);
BEGIN
  SELECT COALESCE(
    SUM(p.price * (1 + (dt.adjust_percent / 100))),
    0
  )
  INTO detail_total
  FROM app.booking_detail bd
  JOIN app.pricelist p ON p.price_id = bd.price_id
  JOIN app.day_type dt ON dt.day_type_id = bd.day_type_id
  WHERE bd.booking_id = p_booking_id;

  SELECT COALESCE(SUM(bs.total_price), 0)
    INTO service_total
  FROM app.booking_service bs
  WHERE bs.booking_id = p_booking_id;

  UPDATE app.booking
  SET total_amount = detail_total + service_total
  WHERE booking_id = p_booking_id;
END;
$$;

-- After any change in booking_detail, recompute booking total.
CREATE OR REPLACE FUNCTION app.booking_detail_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM app.recalc_booking_total(OLD.booking_id);
    RETURN OLD;
  END IF;

  PERFORM app.recalc_booking_total(NEW.booking_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_detail_after_change ON app.booking_detail;
CREATE TRIGGER trg_booking_detail_after_change
AFTER INSERT OR UPDATE OR DELETE
ON app.booking_detail
FOR EACH ROW
EXECUTE FUNCTION app.booking_detail_after_change();

-- After any change in booking_service, recompute booking total.
CREATE OR REPLACE FUNCTION app.booking_service_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM app.recalc_booking_total(OLD.booking_id);
    RETURN OLD;
  END IF;

  PERFORM app.recalc_booking_total(NEW.booking_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_service_after_change ON app.booking_service;
CREATE TRIGGER trg_booking_service_after_change
AFTER INSERT OR UPDATE OR DELETE
ON app.booking_service
FOR EACH ROW
EXECUTE FUNCTION app.booking_service_after_change();

-- Enforce cancel_reason when status=CANCELLED; clear cancel_reason otherwise.
CREATE OR REPLACE FUNCTION app.booking_validate_cancel_reason()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'CANCELLED' AND (NEW.cancel_reason IS NULL OR length(trim(NEW.cancel_reason)) = 0) THEN
    RAISE EXCEPTION 'cancel_reason is required when status=CANCELLED';
  END IF;

  IF NEW.status <> 'CANCELLED' THEN
    NEW.cancel_reason = NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_validate_cancel_reason ON app.booking;
CREATE TRIGGER trg_booking_validate_cancel_reason
BEFORE INSERT OR UPDATE OF status, cancel_reason
ON app.booking
FOR EACH ROW
EXECUTE FUNCTION app.booking_validate_cancel_reason();

-- If payment becomes SUCCESS, mark booking as PAID.
CREATE OR REPLACE FUNCTION app.payment_after_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_status = 'SUCCESS' THEN
    UPDATE app.booking
    SET status = 'PAID'
    WHERE booking_id = NEW.booking_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_after_change ON app.payment;
CREATE TRIGGER trg_payment_after_change
AFTER INSERT OR UPDATE OF payment_status
ON app.payment
FOR EACH ROW
EXECUTE FUNCTION app.payment_after_change();
