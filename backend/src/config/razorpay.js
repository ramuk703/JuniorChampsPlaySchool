const Razorpay = require("razorpay");

module.exports = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_dummykey123",
  key_secret: process.env.RAZORPAY_SECRET || "dummysecretkey123",
});
