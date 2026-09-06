-- Keep only today's minimal usage accounting separate from deletable profiles.
-- Deleting/recreating an account must not replenish the free AI allowance.
CREATE TABLE plan_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  day_start INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  status TEXT NOT NULL
);
CREATE INDEX usage_user_day ON plan_usage(user_id, day_start, created_at);
CREATE INDEX usage_ip_day ON plan_usage(ip_hash, day_start);
CREATE INDEX usage_day ON plan_usage(day_start);
INSERT INTO plan_usage SELECT id,user_id,ip_hash,day_start,created_at,status FROM plan_jobs
  WHERE day_start >= CAST(strftime('%s','now','start of day') AS INTEGER);

DROP TRIGGER reserve_plan;
CREATE TRIGGER reserve_plan BEFORE INSERT ON plan_jobs BEGIN
  SELECT RAISE(ABORT, 'USER_DAILY_LIMIT')
    WHERE (SELECT count(*) FROM plan_usage WHERE user_id=NEW.user_id AND day_start=NEW.day_start) >= 3;
  SELECT RAISE(ABORT, 'IP_DAILY_LIMIT')
    WHERE (SELECT count(*) FROM plan_usage WHERE ip_hash=NEW.ip_hash AND day_start=NEW.day_start) >= 15;
  SELECT RAISE(ABORT, 'SITE_DAILY_LIMIT')
    WHERE (SELECT count(*) FROM plan_usage WHERE day_start=NEW.day_start) >= 40;
  SELECT RAISE(ABORT, 'COOLDOWN')
    WHERE EXISTS(SELECT 1 FROM plan_usage WHERE user_id=NEW.user_id AND created_at>NEW.created_at-60);
  SELECT RAISE(ABORT, 'PLAN_IN_PROGRESS')
    WHERE EXISTS(SELECT 1 FROM plan_usage WHERE user_id=NEW.user_id AND status='pending' AND created_at>NEW.created_at-120);
END;
CREATE TRIGGER record_plan_usage AFTER INSERT ON plan_jobs BEGIN
  INSERT INTO plan_usage VALUES(NEW.id,NEW.user_id,NEW.ip_hash,NEW.day_start,NEW.created_at,NEW.status);
END;
CREATE TRIGGER update_plan_usage AFTER UPDATE OF status ON plan_jobs BEGIN
  UPDATE plan_usage SET status=NEW.status WHERE id=NEW.id;
END;
