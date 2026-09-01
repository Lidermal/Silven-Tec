import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });

export async function POST(req: Request) {
  const { projectName, amount, projectId } = await req.json();

  try {
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [{ 
          title: `Projeto Silven Tec: ${projectName}`, 
          unit_price: Number(amount), 
          quantity: 1 
        }],
        payment_methods: { excluded_payment_types: [{ id: 'ticket' }] },
        external_reference: projectId,
        auto_return: 'approved',
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao conectar com Mercado Pago' }, { status: 500 });
  }
}
