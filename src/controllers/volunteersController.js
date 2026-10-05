import { registerVolunteer } from '../services/volunteersService.js';

export async function handleVolunteerApplication(req, res, next) {
  try {
    const { fullName, email, phone, city, skills, availability } = req.body;
    const result = await registerVolunteer({
      fullName,
      email,
      phone,
      city,
      skills,
      availability,
    });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
