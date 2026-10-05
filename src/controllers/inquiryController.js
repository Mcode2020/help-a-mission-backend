import { getDb } from '../config/db.js';
import { logger } from '../security/logger.js';
import { sanitizeString, isValidEmail, isValidPhone } from '../middleware/validate.js';

const mockInquiriesStore = [];
const mockVolunteersStore = [];

/**
 * POST /api/inquiries/contact
 * Handle contact form submissions
 */
export async function createContactInquiry(req, res, next) {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).json({
        status: 'error',
        message: 'Name, email, and message are required fields.'
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.'
      });
      return;
    }

    if (phone && !isValidPhone(phone)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid phone number format provided.'
      });
      return;
    }

    const inquiry = {
      id: `inq-${Date.now()}`,
      name: sanitizeString(name),
      email: email.trim().toLowerCase(),
      phone: phone ? sanitizeString(phone) : null,
      subject: sanitizeString(subject || 'General Inquiry'),
      message: sanitizeString(message),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    try {
      const db = getDb();
      await db.collection('inquiries').insertOne(inquiry);
    } catch {
      mockInquiriesStore.unshift(inquiry);
    }

    logger.info('Contact inquiry received', { id: inquiry.id, email: inquiry.email });

    res.status(201).json({
      status: 'success',
      message: 'Thank you for reaching out to Help A Mission Welfare Society! We will get back to you shortly.',
      data: {
        id: inquiry.id,
        createdAt: inquiry.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/inquiries/volunteer
 * Handle volunteer registration submissions
 */
export async function createVolunteerApplication(req, res, next) {
  try {
    const { name, email, phone, age, occupation, skills, motivation, availability } = req.body;

    if (!name || !email || !phone || !skills) {
      res.status(400).json({
        status: 'error',
        message: 'Name, email, phone, and skills are required fields for volunteer registration.'
      });
      return;
    }

    if (!isValidEmail(email)) {
      res.status(400).json({
        status: 'error',
        message: 'Please provide a valid email address.'
      });
      return;
    }

    if (!isValidPhone(phone)) {
      res.status(400).json({
        status: 'error',
        message: 'Please provide a valid phone number.'
      });
      return;
    }

    const volunteer = {
      id: `vol-${Date.now()}`,
      name: sanitizeString(name),
      email: email.trim().toLowerCase(),
      phone: sanitizeString(phone),
      age: age ? Number(age) : null,
      occupation: occupation ? sanitizeString(occupation) : 'N/A',
      skills: Array.isArray(skills) ? skills.map(sanitizeString) : [sanitizeString(skills)],
      motivation: sanitizeString(motivation || ''),
      availability: sanitizeString(availability || 'Weekends'),
      status: 'UNDER_REVIEW',
      createdAt: new Date().toISOString()
    };

    try {
      const db = getDb();
      await db.collection('volunteers').insertOne(volunteer);
    } catch {
      mockVolunteersStore.unshift(volunteer);
    }

    logger.info('Volunteer application submitted', { id: volunteer.id, email: volunteer.email });

    res.status(201).json({
      status: 'success',
      message: 'Volunteer application submitted successfully! Our volunteer coordinator will contact you soon.',
      data: {
        id: volunteer.id,
        createdAt: volunteer.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}
