import { ApiError } from '../utils/api-error.js';

/**
 * Express middleware factory for permissions-first RBAC authorization.
 * @param {...string|string[]} requiredPermissions - Required permission key(s)
 */
export function authorize(...requiredPermissions) {
  const flattenedPermissions = requiredPermissions.flat();

  return (req, res, next) => {
    try {
      if (!req.admin) {
        throw ApiError.unauthorized('Authentication required before authorization.', 'UNAUTHENTICATED');
      }

      const { role, roles = [], permissions = [] } = req.admin;

      // Super Admin role or wildcard permission bypasses granular permission checks
      if (
        role === 'SUPER_ADMIN' ||
        role === 'super_admin' ||
        roles.includes('super_admin') ||
        roles.includes('SUPER_ADMIN') ||
        permissions.includes('access:all') ||
        permissions.includes('admin:all') ||
        permissions.includes('super_admin')
      ) {
        return next();
      }

      if (flattenedPermissions.length === 0) {
        return next();
      }

      // Check if admin possesses at least one required permission key
      const hasPermission = flattenedPermissions.some((perm) => permissions.includes(perm));

      if (!hasPermission) {
        throw ApiError.forbidden(
          `Access denied. Requires permission: ${flattenedPermissions.join(', ')}`,
          'INSUFFICIENT_PERMISSIONS'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export const requirePermission = authorize;
export default authorize;
