export const roleLabels = {
  admin: 'Administrator',
  manager: 'Support Manager',
  agent: 'Support Agent',
  requester: 'Requester',
}

const permissions = {
  admin: ['tickets:view_all', 'tickets:update', 'tickets:assign', 'messages:note', 'reports:view', 'users:manage'],
  manager: ['tickets:view_all', 'tickets:update', 'tickets:assign', 'messages:note', 'reports:view'],
  agent: ['tickets:view_all', 'tickets:update', 'tickets:assign', 'messages:note'],
  requester: ['tickets:view_own'],
}

export function can(role, permission) {
  return permissions[role]?.includes(permission) ?? false
}

export function isStaff(role) {
  return ['admin', 'manager', 'agent'].includes(role)
}
