const { CategoryModel } = require("../../models/categorys/category-scheema");
const { StockModal } = require("../../models/stock/stock-scheema");


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

   console.log("COming here ...=>")

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


module.exports = {
   createCategoryController,
   fetchCategoriesController
};