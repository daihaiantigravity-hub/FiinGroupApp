import type { PermissionMap } from '../auth/authTypes';

export type ProjectManagementWriteCapability = 'canAdd' | 'canEdit';

const projectManagementForms = ['project-tasks', 'projectmanagement'] as const;

/**
 * Mirrors the target API's TFS write rule: the form must be accessible and
 * the requested capability must be granted. Keeping this in a small pure helper
 * lets the UI guard write actions before a request can fail with 403.
 */
export function canUseProjectManagementCapability(
  permissions: PermissionMap,
  capability: ProjectManagementWriteCapability,
): boolean {
  return projectManagementForms.some((formCode) => {
    const permission = permissions[formCode];
    return permission?.canAccess === true && permission[capability] === true;
  });
}
