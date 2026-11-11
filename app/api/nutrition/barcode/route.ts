import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode');

    if (!barcode || barcode.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: 'Código de barras no proporcionado o inválido' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanBarcode = barcode.trim();
    const offUrl = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json`;

    const res = await fetch(offUrl, {
      headers: {
        'User-Agent': 'VYFITH-App/1.0 (santiago@vyfith.com)',
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          status: 0,
          message: `Open Food Facts respondió con estado ${res.status}`,
          barcode: cleanBarcode,
        },
        { status: res.status, headers: corsHeaders }
      );
    }

    const json = await res.json();

    if (json.status !== 1 || !json.product) {
      return NextResponse.json(
        {
          success: false,
          status: 0,
          message: 'Producto no encontrado en Open Food Facts',
          barcode: cleanBarcode,
        },
        { headers: corsHeaders }
      );
    }

    const product = json.product;
    const nutriments = product.nutriments || {};

    const kcal100g = Number(nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0);
    const prot100g = Number(nutriments['proteins_100g'] ?? nutriments['proteins'] ?? 0);
    const carbs100g = Number(nutriments['carbohydrates_100g'] ?? nutriments['carbohydrates'] ?? 0);
    const fat100g = Number(nutriments['fat_100g'] ?? nutriments['fat'] ?? 0);
    const fiber100g = Number(nutriments['fiber_100g'] ?? 0);
    const sodium100g = Number(nutriments['sodium_100g'] ?? 0);

    const servingQuantity = Number(product.serving_quantity || 100);
    const servingRatio = servingQuantity / 100;

    const parsedFood = {
      barcode: cleanBarcode,
      name: product.product_name_es || product.product_name || 'Producto Escaneado',
      brand: product.brands || 'Marca Desconocida',
      servingSize: product.serving_size || `${servingQuantity}g`,
      servingGrams: servingQuantity,
      imageUrl: product.image_url || product.image_front_url || null,
      per100g: {
        calories: Math.round(kcal100g),
        protein: Number(prot100g.toFixed(1)),
        carbs: Number(carbs100g.toFixed(1)),
        fat: Number(fat100g.toFixed(1)),
        fiber: Number(fiber100g.toFixed(1)),
        sodiumMg: Math.round(sodium100g * 1000),
      },
      perServing: {
        calories: Math.round(kcal100g * servingRatio),
        protein: Number((prot100g * servingRatio).toFixed(1)),
        carbs: Number((carbs100g * servingRatio).toFixed(1)),
        fat: Number((fat100g * servingRatio).toFixed(1)),
        fiber: Number((fiber100g * servingRatio).toFixed(1)),
      },
    };

    return NextResponse.json(
      {
        success: true,
        status: 1,
        source: 'Open Food Facts v2',
        data: parsedFood,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Error procesando código de barras' },
      { status: 500, headers: corsHeaders }
    );
  }
}
