import { logger } from '../security/logger.js';

const inquiriesStore = [];

export async function submitContactInquiry({ fullName, email, phone, subject, message }) {
  if (!fullName || !email || !message) {
    throw new Error('Name, email, and message are required.');
  }

  const inquiry = {
    id: `INQ-${Date.now()}`,
    fullName,
    email,
    phone: phone || '',
    subject: subject || 'General Query',
    message,
    status: 'received',
    submittedAt: new Date().toISOString(),
  };

  inquiriesStore.push(inquiry);
  logger.info('Contact inquiry received', {
    id: inquiry.id,
    subject: inquiry.subject,
  });

  return {
    status: 'success',
    message: 'Thank you for reaching out! We have received your message and will respond shortly.',
    inquiryId: inquiry.id,
  };
}
