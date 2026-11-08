import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { writeLog } from '../lib/audit.js';
import { labTasksStore } from './labTasks.js';

const router = Router();

// Dedicated hospital destination bank accounts for direct fee routing and settlement
const HOSPITAL_BANK_ACCOUNTS = {
  'HOSP-01': {
    entityName: 'Company A Diagnostics & Hospitals Private Limited',
    bankName: 'HDFC Bank Corporate Healthcare Division',
    accountNo: '50200088192019',
    ifsc: 'HDFC0001824',
    branch: 'MG Road Healthcare Enclave, Vijayawada',
    upiId: 'companya.hosp01@hdfcbank',
  },
  'HOSP-02': {
    entityName: 'Apollo Hospitals Enterprise Ltd (Vijayawada Facility)',
    bankName: 'ICICI Bank Specialized Medical Services',
    accountNo: '004805019821',
    ifsc: 'ICIC0000048',
    branch: 'Benz Circle, Vijayawada',
    upiId: 'apollo.vijayawada@icici',
  },
  'HOSP-03': {
    entityName: 'Manipal Health Enterprises Private Limited',
    bankName: 'State Bank of India (Medical Enclave Branch)',
    accountNo: '38291029102',
    ifsc: 'SBIN0004821',
    branch: 'Governorpet, Vijayawada',
    upiId: 'manipal.care@sbi',
  },
  'HOSP-04': {
    entityName: 'Government General Hospital (GGH) Arogyasri Trust',
    bankName: 'Union Bank of India (AP Govt Treasury Sub-Account)',
    accountNo: '99218201982',
    ifsc: 'UBIN0542918',
    branch: 'Old Hospital Road, Vijayawada',
    upiId: 'ggh.treasury@uboi',
  },
  'LAB-01': {
    entityName: 'Company A Central Reference Diagnostics Network',
    bankName: 'Kotak Mahindra Bank Pathology Clearing',
    accountNo: '4819201982',
    ifsc: 'KKBK0000918',
    branch: 'Suryaraopet, Vijayawada',
    upiId: 'companya.labs@kotak',
  },
};

// In-memory multi-hospital, department, doctor, and laboratory network store
let hospitalNetwork = [
  {
    id: 'HOSP-01',
    name: 'Company A Main Super-Specialty Hospital',
    type: 'TERTIARY_HOSPITAL', // TERTIARY_HOSPITAL | MULTISPECIALTY | CORE_LAB | COLLECTION_HUB
    category: 'HOSPITAL',
    coordinates: [16.5085, 80.6430],
    bedCapacity: 450,
    address: 'MG Road Healthcare Enclave, Vijayawada - 520010',
    distanceKm: 1.2,
    rating: 4.9,
    emergency24x7: true,
    timing: 'Open 24 Hours • 7 Days',
    phone: '+91 866 244 8800',
    superAdminVerified: true,
    hospitalBoardVerified: true,
    verificationStatus: 'FULLY_VERIFIED', // PENDING_BOTH | HOSPITAL_APPROVED | SUPERADMIN_APPROVED | FULLY_VERIFIED
    accreditations: ['NABL ISO 15189:2022', 'NABH Digital Health Gold', 'ABDM Gateway Grade 1'],
    departments: [
      {
        id: 'dept-cardio',
        name: 'Cardiology & Cardiovascular Sciences',
        head: 'Dr. Vikram Anand, MBBS, MD, DM',
        opdTimings: '09:00 AM - 01:00 PM & 05:00 PM - 08:00 PM',
        doctors: [
          {
            id: 'doc-vikram',
            name: 'Dr. Vikram Anand',
            degrees: 'MBBS, MD, DM (Cardiology)',
            nmcRegNo: 'NMC-2023-77401',
            stateCouncil: 'Maharashtra Medical Council',
            experienceYears: 14,
            opdFee: 800,
            slotsAvailable: ['09:30 AM - 10:00 AM', '10:00 AM - 10:30 AM', '11:15 AM - 11:45 AM', '05:30 PM - 06:00 PM', '06:45 PM - 07:15 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-rajeshwari',
            name: 'Dr. Rajeshwari Varma',
            degrees: 'MBBS, MD, DNB (Interventional Cardiology)',
            nmcRegNo: 'NMC-2022-61092',
            stateCouncil: 'AP Medical Council',
            experienceYears: 11,
            opdFee: 750,
            slotsAvailable: ['10:00 AM - 10:30 AM', '11:30 AM - 12:00 PM', '04:30 PM - 05:00 PM', '06:00 PM - 06:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-narayana',
            name: 'Dr. S. K. Narayana',
            degrees: 'MBBS, MS, MCh (Cardiothoracic & Vascular Surgery)',
            nmcRegNo: 'MCI-2015-44912',
            stateCouncil: 'Karnataka Medical Council',
            experienceYears: 19,
            opdFee: 900,
            slotsAvailable: ['11:00 AM - 11:30 AM', '12:30 PM - 01:00 PM', '05:00 PM - 05:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-endocrine',
        name: 'Endocrinology, Diabetology & Metabolism',
        head: 'Dr. Pooja Sharma, MBBS, DNB',
        opdTimings: '10:00 AM - 02:00 PM & 05:00 PM - 07:30 PM',
        doctors: [
          {
            id: 'doc-pooja',
            name: 'Dr. Pooja Sharma',
            degrees: 'MBBS, DNB (Endocrinology)',
            nmcRegNo: 'NMC-2024-51029',
            stateCouncil: 'Karnataka Medical Council',
            experienceYears: 9,
            opdFee: 750,
            slotsAvailable: ['10:00 AM - 10:30 AM', '10:45 AM - 11:15 AM', '11:30 AM - 12:00 PM', '01:00 PM - 01:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-sandeep',
            name: 'Dr. Sandeep Chowdary',
            degrees: 'MBBS, MD, DM (Endocrinology & Diabetes)',
            nmcRegNo: 'APMC-2019-88124',
            stateCouncil: 'AP Medical Council',
            experienceYears: 13,
            opdFee: 800,
            slotsAvailable: ['10:30 AM - 11:00 AM', '12:00 PM - 12:30 PM', '05:00 PM - 05:30 PM', '06:30 PM - 07:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-ananya-endo',
            name: 'Dr. Ananya Ray',
            degrees: 'MBBS, MD (Diabetology & Obesity Care)',
            nmcRegNo: 'WBMC-2021-39910',
            stateCouncil: 'West Bengal Medical Council',
            experienceYears: 8,
            opdFee: 650,
            slotsAvailable: ['11:00 AM - 11:30 AM', '01:30 PM - 02:00 PM', '05:30 PM - 06:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-genmed',
        name: 'Internal Medicine & Critical Care',
        head: 'Dr. K. Suresh, MBBS, MD, FICP',
        opdTimings: '08:30 AM - 01:30 PM & 04:30 PM - 07:30 PM',
        doctors: [
          {
            id: 'doc-suresh',
            name: 'Dr. K. Suresh',
            degrees: 'MBBS, MD (Gen Med), FICP',
            nmcRegNo: 'MCI-2018-84920',
            stateCouncil: 'AP Medical Council',
            experienceYears: 18,
            opdFee: 700,
            slotsAvailable: ['08:45 AM - 09:15 AM', '09:30 AM - 10:00 AM', '10:30 AM - 11:00 AM', '12:00 PM - 12:30 PM', '05:00 PM - 05:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-radhika',
            name: 'Dr. Radhika Menon',
            degrees: 'MBBS, MD (Internal Medicine), Dip. Geriatrics',
            nmcRegNo: 'TCMC-2020-49210',
            stateCouncil: 'Travancore Cochin Medical Council',
            experienceYears: 10,
            opdFee: 650,
            slotsAvailable: ['09:00 AM - 09:30 AM', '11:00 AM - 11:30 AM', '04:30 PM - 05:00 PM', '06:00 PM - 06:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-vinay',
            name: 'Dr. Vinay Mohan',
            degrees: 'MBBS, MD, IDCCM (Critical Care Specialist)',
            nmcRegNo: 'KMC-2017-91024',
            stateCouncil: 'Karnataka Medical Council',
            experienceYears: 14,
            opdFee: 750,
            slotsAvailable: ['10:00 AM - 10:30 AM', '12:30 PM - 01:00 PM', '06:30 PM - 07:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-path',
        name: 'Clinical Pathology & Laboratory Medicine',
        head: 'Dr. A. Verma, MBBS, MD (Pathology)',
        opdTimings: '24x7 Core Diagnostic Processing & Consultation',
        doctors: [
          {
            id: 'doc-verma',
            name: 'Dr. A. Verma',
            degrees: 'MBBS, MD (Pathology), MIAC',
            nmcRegNo: 'MCI-2021-19284',
            stateCouncil: 'Delhi Medical Council',
            experienceYears: 12,
            opdFee: 500,
            slotsAvailable: ['09:00 AM - 09:30 AM', '11:00 AM - 11:30 AM', '03:00 PM - 03:30 PM', '05:00 PM - 05:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-snigdha',
            name: 'Dr. Snigdha Sen',
            degrees: 'MBBS, MD (Hematology & Immuno-Pathology)',
            nmcRegNo: 'NMC-2022-77192',
            stateCouncil: 'Maharashtra Medical Council',
            experienceYears: 8,
            opdFee: 500,
            slotsAvailable: ['10:00 AM - 10:30 AM', '01:00 PM - 01:30 PM', '04:00 PM - 04:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-ramanaiah-path',
            name: 'Dr. P. Ramanaiah',
            degrees: 'MBBS, MD (Biochemistry & Lab Medicine)',
            nmcRegNo: 'APMC-2016-10294',
            stateCouncil: 'AP Medical Council',
            experienceYears: 15,
            opdFee: 550,
            slotsAvailable: ['09:30 AM - 10:00 AM', '11:30 AM - 12:00 PM', '05:30 PM - 06:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-neuro',
        name: 'Neurology & Stroke Sciences',
        head: 'Dr. P. Ramanaiah, MBBS, MD, DM (Neuro)',
        opdTimings: '09:30 AM - 01:30 PM & 05:00 PM - 08:00 PM',
        doctors: [
          {
            id: 'doc-ramanaiah',
            name: 'Dr. P. Ramanaiah',
            degrees: 'MBBS, MD, DM (Neurology)',
            nmcRegNo: 'APMC-2016-10294',
            stateCouncil: 'AP Medical Council',
            experienceYears: 16,
            opdFee: 850,
            slotsAvailable: ['09:30 AM - 10:00 AM', '10:45 AM - 11:15 AM', '12:00 PM - 12:30 PM', '05:30 PM - 06:00 PM', '07:00 PM - 07:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-gautham-neuro',
            name: 'Dr. Gautham V. Raju',
            degrees: 'MBBS, DNB (Neurology & Stroke Care)',
            nmcRegNo: 'NMC-2023-44810',
            stateCouncil: 'Karnataka Medical Council',
            experienceYears: 9,
            opdFee: 750,
            slotsAvailable: ['10:00 AM - 10:30 AM', '11:30 AM - 12:00 PM', '04:30 PM - 05:00 PM', '06:30 PM - 07:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Dr. K. Srinivas (Medical Superintendent)',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
    ],
  },
  {
    id: 'HOSP-02',
    name: 'Apollo Multi-Specialty Hospital & Research Center',
    type: 'MULTISPECIALTY',
    category: 'HOSPITAL',
    coordinates: [16.4998, 80.6548],
    bedCapacity: 300,
    address: 'Benz Circle Commercial Corridor, Vijayawada - 520008',
    distanceKm: 2.8,
    rating: 4.8,
    emergency24x7: true,
    timing: 'Open 24 Hours',
    phone: '+91 866 255 1200',
    superAdminVerified: true,
    hospitalBoardVerified: true,
    verificationStatus: 'FULLY_VERIFIED',
    accreditations: ['NABL ISO 15189', 'NABH Multi-Specialty Accredited'],
    departments: [
      {
        id: 'dept-pediatrics',
        name: 'Pediatrics & Neonatal Care',
        head: 'Dr. Meera Nambiar, MD, DCH',
        opdTimings: '09:00 AM - 01:00 PM & 04:30 PM - 07:30 PM',
        doctors: [
          {
            id: 'doc-meera',
            name: 'Dr. Meera Nambiar',
            degrees: 'MBBS, MD (Pediatrics), DCH',
            nmcRegNo: 'NMC-2020-33419',
            stateCouncil: 'Kerala Medical Council',
            experienceYears: 11,
            opdFee: 650,
            slotsAvailable: ['09:30 AM - 10:00 AM', '10:30 AM - 11:00 AM', '11:30 AM - 12:00 PM', '04:30 PM - 05:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Hospital Director Dr. G. Prasad',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-tarun',
            name: 'Dr. Tarun Kishore',
            degrees: 'MBBS, DCH, DNB (Pediatrics & Neonatal ICU)',
            nmcRegNo: 'APMC-2021-50291',
            stateCouncil: 'AP Medical Council',
            experienceYears: 8,
            opdFee: 600,
            slotsAvailable: ['10:00 AM - 10:30 AM', '12:00 PM - 12:30 PM', '05:00 PM - 05:30 PM', '06:30 PM - 07:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Hospital Director Dr. G. Prasad',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-preeti',
            name: 'Dr. Preeti Reddy',
            degrees: 'MBBS, MD (Pediatrics & Adolescent Medicine)',
            nmcRegNo: 'NMC-2018-88210',
            stateCouncil: 'Telangana Medical Council',
            experienceYears: 13,
            opdFee: 700,
            slotsAvailable: ['09:00 AM - 09:30 AM', '11:00 AM - 11:30 AM', '05:30 PM - 06:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Hospital Director Dr. G. Prasad',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-ortho',
        name: 'Orthopedics & Joint Replacement',
        head: 'Dr. Harish Reddy, MS (Ortho), MCh',
        opdTimings: '10:00 AM - 03:00 PM & 05:30 PM - 08:00 PM',
        doctors: [
          {
            id: 'doc-harish',
            name: 'Dr. Harish Reddy',
            degrees: 'MBBS, MS (Orthopedics), MCh (Joint Replacement)',
            nmcRegNo: 'MCI-2017-66810',
            stateCouncil: 'AP Medical Council',
            experienceYears: 15,
            opdFee: 850,
            slotsAvailable: ['10:00 AM - 10:30 AM', '11:00 AM - 11:30 AM', '01:30 PM - 02:00 PM', '05:30 PM - 06:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Hospital Director Dr. G. Prasad',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-manoj-ortho',
            name: 'Dr. Manoj K. Varma',
            degrees: 'MBBS, MS (Ortho), DNB, Fellowship in Arthroscopy',
            nmcRegNo: 'NMC-2019-31092',
            stateCouncil: 'Karnataka Medical Council',
            experienceYears: 12,
            opdFee: 800,
            slotsAvailable: ['10:30 AM - 11:00 AM', '12:00 PM - 12:30 PM', '06:00 PM - 06:30 PM', '07:00 PM - 07:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Hospital Director Dr. G. Prasad',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-apollo-gen',
        name: 'General Medicine & Diabetology',
        head: 'Dr. K. Suresh Kumar, MD',
        opdTimings: '09:00 AM - 01:00 PM & 04:00 PM - 08:00 PM',
        doctors: [
          {
            id: 'doc-suresh-apollo',
            name: 'Dr. K. Suresh Kumar',
            degrees: 'MBBS, MD (General Medicine)',
            nmcRegNo: 'MCI-2018-84920',
            stateCouncil: 'AP Medical Council',
            experienceYears: 18,
            opdFee: 700,
            slotsAvailable: ['09:30 AM - 10:00 AM', '11:00 AM - 11:30 AM', '04:30 PM - 05:00 PM', '06:30 PM - 07:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Hospital Director Dr. G. Prasad',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-madhav-apollo',
            name: 'Dr. Madhav Rao',
            degrees: 'MBBS, DNB (Internal Medicine)',
            nmcRegNo: 'APMC-2022-10824',
            stateCouncil: 'AP Medical Council',
            experienceYears: 7,
            opdFee: 600,
            slotsAvailable: ['10:00 AM - 10:30 AM', '12:30 PM - 01:00 PM', '05:00 PM - 05:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Hospital Director Dr. G. Prasad',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
    ],
  },
  {
    id: 'HOSP-03',
    name: 'Manipal Super-Specialty Hospital',
    type: 'TERTIARY_HOSPITAL',
    category: 'HOSPITAL',
    coordinates: [16.5142, 80.6315],
    bedCapacity: 350,
    address: 'Governorpet Medical Enclave, Vijayawada - 520002',
    distanceKm: 3.1,
    rating: 4.85,
    emergency24x7: true,
    timing: 'Open 24 Hours • 7 Days',
    phone: '+91 866 228 9000',
    superAdminVerified: true,
    hospitalBoardVerified: true,
    verificationStatus: 'FULLY_VERIFIED',
    accreditations: ['NABL ISO 15189', 'NABH Digital Excellence'],
    departments: [
      {
        id: 'dept-manipal-pulmo',
        name: 'Pulmonology & Chest Medicine',
        head: 'Dr. V. Ravi Teja, MD, DM (Pulmonology)',
        opdTimings: '09:00 AM - 01:00 PM & 05:00 PM - 07:30 PM',
        doctors: [
          {
            id: 'doc-raviteja',
            name: 'Dr. V. Ravi Teja',
            degrees: 'MBBS, MD, DM (Pulmonary & Sleep Medicine)',
            nmcRegNo: 'APMC-2017-48201',
            stateCouncil: 'AP Medical Council',
            experienceYears: 13,
            opdFee: 800,
            slotsAvailable: ['09:30 AM - 10:00 AM', '11:00 AM - 11:30 AM', '05:30 PM - 06:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Medical Director Dr. K. Rao',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-deepika-pulmo',
            name: 'Dr. Deepika Sharma',
            degrees: 'MBBS, DNB (Respiratory Diseases)',
            nmcRegNo: 'NMC-2021-99412',
            stateCouncil: 'Delhi Medical Council',
            experienceYears: 8,
            opdFee: 700,
            slotsAvailable: ['10:00 AM - 10:30 AM', '12:00 PM - 12:30 PM', '06:00 PM - 06:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Medical Director Dr. K. Rao',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-manipal-gastro',
        name: 'Gastroenterology & Hepatobiliary Sciences',
        head: 'Dr. B. R. Prasad, MBBS, MD, DM',
        opdTimings: '10:00 AM - 02:00 PM & 05:00 PM - 08:00 PM',
        doctors: [
          {
            id: 'doc-br-prasad',
            name: 'Dr. B. R. Prasad',
            degrees: 'MBBS, MD, DM (Medical Gastroenterology)',
            nmcRegNo: 'MCI-2016-59124',
            stateCouncil: 'AP Medical Council',
            experienceYears: 15,
            opdFee: 850,
            slotsAvailable: ['10:00 AM - 10:30 AM', '11:30 AM - 12:00 PM', '05:30 PM - 06:00 PM', '07:00 PM - 07:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Medical Director Dr. K. Rao',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-kavitha-gastro',
            name: 'Dr. Kavitha Rao',
            degrees: 'MBBS, DNB (Gastroenterology & Liver Care)',
            nmcRegNo: 'NMC-2020-61029',
            stateCouncil: 'Karnataka Medical Council',
            experienceYears: 9,
            opdFee: 750,
            slotsAvailable: ['10:30 AM - 11:00 AM', '01:00 PM - 01:30 PM', '06:00 PM - 06:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Medical Director Dr. K. Rao',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
    ],
  },
  {
    id: 'HOSP-04',
    name: 'Government General Hospital (GGH) Vijayawada',
    type: 'TERTIARY_HOSPITAL',
    category: 'HOSPITAL',
    coordinates: [16.5205, 80.6220],
    bedCapacity: 900,
    address: 'Old Hospital Road, Suryaraopet, Vijayawada - 520002',
    distanceKm: 2.1,
    rating: 4.6,
    emergency24x7: true,
    timing: '24x7 Emergency • OPD 08:00 AM - 02:00 PM',
    phone: '+91 866 257 8899',
    superAdminVerified: true,
    hospitalBoardVerified: true,
    verificationStatus: 'FULLY_VERIFIED',
    accreditations: ['AP Govt Health Directorate', 'Arogyasri Apex Care', 'NABL Govt Lab Accredited'],
    departments: [
      {
        id: 'dept-ggh-genmed',
        name: 'General Medicine & Arogyasri OPD',
        head: 'Dr. K. Srinivas, MD (Gen Med), Professor',
        opdTimings: '08:00 AM - 02:00 PM Daily',
        doctors: [
          {
            id: 'doc-ggh-srinivas',
            name: 'Dr. K. Srinivas',
            degrees: 'MBBS, MD (Gen Med), Professor of Medicine',
            nmcRegNo: 'APMC-2012-19201',
            stateCouncil: 'AP Medical Council',
            experienceYears: 22,
            opdFee: 250,
            slotsAvailable: ['08:30 AM - 09:00 AM', '09:30 AM - 10:00 AM', '11:00 AM - 11:30 AM', '12:30 PM - 01:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'GGH Superintendent Dr. Y. Satyanarayana',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-ggh-lakshmi',
            name: 'Dr. M. Lakshmi Prasanna',
            degrees: 'MBBS, MD (General Medicine)',
            nmcRegNo: 'APMC-2019-74812',
            stateCouncil: 'AP Medical Council',
            experienceYears: 10,
            opdFee: 250,
            slotsAvailable: ['09:00 AM - 09:30 AM', '10:30 AM - 11:00 AM', '12:00 PM - 12:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'GGH Superintendent Dr. Y. Satyanarayana',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-ggh-surg',
        name: 'General Surgery & Trauma Center',
        head: 'Dr. N. Chandrasekhar, MS (Gen Surg)',
        opdTimings: '08:30 AM - 01:30 PM',
        doctors: [
          {
            id: 'doc-ggh-chandra',
            name: 'Dr. N. Chandrasekhar',
            degrees: 'MBBS, MS (General Surgery), FAIS',
            nmcRegNo: 'APMC-2014-38910',
            stateCouncil: 'AP Medical Council',
            experienceYears: 17,
            opdFee: 300,
            slotsAvailable: ['09:00 AM - 09:30 AM', '10:30 AM - 11:00 AM', '12:00 PM - 12:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'GGH Superintendent Dr. Y. Satyanarayana',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
    ],
  },
  {
    id: 'LAB-01',
    name: 'Central Automated Core Diagnostics Reference Laboratory',
    type: 'CORE_LAB',
    category: 'LABORATORY',
    coordinates: [16.5110, 80.6390],
    address: 'Tech Park Biotech Zone, Vijayawada - 520007',
    distanceKm: 3.5,
    rating: 4.95,
    emergency24x7: true,
    timing: '24x7 Automated Testing • Home Sample Hub',
    phone: '+91 866 299 4400',
    superAdminVerified: true,
    hospitalBoardVerified: true,
    verificationStatus: 'FULLY_VERIFIED',
    accreditations: ['NABL ISO 15189:2022 Central Reference Lab', 'CAP Equivalent Cold-Chain'],
    departments: [
      {
        id: 'dept-biochem',
        name: 'Automated Clinical Biochemistry & Immunoassay',
        head: 'Dr. A. Verma, MD',
        opdTimings: 'Continuous 24x7 Automation (Cobas 6000 & AU5800)',
        doctors: [
          {
            id: 'doc-lab-verma',
            name: 'Dr. A. Verma',
            degrees: 'MBBS, MD (Pathology), MIAC',
            nmcRegNo: 'MCI-2021-19284',
            stateCouncil: 'Delhi Medical Council',
            experienceYears: 12,
            opdFee: 500,
            slotsAvailable: ['09:00 AM - 09:30 AM', '11:30 AM - 12:00 PM', '03:30 PM - 04:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Central Lab Medical Director',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
          {
            id: 'doc-lab-ramanaiah',
            name: 'Dr. P. Ramanaiah',
            degrees: 'MBBS, MD (Biochemistry & Quality Systems)',
            nmcRegNo: 'APMC-2016-10294',
            stateCouncil: 'AP Medical Council',
            experienceYears: 15,
            opdFee: 550,
            slotsAvailable: ['10:00 AM - 10:30 AM', '01:00 PM - 01:30 PM', '05:00 PM - 05:30 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Central Lab Medical Director',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
      {
        id: 'dept-molecular',
        name: 'Molecular Genetics & RT-PCR Testing',
        head: 'Dr. Shobha K, PhD (Biotech), PostDoc (Genomics)',
        opdTimings: '08:00 AM - 08:00 PM',
        doctors: [
          {
            id: 'doc-lab-shobha',
            name: 'Dr. Shobha K',
            degrees: 'MBBS, PhD (Genetics & Molecular Diagnostics)',
            nmcRegNo: 'NMC-2019-81204',
            stateCouncil: 'Karnataka Medical Council',
            experienceYears: 11,
            opdFee: 600,
            slotsAvailable: ['10:30 AM - 11:00 AM', '02:00 PM - 02:30 PM', '04:30 PM - 05:00 PM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'Central Lab Medical Director',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
    ],
  },
  {
    id: 'LAB-02',
    name: 'City Care Community Diagnostics & Walk-in Lab',
    type: 'COLLECTION_HUB',
    category: 'LABORATORY',
    coordinates: [16.5180, 80.6450],
    address: 'Opp. Sub-Collector Office, Bunder Road, Vijayawada - 520002',
    distanceKm: 1.8,
    rating: 4.7,
    emergency24x7: false,
    timing: '06:30 AM - 09:00 PM Daily',
    phone: '+91 866 211 5599',
    superAdminVerified: true,
    hospitalBoardVerified: false,
    verificationStatus: 'SUPERADMIN_APPROVED', // Pending hospital board reciprocal stamp
    accreditations: ['NABL Primary Collection Hub', 'ISO 9001:2015'],
    departments: [
      {
        id: 'dept-phleb',
        name: 'Walk-in Phlebotomy & Fasting Profiles',
        head: 'Tech Lead K. Murthy',
        opdTimings: '06:30 AM - 02:00 PM (Fasting optimal)',
        doctors: [
          {
            id: 'doc-lab-sunita',
            name: 'Dr. B. Sunita',
            degrees: 'MBBS, DCP (Clinical Pathology)',
            nmcRegNo: 'APMC-2018-49021',
            stateCouncil: 'AP Medical Council',
            experienceYears: 9,
            opdFee: 450,
            slotsAvailable: ['07:30 AM - 08:00 AM', '09:00 AM - 09:30 AM', '11:00 AM - 11:30 AM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'City Care Lab In-Charge',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
    ],
  },
];

// In-memory patient appointment & OPD token store
let appointmentsStore = [
  {
    id: 'APT-8821',
    tokenNo: 'TOKEN-OPD-104',
    uhid: 'UHID-2026-9041',
    patientName: 'Farzana Begum',
    phoneMasked: '••••••0003',
    mobileE164: '+919000000003',
    hospitalId: 'HOSP-01',
    hospitalName: 'Company A Main Super-Specialty Hospital',
    department: 'Cardiology & Cardiovascular Sciences',
    doctorName: 'Dr. Vikram Anand, MBBS, MD, DM',
    type: 'DOCTOR_OPD_CONSULTATION', // DOCTOR_OPD_CONSULTATION | DIAGNOSTIC_TEST
    date: '2026-11-05',
    timeSlot: '10:00 AM - 10:30 AM',
    fee: 800,
    paymentStatus: 'PAID_ONLINE',
    status: 'CONFIRMED', // CONFIRMED | CHECKED_IN | COMPLETED | CANCELLED
    qrCodeData: 'OPD-HOSP01-FARZANA-UHID9041-SLOT1000',
    bookedAt: '2026-11-04T08:30:00.000Z',
  },
  {
    id: 'APT-7910',
    tokenNo: 'TOKEN-LAB-402',
    uhid: 'UHID-2026-7240',
    patientName: 'Srinivas Rao T',
    phoneMasked: '••••••0001',
    mobileE164: '+919000000001',
    hospitalId: 'LAB-01',
    hospitalName: 'Central Automated Core Diagnostics Reference Laboratory',
    department: 'Automated Clinical Biochemistry',
    testName: 'Comprehensive HbA1c & Fasting Metabolic Panel',
    type: 'DIAGNOSTIC_TEST',
    date: '2026-11-06',
    timeSlot: '07:30 AM - 08:00 AM (Fasting)',
    fee: 1250,
    paymentStatus: 'PAID_ONLINE',
    status: 'CONFIRMED',
    qrCodeData: 'LAB-LAB01-SRINIVAS-UHID7240-TEST1250',
    bookedAt: '2026-11-04T09:15:00.000Z',
  },
  {
    id: 'APT-APO-01',
    tokenNo: 'TOKEN-APO-101',
    uhid: 'UHID-2026-7819',
    patientName: 'T. Sambasiva Rao',
    phoneMasked: '••••••0004',
    mobileE164: '+919000000004',
    hospitalId: 'HOSP-02',
    hospitalName: 'Apollo Specialty Hospital',
    department: 'Orthopedics & Joint Replacement',
    doctorName: 'Dr. Harish Reddy, MBBS, MS, MCh',
    type: 'DOCTOR_OPD_CONSULTATION',
    date: '2026-11-05',
    timeSlot: '09:00 AM - 09:30 AM',
    fee: 850,
    paymentStatus: 'PAID_ONLINE',
    status: 'CONFIRMED',
    qrCodeData: 'OPD-APO-SAMBASIVA-UHID7819',
    bookedAt: '2026-11-04T09:20:00.000Z',
  },
  {
    id: 'APT-APO-02',
    tokenNo: 'TOKEN-APO-102',
    uhid: 'UHID-2026-4401',
    patientName: 'G. Venkatesh',
    phoneMasked: '••••••0005',
    mobileE164: '+919000000005',
    hospitalId: 'HOSP-02',
    hospitalName: 'Apollo Specialty Hospital',
    department: 'Cardiology & Cardiovascular Sciences',
    doctorName: 'Dr. Vikram Anand, MBBS, MD, DM',
    type: 'DOCTOR_OPD_CONSULTATION',
    date: '2026-11-05',
    timeSlot: '11:00 AM - 11:30 AM',
    fee: 900,
    paymentStatus: 'PAID_ONLINE',
    status: 'CONFIRMED',
    qrCodeData: 'OPD-APO-VENKATESH-UHID4401',
    bookedAt: '2026-11-04T10:10:00.000Z',
  },
  {
    id: 'APT-MAN-01',
    tokenNo: 'TOKEN-MAN-201',
    uhid: 'UHID-2026-5510',
    patientName: 'G. Satyanarayana',
    phoneMasked: '••••••0006',
    mobileE164: '+919000000006',
    hospitalId: 'HOSP-03',
    hospitalName: 'Manipal Super-Specialty Hospital',
    department: 'Pulmonology & Chest Medicine',
    doctorName: 'Dr. V. Ravi Teja, MBBS, MD, DM',
    type: 'DOCTOR_OPD_CONSULTATION',
    date: '2026-11-05',
    timeSlot: '02:00 PM - 02:30 PM',
    fee: 850,
    paymentStatus: 'PAID_ONLINE',
    status: 'CONFIRMED',
    qrCodeData: 'OPD-MAN-SATYANARAYANA-UHID5510',
    bookedAt: '2026-11-04T10:30:00.000Z',
  },
];

// GET /api/hospitals — List hospitals & laboratories with departments and doctors
router.get('/', async (req, res) => {
  const { category, search, department } = req.query;
  let list = [...hospitalNetwork];

  if (category && category !== 'ALL') {
    list = list.filter(h => h.category === category);
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(
      h =>
        h.name.toLowerCase().includes(q) ||
        h.address.toLowerCase().includes(q) ||
        h.departments.some(d => d.name.toLowerCase().includes(q)) ||
        h.departments.some(d => d.doctors?.some(doc => doc.name.toLowerCase().includes(q)))
    );
  }

  if (department && department !== 'ALL') {
    list = list.filter(h =>
      h.departments.some(d => d.name.toLowerCase().includes(department.toLowerCase()))
    );
  }

  return res.json({
    hospitals: list,
    total: list.length,
    stats: {
      totalFacilities: hospitalNetwork.length,
      totalHospitals: hospitalNetwork.filter(h => h.category === 'HOSPITAL').length,
      totalLaboratories: hospitalNetwork.filter(h => h.category === 'LABORATORY').length,
      fullyVerified: hospitalNetwork.filter(h => h.verificationStatus === 'FULLY_VERIFIED').length,
    },
  });
});

// GET /api/hospitals/:id — Get hospital details
router.get('/:id', async (req, res) => {
  const facility = hospitalNetwork.find(h => h.id === req.params.id);
  if (!facility) {
    return res.status(404).json({ error: 'Hospital or Laboratory not found' });
  }
  return res.json({ facility });
});

// POST /api/hospitals — Super Admin registers a new Hospital or Diagnostic Laboratory
router.post('/', authenticate, async (req, res) => {
  const { name, category, type, address, phone, bedCapacity, accreditations, departments } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Facility name and address are required' });
  }

  const newFacility = {
    id: category === 'LABORATORY' ? `LAB-0${hospitalNetwork.length + 1}` : `HOSP-0${hospitalNetwork.length + 1}`,
    name,
    category: category || 'HOSPITAL',
    type: type || (category === 'LABORATORY' ? 'CORE_LAB' : 'MULTISPECIALTY'),
    bedCapacity: Number(bedCapacity) || 0,
    address,
    distanceKm: 4.2,
    rating: 5.0,
    emergency24x7: true,
    timing: 'Open 24 Hours',
    phone: phone || '+91 866 200 0000',
    superAdminVerified: true,
    hospitalBoardVerified: false,
    verificationStatus: 'SUPERADMIN_APPROVED', // awaiting hospital board reciprocal verification
    accreditations: accreditations || ['NABL ISO 15189', 'NABH Applicant'],
    departments: departments || [
      {
        id: 'dept-gen',
        name: 'General Medicine & OPD',
        head: 'Chief Medical Officer',
        opdTimings: '09:00 AM - 05:00 PM',
        doctors: [
          {
            id: 'doc-lab-sunita',
            name: 'Dr. B. Sunita',
            degrees: 'MBBS, DCP (Clinical Pathology)',
            nmcRegNo: 'APMC-2018-49021',
            stateCouncil: 'AP Medical Council',
            experienceYears: 9,
            opdFee: 450,
            slotsAvailable: ['07:30 AM - 08:00 AM', '09:00 AM - 09:30 AM', '11:00 AM - 11:30 AM'],
            hospitalVerified: true,
            hospitalVerifiedBy: 'City Care Lab In-Charge',
            superAdminVerified: true,
            superAdminVerifiedBy: 'Dr. M. Ramanathan, CMO',
            status: 'FULLY_VERIFIED',
          },
        ],
      },
    ],
  };

  hospitalNetwork.unshift(newFacility);

  await writeLog({
    actorType: 'STAFF',
    actorId: req.dbUser?.id || 'admin-super-1',
    action: 'IMPORT',
    outcome: 'OK',
    detail: `Registered new ${newFacility.category}: ${newFacility.name} (${newFacility.id})`,
    req,
  }).catch(() => { });

  return res.status(201).json({
    success: true,
    message: `${newFacility.category} ${newFacility.name} registered successfully with Super Admin approval.`,
    facility: newFacility,
  });
});

// POST /api/hospitals/:id/doctors — Register a doctor under a hospital department with dual-verification
router.post('/:id/doctors', authenticate, async (req, res) => {
  const { id } = req.params;
  const { departmentId, name, degrees, nmcRegNo, stateCouncil, opdFee, experienceYears } = req.body;

  const facility = hospitalNetwork.find(h => h.id === id);
  if (!facility) {
    return res.status(404).json({ error: 'Facility not found' });
  }

  let dept = facility.departments.find(d => d.id === departmentId);
  if (!dept && facility.departments.length > 0) {
    dept = facility.departments[0];
  }

  const newDoc = {
    id: `doc-${Date.now().toString(36)}`,
    name,
    degrees: degrees || 'MBBS, MD',
    nmcRegNo,
    stateCouncil: stateCouncil || 'National Medical Commission',
    experienceYears: Number(experienceYears) || 5,
    opdFee: Number(opdFee) || 600,
    slotsAvailable: ['09:30 AM', '11:00 AM', '04:30 PM', '06:00 PM'],
    hospitalVerified: true, // Hospital where doctor is added verifies internally
    hospitalVerifiedBy: 'Hospital Medical Superintendent',
    superAdminVerified: false, // Pending Super Admin CMO central check
    status: 'HOSPITAL_APPROVED',
  };

  if (!dept.doctors) dept.doctors = [];
  dept.doctors.push(newDoc);

  await writeLog({
    actorType: 'STAFF',
    actorId: req.dbUser?.id || 'admin-super-1',
    action: 'TASK_DONE',
    outcome: 'OK',
    detail: `Doctor ${name} registered under ${facility.name} (${dept.name}). Dual-verification pending Super Admin approval.`,
    req,
  }).catch(() => { });

  return res.status(201).json({
    success: true,
    message: `Doctor ${name} registered under ${facility.name}. Hospital verification verified; awaiting Super Admin CMO approval.`,
    doctor: newDoc,
  });
});

// PATCH /api/hospitals/:hospId/doctors/:docId/dual-verify — Dual verification toggle (Hospital or Super Admin)
router.patch('/:hospId/doctors/:docId/dual-verify', authenticate, async (req, res) => {
  const { hospId, docId } = req.params;
  const { verifierType, approved } = req.body; // verifierType: 'SUPER_ADMIN' | 'HOSPITAL_ADMIN'

  const facility = hospitalNetwork.find(h => h.id === hospId);
  if (!facility) return res.status(404).json({ error: 'Hospital not found' });

  let foundDoc = null;
  for (const dept of facility.departments) {
    const doc = dept.doctors?.find(d => d.id === docId);
    if (doc) {
      foundDoc = doc;
      break;
    }
  }

  if (!foundDoc) return res.status(404).json({ error: 'Doctor not found in this hospital' });

  if (verifierType === 'SUPER_ADMIN') {
    foundDoc.superAdminVerified = approved;
    foundDoc.superAdminVerifiedBy = approved ? 'Dr. M. Ramanathan, CMO (Super Admin)' : null;
  } else if (verifierType === 'HOSPITAL_ADMIN') {
    foundDoc.hospitalVerified = approved;
    foundDoc.hospitalVerifiedBy = approved ? 'Dr. K. Srinivas (Medical Superintendent)' : null;
  }

  // Update overall dual verification status
  if (foundDoc.hospitalVerified && foundDoc.superAdminVerified) {
    foundDoc.status = 'FULLY_VERIFIED';
  } else if (foundDoc.hospitalVerified && !foundDoc.superAdminVerified) {
    foundDoc.status = 'HOSPITAL_APPROVED';
  } else if (!foundDoc.hospitalVerified && foundDoc.superAdminVerified) {
    foundDoc.status = 'SUPERADMIN_APPROVED';
  } else {
    foundDoc.status = 'PENDING_BOTH';
  }

  return res.json({
    success: true,
    message: `Doctor ${foundDoc.name} dual-verification updated by ${verifierType}. Current status: ${foundDoc.status}`,
    doctor: foundDoc,
  });
});

// GET /api/hospitals/appointments/my — Patient gets their booked appointments across all hospitals
router.get('/appointments/my', authenticate, async (req, res) => {
  const phone = req.dbAccount?.mobileE164;
  let userApts = appointmentsStore;

  if (phone) {
    userApts = appointmentsStore.filter(a => a.mobileE164 === phone);
  }

  return res.json({
    appointments: userApts,
    total: userApts.length,
  });
});

// POST /api/hospitals/appointments — Online appointment booking with instant OPD Token & QR Code
router.post('/appointments', authenticate, async (req, res) => {
  const {
    hospitalId,
    department,
    doctorName,
    testName,
    type,
    date,
    timeSlot,
    patientName,
    fee,
    paymentMethod,
    paymentTxnId,
  } = req.body;

  const facility = hospitalNetwork.find(h => h.id === hospitalId) || hospitalNetwork[0];
  const aptId = `APT-${Math.floor(1000 + Math.random() * 9000)}`;
  const tokenNo = type === 'DIAGNOSTIC_TEST'
    ? `TOKEN-LAB-${Math.floor(100 + Math.random() * 900)}`
    : `TOKEN-OPD-${Math.floor(100 + Math.random() * 900)}`;

  const mobile = req.dbAccount?.mobileE164 || '+919000000001';
  const uhid = `UHID-2026-${mobile.slice(-4)}`;

  // Destination hospital account for payment routing
  const hospitalBankAccount = HOSPITAL_BANK_ACCOUNTS[facility.id] || {
    entityName: `${facility.name} Healthcare Trust Account`,
    bankName: 'HDFC Bank Healthcare Division',
    accountNo: '502000' + Math.floor(10000000 + Math.random() * 90000000),
    ifsc: 'HDFC0001824',
    branch: 'Healthcare Enclave, Vijayawada',
    upiId: `${facility.id.toLowerCase()}.care@hdfcbank`,
  };

  const isOnlinePaid = paymentMethod === 'ONLINE_RAZORPAY';
  const paymentStatus = isOnlinePaid ? 'PAID_ONLINE' : 'PAY_AT_COUNTER';

  // If a diagnostic test is booked, create a real Order in PostgreSQL and accession a specimen task!
  let createdOrderNo = null;
  if (type === 'DIAGNOSTIC_TEST') {
    try {
      let patient = null;
      if (req.dbAccount) {
        patient = await prisma.patient.findFirst({
          where: { accountId: req.dbAccount.id },
        });
      }
      if (!patient) {
        patient = await prisma.patient.findFirst();
      }

      if (patient) {
        createdOrderNo = `ORD-${Math.floor(73000 + Math.random() * 20000)}`;
        const testParam = testName || 'Comprehensive Health Screening Panel';

        await prisma.order.create({
          data: {
            orderNo: createdOrderNo,
            patientId: patient.id,
            status: 'PROCESSING',
            hasCritical: false,
            results: {
              create: [
                {
                  parameter: testParam,
                  value: 'Sample Collection Scheduled',
                  flag: 'NORMAL',
                  refRangeRaw: 'NABL ISO 15189 Testing',
                },
              ],
            },
          },
        });

        // Accession tube into labTasksStore
        labTasksStore.unshift({
          id: `LT-${Math.floor(1000 + Math.random() * 9000)}`,
          orderNo: createdOrderNo,
          patientName: patientName || patient.fullName,
          ageSex: '38Y / Adult',
          uhid: uhid,
          tubeBarcode: `BC-${createdOrderNo}-SST`,
          tubeType: 'Gold Top (SST Gel Separator 5mL)',
          department: department || 'Clinical Biochemistry',
          testsRequested: [testParam],
          priority: 'ROUTINE',
          stage: 'ACCESSIONING_QC',
          accessionDetails: {
            collectedAt: new Date().toISOString(),
            receivedAt: new Date().toISOString(),
            integrity: 'NORMAL',
            volumeStatus: 'SUFFICIENT (3.5 mL)',
            accessionedBy: 'Online Hospital Booking Kiosk',
          },
          analyzerDetails: {
            instrument: 'Roche Cobas 6000 (Module c501)',
            batchRunId: null,
            calibrationStatus: 'SCHEDULED FOR RUN',
            completedAt: null,
            rawResults: [],
          },
          qcDetails: {
            westgardStatus: 'PENDING',
            deltaCheckFlag: false,
          },
          pathologistReview: {
            pathologistName: 'Dr. A. Verma, MD',
            clinicalRemarks: '',
            signedAt: null,
          },
          createdAt: new Date().toISOString(),
        });
      }
    } catch (orderErr) {
      console.warn('Could not create order in DB:', orderErr);
    }
  }

  const newAppointment = {
    id: aptId,
    tokenNo,
    uhid,
    patientName: patientName || 'Lakshmi Prasanna K',
    phoneMasked: mobile.replace(/\d(?=\d{4})/g, '•'),
    mobileE164: mobile,
    hospitalId: facility.id,
    hospitalName: facility.name,
    department: department || 'General Medicine & OPD',
    doctorName: doctorName || 'Attending Physician',
    testName: testName || null,
    type: type || 'DOCTOR_OPD_CONSULTATION',
    date: date || new Date(Date.now() + 86400000).toISOString().split('T')[0],
    timeSlot: timeSlot || '10:00 AM - 10:30 AM',
    fee: Number(fee) || (type === 'DIAGNOSTIC_TEST' ? 1250 : 750),
    paymentStatus,
    paymentMethod: paymentMethod || 'ONLINE_RAZORPAY',
    paymentTxnId: paymentTxnId || (isOnlinePaid ? `pay_rzp_${Math.floor(10000000 + Math.random() * 90000000)}` : null),
    hospitalBankAccount,
    orderNo: createdOrderNo,
    status: 'CONFIRMED',
    qrCodeData: `TOKEN:${tokenNo}|UHID:${uhid}|FACILITY:${facility.id}|PAY:${paymentStatus}|ORDER:${createdOrderNo || 'N/A'}`,
    bookedAt: new Date().toISOString(),
  };

  appointmentsStore.unshift(newAppointment);

  await writeLog({
    actorType: 'PATIENT',
    accountId: req.dbAccount?.id,
    action: 'TASK_DONE',
    outcome: 'OK',
    detail: `Online booking confirmed: ${tokenNo} at ${facility.name} for ${patientName} (${paymentStatus} - routed to ${hospitalBankAccount.entityName})`,
    req,
  }).catch(() => { });

  return res.status(201).json({
    success: true,
    message: `Appointment booked successfully! Payment routed to ${hospitalBankAccount.entityName}. Token #${tokenNo} confirmed.`,
    appointment: newAppointment,
  });
});

// PATCH /api/hospitals/appointments/:id/pay — Settle payment online via Razorpay
router.patch('/appointments/:id/pay', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod = 'ONLINE_RAZORPAY', paymentTxnId } = req.body;

    const apt = appointmentsStore.find(a => a.id === id || a.tokenNo === id);
    if (!apt) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const txnId = paymentTxnId || `pay_rzp_${Math.floor(10000000 + Math.random() * 90000000)}`;

    apt.paymentStatus = 'PAID_ONLINE';
    apt.paymentMethod = paymentMethod;
    apt.paymentTxnId = txnId;
    apt.paidAt = new Date().toISOString();
    apt.qrCodeData = `TOKEN:${apt.tokenNo}|UHID:${apt.uhid}|FACILITY:${apt.hospitalId}|PAY:PAID_ONLINE|ORDER:${apt.orderNo || 'N/A'}`;

    await writeLog({
      actorType: 'PATIENT',
      accountId: req.dbAccount?.id,
      action: 'TASK_DONE',
      outcome: 'OK',
      detail: `Appointment ${apt.tokenNo} payment settled via ${paymentMethod} (${txnId})`,
      req,
    }).catch(() => {});

    return res.json({
      success: true,
      message: `Payment of ₹${apt.fee} settled successfully via Razorpay.`,
      appointment: apt,
    });
  } catch (err) {
    console.error('Error settling appointment payment:', err);
    return res.status(500).json({ error: 'Failed to settle appointment payment' });
  }
});

export { hospitalNetwork, appointmentsStore };
export default router;
