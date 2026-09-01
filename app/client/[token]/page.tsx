'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

export default function ClientArea() {
  const { token } = useParams();
  const [project, setProject] = useState<any>(null);
  const [paymentLink, setPaymentLink] = useState('');

  useEffect(() => {
    if (token) fetchProject();
  }, [token]);

  const fetchProject = async () => {
    const { data } = await supabase.from('projects').select('*').eq('access_token', token).single();
    setProject(data);
  };

  const generatePayment = async () => {
    const res = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        projectName: project.title, 
        amount: project.total_value,
        projectId: project.id 
      }),
    });
    const data = await res.json();
    setPaymentLink(data.init_point);
  };

  if (!project) return <div className="min-h-screen bg-[#0B0F19] text-white flex items-center justify-center">Carregando projeto...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 p-6">
      <div className="max-w-2xl mx-auto bg-slate-900/50 p-8 rounded-2xl border border-indigo-500/20 shadow-2xl">
        <h1 className="text-3xl font-orbitron text-indigo-400 mb-2">{project.title}</h1>
        <p className="text-slate-400 mb-6">Olá, {project.client_name}. Acompanhe seu projeto abaixo.</p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <span className="text-xs text-slate-500 uppercase">Status</span>
            <p className="text-xl font-bold text-emerald-400">{project.status}</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-lg">
            <span className="text-xs text-slate-500 uppercase">Prazo</span>
            <p className="text-xl font-bold text-white">{new Date(project.deadline).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6">
          <h3 className="text-lg font-bold mb-4">Pagamento</h3>
          {paymentLink ? (
            <a href={paymentLink} target="_blank" className="block w-full bg-emerald-600 text-center py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
              Finalizar Pagamento (PIX/Cartão)
            </a>
          ) : (
            <button onClick={generatePayment} className="w-full bg-indigo-600 py-3 rounded-lg font-bold hover:bg-indigo-700 transition">
              Gerar Link de Pagamento
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
