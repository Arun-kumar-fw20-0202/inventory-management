// middlewares/checkPower.js

const { Permission } = require("../models/permission/permission-scheema");

const checkPermissions = (module, action) => { // module and action example: 'products', 'read'
  return async (req, res, next) => {
    try {
        const user = req.profile;

        if (user.activerole === "superadmin") return next();
        const getPermission = await Permission.findOne({userId: user?._id}).lean();

        const hasAccess = hasPermission(getPermission, module, action);
        
        if (!hasAccess) {
          return res.status(403).json({ error: "Access denied. Insufficient permissions." });
        }

        next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
};

module.exports = checkPermissions;





const ACTION_MAPPING = {
  create: 'CREATE',
  read: 'VIEW', // older defaults used VIEW for read
  update: 'EDIT',
  delete: 'DELETE'
}

function normalizePermissions(input) {
  if (!input) return null
  // input may be a permission document with `.permissions`
  if (typeof input === 'object' && input.permissions) return input.permissions
  return input
}

function findModule(perms, moduleKey) {
  if (!perms || !moduleKey) return null
  // direct
  if (perms[moduleKey]) return perms[moduleKey]
  // try lowercase / case-insensitive
  const lower = moduleKey.toLowerCase()
  const foundKey = Object.keys(perms || {}).find(k => String(k).toLowerCase() === lower)
  return foundKey ? perms[foundKey] : null
}

function  hasPermission (permissionsInput, moduleKey, action){
  if (!moduleKey || !action) return false
  const perms = normalizePermissions(permissionsInput)
  if (!perms) return false

  const mod = findModule(perms, moduleKey)
  if (!mod) return false

  const act = String(action).toLowerCase()

  // If module entry uses boolean flags like { create: true }
  if (typeof mod === 'object') {
    if (mod.hasOwnProperty(act)) return !!mod[act]

    // if module has an `actions` array (older/default shape)
    if (Array.isArray(mod.actions)) {
      const mapped = ACTION_MAPPING[act] || act.toUpperCase()
      return mod.actions.map(a => String(a).toUpperCase()).includes(mapped)
    }

    // support visible/read semantics
    if (act === 'read' && typeof mod.visible === 'boolean') return !!mod.visible
  }

  return false
}