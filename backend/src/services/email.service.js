const { transporter } = require("../config/mailer");
const { smtp } = require("../config/env");
const logger = require("../config/logger");

const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1000;

const sanitizeRecipient = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
};

const validateEmail = (email) => {
  if (!email || /[\r\n]/.test(email)) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const isRetryableError = (error) => {
  const retryableCodes = new Set([
    "ECONNECTION",
    "ECONNRESET",
    "ETIMEDOUT",
    "ESOCKET",
    "EAI_AGAIN",
  ]);

  const retryableResponseCodes = new Set([
    421,
    450,
    451,
    452,
  ]);

  if (error?.code && retryableCodes.has(error.code)) {
    return true;
  }

  if (
    error?.responseCode &&
    retryableResponseCodes.has(Number(error.responseCode))
  ) {
    return true;
  }

  return false;
};

const sendEmail = async ({
  to,
  subject,
  text,
  html,
  replyTo,
}) => {
  const recipient = sanitizeRecipient(to);

  if (!recipient || !validateEmail(recipient)) {
    throw new Error("A valid recipient email address is required.");
  }

  if (
    !subject ||
    typeof subject !== "string" ||
    /[\r\n]/.test(subject)
  ) {
    throw new Error("A valid email subject is required.");
  }

  if (subject.trim().length > 200) {
    throw new Error("Email subject must not exceed 200 characters.");
  }

  if (!text && !html) {
    throw new Error("Email must contain text or HTML content.");
  }

  const mailOptions = {
    from: {
      name: smtp.fromName,
      address: smtp.fromEmail,
    },
    to: recipient,
    subject: subject.trim(),
    text,
    html,
  };

  if (replyTo) {
    const sanitizedReplyTo = sanitizeRecipient(replyTo);

    if (!validateEmail(sanitizedReplyTo)) {
      throw new Error("replyTo must be a valid email address.");
    }

    mailOptions.replyTo = sanitizedReplyTo;
  }

  if (!transporter || !smtp.configured) {
    logger.warn("Email skipped because SMTP is not configured.");

    return {
      sent: false,
      skipped: true,
      reason: "SMTP_NOT_CONFIGURED",
    };
  }

  let lastError = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const info = await transporter.sendMail(mailOptions);

      logger.info("Email sent successfully.");

      return {
        sent: true,
        skipped: false,
        messageId: info.messageId,
      };
    } catch (error) {
      lastError = error;

      const retryable = isRetryableError(error);
      const hasRetriesRemaining = attempt < MAX_RETRIES;

      logger.warn(
        `Email delivery attempt ${attempt + 1} failed. Retryable: ${retryable}`
      );

      if (!retryable || !hasRetriesRemaining) {
        break;
      }

      const delay =
        RETRY_BASE_DELAY_MS * 2 ** attempt;

      await sleep(delay);
    }
  }

  logger.error("Email delivery failed after retry attempts.");

  throw new Error("Email delivery failed.");
};

const emailService = {
  sendEmail,
};

module.exports = emailService;