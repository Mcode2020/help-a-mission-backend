import { logger } from '../security/logger.js';

const volunteersStore = [];

export async function registerVolunteer({ fullName, email, phone, city, skills, availability }) {
  if (!fullName || !email || !phone) {
    throw new Error('Full name, email, and phone number are required.');
  }

  const volunteer = {
    id: `VOL-${Date.now()}`,
    fullName,
    email,
    phone,
    city: city || 'Jind',
    skills: skills || 'General Assistance',
    availability: availability || 'Flexible',
    status: 'pending_review',
    registeredAt: new Date().toISOString(),
  };

  volunteersStore.push(volunteer);
  logger.info('New volunteer application registered', {
    id: volunteer.id,
    city: volunteer.city,
  });

  return {
    status: 'success',
    message: 'Volunteer application submitted successfully! Our team will contact you shortly.',
    applicationId: volunteer.id,
  };
}
