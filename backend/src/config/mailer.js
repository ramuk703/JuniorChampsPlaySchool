const nodemailer = require("nodemailer");
const { smtp } = require("./env");
const logger = require("./logger");

let transporter = null;

const createMailer = () => {
  if (!smtp.configured) {
    logger.warn(
      "SMTP is not configured. Email sending is disabled until SMTP settings are provided."
    );

    return null;
  }

  return nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,

    auth: {
      user: smtp.user,
      pass: smtp.password,
    },

    connectionTimeout: smtp.connectionTimeoutMs,
    greetingTimeout: smtp.greetingTimeoutMs,
    socketTimeout: smtp.socketTimeoutMs,

    disableFileAccess: true,
    disableUrlAccess: true,
  });
};

transporter = createMailer();

const verifyMailerConnection = async () => {
  if (!transporter) {
    return {
      configured: false,
      connected: false,
    };
  }

  try {
    await transporter.verify();

    logger.info("SMTP connection verified successfully.");

    return {
      configured: true,
      connected: true,
    };
  } catch (error) {
    logger.error(
      `SMTP connection verification failed: ${error.message}`
    );

    return {
      configured: true,
      connected: false,
    };
  }
};

module.exports = {
  get transporter() {
    return transporter;
  },

  verifyMailerConnection,
};
