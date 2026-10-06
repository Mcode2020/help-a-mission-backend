import { submitContactInquiry } from '../services/contactService.js';

export async function handleContactInquiry(req, res, next) {
  try {
    const { fullName, email, phone, subject, message } = req.body;
    const result = await submitContactInquiry({
      fullName,
      email,
      phone,
      subject,
      message,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
