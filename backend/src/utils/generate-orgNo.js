const { OrganizationModal } = require("../models/User");

const generateOrgNo = async () => {
   try{
      const lastOrg = await OrganizationModal.findOne().sort({ createdAt: -1 }).select('orgNo');
      if (lastOrg && lastOrg.orgNo) {
         const lastNumber = parseInt(lastOrg.orgNo, 10);
         return String(lastNumber + 1).padStart(4, '0'); // Increment and pad with leading zeros
      }
   }catch (error) {
      console.error("Error generating organization number:", error);
   }
   return '0001'; 
};

module.exports = {
   generateOrgNo,
};