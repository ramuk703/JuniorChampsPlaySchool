const crypto = require("crypto");

const { redisClient } = require("../config/redis");
const {
  authFailedWindowSeconds,
  authFailedThreshold,
  authProtectionCooldownSeconds,
} = require("../config/env");
const redisKeys = require("../constants/redisKeys");

const normalizeIdentifier = (identifier) =>
  String(identifier || "").trim().toLowerCase();

const normalizeSource = (source) =>
  String(source || "").trim().toLowerCase();

/**
 * Generate an opaque protection hash from:
 *   normalized account identifier + normalized source IP
 *
 * The actual email/IP values are never stored in the Redis key.
 */
const getProtectionHash = (identifier, source) =>
  crypto
    .createHash("sha256")
    .update(
      `${normalizeIdentifier(identifier)}\0${normalizeSource(source)}`
    )
    .digest("hex");

const isRedisAvailable = () => redisClient.isOpen;

const getFailedKey = (accountType, identifier, source) =>
  redisKeys.authFailed(
    accountType,
    getProtectionHash(identifier, source)
  );

const getBlockedKey = (accountType, identifier, source) =>
  redisKeys.authBlocked(
    accountType,
    getProtectionHash(identifier, source)
  );

/**
 * Returns the current protection status for email + IP.
 *
 * blocked:
 *   Whether the email + IP pair is currently blocked.
 *
 * retryAfter:
 *   Remaining cooldown in seconds.
 */
const getProtectionStatus = async (
  accountType,
  identifier,
  source
) => {
  if (!isRedisAvailable()) {
    return {
      blocked: false,
      retryAfter: 0,
    };
  }

  try {
    const blockedKey = getBlockedKey(
      accountType,
      identifier,
      source
    );

    const [exists, ttl] = await Promise.all([
      redisClient.exists(blockedKey),
      redisClient.ttl(blockedKey),
    ]);

    return {
      blocked: exists === 1,
      retryAfter: ttl > 0 ? ttl : 0,
    };
  } catch {
    // Authentication must remain available if Redis is unavailable.
    return {
      blocked: false,
      retryAfter: 0,
    };
  }
};

/**
 * Record one failed login attempt for email + IP.
 */
const recordFailure = async (
  accountType,
  identifier,
  source
) => {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const failedKey = getFailedKey(
      accountType,
      identifier,
      source
    );

    const blockedKey = getBlockedKey(
      accountType,
      identifier,
      source
    );

    /*
     * Increment the failure counter and refresh its TTL.
     *
     * Refreshing the TTL on each failure creates a sliding
     * failed-login protection window.
     */
    const result = await redisClient
      .multi()
      .incr(failedKey)
      .expire(failedKey, authFailedWindowSeconds)
      .exec();

    const attempts = Number(result?.[0] || 0);

    if (attempts >= authFailedThreshold) {
      await redisClient.set(blockedKey, "1", {
        EX: authProtectionCooldownSeconds,
      });
    }

    return attempts;
  } catch {
    // Authentication must remain available if Redis is unavailable.
    return 0;
  }
};

/**
 * Clear failed attempts and active protection
 * after a successful login for the same email + IP pair.
 */
const clearFailures = async (
  accountType,
  identifier,
  source
) => {
  if (!isRedisAvailable()) {
    return;
  }

  try {
    const failedKey = getFailedKey(
      accountType,
      identifier,
      source
    );

    const blockedKey = getBlockedKey(
      accountType,
      identifier,
      source
    );

    await redisClient.del(failedKey, blockedKey);
  } catch {
    // Authentication must remain available if Redis is unavailable.
  }
};

module.exports = {
  getProtectionStatus,
  recordFailure,
  clearFailures,
};
