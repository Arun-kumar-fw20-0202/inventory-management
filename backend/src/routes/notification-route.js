const NotificationRouter = require('express').Router();
const { RoleVerifyMiddleware } = require('../middleware/role-verify-middleware');
const {
    CreateNotification,
    GetNotifications,
    GetUnreadCount,
    MarkAsRead,
    MarkAsDelivered,
    DismissNotification,
    DeleteNotification
} = require('../controllers/notification/notification-controller');

// create notification (restricted to admin/manager)
NotificationRouter.post('/', RoleVerifyMiddleware('admin', 'manager', 'superadmin'), CreateNotification);

// list notifications for current user
NotificationRouter.get('/', RoleVerifyMiddleware('admin','manager','staff','superadmin'), GetNotifications);
NotificationRouter.get('/unread/count', RoleVerifyMiddleware('admin','manager','staff','superadmin'), GetUnreadCount);

// mark actions for current user
NotificationRouter.post('/:id/read', RoleVerifyMiddleware('admin','manager','staff','superadmin'), MarkAsRead);
NotificationRouter.post('/:id/delivered', RoleVerifyMiddleware('admin','manager','staff','superadmin'), MarkAsDelivered);
NotificationRouter.post('/:id/dismiss', RoleVerifyMiddleware('admin','manager','staff','superadmin'), DismissNotification);

// delete notification (admin only)
NotificationRouter.delete('/:id', RoleVerifyMiddleware('admin','superadmin'), DeleteNotification);

module.exports = {
        NotificationRouter,
}