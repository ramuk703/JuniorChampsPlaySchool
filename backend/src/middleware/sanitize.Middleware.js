function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") {
    return;
  }

  for (const key of Object.keys(obj)) {
    // Remove MongoDB operators like $gt, $set, etc.
    if (key.startsWith("$")) {
      delete obj[key];
      continue;
    }

    // Remove dotted keys
    if (key.includes(".")) {
      delete obj[key];
      continue;
    }

    sanitizeObject(obj[key]);
  }
}

module.exports = (req, res, next) => {
  sanitizeObject(req.body);

  sanitizeObject(req.params);

  sanitizeObject(req.query);

  next();
};
