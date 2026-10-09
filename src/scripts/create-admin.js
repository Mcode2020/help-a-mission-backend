import readline from 'node:readline';
import { AdminModel } from '../database/models/admin.model.js';

async function createAdminCli() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  try {
    console.log('--- NGO Backend CLI Admin Creation ---');
    const email = await question('Enter admin email: ');
    const password = await question('Enter admin password: ');

    if (!email || !password) {
      console.error('Error: Email and password are required.');
      process.exit(1);
    }

    console.log(`Creating admin account for ${email}...`);
    const admin = await AdminModel.createAdmin({
      email,
      password,
      roleKeys: ['super_admin'],
    });

    console.log('✔ Admin account created successfully!');
    console.log(`Admin ID: ${admin.id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Status: ${admin.status}`);
  } catch (error) {
    console.error('✖ Failed to create admin:', error.message);
  } finally {
    rl.close();
    process.exit(0);
  }
}

createAdminCli();
