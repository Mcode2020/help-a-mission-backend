import { MemberRepository } from '../../database/repositories/index.js';
import { ApiError } from '../../utils/api-error.js';

const memberRepo = new MemberRepository();

export const membersController = {
  async getPublicMembers(req, res, next) {
    try {
      const page = parseInt(req.query.page || 1, 10);
      const limit = parseInt(req.query.limit || 50, 10);
      const language = req.query.language || req.headers['accept-language'] || 'en';
      const result = await memberRepo.findPublished({ page, limit, language });
      res.json({
        success: true,
        data: result.items,
        meta: { pagination: result.pagination },
      });
    } catch (err) {
      next(err);
    }
  },

  async getAdminMembers(req, res, next) {
    try {
      const page = parseInt(req.query.page || 1, 10);
      const limit = parseInt(req.query.limit || 50, 10);
      const search = req.query.search || '';
      const language = req.query.language || undefined;
      const result = await memberRepo.findAllAdmin({ page, limit, search, language });
      res.json({
        success: true,
        data: result.items,
        meta: { pagination: result.pagination },
      });
    } catch (err) {
      next(err);
    }
  },

  async getMemberById(req, res, next) {
    try {
      const { id } = req.params;
      const member = await memberRepo.findById(id);
      if (!member) {
        throw ApiError.notFound('Member not found.');
      }
      res.json({
        success: true,
        data: member,
      });
    } catch (err) {
      next(err);
    }
  },

  async createMember(req, res, next) {
    try {
      const { name, email, phone, title, description, image_url, imageUrl, status, language, sort_order, sortOrder } = req.body;
      if (!name || !name.trim()) {
        throw ApiError.badRequest('Member name is required.');
      }
      if (!title || !title.trim()) {
        throw ApiError.badRequest('Member title is required.');
      }

      const created = await memberRepo.create({
        name: name.trim(),
        email: email ? email.trim() : null,
        phone: phone ? phone.trim() : null,
        title: title.trim(),
        description: description ? description.trim() : null,
        image_url: image_url || imageUrl || null,
        status: status || 'published',
        language: language || 'en',
        sort_order: sort_order !== undefined ? parseInt(sort_order, 10) : (sortOrder !== undefined ? parseInt(sortOrder, 10) : 0),
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateMember(req, res, next) {
    try {
      const { id } = req.params;
      const member = await memberRepo.findById(id);
      if (!member) {
        throw ApiError.notFound('Member not found.');
      }

      const { name, email, phone, title, description, image_url, imageUrl, status, language, sort_order, sortOrder } = req.body;

      const updateData = {};
      if (name !== undefined) updateData.name = name.trim();
      if (email !== undefined) updateData.email = email ? email.trim() : null;
      if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
      if (title !== undefined) updateData.title = title.trim();
      if (description !== undefined) updateData.description = description ? description.trim() : null;
      if (image_url !== undefined || imageUrl !== undefined) updateData.image_url = image_url !== undefined ? image_url : imageUrl;
      if (status !== undefined) updateData.status = status;
      if (language !== undefined) updateData.language = language;
      if (sort_order !== undefined || sortOrder !== undefined) {
        updateData.sort_order = parseInt(sort_order !== undefined ? sort_order : sortOrder, 10);
      }

      const updated = await memberRepo.update(id, updateData);

      res.json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteMember(req, res, next) {
    try {
      const { id } = req.params;
      const member = await memberRepo.findById(id);
      if (!member) {
        throw ApiError.notFound('Member not found.');
      }

      await memberRepo.delete(id);

      res.json({
        success: true,
        message: 'Member deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  },
};

export default membersController;
