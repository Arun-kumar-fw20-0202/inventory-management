const { randomUUID } = require("crypto");
const {
  Env,
  StandardCheckoutClient,
  StandardCheckoutPayRequest,
  MetaInfo,
} = require("pg-sdk-node");
const { PaymentHistoryScheema } = require("../../models/payment/payment-history-scheema");
const { PlanModel } = require("../../models/pricing/pricing-scheema");
const { OrganizationModal } = require("../../models/User");


const CONFIG = {
  clientId: process.env.PHONEPE_CLIENT_ID,
  clientSecret: process.env.PHONEPE_CLIENT_SECRET,
  clientVersion: process.env.PHONEPE_CLIENT_VERSION || 1,
  env: process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX,
};

console.log("PhonePe Config:", CONFIG );

const client = StandardCheckoutClient.getInstance(
  CONFIG.clientId,
  CONFIG.clientSecret,
  CONFIG.clientVersion,
  CONFIG.env
);



const CreatePhonePeOrderController = async (req, res) => {
  try {
    let { pricing_id } = req.body;

    if (!pricing_id) {
      return res.status(400).json({ error: "Invalid DVC or Pricing ID" });
    }

    const validateAmount = await PlanModel.findById(pricing_id);

    if (!validateAmount) {
      return res.status(404).json({ error: "Pricing plan not found", status: false });
    }

    const merchantOrderId = randomUUID();
    // const redirectUrl = `http://localhost:${PORT}/check-status?merchantId=${merchantOrderId}`;
    const redirectUrl = `${process.env.BACKEND_URL}/api/payment/phone-pe/check-status/${merchantOrderId}?pricing_id=${validateAmount?._id}`;

    const metaInfo = MetaInfo.builder().udf1("udf1").udf2("udf2").build();

    const price = validateAmount?.discountPrice > 0 ? Number(validateAmount?.discountPrice) : Number(validateAmount?.price);
    if (price <= 0) {
      return res.status(400).json({ error: "Invalid pricing amount", status: false });
    }
    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(price * 100)
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    const response = await client.pay(request);
    const checkoutPageUrl = response.redirectUrl;

    return res.status(200).json({
      message: "Payment initiation endpoint is under construction",
      url: checkoutPageUrl,
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ msg: "Payment initiation failed", error: error });
  }
}


const CheckPhonePeStatusController = async (req, res) => {
  
  try {
    const { merchantId } = req.params;
    const { pricing_id } = req.query;
    
    console.log("Checking status for merchantId:", merchantId);
    console.log("Pricing ID:", pricing_id);

    if (!pricing_id) {
      return res.status(400).json({ success: false, message: "Missing required fields: pricing_id" });
    }
  
    if (!merchantId) {
      return res.status(400).json({ error: "Merchant ID is required" });
    }

    const response = await client.getOrderStatus(merchantId);
    console.log("Order Status:", response);
    if (response.state === "COMPLETED") {

      const dvc = await OrganizationModal.findOne({userId : req.profile.id}).select('payment')
      const pricing = await PlanModel.findById(pricing_id);
      
      if (!pricing) {
        return res.status(404).json({ success: false, message: "Pricing plan not found" });
      }
      if (!dvc) {
        return res.status(404).json({ success: false, message: "DVC not found" });
      }

      // Calculate expiry date
      const now = new Date();
      let newExpiry;

      if (dvc.payment?.willExpire && dvc.payment.willExpire > now) {
        // Case 1: Plan still active → extend from current expiry
        newExpiry = new Date(dvc.payment.willExpire);
        newExpiry.setMonth(newExpiry.getMonth() + (pricing.durationInMonths || 1));
      } else {
        // Case 2: Expired or no plan → start from today
        newExpiry = new Date();
        newExpiry.setMonth(newExpiry.getMonth() + (pricing.durationInMonths || 1));
      }

        await OrganizationModal.findOneAndUpdate({userId: req.profile.id}, {
            payment: {
                lastPricingId: pricing?._id,
                pricing_type: pricing?.pricing_type,
                paymentDate: now,
                willExpire: newExpiry,
                details: {
                    limits: pricing?.limits,
                    amount: price,
                    name: pricing?.name,
                    durationInMonths: pricing?.durationInMonths,
                    isTrial: pricing?.isTrial || false,
                },
                lastPaymentId: razorpay_payment_id
            }},
            { upsert: true }
        );

      const paymentRecord = {
        pricing_id,
        paymentDate: now,
        amount: pricing.price,
        willExpire: newExpiry,
        createdBy: req.profile?.id || dvc.createdBy,
        paymentType: 'one-time',
        razorpayOrderId: response?.paymentDetails[0].orderId,
        razorpayPaymentId: response?.paymentDetails[0].transactionId,
        payment_method: 'phonepe' // <-- REQUIRED FIELD FIX
      };
      await PaymentHistoryScheema.create(paymentRecord);
    //   await extendReferrerDvcExpiry(dvc.createdBy);

      // Get pricing information
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?transactionId=${response?.paymentDetails[0].transactionId}`);

    } else {
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed`);
    }
  } catch (error) {
    console.error("Error fetching order status:", error);
    res.status(500).json({ msg: "Failed to fetch order status", err: error });
  }
};

module.exports = {
  CreatePhonePeOrderController,
  CheckPhonePeStatusController
};
