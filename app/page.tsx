import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B0F19] text-slate-200 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Efeito de fundo futurista */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0B0F19] to-[#0B0F19] -z-10"></div>
      
      <div className="text-center space-y-6 z-10">
        <h1 className="text-6xl font-orbitron text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 tracking-widest drop-shadow-lg">
          SILVEN TEC
        </h1>
        <p className="text-slate-400 max-w-md mx-auto text-lg">
          Tecnologia, inovação e gestão financeira integrada para seus projetos.
        </p>
        
        <div className="flex gap-4 justify-center mt-8">
          <Link href="/admin" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            Área Administrativa
          </Link>
        </div>
        <p className="text-xs text-slate-600 mt-4">Acesso restrito a parceiros autorizados.</p>
      </div>
    </main>
  );
}
