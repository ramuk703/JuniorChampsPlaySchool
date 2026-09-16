const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const createBaseTemplate = ({
  title,
  content,
  footer = "Junior Champ's Play School",
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding:30px 15px;">

        <table
          width="600"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;"
        >

          <tr>
            <td style="padding:24px;background:#1f2937;color:#ffffff;">
              <h1 style="margin:0;font-size:24px;">
                Junior Champ's Play School
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;color:#333333;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>

          <tr>
            <td style="padding:20px;background:#f8fafc;color:#6b7280;font-size:12px;text-align:center;">
              ${escapeHtml(footer)}
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
`;
};

module.exports = {
  escapeHtml,
  createBaseTemplate,
};