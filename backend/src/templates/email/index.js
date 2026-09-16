const { createBaseTemplate, escapeHtml } = require("./base.template");

const welcomeEmail = ({
  name,
  email,
}) => {
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);

  return {
    subject: "Welcome to Junior Champ's Play School",
    text: `Hello ${name},

Welcome to Junior Champ's Play School.

Your account has been created successfully.

Registered email: ${email}

Regards,
Junior Champ's Play School`,
    html: createBaseTemplate({
      title: "Welcome",
      content: `
        <h2>Welcome, ${safeName}!</h2>

        <p>
          Your account at <strong>Junior Champ's Play School</strong>
          has been created successfully.
        </p>

        <p>
          Registered email:
          <strong>${safeEmail}</strong>
        </p>

        <p>
          Thank you for joining us.
        </p>
      `,
    }),
  };
};

const passwordResetEmail = ({
  name,
  resetUrl,
  expiresIn = "15 minutes",
}) => {
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);

  return {
    subject: "Password Reset Request",
    text: `Hello ${name},

A password reset was requested for your account.

Reset your password using this link:

${resetUrl}

This link expires in ${expiresIn}.

If you did not request this, you can safely ignore this email.

Regards,
Junior Champ's Play School`,
    html: createBaseTemplate({
      title: "Password Reset",
      content: `
        <h2>Password Reset</h2>

        <p>Hello ${safeName},</p>

        <p>
          A password reset was requested for your account.
        </p>

        <p>
          <a
            href="${safeResetUrl}"
            style="display:inline-block;padding:12px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;"
          >
            Reset Password
          </a>
        </p>

        <p>
          This link expires in <strong>${escapeHtml(expiresIn)}</strong>.
        </p>

        <p>
          If you did not request this password reset,
          you can safely ignore this email.
        </p>
      `,
    }),
  };
};

const admissionEmail = ({
  parentName,
  studentName,
}) => {
  const safeParentName = escapeHtml(parentName);
  const safeStudentName = escapeHtml(studentName);

  return {
    subject: "Admission Registration Received",
    text: `Hello ${parentName},

We have received the admission registration for ${studentName}.

Our school team will review the submitted information.

Regards,
Junior Champ's Play School`,
    html: createBaseTemplate({
      title: "Admission Registration",
      content: `
        <h2>Admission Registration Received</h2>

        <p>Hello ${safeParentName},</p>

        <p>
          We have received the admission registration for:
        </p>

        <p>
          <strong>Student:</strong> ${safeStudentName}
        </p>

        <p>
          Our school team will review the submitted information.
        </p>
      `,
    }),
  };
};

const paymentEmail = ({
  parentName,
  studentName,
  amount,
  receiptNumber,
}) => {
  const safeParentName = escapeHtml(parentName);
  const safeStudentName = escapeHtml(studentName);
  const safeAmount = escapeHtml(amount);
  const safeReceiptNumber = escapeHtml(receiptNumber);

  return {
    subject: "Fee Payment Confirmation",
    text: `Hello ${parentName},

Your fee payment has been recorded successfully.

Student: ${studentName}
Amount: ${amount}
Receipt: ${receiptNumber}

Regards,
Junior Champ's Play School`,
    html: createBaseTemplate({
      title: "Fee Payment Confirmation",
      content: `
        <h2>Fee Payment Confirmation</h2>

        <p>Hello ${safeParentName},</p>

        <p>Your fee payment has been recorded successfully.</p>

        <table cellpadding="8" cellspacing="0" border="0">
          <tr>
            <td><strong>Student</strong></td>
            <td>${safeStudentName}</td>
          </tr>

          <tr>
            <td><strong>Amount</strong></td>
            <td>${safeAmount}</td>
          </tr>

          <tr>
            <td><strong>Receipt</strong></td>
            <td>${safeReceiptNumber}</td>
          </tr>
        </table>
      `,
    }),
  };
};

const notificationEmail = ({
  name,
  subject,
  message,
}) => {
  const safeName = escapeHtml(name);
  const safeMessage = escapeHtml(message);

  return {
    subject,
    text: `Hello ${name},

${message}

Regards,
Junior Champ's Play School`,
    html: createBaseTemplate({
      title: subject,
      content: `
        <h2>${escapeHtml(subject)}</h2>

        <p>Hello ${safeName},</p>

        <p>${safeMessage.replace(/\n/g, "<br>")}</p>
      `,
    }),
  };
};

module.exports = {
  welcomeEmail,
  passwordResetEmail,
  admissionEmail,
  paymentEmail,
  notificationEmail,
};