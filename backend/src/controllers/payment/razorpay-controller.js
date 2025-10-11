const Razorpay = require("razorpay");
const crypto = require("crypto");
const { PaymentHistoryScheema } = require("../../models/payment/payment-history-scheema");
const { PlanModel } = require("../../models/pricing/pricing-scheema");
const { UserModal, OrganizationModal } = require("../../models/User");
const { extendReferrerDvcExpiry } = require("../../core/refer-extend");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// BULLETPROOF Main Order Controller
const CreateRazorpayOrderController = async (req, res, next) => {
    try {
        // console.log('🎯 CreateRazorpayOrderController - Request body:', req.body);
        const { pricing_id, payment_type = 'one-time' } = req.body;

        console.log(req.body, '<< req.body');
        // Validate required fields
        if (!pricing_id) {
            return res.status(400).json({ error: "Missing required fields", required: ['pricing_id'] });
        }

        // Validate pricing exists
        const pricing = await PlanModel.findById(pricing_id);
        if (!pricing) {
            console.log('❌ Pricing plan not found for ID:', pricing_id);
            return res.status(404).json({ error: "Pricing plan not found" });
        }

        // console.log('✅ Pricing plan found:', pricing);

        const price = pricing?.discountPrice > 0 ? Number(pricing?.discountPrice) : Number(pricing?.price);

        

        console.log('✅ Pricing found:', {
            id: pricing._id,
            name: pricing.name,
            price: price,
            type: payment_type
        });

        // One-time payment logic
        console.log('💳 Creating one-time payment order...');

        
        const orderOptions = {
            amount: Math.round(price * 100), // Ensure integer, amount in paise
            currency: "INR",
            notes: {
                pricing_id: pricing_id,
                payment_type: 'one-time'
            },
            receipt: `order_${Date.now()}_${pricing_id.slice(-6)}`,
        };

        // console.log('💳 Order options:', orderOptions);

        const order = await razorpay.orders.create(orderOptions);
        
        console.log('✅ Order created successfully:', order.id);
        
        res.json({ success: true, ...order, payment_type: 'one-time' });
        
    } catch (err) {
        console.error('💥 CreateRazorpayOrderController Error:', err);
        
        const errorResponse = {
            error: "Failed to create payment order",
            message: err.message,
            details: err.error?.description || null,
            code: err.error?.code || null,
            timestamp: new Date().toISOString()
        };
        
        res.status(500).json(errorResponse);
    }
};

// BULLETPROOF Main Verification Controller
const VerifyRazorpayPaymentController = async (req, res, next) => {
    try {
        console.log('🔍 VerifyRazorpayPaymentController - Request body:', req.body);
        
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            pricing_id,
        } = req.body;

        const user = await OrganizationModal.findOne({userId : req.profile.id}).select('payment')

        // Validate required fields
        if (!pricing_id) {
            return res.status(400).json({ success: false, message: "Missing required fields: pricing_id" });
        }

        // Get pricing information
        const pricing = await PlanModel.findById(pricing_id);
        const price = pricing?.discountPrice > 0 ? Number(pricing?.price - pricing?.discountPrice) : Number(pricing?.price);
        if (!pricing) {
            return res.status(404).json({ 
                success: false, 
                message: "Pricing plan not found" 
            });
        }

        // console.log('✅ Pricing verified:', pricing.planName, pricing.price);


        // One-time payment verification
        console.log('💳 Verifying one-time payment...');
        
        // Validate one-time payment fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ 
                success: false, 
                message: "Missing payment verification data" 
            });
        }

        // Verify signature
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            console.log('❌ Signature verification failed');
            return res.status(400).json({ 
                success: false, 
                message: "Invalid payment signature" 
            });
        }

        console.log('✅ Payment signature verified');

        // Calculate expiry date
        const now = new Date();
        let newExpiry;

        if (user.payment?.willExpire && user.payment.willExpire > now) {
            // Case 1: Plan still active → extend from current expiry
            newExpiry = new Date(user.payment.willExpire);
            newExpiry.setMonth(newExpiry.getMonth() + (pricing?.durationInMonths || 1));
        } else {
            // Case 2: Expired or no plan → start from today
            newExpiry = new Date();
            newExpiry.setMonth(newExpiry.getMonth() + (pricing?.durationInMonths || 1));
        }

        // console.log('📅 New expiry calculated:', newExpiry);

        // Update payment details, if not exist add the keys
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
            },
        },
            { upsert: true }
        );

        const paymentRecord = {
            pricing_id,
            paymentDate: now,
            amount: price,
            willExpire: newExpiry,
            createdBy: req.profile?.id,
            paymentType: 'one-time',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            payment_method: 'razorpay' // <-- REQUIRED FIELD FIX
        };

        await PaymentHistoryScheema.create(paymentRecord);
        console.log('✅ Payment history recorded');

        // await extendReferrerDvcExpiry(req.profile?.id, pricing?.durationInMonths || 1);
    
        

        // Return success response
        const response = {
            success: true,
            message: "Payment verified & plan activated successfully",
            willExpire: newExpiry,
            paymentType: 'one-time',
            planDuration: `${pricing.durationInMonths} month(s)`
        };

        // console.log('🎉 One-time payment verification completed:', response);
        return res.json(response);

    } catch (error) {
        console.error("💥 VerifyRazorpayPaymentController Fatal Error:", error);
        return res.status(500).json({ 
            success: false, 
            error : error.message,
            message: "Internal server error during payment verification",
            timestamp: new Date().toISOString()
        });
    }
};


module.exports = {
   CreateRazorpayOrderController,
   VerifyRazorpayPaymentController,
}