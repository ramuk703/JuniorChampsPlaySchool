class ApiResponse {
  static success(res, message, data = {}) {
    return res.status(200).json({
      success: true,

      message,

      data,
    });
  }

  static created(res, message, data = {}) {
    return res.status(201).json({
      success: true,

      message,

      data,
    });
  }
}

module.exports = ApiResponse;
