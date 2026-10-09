import { PermissionRepository, RoleRepository, AdminRepository } from '../../database/repositories/index.js';
import { RoleModel } from '../../database/models/index.js';
import { ApiError } from '../../utils/api-error.js';

const permRepo = new PermissionRepository();
const roleRepo = new RoleRepository();
const adminRepo = new AdminRepository();

export const adminRbacController = {
  async getPermissions(req, res, next) {
    try {
      const permissions = await permRepo.getAllActive();
      res.json({
        success: true,
        data: { permissions },
      });
    } catch (err) {
      next(err);
    }
  },

  async getRoles(req, res, next) {
    try {
      const roles = await roleRepo.findAll({ limit: 100 });
      res.json({
        success: true,
        data: { roles: roles.items },
      });
    } catch (err) {
      next(err);
    }
  },

  async createRole(req, res, next) {
    try {
      const { key, name, description, permissionKeys } = req.body;
      if (!key || !name) {
        throw ApiError.badRequest('Role key and name are required.');
      }
      const role = await RoleModel.createRole({ key, name, description, permissionKeys });
      res.status(201).json({
        success: true,
        data: { role },
      });
    } catch (err) {
      next(err);
    }
  },

  async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const { name, description, permissionKeys } = req.body;
      const role = await RoleModel.updateRole(id, { name, description, permissionKeys });
      res.json({
        success: true,
        data: { role },
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      await RoleModel.deleteRole(id);
      res.json({
        success: true,
        message: 'Role deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  },

  async assignAccountRoles(req, res, next) {
    try {
      const { id } = req.params; // admin account ID
      const { roleIds } = req.body;
      if (!Array.isArray(roleIds)) {
        throw ApiError.badRequest('roleIds must be an array of UUIDs.');
      }
      await adminRepo.assignRoles(id, roleIds);
      res.json({
        success: true,
        message: 'Admin account roles updated successfully.',
      });
    } catch (err) {
      next(err);
    }
  },
};
