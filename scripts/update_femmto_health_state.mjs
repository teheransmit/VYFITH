import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.join(__dirname, '..', 'data', 'real_health_state.json');

const raw = fs.readFileSync(jsonPath, 'utf8');
const state = JSON.parse(raw);

state.currentMetrics = {
  ...state.currentMetrics,
  weightKg: 55.7,
  bodyFatPct: 10.6,
  skeletalMuscleKg: 25.1,
  bmi: 18.8,
  waterL: 32.8,
  proteinKg: 13.9,
  mineralsKg: 3.2,
  fatMassKg: 5.9,
  leanBodyMassKg: 46.6,
  fatFreeMassKg: 49.8
};

const INITIAL_FEMMTO_RECORDS = [
  { id: 'f-01', date: '01/08', time: '21:45', dateTime: '2026-08-01T21:45:00', weightKg: 55.0, skeletalMuscleKg: 25.0, bodyFatPct: 9.9, bmi: 18.59, fatMassKg: 5.45 },
  { id: 'f-02', date: '02/08', time: '16:15', dateTime: '2026-08-02T16:15:00', weightKg: 55.6, skeletalMuscleKg: 25.1, bodyFatPct: 10.5, bmi: 18.79, fatMassKg: 5.84 },
  { id: 'f-03', date: '03/08', time: '08:35', dateTime: '2026-08-03T08:35:00', weightKg: 54.9, skeletalMuscleKg: 25.0, bodyFatPct: 9.8, bmi: 18.56, fatMassKg: 5.38 },
  { id: 'f-04', date: '04/08', time: '06:56', dateTime: '2026-08-04T06:56:00', weightKg: 54.9, skeletalMuscleKg: 25.0, bodyFatPct: 9.8, bmi: 18.56, fatMassKg: 5.38 },
  { id: 'f-05', date: '05/08', time: '10:49', dateTime: '2026-08-05T10:49:00', weightKg: 54.7, skeletalMuscleKg: 24.9, bodyFatPct: 9.7, bmi: 18.49, fatMassKg: 5.31 },
  { id: 'f-06', date: '10/08', time: '10:59', dateTime: '2026-08-10T10:59:00', weightKg: 54.6, skeletalMuscleKg: 24.9, bodyFatPct: 9.5, bmi: 18.46, fatMassKg: 5.19 },
  { id: 'f-07', date: '13/08', time: '06:48', dateTime: '2026-08-13T06:48:00', weightKg: 54.3, skeletalMuscleKg: 24.9, bodyFatPct: 9.2, bmi: 18.35, fatMassKg: 5.00 },
  { id: 'f-08', date: '19/08', time: '05:33', dateTime: '2026-08-19T05:33:00', weightKg: 54.8, skeletalMuscleKg: 25.0, bodyFatPct: 9.7, bmi: 18.52, fatMassKg: 5.32 },
  { id: 'f-09', date: '24/08', time: '08:38', dateTime: '2026-08-24T08:38:00', weightKg: 54.7, skeletalMuscleKg: 25.0, bodyFatPct: 9.7, bmi: 18.49, fatMassKg: 5.31 },
  { id: 'f-10', date: '26/08', time: '08:40', dateTime: '2026-08-26T08:40:00', weightKg: 54.8, skeletalMuscleKg: 25.0, bodyFatPct: 9.7, bmi: 18.52, fatMassKg: 5.32 },
  { id: 'f-11', date: '27/08', time: '06:54', dateTime: '2026-08-27T06:54:00', weightKg: 55.2, skeletalMuscleKg: 25.0, bodyFatPct: 10.1, bmi: 18.66, fatMassKg: 5.58 },
  { id: 'f-12', date: '28/08', time: '08:41', dateTime: '2026-08-28T08:41:00', weightKg: 52.6, skeletalMuscleKg: 24.5, bodyFatPct: 7.5, bmi: 17.78, fatMassKg: 3.95 },
  { id: 'f-13', date: '30/08', time: '10:11', dateTime: '2026-08-30T10:11:00', weightKg: 54.5, skeletalMuscleKg: 24.9, bodyFatPct: 9.4, bmi: 18.42, fatMassKg: 5.12 },
  { id: 'f-14', date: '31/08', time: '08:25', dateTime: '2026-08-31T08:25:00', weightKg: 54.5, skeletalMuscleKg: 24.9, bodyFatPct: 9.5, bmi: 18.42, fatMassKg: 5.18 },
  { id: 'f-15', date: '01/09', time: '07:09', dateTime: '2026-09-01T07:09:00', weightKg: 55.4, skeletalMuscleKg: 25.1, bodyFatPct: 10.3, bmi: 18.73, fatMassKg: 5.71 },
  { id: 'f-16', date: '02/09', time: '09:00', dateTime: '2026-09-02T09:00:00', weightKg: 55.1, skeletalMuscleKg: 25.0, bodyFatPct: 9.9, bmi: 18.63, fatMassKg: 5.45 },
  { id: 'f-17', date: '03/09', time: '07:12', dateTime: '2026-09-03T07:12:00', weightKg: 55.0, skeletalMuscleKg: 25.0, bodyFatPct: 9.9, bmi: 18.59, fatMassKg: 5.45 },
  { id: 'f-18', date: '08/09', time: '07:13', dateTime: '2026-09-08T07:13:00', weightKg: 54.9, skeletalMuscleKg: 24.9, bodyFatPct: 9.8, bmi: 18.56, fatMassKg: 5.38 },
  { id: 'f-19', date: '11/09', time: '08:13', dateTime: '2026-09-11T08:13:00', weightKg: 55.1, skeletalMuscleKg: 25.0, bodyFatPct: 10.1, bmi: 18.63, fatMassKg: 5.57 },
  { id: 'f-20', date: '14/09', time: '13:05', dateTime: '2026-09-14T13:05:00', weightKg: 54.5, skeletalMuscleKg: 24.9, bodyFatPct: 9.5, bmi: 18.42, fatMassKg: 5.18 },
  { id: 'f-21', date: '15/09', time: '06:27', dateTime: '2026-09-15T06:27:00', weightKg: 56.0, skeletalMuscleKg: 25.2, bodyFatPct: 10.9, bmi: 18.93, fatMassKg: 6.10 },
  { id: 'f-22', date: '21/09', time: '09:03', dateTime: '2026-09-21T09:03:00', weightKg: 54.6, skeletalMuscleKg: 24.9, bodyFatPct: 9.5, bmi: 18.46, fatMassKg: 5.19 },
  { id: 'f-23', date: '22/09', time: '07:20', dateTime: '2026-09-22T07:20:00', weightKg: 54.4, skeletalMuscleKg: 24.9, bodyFatPct: 9.4, bmi: 18.39, fatMassKg: 5.11 },
  { id: 'f-24', date: '28/09', time: '08:52', dateTime: '2026-09-28T08:52:00', weightKg: 55.3, skeletalMuscleKg: 25.1, bodyFatPct: 10.2, bmi: 18.69, fatMassKg: 5.64 },
  { id: 'f-25', date: '01/10', time: '07:12', dateTime: '2026-10-01T07:12:00', weightKg: 55.2, skeletalMuscleKg: 25.0, bodyFatPct: 10.1, bmi: 18.66, fatMassKg: 5.58 },
  { id: 'f-26', date: '06/10', time: '06:41', dateTime: '2026-10-06T06:41:00', weightKg: 55.2, skeletalMuscleKg: 25.0, bodyFatPct: 10.0, bmi: 18.66, fatMassKg: 5.52 },
  { id: 'f-27', date: '28/10', time: '12:12', dateTime: '2026-10-28T12:12:00', weightKg: 55.7, skeletalMuscleKg: 25.1, bodyFatPct: 10.6, bmi: 18.80, fatMassKg: 5.90 },
];

state.femmtoData = {
  user: {
    name: 'Santiago Teheran',
    heightCm: 172,
    age: 21,
    gender: 'Masculino',
    lastMeasurementDateTime: '2026-10-28 12:12',
  },
  latest: {
    water: { value: 32.8, rangeMin: 27.9, rangeMax: 36.2, unit: 'L', status: 'normal' },
    protein: { value: 13.9, rangeMin: 6.7, rangeMax: 11.1, unit: 'Kg', status: 'exceso' },
    minerals: { value: 3.2, rangeMin: 1.7, rangeMax: 2.8, unit: 'Kg', status: 'exceso' },
    fatMass: { value: 5.9, rangeMin: 4.1, rangeMax: 11.8, unit: 'Kg', status: 'normal' },
    leanBodyMass: { value: 46.6, rangeMin: 46.6, rangeMax: 49.8, unit: 'Kg', status: 'normal' },
    fatFreeMass: { value: 49.8, unit: 'Kg' },
    weight: { value: 55.7, rangeMin: 54.7, rangeMax: 74.0, unit: 'Kg', status: 'normal' },
    skeletalMuscle: { value: 25.1, rangeMin: 23.0, rangeMax: 35.0, unit: 'Kg', status: 'normal' },
    bmi: { value: 18.8, rangeMin: 18.5, rangeMax: 24.9, unit: 'Kg/m²', status: 'normal' },
    bodyFatPct: { value: 10.6, rangeMin: 10.0, rangeMax: 20.0, unit: '%', status: 'normal' }
  },
  history: INITIAL_FEMMTO_RECORDS
};

const weightObs = [
  {
    id: `vyfith-weight-femmto-latest`,
    resourceType: 'Observation',
    status: 'final',
    category: 'Composición Corporal - Báscula Femmto',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '29463-7',
          display: 'Body weight'
        }
      ]
    },
    valueQuantity: {
      value: 55.7,
      unit: 'kg'
    },
    effectiveDateTime: '2026-10-28T17:12:00.000Z'
  },
  {
    id: `vyfith-bodyfat-femmto-latest`,
    resourceType: 'Observation',
    status: 'final',
    category: 'Composición Corporal - Báscula Femmto',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '41982-0',
          display: 'Percentage of body fat'
        }
      ]
    },
    valueQuantity: {
      value: 10.6,
      unit: '%'
    },
    effectiveDateTime: '2026-10-28T17:12:00.000Z'
  },
  {
    id: `vyfith-mme-femmto-latest`,
    resourceType: 'Observation',
    status: 'final',
    category: 'Composición Corporal - Báscula Femmto',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '73964-9',
          display: 'Body skeletal muscle'
        }
      ]
    },
    valueQuantity: {
      value: 25.1,
      unit: 'kg'
    },
    effectiveDateTime: '2026-10-28T17:12:00.000Z'
  },
  {
    id: `vyfith-bmi-femmto-latest`,
    resourceType: 'Observation',
    status: 'final',
    category: 'Composición Corporal - Báscula Femmto',
    code: {
      coding: [
        {
          system: 'http://loinc.org',
          code: '39156-5',
          display: 'Body mass index (BMI)'
        }
      ]
    },
    valueQuantity: {
      value: 18.8,
      unit: 'kg/m2'
    },
    effectiveDateTime: '2026-10-28T17:12:00.000Z'
  }
];

// Add if not already present
state.recentObservations = [
  ...weightObs,
  ...state.recentObservations.filter(o => !o.id.includes('femmto'))
];

fs.writeFileSync(jsonPath, JSON.stringify(state, null, 2), 'utf8');
console.log('Successfully updated real_health_state.json with Femmto composition & 27 historical records!');
