const axios = require("axios");

async function createCheckout({
  amount,
  currency = "EUR",
  description = "Billet NIGHTMARE",
}) {
  const response = await axios.post(
    "https://api.sumup.com/v0.1/checkouts",
    {
      checkout_reference: `TNLP-${Date.now()}`,
      amount: Number(amount),
      currency,
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      description,
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.SUMUP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
}

module.exports = {
  createCheckout,
};