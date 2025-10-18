/**
 * Permission checker utility
 * - hasPermission(permissions, moduleKey, action)
 *     permissions: object or permission doc ({ permissions: { module: { create, read, ... }}})
 *     moduleKey: string (module name)
 *     action: one of 'create'|'read'|'update'|'delete' (case-insensitive)
 *
 * - useHasPermission(moduleKey, action) -> React hook (uses redux state at state.permissions.permissions)
 */
import { useSelector } from 'react-redux'

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

export function hasPermission(permissionsInput, moduleKey, action) {
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

export function useHasPermission(moduleKey, action) {
    const perms = useSelector((s) => s?.permissions?.permissions)
    console.log('perms in hook', perms == null ? 'null/undefined' : {perms})
    if (perms == null) {
        console.log('No permissions found in state')
        return false
    }
    return hasPermission(perms, moduleKey, action)
}

export default hasPermission

