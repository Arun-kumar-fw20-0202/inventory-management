const { WherehouseModel } = require("../models/warehouse/wherehouse-model");
const { success, error } = require("../utils/response");

// Create a new wherehouse
const createWherehouse_controller = async (req, res) => {
    try {
      const payload = {
         ...req.body,
         orgNo: req.profile.orgNo,
         createdBy: req.profile.id
      }
      
      const wherehouse = new WherehouseModel(payload);
      await wherehouse.save();
      return  res.status(201).send({data: wherehouse, message: 'Wherehouse created successfully', status: true});
    } catch (error) {
      return res.status(400).send({message: error?.message, error, status: false});
    }
};

// Get all wherehouses
const get_AllWherehouses_controller = async (req, res) => {
   const { limit = 10, page = 1, search = '', active_status = 'true' } = req.query;
   const isActive = active_status === 'true';

   // Construct case-insensitive regex
   const searchRegex = new RegExp(search, 'i');

   const query = {
       orgNo: req.profile.orgNo,
       active_status: isActive,
       $or: [
           { name: { $regex: searchRegex } }, 
           { location: { $regex: searchRegex } }
       ]
   };

   try {

       const wherehouses = await WherehouseModel.find(query)
           .limit(parseInt(limit))
           .populate('createdBy', 'name email')
           .skip((parseInt(page) - 1) * parseInt(limit))
           .exec();

       const countdocs = await WherehouseModel.countDocuments(query);

       return res.status(200).send({
           data: wherehouses,
           pagination: {
               totalDocs: countdocs,
               totalPages: Math.ceil(countdocs / parseInt(limit)),
               currentPage: parseInt(page)
           },
           status: true,
           message: 'Warehouses retrieved successfully'
       });
   } catch (error) {
       console.error('Error fetching warehouses:', error); // Debugging
      return res.status(500).send({ status: false, message: 'Error retrieving warehouses', error });
   }
};



// Get a wherehouse by ID
const get_WherehouseById_controller = async (req, res) => {

   const { id } = req.params;
   try {
      const wherehouse = await WherehouseModel.findById({
         _id: id,
         orgNo: req.profile.orgNo,
         active_status: true
      });

      res.status(200).send({data: wherehouse, status: true, message: 'Wherehouse retrieved successfully'});
   } catch (error) {
      res.status(500).send(error);
   }
};

const DeleteWarehouse_controller = async (req, res) => {
    try{
        const ids = req.body.ids; // Expecting an array of IDs
        if(!Array.isArray(ids) || ids.length === 0){
            return res.status(400).send({message: "No IDs provided", status: false});
        }
        const result = await WherehouseModel.deleteMany(
            { _id: { $in: ids }, orgNo: req.profile.orgNo },
            { $set: { active_status: false } }
        );
        if(result.deletedCount === 0){
            return res.status(404).send({message: "No warehouses found to delete", status: false});
        }
        
        success(res, { message: `warehouses deleted successfully`, status: true });
    }
    catch(err){
        error(res, { message: err.message, status: false });
    }
}
const UpdateWarehouse_controller = async (req, res) => {
    try{
        const { id } = req.body;
        if(!id){
            return res.status(400).send({message: "Warehouse ID is required", status: false});
        }
        const wherehouse = await WherehouseModel.findOneAndUpdate(
            { _id: id, orgNo: req.profile.orgNo },
            req.body,
            { new: true }
        );

        if(!wherehouse){
            return res.status(404).send({message: "Warehouse not found", status: false});
        }
        success(res, { data: wherehouse, message: "Warehouse updated successfully", status: true });
    }
    catch(err){
        error(res, { message: err.message, status: false });
    }
}


module.exports = {
    createWherehouse_controller,
    get_AllWherehouses_controller,
    get_WherehouseById_controller,
    DeleteWarehouse_controller,
    UpdateWarehouse_controller
};