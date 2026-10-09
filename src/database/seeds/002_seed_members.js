/**
 * Seed initial published members
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  const count = await knex('members').count({ count: '*' });
  const total = parseInt(count[0]?.count || '0', 10);

  if (total === 0) {
    await knex('members').insert([
      {
        name: 'Dr. Ramesh Kumar',
        title: 'Founder & President',
        email: 'president@helpamission.org',
        phone: '+91 98120 12345',
        description: 'Leading Help A Mission Welfare Society since inception. Dedicated social activist committed to healthcare accessibility, blood donation drives, and community welfare in Jind.',
        status: 'published',
        language: 'en',
        sort_order: 1,
      },
      {
        name: 'Sunita Sharma',
        title: 'Vice President & Women Welfare Lead',
        email: 'sunita.sharma@helpamission.org',
        phone: '+91 98120 23456',
        description: 'Overseeing women empowerment programs, vocational training workshops, and emergency relief distribution for underprivileged families across Haryana.',
        status: 'published',
        language: 'en',
        sort_order: 2,
      },
      {
        name: 'Vikram Singh',
        title: 'General Secretary',
        email: 'vikram.singh@helpamission.org',
        phone: '+91 98120 34567',
        description: 'Managing organizational operations, inter-agency partnerships, and annual blood donation camp logistics with Red Cross Society.',
        status: 'published',
        language: 'en',
        sort_order: 3,
      },
      {
        name: 'Pooja Rani',
        title: 'Treasurer & Finance Director',
        email: 'finance@helpamission.org',
        phone: '+91 98120 45678',
        description: 'Ensuring total financial transparency, auditing donor contributions, and managing 80G tax exemption compliance.',
        status: 'published',
        language: 'en',
        sort_order: 4,
      },
      {
        name: 'Rajiv Malhotra',
        title: 'Youth & Education Coordinator',
        email: 'youth@helpamission.org',
        phone: '+91 98120 56789',
        description: 'Directing remedial education classes, school kit distributions, and youth volunteer mobilization drives.',
        status: 'published',
        language: 'en',
        sort_order: 5,
      },
    ]);
  }
}
