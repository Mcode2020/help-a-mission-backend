import { AdminModel } from '../database/models/admin.model.js';

async function seedAdmin() {
  try {
    const email = 'admin@helpamission.org';
    const password = 'SuperAdminPassword123!';

    console.log(`Seeding bootstrap admin: ${email}...`);
    const admin = await AdminModel.createAdmin({
      email,
      password,
      roleKeys: ['super_admin'],
    });

    console.log('✔ Bootstrap admin created successfully!');
    console.log('ID:', admin.id);
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✔ Admin account already exists.');
    } else {
      console.error('✖ Error:', error.message);
    }
  } finally {
    process.exit(0);
  }
}

seedAdmin();
