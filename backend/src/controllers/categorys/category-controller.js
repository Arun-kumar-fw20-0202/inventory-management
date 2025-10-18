const { CategoryModel } = require("../../models/categorys/category-scheema");
const { StockModal } = require("../../models/stock/stock-scheema");
const { error, success } = require("../../utils/response");


// Create a new product category
const createCategoryController = async (req, res) => {
   try {
      const payload = {
         ...req.body,
         orgNo: req.profile.orgNo,
         createdBy: req.profile.id
      }
      
      const newCategory = new CategoryModel(payload);
      await newCategory.save();
      res.status(201).json({data: newCategory , message: 'product category created' });
   } catch (error) {
      res.status(500).json({ message: 'Error creating category', error });
   }
};

// Fetch all product categories
const fetchCategoriesController = async (req, res) => {
   const { search = '', page = 1, limit = 10, active_status = true } = req.query;

   // Validate req.profile
   if (!req.profile || !req.profile.orgNo) {
      return res.status(400).json({ message: "Invalid request: Missing orgNo", status: false });
   }

   try {
      const query = {
         name: { $regex: search, $options: 'i' },
         orgNo: req.profile.orgNo,
         active_status
      };

      // console.log("Query:", query); // Debugging

      const categories = await CategoryModel.find(query)
         .populate('createdBy', 'name email')
         .limit(Number(limit))
         .skip((Number(page) - 1) * Number(limit))
         .sort({ createdAt: -1 })
         .exec();

      const count = await CategoryModel.countDocuments(query);

      res.status(200).json({
         data: categories,
         message: 'Product categories fetched',
         status: true,
         pagination: {
            total: count,
            current_page: Number(page),
            total_pages: Math.ceil(count / limit),
         },
      });
   } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching categories', error });
   }
};

const DeleteCategory_controller = async (req, res) => {
    try{
        const ids = req.body.ids; // Expecting an array of IDs
        if(!Array.isArray(ids) || ids.length === 0){
            return res.status(400).send({message: "No IDs provided", status: false});
        }
        const result = await CategoryModel.deleteMany(
            { _id: { $in: ids }, orgNo: req.profile.orgNo },
            { $set: { active_status: false } }
        );
        if(result.deletedCount === 0){
            return res.status(404).send({message: "No Categorys found to delete", status: false});
        }
        
        success(res, { message: `Categorys deleted successfully`, status: true });
    }
    catch(err){
      error(res, { message: err.message, status: false });
    }
}
const UpdateCategory_controller = async (req, res) => {
    try{
        const { id } = req.body;
        if(!id){
            return res.status(400).send({message: "Category ID is required", status: false});
        }
        const wherehouse = await CategoryModel.findOneAndUpdate(
            { _id: id, orgNo: req.profile.orgNo },
            req.body,
            { new: true }
        );

        if(!wherehouse){
            return res.status(404).send({message: "Category not found", status: false});
        }
        success(res, { data: wherehouse, message: "Category updated successfully", status: true });
    }
    catch(err){
        error(res, { message: err.message, status: false });
    }
}



module.exports = {
   createCategoryController,
   fetchCategoriesController,
   DeleteCategory_controller,
   UpdateCategory_controller
};