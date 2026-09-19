import { NextResponse } from 'next/server';
import { ProductService } from '@/services/ProductService';

export async function GET() {
    const stock = await ProductService.getLiveStock();
    return NextResponse.json({ 
        stockCount: Object.keys(stock).length,
        sample: stock["212 NYC MEN EDT 100 ML TESTER"]
    });
}
