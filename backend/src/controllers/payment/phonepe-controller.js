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
const { extendReferrerDvcExpiry } = require("../../core/refer-extend");

const CONFIG = {
  clientId: process.env.PHONEPE_CLIENT_ID,
  clientSecret: process.env.PHONEPE_CLIENT_SECRET,
  clientVersion: process.env.PHONEPE_CLIENT_VERSION || 1,
  env: process.env.NODE_ENV === "production" ? Env.PRODUCTION : Env.SANDBOX,
};

const client = StandardCheckoutClient.getInstance(
  CONFIG.clientId,
  CONFIG.clientSecret,
  CONFIG.clientVersion,
  CONFIG.env
);

// Constants for billing cycles
const BILLING_CYCLES = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly'
};

const BILLING_MULTIPLIERS = {
  [BILLING_CYCLES.MONTHLY]: 1,
  [BILLING_CYCLES.YEARLY]: 12
};

// Utility functions
const validateBillingCycle = (billingCycle) => {
  return Object.values(BILLING_CYCLES).includes(billingCycle);
};

const calculatePrice = (pricing, billingCycle) => {
  if (!pricing || !validateBillingCycle(billingCycle)) {
    throw new Error("Invalid pricing or billing cycle");
  }

  const basePrice = pricing.discountPrice > 0 ? Number(pricing.discountPrice) : Number(pricing.price);
  const multiplier = BILLING_MULTIPLIERS[billingCycle];
  
  return Math.round(basePrice * multiplier * 100) / 100; // Round to 2 decimal places
};

const calculateExpiryDate = (currentExpiry, billingCycle, pricingDuration) => {
  const now = new Date();
  let newExpiry;

  if (currentExpiry && new Date(currentExpiry) > now) {
    newExpiry = new Date(currentExpiry);
  } else {
    newExpiry = new Date();
  }

  const monthsToAdd = billingCycle === BILLING_CYCLES.YEARLY 
    ? (pricingDuration || 1) * 12 
    : (pricingDuration || 1);

  newExpiry.setMonth(newExpiry.getMonth() + monthsToAdd);
  return newExpiry;
};

const CreatePhonePeOrderController = async (req, res) => {
  try {
    const { pricing_id, billing_cycle = BILLING_CYCLES.MONTHLY } = req.body;

    // Input validation
    if (!pricing_id || typeof pricing_id !== 'string') {
      return res.status(400).json({ 
        error: "Invalid pricing ID", 
        status: false 
      });
    }

    if (!validateBillingCycle(billing_cycle)) {
      return res.status(400).json({ 
        error: "Invalid billing cycle. Must be 'monthly' or 'yearly'", 
        status: false 
      });
    }

    // Fetch and validate pricing plan
    const validateAmount = await PlanModel.findById(pricing_id).lean();
    if (!validateAmount) {
      return res.status(404).json({ 
        error: "Pricing plan not found", 
        status: false 
      });
    }

    // Check if plan supports the requested billing cycle
    console.log({billing_cycle})
    if (billing_cycle === BILLING_CYCLES.YEARLY && !validateAmount.billing_cycle.includes('yearly')) {
      return res.status(400).json({ 
        error: "Yearly billing not supported for this plan", 
        status: false 
      });
    }

    const merchantOrderId = randomUUID();
    const redirectUrl = `${process.env.BACKEND_URL}/api/v1/payment/phone-pe/check-status/${merchantOrderId}?pricing_id=${encodeURIComponent(validateAmount._id)}&billing_cycle=${encodeURIComponent(billing_cycle)}`;

    const metaInfo = MetaInfo.builder()
      .udf1(billing_cycle)
      .udf2(validateAmount._id.toString())
      .build();

    const price = calculatePrice(validateAmount, billing_cycle);

    if (price <= 0) {
      return res.status(400).json({ 
        error: "Invalid pricing amount", 
        status: false 
      });
    }

    const request = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantOrderId)
      .amount(Math.round(price * 100)) // Convert to paisa/cents
      .redirectUrl(redirectUrl)
      .metaInfo(metaInfo)
      .build();

    const response = await client.pay(request);
    const checkoutPageUrl = response?.redirectUrl || response?.checkoutUrl || response?.redirect_url || null;

    if (!checkoutPageUrl) {
      return res.status(500).json({ 
        error: "Failed to generate payment URL", 
        status: false 
      });
    }

    return res.status(200).json({ 
      success: true, 
      merchantOrderId, 
      url: checkoutPageUrl,
      amount: price,
      billingCycle: billing_cycle
    });

  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ 
      error: "Payment initiation failed", 
      status: false 
    });
  }
};

const CheckPhonePeStatusController = async (req, res) => {
  try {
    const { merchantId } = req.params;
    const { pricing_id, billing_cycle = BILLING_CYCLES.MONTHLY } = req.query;
    const userId = req.profile?.id;

    // Input validation
    if (!merchantId || typeof merchantId !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid merchant ID" 
      });
    }

    if (!pricing_id || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required parameters: pricing_id and userId" 
      });
    }

    if (!validateBillingCycle(billing_cycle)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid billing cycle" 
      });
    }

    const response = await client.getOrderStatus(merchantId);
    console.log("Order Status:", response);

    const paymentDetails = Array.isArray(response?.paymentDetails) 
      ? response.paymentDetails[0] 
      : (response?.paymentDetails || {});

    if (response && (response.state === "COMPLETED" || response.state === "PAID")) {
      // Fetch organization and pricing in parallel
      const [org, pricing] = await Promise.all([
        OrganizationModal.findOne({ userId }).select('payment createdBy').lean(),
        PlanModel.findById(pricing_id).lean()
      ]);

      if (!pricing) {
        return res.status(404).json({ 
          success: false, 
          message: "Pricing plan not found" 
        });
      }

      const now = new Date();
      const newExpiry = calculateExpiryDate(
        org?.payment?.willExpire, 
        billing_cycle, 
        pricing.durationInMonths
      );

      const price = calculatePrice(pricing, billing_cycle);

      // Prepare payment update data
      const paymentUpdateData = {
        payment: {
          lastPricingId: pricing._id,
          pricing_type: pricing.pricing_type,
          paymentDate: now,
          willExpire: newExpiry,
          billingCycle: billing_cycle,
          details: {
            limits: pricing.limits,
            amount: price,
            name: pricing.name,
            durationInMonths: pricing.durationInMonths,
            isTrial: pricing.isTrial || false,
            billingCycle: billing_cycle
          },
          lastPaymentId: paymentDetails?.transactionId || paymentDetails?.transaction_id || null
        }
      };

      // Prepare payment history record
      const paymentRecord = {
        pricing_id,
        paymentDate: now,
        amount: price,
        willExpire: newExpiry,
        createdBy: userId,
        paymentType: billing_cycle === BILLING_CYCLES.YEARLY ? 'yearly' : 'monthly',
        billingCycle: billing_cycle,
        externalOrderId: paymentDetails?.orderId || paymentDetails?.order_id || null,
        externalPaymentId: paymentDetails?.transactionId || paymentDetails?.transaction_id || null,
        payment_method: 'phonepe'
      };

      // Execute database operations in parallel
      await Promise.all([
        OrganizationModal.findOneAndUpdate({ userId }, paymentUpdateData, { upsert: true }),
        PaymentHistoryScheema.create(paymentRecord)
      ]);

      // Extend referrer expiry (non-blocking)
      // try {
      //   await extendReferrerDvcExpiry(org?.createdBy || userId);
      // } catch (e) {
      //   console.error('extendReferrerDvcExpiry error', e);
      // }

      const successUrl = `${process.env.FRONTEND_URL}/payment/success?transactionId=${encodeURIComponent(paymentRecord.externalPaymentId || '')}&billingCycle=${encodeURIComponent(billing_cycle)}`;
      return res.redirect(successUrl);
    }

    const failureUrl = `${process.env.FRONTEND_URL}/payment/failed?merchantId=${encodeURIComponent(merchantId)}`;
    return res.redirect(failureUrl);

  } catch (error) {
    console.error("Error fetching order status:", error);
    const errorUrl = `${process.env.FRONTEND_URL}/payment/error`;
    res.redirect(errorUrl);
  }
};

module.exports = {
  CreatePhonePeOrderController,
  CheckPhonePeStatusController
};
