
const { createCategoryController, fetchCategoriesController } = require('../controllers/categorys/category-controller');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');

const CategoryRouter = require('express').Router();


CategoryRouter.post('/create-category', RoleVerifyMiddleware("superadmin", 'admin', "manager") , createCategoryController)
CategoryRouter.get('/fetch-category', RoleVerifyMiddleware("all") , fetchCategoriesController)

module.exports = {
   CategoryRouter
}