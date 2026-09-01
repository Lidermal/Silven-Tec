import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    // Busca o hash armazenado no banco
    const { data, error } = await supabase
      .from('system_config')
      .select('config_value')
      .eq('config_key', 'admin_password_hash')
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Configuração de segurança não encontrada.' }, { status: 500 });
    }

    // Gera hash da senha digitada e compara
    const inputHash = crypto.createHash('sha256').update(password).digest('hex');

    if (inputHash === data.config_value) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
