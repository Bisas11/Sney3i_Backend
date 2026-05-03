/**
 * Database seeder - run with: npm run seed
 *
 * This script resets all application data, then creates deterministic English
 * demo data distributed across all 24 Tunisian governorates.
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { AdminAction } from './admin/entities/admin-action.entity';
import { Category } from './categories/entities/category.entity';
import { SousCategory } from './categories/entities/sous-category.entity';
import { EmailToken } from './auth/entities/email-token.entity';
import { Document } from './prestataires/entities/document.entity';
import { PrestataireProfile } from './prestataires/entities/prestataire-profile.entity';
import { Report } from './reports/entities/report.entity';
import { Review } from './reviews/entities/review.entity';
import { ServiceRequest } from './service-requests/entities/service-request.entity';
import { Service } from './services/entities/service.entity';
import { User } from './users/entities/user.entity';

import {
  AdminActionType,
  AdminTargetType,
  DocumentType,
  PrestataireApplicationStatus,
  ReportStatus,
  ServiceRequestStatus,
  ServiceStatus,
  UserRole,
} from './common/enums';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    PrestataireProfile,
    Document,
    Category,
    SousCategory,
    Service,
    ServiceRequest,
    Review,
    AdminAction,
    EmailToken,
    Report,
  ],
  synchronize: false,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : false,
});

const GOVERNORATES = [
  'Tunis',
  'Ariana',
  'Ben Arous',
  'Manouba',
  'Nabeul',
  'Zaghouan',
  'Bizerte',
  'Beja',
  'Jendouba',
  'Kef',
  'Siliana',
  'Sousse',
  'Monastir',
  'Mahdia',
  'Sfax',
  'Kairouan',
  'Kasserine',
  'Sidi Bouzid',
  'Gabes',
  'Medenine',
  'Tataouine',
  'Gafsa',
  'Tozeur',
  'Kebili',
] as const;

const CLIENT_NAMES = [
  'Yassine Trabelsi',
  'Amira Ben Salem',
  'Mehdi Jaziri',
  'Nour Bouazizi',
  'Rania Chouchane',
  'Oussama Mbarek',
  'Ines Mansouri',
  'Sami Gharbi',
  'Manel Ferchichi',
  'Walid Haddad',
  'Leila Dridi',
  'Karim Bouhlel',
  'Salma Kammoun',
  'Firas Ayadi',
  'Mariem Elloumi',
  'Hatem Hachicha',
  'Amina Jlassi',
  'Anis Oueslati',
  'Lobna Khelifi',
  'Tarek Hamdi',
  'Nesrine Guesmi',
  'Mohamed Baccouche',
  'Aya Mzoughi',
  'Bilel Saidi',
];

const PROVIDER_NAMES = [
  'Ali Chebbi',
  'Samira Othmani',
  'Nizar Saidi',
  'Houda Mansour',
  'Foued Karoui',
  'Rim Dakhli',
  'Aymen Guermazi',
  'Sarra Hentati',
  'Moez Hamdi',
  'Emna Sghaier',
  'Lotfi Bousnina',
  'Nadia Kallel',
  'Taha Rekik',
  'Sonia Ayari',
  'Wassim Miled',
  'Mouna Jebali',
  'Hichem Kacem',
  'Olfa Beldi',
  'Rached Guesmi',
  'Dorra Triki',
  'Fethi Mabrouk',
  'Yosra Lassoued',
  'Skander Neji',
  'Maha Hajri',
];

const SPECIALTIES = [
  'Licensed Electrician',
  'Plumbing Technician',
  'Deep Cleaning Specialist',
  'HVAC Technician',
  'Appliance Repair Specialist',
  'Interior Painter',
  'Garden Maintenance Expert',
  'Moving and Assembly Pro',
];

const CATEGORY_DEFINITIONS = [
  {
    name: 'Electrical',
    subcategories: ['Wiring Installation', 'Emergency Electrical Repair'],
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=900&q=80',
    price: 160,
  },
  {
    name: 'Plumbing',
    subcategories: ['Leak Repair', 'Drain Unclogging'],
    image: 'https://images.unsplash.com/photo-1607400201515-c2c41c07d307?w=900&q=80',
    price: 130,
  },
  {
    name: 'Cleaning',
    subcategories: ['Home Deep Cleaning', 'Window Cleaning'],
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=900&q=80',
    price: 95,
  },
  {
    name: 'HVAC',
    subcategories: ['Air Conditioner Installation', 'AC Maintenance'],
    image: 'https://images.unsplash.com/photo-1581092160607-ee22731c06d3?w=900&q=80',
    price: 190,
  },
  {
    name: 'Appliance Repair',
    subcategories: ['Washing Machine Repair', 'Refrigerator Repair'],
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80',
    price: 120,
  },
  {
    name: 'Painting and Renovation',
    subcategories: ['Interior Painting', 'Tile Repair'],
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&q=80',
    price: 210,
  },
  {
    name: 'Gardening',
    subcategories: ['Garden Maintenance', 'Tree Trimming'],
    image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=900&q=80',
    price: 85,
  },
  {
    name: 'Moving',
    subcategories: ['Local Moving', 'Furniture Assembly'],
    image: 'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=900&q=80',
    price: 180,
  },
];

const REQUEST_STATUSES = [
  ServiceRequestStatus.PENDING,
  ServiceRequestStatus.ACCEPTED,
  ServiceRequestStatus.IN_PROGRESS,
  ServiceRequestStatus.DONE,
  ServiceRequestStatus.REJECTED,
  ServiceRequestStatus.CANCELLED,
];

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.+|\.+$/g, '');
}

function phone(index: number, prefix = 20): string {
  return `+216${prefix}${String(100000 + index).slice(1)}`;
}

function birthDate(index: number): string {
  const year = 1978 + (index % 22);
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 27) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function resetDatabase(): Promise<void> {
  await AppDataSource.query(`
    TRUNCATE TABLE
      "reports",
      "admin_actions",
      "email_tokens",
      "reviews",
      "service_requests",
      "services",
      "documents",
      "prestataire_profiles",
      "sous_categories",
      "categories",
      "users"
    RESTART IDENTITY CASCADE
  `);
}

async function seed() {
  await AppDataSource.initialize();
  console.log('Connected to database.');

  const userRepo = AppDataSource.getRepository(User);
  const profileRepo = AppDataSource.getRepository(PrestataireProfile);
  const documentRepo = AppDataSource.getRepository(Document);
  const categoryRepo = AppDataSource.getRepository(Category);
  const sousCategoryRepo = AppDataSource.getRepository(SousCategory);
  const serviceRepo = AppDataSource.getRepository(Service);
  const requestRepo = AppDataSource.getRepository(ServiceRequest);
  const reviewRepo = AppDataSource.getRepository(Review);
  const reportRepo = AppDataSource.getRepository(Report);
  const adminActionRepo = AppDataSource.getRepository(AdminAction);

  console.log('Resetting existing data...');
  await resetDatabase();

  const [adminPassword, clientPassword, providerPassword] = await Promise.all([
    bcrypt.hash('Admin1234!', 10),
    bcrypt.hash('Client1234!', 10),
    bcrypt.hash('Provider1234!', 10),
  ]);

  console.log('Creating English Tunisian users...');

  const admin = await userRepo.save(userRepo.create({
    name: 'Platform Admin',
    email: 'admin@sney3i.tn',
    password: adminPassword,
    role: UserRole.ADMIN,
    is_email_verified: true,
    is_active: true,
    phone_number: '+21671100000',
    address: 'Tunis, Tunisia',
  }));

  const clients = await userRepo.save(GOVERNORATES.map((region, index) => userRepo.create({
    name: CLIENT_NAMES[index],
    email: `client.${slug(region)}@sney3i.tn`,
    password: clientPassword,
    role: UserRole.CLIENT,
    is_email_verified: true,
    is_active: true,
    phone_number: phone(index, 21),
    date_of_birth: birthDate(index),
    address: `${region}, Tunisia`,
  })));

  const providers = await userRepo.save(GOVERNORATES.map((region, index) => userRepo.create({
    name: PROVIDER_NAMES[index],
    email: `provider.${slug(region)}@sney3i.tn`,
    password: providerPassword,
    role: UserRole.PRESTATAIRE,
    is_email_verified: true,
    is_active: true,
    phone_number: phone(index, 50),
    date_of_birth: birthDate(index + 7),
    address: `${region}, Tunisia`,
  })));

  const pendingApplicants = await userRepo.save([
    { name: 'Khalil Marzouki', region: 'Tunis' },
    { name: 'Ines Karray', region: 'Sfax' },
    { name: 'Maher Lahmar', region: 'Sousse' },
  ].map((applicant, index) => userRepo.create({
    name: applicant.name,
    email: `applicant.${slug(applicant.region)}@sney3i.tn`,
    password: clientPassword,
    role: UserRole.CLIENT,
    is_email_verified: true,
    is_active: true,
    phone_number: phone(index, 29),
    address: `${applicant.region}, Tunisia`,
  })));

  console.log(`Created ${1 + clients.length + providers.length + pendingApplicants.length} users.`);

  console.log('Creating provider profiles and documents...');

  const approvedProfiles = providers.map((provider, index) => {
    const specialty = SPECIALTIES[index % SPECIALTIES.length];
    return profileRepo.create({
      user_id: provider.id,
      application_status: PrestataireApplicationStatus.APPROVED,
      title: specialty,
      bio: `${specialty} serving ${GOVERNORATES[index]} and nearby communities with clear pricing and reliable scheduling.`,
      doc_validation: true,
    });
  });

  const pendingProfiles = pendingApplicants.map((applicant, index) => profileRepo.create({
    user_id: applicant.id,
    application_status: PrestataireApplicationStatus.PENDING,
    title: SPECIALTIES[(index + 2) % SPECIALTIES.length],
    bio: `New applicant based in ${applicant.address}. Documents are ready for admin review.`,
    doc_validation: false,
  }));

  await profileRepo.save([...approvedProfiles, ...pendingProfiles]);

  await documentRepo.save(providers.map((provider, index) => documentRepo.create({
    prestataire_id: provider.id,
    doc_type: index % 2 === 0 ? DocumentType.CERTIFICATE : DocumentType.DIPLOMA,
    doc_url: `seed-documents/${slug(provider.email)}.pdf`,
  })));

  console.log(`Created ${approvedProfiles.length + pendingProfiles.length} provider profiles.`);

  console.log('Creating categories and subcategories...');

  const savedCategories = await categoryRepo.save(CATEGORY_DEFINITIONS.map(category =>
    categoryRepo.create({ name: category.name }),
  ));

  const subcategoryRecords = savedCategories.flatMap((category, categoryIndex) =>
    CATEGORY_DEFINITIONS[categoryIndex].subcategories.map(name =>
      sousCategoryRepo.create({ category_id: category.id, name }),
    ),
  );

  const savedSubcategories = await sousCategoryRepo.save(subcategoryRecords);
  console.log(`Created ${savedCategories.length} categories and ${savedSubcategories.length} subcategories.`);

  console.log('Creating services...');

  const services = await serviceRepo.save(providers.map((provider, index) => {
    const categoryIndex = index % CATEGORY_DEFINITIONS.length;
    const category = CATEGORY_DEFINITIONS[categoryIndex];
    const subcategory = savedSubcategories[(categoryIndex * 2) + (index % 2)];
    const region = GOVERNORATES[index];
    const specialty = SPECIALTIES[index % SPECIALTIES.length];

    return serviceRepo.create({
      prestataire_id: provider.id,
      sous_category_id: subcategory.id,
      title: `${specialty} in ${region}`,
      description: `Professional ${subcategory.name.toLowerCase()} service for homes and small businesses in ${region}. Includes diagnosis, labor, and transparent follow-up.`,
      price: `${(category.price + (index % 5) * 15).toFixed(2)}`,
      image_url: category.image,
      status: ServiceStatus.ACTIVE,
    });
  }));

  console.log(`Created ${services.length} services.`);

  console.log('Creating service requests...');

  const requests = await requestRepo.save(services.slice(0, 18).map((service, index) => {
    const client = clients[(index * 5) % clients.length];
    const provider = providers.find(item => item.id === service.prestataire_id)!;
    const status = REQUEST_STATUSES[index % REQUEST_STATUSES.length];

    return requestRepo.create({
      service_id: service.id,
      client_id: client.id,
      prestataire_id: provider.id,
      status,
      client_message: `Hello, I need help with "${service.title}" at my home in ${client.address}.`,
    });
  }));

  console.log(`Created ${requests.length} service requests.`);

  console.log('Creating reviews for completed requests...');

  const completedRequests = requests.filter(request => request.status === ServiceRequestStatus.DONE);
  const reviews = await reviewRepo.save(completedRequests.map((request, index) => reviewRepo.create({
    service_request_id: request.id,
    client_id: request.client_id,
    score: index % 2 === 0 ? 5 : 4,
    commentaire: index % 2 === 0
      ? 'Excellent service, punctual and very professional.'
      : 'Good work and clear communication throughout the visit.',
  })));

  console.log(`Created ${reviews.length} reviews.`);

  console.log('Creating reports and admin actions...');

  const reports = await reportRepo.save([
    reportRepo.create({
      reporter_id: clients[0].id,
      service_id: services[5].id,
      review_id: null,
      comment: 'Service description needs admin review for clarity.',
      status: ReportStatus.UNSEEN,
    }),
    reportRepo.create({
      reporter_id: clients[3].id,
      service_id: services[12].id,
      review_id: null,
      comment: 'Client reported a scheduling mismatch.',
      status: ReportStatus.UNSEEN,
    }),
    reportRepo.create({
      reporter_id: clients[6].id,
      service_id: null,
      review_id: reviews[0]?.id ?? null,
      comment: 'Review was checked and no action was needed.',
      status: ReportStatus.SEEN,
    }),
  ]);

  await adminActionRepo.save(adminActionRepo.create({
    admin_id: admin.id,
    action_type: AdminActionType.PARDON,
    target_id: reports[2].review_id,
    target_type: AdminTargetType.REVIEW,
    target_user_id: clients[6].id,
    reason: 'Seeded admin audit entry for reviewed report.',
    pardon_amount: 1,
  }));

  await AppDataSource.destroy();

  console.log('\nSeed complete.');
  console.log('Accounts:');
  console.log('  Admin:     admin@sney3i.tn / Admin1234!');
  console.log('  Client:    client.tunis@sney3i.tn / Client1234!');
  console.log('  Provider:  provider.tunis@sney3i.tn / Provider1234!');
  console.log(`Regions: ${GOVERNORATES.join(', ')}`);
}

seed().catch(async err => {
  console.error('Seed failed:', err);
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  process.exit(1);
});
