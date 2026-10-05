export const INITIAL_CAMPAIGNS = [
  {
    id: 'camp-1',
    title: 'Mission Rural Education: Digital Classrooms for Jind Villages',
    category: 'Education',
    summary: 'Equipping 5 village schools with solar-powered computer labs, smart tablets, and digital learning modules for 1,200+ underprivileged children.',
    fullStory: 'In rural Haryana, thousands of children lack access to basic digital tools, severely limiting their higher education and employment opportunities. Help A Mission Welfare Society is setting up solar-powered digital classrooms in 5 government primary schools across Jind district. Each school will receive 10 tablets, interactive projector systems, digital curriculum software in Hindi & English, and a dedicated computer instructor.',
    targetAmount: 350000,
    raisedAmount: 245000,
    donorsCount: 142,
    daysLeft: 18,
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80',
    urgent: true,
    featured: true,
    budgetBreakdown: [
      { item: '50 Educational Tablets & Protective Cases', amount: 175000 },
      { item: 'Solar Inverter Systems (5 Schools)', amount: 80000 },
      { item: 'Digital Content License & Workbooks', amount: 45000 },
      { item: 'Instructor Honorarium (6 Months)', amount: 50000 }
    ]
  },
  {
    id: 'camp-2',
    title: 'Mobile Healthcare Clinic & Diagnostic Camps',
    category: 'Healthcare',
    summary: 'Deploying a custom medical van to deliver free doctor consultations, blood tests, and essential medicines to remote farming hamlets.',
    fullStory: 'Elderly villagers and young mothers in remote areas often travel over 25 km for basic health checkups. Our Mobile Health Unit travels to 12 interior villages weekly, offering free OPD, diagnostic screening for anemia and diabetes, and distributing free prescription drugs.',
    targetAmount: 500000,
    raisedAmount: 380000,
    donorsCount: 215,
    daysLeft: 25,
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    urgent: false,
    featured: true,
    budgetBreakdown: [
      { item: 'Mobile Van Fuel & Maintenance (1 Year)', amount: 180000 },
      { item: 'Free Prescription Medicines Bulk Purchase', amount: 200000 },
      { item: 'Diagnostic Kits & Lab Consumables', amount: 70000 },
      { item: 'Paramedic & Driver Support', amount: 50000 }
    ]
  },
  {
    id: 'camp-3',
    title: 'Annapurna Daily Meal Program for Homeless & Wagers',
    category: 'Hunger Relief',
    summary: 'Providing nutritious hot meals daily to 300+ destitute elderly, daily wagers, and hospital attendants outside district hospitals.',
    fullStory: 'Hunger compromises health and dignity. Through our Annapurna Community Kitchen, we prepare and distribute fresh, balanced meals every afternoon to homeless individuals, daily wagers, and patient attendants staying outside civil hospitals.',
    targetAmount: 200000,
    raisedAmount: 165000,
    donorsCount: 310,
    daysLeft: 10,
    image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
    urgent: true,
    featured: false,
    budgetBreakdown: [
      { item: 'Ration & Grocery Supplies (Wheat, Rice, Dal)', amount: 120000 },
      { item: 'Eco-friendly Biodegradable Packaging', amount: 30000 },
      { item: 'Kitchen LPG & Logistics', amount: 50000 }
    ]
  }
];

export const INITIAL_TEAM = [
  {
    id: '1',
    name: 'Sh. Rajesh Verma',
    role: 'Founder & President',
    bio: 'Dedicated social worker with over 15 years of grassroots community service in Haryana, specializing in youth education and rural upliftment.',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    qualification: 'M.A. Social Work'
  },
  {
    id: '2',
    name: 'Dr. Anita Sharma',
    role: 'Vice President & Health Director',
    bio: 'Public health strategist driving rural medical camps, mobile clinic outreach, and child nutrition programs across Jind district.',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    qualification: 'MBBS, MD'
  },
  {
    id: '3',
    name: 'Er. Amit Kumar',
    role: 'General Secretary',
    bio: 'Manages field operations, volunteer coordination, legal compliance, and digital transparency infrastructure for the society.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    qualification: 'B.Tech, MBA'
  },
  {
    id: '4',
    name: 'Sunita Rani',
    role: 'Women Empowerment Lead',
    bio: 'Pioneer of self-help vocational centers providing sewing, computer literacy, and financial independence training to rural women.',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80',
    qualification: 'B.Ed'
  }
];

export const INITIAL_IMPACT = [
  {
    id: 'imp-1',
    title: 'From Stitched Clothes to Financial Independence',
    category: 'Financial Support',
    beneficiary: 'Meena Devi, Age 34',
    location: 'Safidon Block, Jind',
    before: 'Struggled to afford basic school uniforms for her 2 daughters with her husband\'s irregular daily wages.',
    after: 'Completed our 6-month tailoring course, received a free sewing machine, and now earns ₹8,500/month making school uniforms.',
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80',
    quote: 'Help A Mission didn\'t just give us food; they gave me a skill that restored my family\'s self-respect and secured my daughters\' schooling.'
  },
  {
    id: 'imp-2',
    title: 'Breaking Through the Digital Divide',
    category: 'Education',
    beneficiary: 'Rahul Kumar, Class 9 Student',
    location: 'Julana Village',
    before: 'Had never operated a laptop or tablet, scoring low in science and math due to lack of practical study materials.',
    after: 'Scored 92% in 8th grade board exams after attending our digital lab classes daily for 8 months.',
    image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80',
    quote: 'The interactive digital modules made science come alive for me. Now I aspire to become a software engineer.'
  }
];
