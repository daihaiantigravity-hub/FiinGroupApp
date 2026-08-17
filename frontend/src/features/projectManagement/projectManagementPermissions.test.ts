import { describe, expect, it } from 'vitest';
import { canUseProjectManagementCapability } from './projectManagementPermissions';

describe('project-management write permissions', () => {
  it('allows add when either project form grants access and add', () => {
    expect(canUseProjectManagementCapability({ projectmanagement: { canAccess: true, canAdd: true } }, 'canAdd')).toBe(true);
  });

  it('requires access as well as the capability', () => {
    expect(canUseProjectManagementCapability({ 'project-tasks': { canAccess: false, canAdd: true } }, 'canAdd')).toBe(false);
  });

  it('checks edit independently from add', () => {
    expect(canUseProjectManagementCapability({ 'project-tasks': { canAccess: true, canEdit: true } }, 'canEdit')).toBe(true);
    expect(canUseProjectManagementCapability({ 'project-tasks': { canAccess: true, canEdit: false, canAdd: true } }, 'canEdit')).toBe(false);
  });
});
