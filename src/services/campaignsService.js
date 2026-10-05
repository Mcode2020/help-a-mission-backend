// Initial seed campaigns matching the Figma design causes
const INITIAL_CAMPAIGNS = [
  {
    id: 'camp-1',
    slug: 'blood-donation-camps',
    title: 'Blood Donation Camps',
    category: 'Healthcare',
    shortDescription: 'Organizing periodic voluntary blood donation camps across Jind to replenish regional blood banks.',
    fullDescription: 'Every two seconds, someone in India needs blood. Our society regularly organizes community blood donation camps in association with local civil hospitals and red cross units, ensuring safe screening, cold storage, and emergency distribution.',
    goalAmount: 150000,
    raisedAmount: 112000,
    donorsCount: 148,
    isUrgent: true,
    status: 'active',
  },
  {
    id: 'camp-2',
    slug: 'financial-aid',
    title: 'Financial Assistance Program',
    category: 'Social Welfare',
    shortDescription: 'Providing direct financial aid to underprivileged individuals and families facing severe medical or social hardship.',
    fullDescription: 'Direct financial assistance program provides emergency grants and living subsidies to widow-headed households, daily-wage laborers injured at work, and families fighting life-threatening illness who lack social security.',
    goalAmount: 300000,
    raisedAmount: 245000,
    donorsCount: 312,
    isUrgent: false,
    status: 'active',
  },
  {
    id: 'camp-3',
    slug: 'educational-support',
    title: 'Educational Support Drive',
    category: 'Education',
    shortDescription: 'Empowering children with books, tuition support, uniforms, and essential school kits for a brighter future.',
    fullDescription: 'Education is the most powerful tool for breaking cycles of poverty. We sponsor annual school fees, school bags, stationery, and after-school remedial tutoring for children from low-income families.',
    goalAmount: 200000,
    raisedAmount: 178000,
    donorsCount: 220,
    isUrgent: false,
    status: 'active',
  },
  {
    id: 'camp-4',
    slug: 'community-development',
    title: 'Community Relief & Development',
    category: 'Community',
    shortDescription: 'Distributing essential goods, winter blankets, sanitation supplies, and food rations during relief campaigns.',
    fullDescription: 'Our seasonal community relief drive reaches the most vulnerable slum clusters and rural outskirts with warm blankets in winter, clean water tankers in summer, and ration kits throughout the year.',
    goalAmount: 250000,
    raisedAmount: 195000,
    donorsCount: 185,
    isUrgent: true,
    status: 'active',
  },
];

export async function listCampaigns() {
  return INITIAL_CAMPAIGNS.map((c) => ({
    ...c,
    progressPercent: Math.min(100, Math.round((c.raisedAmount / c.goalAmount) * 100)),
  }));
}

export async function getCampaignBySlug(slug) {
  const campaign = INITIAL_CAMPAIGNS.find((c) => c.slug === slug);
  if (!campaign) {
    return null;
  }
  return {
    ...campaign,
    progressPercent: Math.min(100, Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)),
  };
}
