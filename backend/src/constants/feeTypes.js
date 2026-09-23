const FEE_TYPES = Object.freeze({
  ADMISSION: "Admission",
  MONTHLY: "Monthly",
  TRANSPORT: "Transport",
  ANNUAL: "Annual",
  EXAM: "Exam",
});

const FEE_TYPE_VALUES = Object.freeze(Object.values(FEE_TYPES));

const PAYMENT_METHODS = Object.freeze({
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  RAZORPAY: "Razorpay",
});

const PAYMENT_METHOD_VALUES = Object.freeze(Object.values(PAYMENT_METHODS));

const FEE_STATUS = Object.freeze({
  PENDING: "Pending",
  PAID: "Paid",
});

const FEE_STATUS_VALUES = Object.freeze(Object.values(FEE_STATUS));

module.exports = {
  FEE_TYPES,
  FEE_TYPE_VALUES,
  PAYMENT_METHODS,
  PAYMENT_METHOD_VALUES,
  FEE_STATUS,
  FEE_STATUS_VALUES,
};