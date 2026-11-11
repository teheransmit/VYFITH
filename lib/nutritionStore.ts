import { DailyNutritionState, FoodItem, MealType } from './fitiaEngine';
import fs from 'fs';
import path from 'path';

export const DEFAULT_NUTRITION_TARGETS = {
  targetKcal: 2500, // Superávit limpio de volumen para 55.7 kg
  targetProtein: 115, // ~2.06 g/kg de proteína
  targetCarbs: 330,
  targetFat: 65,
  targetWaterMl: 2900, // Meta hídrica oficial del teléfono Vivo Y20
};

export const INITIAL_NUTRITION_STATE: DailyNutritionState = {
  date: '2026-11-11',
  targets: DEFAULT_NUTRITION_TARGETS,
  current: {
    calories: 1820,
    protein: 88.5,
    carbs: 235.0,
    fat: 46.2,
    waterMl: 2000,
  },
  meals: {
    desayuno: {
      mealType: 'desayuno',
      title: 'Desayuno Energético Pre-Entreno',
      time: '07:30',
      items: [
        {
          id: 'item-d1',
          name: 'Huevos pericos con tomate y cebolla',
          spanishName: 'Huevos pericos con tomate y cebolla',
          portionDisplay: '3 huevos grandes (150g)',
          grams: 150,
          calories: 225,
          protein: 18.5,
          carbs: 3.5,
          fat: 15.0,
          source: 'manual',
        },
        {
          id: 'item-d2',
          name: 'Arepa de maíz blanco con queso costeño',
          spanishName: 'Arepa de maíz blanco con queso costeño',
          portionDisplay: '1 arepa + 40g queso',
          grams: 120,
          calories: 295,
          protein: 11.8,
          carbs: 38.0,
          fat: 10.5,
          source: 'manual',
        },
        {
          id: 'item-d3',
          name: 'Avena en hojuelas con leche entera y banano',
          spanishName: 'Avena en hojuelas con leche entera y banano',
          portionDisplay: '1 tazón grande (300ml)',
          grams: 300,
          calories: 320,
          protein: 12.0,
          carbs: 56.0,
          fat: 6.0,
          source: 'manual',
        },
      ],
      totalKcal: 840,
      totalProtein: 42.3,
      totalCarbs: 97.5,
      totalFat: 31.5,
    },
    almuerzo: {
      mealType: 'almuerzo',
      title: 'Almuerzo Universidad UPB (Pechuga & Arroz)',
      time: '13:15',
      items: [
        {
          id: 'item-a1',
          name: 'Pechuga de pollo a la plancha',
          spanishName: 'Pechuga de pollo a la plancha',
          portionDisplay: '1 filete grande (180g)',
          grams: 180,
          calories: 297,
          protein: 55.8,
          carbs: 0.0,
          fat: 6.5,
          source: 'plate_scan',
          confidence: 0.95,
        },
        {
          id: 'item-a2',
          name: 'Arroz blanco cocido',
          spanishName: 'Arroz blanco cocido',
          portionDisplay: '1 plato hondo (220g)',
          grams: 220,
          calories: 286,
          protein: 5.9,
          carbs: 62.0,
          fat: 0.7,
          source: 'plate_scan',
          confidence: 0.94,
        },
        {
          id: 'item-a3',
          name: 'Plátano maduro asado / tajadas',
          spanishName: 'Plátano maduro asado / tajadas',
          portionDisplay: '2 tajadas (80g)',
          grams: 80,
          calories: 208,
          protein: 1.2,
          carbs: 38.4,
          fat: 7.6,
          source: 'plate_scan',
          confidence: 0.91,
        },
        {
          id: 'item-a4',
          name: 'Aguacate Hass',
          spanishName: 'Aguacate Hass',
          portionDisplay: 'Medio aguacate (80g)',
          grams: 80,
          calories: 128,
          protein: 1.6,
          carbs: 6.8,
          fat: 11.8,
          source: 'plate_scan',
          confidence: 0.96,
        },
      ],
      totalKcal: 919,
      totalProtein: 64.5,
      totalCarbs: 107.2,
      totalFat: 26.6,
    },
    cena: {
      mealType: 'cena',
      title: 'Cena de Recuperación Muscular (Planificada)',
      time: '20:30',
      items: [],
      totalKcal: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    },
    snacks: {
      mealType: 'snacks',
      title: 'Snacks & Hidratación',
      time: '16:00',
      items: [
        {
          id: 'item-s1',
          name: 'Banano maduro mediano',
          spanishName: 'Banano maduro mediano',
          portionDisplay: '1 unidad (100g)',
          grams: 100,
          calories: 89,
          protein: 1.1,
          carbs: 22.8,
          fat: 0.3,
          source: 'nlp_voice',
        },
      ],
      totalKcal: 89,
      totalProtein: 1.1,
      totalCarbs: 22.8,
      totalFat: 0.3,
    },
  },
  recentScans: [],
  lastUpdated: new Date().toISOString(),
};

const NUTRITION_FILE = path.join(process.cwd(), 'data', 'real_nutrition_state.json');

export function getDailyNutritionState(): DailyNutritionState {
  try {
    if (fs.existsSync(NUTRITION_FILE)) {
      const raw = fs.readFileSync(NUTRITION_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.current) return parsed;
    }
  } catch (err) {
    console.error('Error loading nutrition state from disk:', err);
  }
  return INITIAL_NUTRITION_STATE;
}

export function saveDailyNutritionState(state: DailyNutritionState): DailyNutritionState {
  try {
    state.lastUpdated = new Date().toISOString();
    fs.writeFileSync(NUTRITION_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error('Error persisting nutrition state to disk:', err);
  }
  return state;
}

export function addFoodItemToMeal(
  mealType: MealType,
  item: FoodItem
): DailyNutritionState {
  const state = getDailyNutritionState();
  if (!state.meals[mealType]) {
    state.meals[mealType] = {
      mealType,
      title: mealType.toUpperCase(),
      time: new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
      items: [],
      totalKcal: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
    };
  }

  const meal = state.meals[mealType];
  meal.items.push(item);
  meal.totalKcal = Math.round(meal.items.reduce((acc, i) => acc + (i.calories || 0), 0));
  meal.totalProtein = Number(meal.items.reduce((acc, i) => acc + (i.protein || 0), 0).toFixed(1));
  meal.totalCarbs = Number(meal.items.reduce((acc, i) => acc + (i.carbs || 0), 0).toFixed(1));
  meal.totalFat = Number(meal.items.reduce((acc, i) => acc + (i.fat || 0), 0).toFixed(1));

  // Recalcular totales del día
  let dayKcal = 0;
  let dayProt = 0;
  let dayCarb = 0;
  let dayFat = 0;

  Object.values(state.meals).forEach((m) => {
    dayKcal += m.totalKcal;
    dayProt += m.totalProtein;
    dayCarb += m.totalCarbs;
    dayFat += m.totalFat;
  });

  state.current.calories = dayKcal;
  state.current.protein = Number(dayProt.toFixed(1));
  state.current.carbs = Number(dayCarb.toFixed(1));
  state.current.fat = Number(dayFat.toFixed(1));

  // Guardar en escaneos recientes
  state.recentScans = [item, ...state.recentScans.slice(0, 9)];

  return saveDailyNutritionState(state);
}

export function updateWaterIntake(deltaMl: number): DailyNutritionState {
  const state = getDailyNutritionState();
  state.current.waterMl = Math.max(0, state.current.waterMl + deltaMl);
  return saveDailyNutritionState(state);
}
