const express = require('express');
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const { createWherehouse_controller, get_AllWherehouses_controller, get_WherehouseById_controller } = require('../controllers/wherehouse.controller');
const WherehouseRouter = express.Router();

WherehouseRouter.post('/create', RoleVerifyMiddleware('superadmin', "admin") , createWherehouse_controller);
WherehouseRouter.get('/fetch', RoleVerifyMiddleware('all') , get_AllWherehouses_controller);
WherehouseRouter.get('/:id', RoleVerifyMiddleware('all') , get_WherehouseById_controller);

module.exports = {
   WherehouseRouter
};