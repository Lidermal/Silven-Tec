import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: Request) {
  const { password } = await req.json();

  // 1. Buscar o hash armazenado no banco
  const { data, error } = await supabase
    .from('system_config')
    .select('config_value')
    .eq('config_key', 'admin_password_hash')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Erro de configuração' }, { status: 500 });
  }

  // 2. Criar hash da senha digitada
  const inputHash = crypto.createHash('sha256').update(password).digest('hex');

  // 3. Comparar os hashes
  if (inputHash === data.config_value) {
    return NextResponse.json({ success: true });
  } else {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  }
}
