const adminPermission = {
    systemuser: { create: true, read: true, update: true, delete: true },
    stock: { create: true, read: true, update: true, delete: true },
    sales: { create: true, read: true, update: true, delete: true },
    purchases: { create: true, read: true, update: true, delete: true },
    reports: { create: true, read: true, update: true, delete: true },
    organization: { create: true, read: true, update: true, delete: true },
    sessions: { create: true, read: true, update: true, delete: true },
    pricing: { create: false, read: true, update: false, delete: false },
    settings: { create: true, read: true, update: true, delete: true },
};

const managerPermission = {
    systemuser: { create: true, read: true, update: true, delete: false },
    stock: { create: true, read: true, update: true, delete: false },
    sales: { create: true, read: true, update: true, delete: false },
    purchases: { create: true, read: true, update: true, delete: false },
    reports: { create: true, read: true, update: true, delete: true },
    organization: { create: false, read: false, update: false, delete: false },
    sessions: { create: false, read: false, update: false, delete: false },
    pricing: { create: false, read: false, update: false, delete: false },
    settings: { create: true, read: true, update: true, delete: true },
};


const staffPermission = {
    systemuser: { create: false, read: false, update: false, delete: false },
    stock: { create: false, read: false, update: false, delete: false },
    sales: { create: true, read: true, update: true, delete: true },
    purchases: { create: false, read: false, update: false, delete: false },
    reports: { create: false, read: true, update: false, delete: false },
    organization: { create: false, read: false, update: false, delete: false },
    sessions: { create: false, read: false, update: false, delete: false },
    pricing: { create: false, read: false, update: false, delete: false },
    settings: { create: true, read: true, update: true, delete: true },
};



module.exports = {
    adminPermission,
    managerPermission,
    staffPermission
};