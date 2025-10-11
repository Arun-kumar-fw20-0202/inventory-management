const { RefferalModel } = require("../models/referral/refer-scheema");
const { UserModal } = require("../models/User");

const extendReferrerDvcExpiry = async (userId, duration) => {
   // Find the user who was referred
   const user = await UserModal.findById(userId).select("_id referredBy payment referralCode");
   // console.log('🔍 extendReferrerDvcExpiry - User found:', user);
   
   if (!user || !user.referredBy) return;

   // Find the referrer (the user who referred this user)
   const referrer = await UserModal.findById(user.referredBy).select("_id referralCode payment");
   // console.log('🔍 extendReferrerDvcExpiry - Referrer found:', referrer);
   if (!referrer) return;

   // Check if this referral already exists (unique per pair)
   const alreadyReferred = await RefferalModel.findOne({
      refferBy: referrer._id,
      refferTo: user._id
   });

   // console.log('🔍 extendReferrerDvcExpiry - Already referred check:', alreadyReferred);
   
   if (alreadyReferred) return;
   console.log('🔍 extendReferrerDvcExpiry - Duration received:', {duration});
   const durationInDays = duration > 6 ? 60 : 15;
   console.log('🔍 extendReferrerDvcExpiry - Duration in days to extend:', durationInDays);

   // Ensure payment objects exist
   if (!referrer.payment) referrer.payment = {};
   if (!user.payment) user.payment = {};

   // Extend referrer's expiry by 30 days
   const now = new Date();
   let referrerExpiry = referrer.payment.willExpire ? new Date(referrer.payment.willExpire) : now;
   if (referrerExpiry < now) referrerExpiry = new Date(now);
   referrerExpiry.setDate(referrerExpiry.getDate() + durationInDays);
   referrer.payment.willExpire = referrerExpiry;
   referrer.markModified('payment');

   // Extend referred user's expiry by 15 days
   let userExpiry = user.payment.willExpire ? new Date(user.payment.willExpire) : now;
   if (userExpiry < now) userExpiry = new Date(now);
   userExpiry.setDate(userExpiry.getDate() + 30);
   user.payment.willExpire = userExpiry;
   user.markModified('payment');

   // Save both users
   await referrer.save();
   await user.save();

   // Store referral event in referral-history
   await RefferalModel.create({
      code: referrer.referralCode,
      refferBy: referrer._id,
      refferTo: user._id
   });
};

module.exports = { extendReferrerDvcExpiry };