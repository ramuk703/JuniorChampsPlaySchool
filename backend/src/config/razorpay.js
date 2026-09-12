const Razorpay = require("razorpay");
const { razorpayKey, razorpaySecret } = require("./env");

if (!razorpayKey || !razorpaySecret) {
  module.exports = null;
} else {
  module.exports = new Razorpay({
    key_id: razorpayKey,
    key_secret: razorpaySecret,
  });
}
