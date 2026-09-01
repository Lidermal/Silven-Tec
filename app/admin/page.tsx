'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminPanel() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ client_name: '', title: '', total_value: '' });

  const handleLogin = async () => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      setIsAuthenticated(true);
      fetchProjects();
    } else {
      alert("Senha incorreta!");
    }
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*');
    setProjects(data || []);
  };

  const createProject = async () => {
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProject),
    });
    fetchProjects();
    setNewProject({ client_name: '', title: '', total_value: '' });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <div className="bg-slate-900 p-8 rounded-xl border border-indigo-500/30 shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-orbitron text-indigo-400 mb-6 text-center">SILVEN TEC ADMIN</h1>
          <input 
            type="password" 
            placeholder="Senha Mestra" 
            className="w-full p-3 bg-slate-800 rounded mb-4 text-white border border-slate-700 focus:border-indigo-500 outline-none"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button onClick={handleLogin} className="w-full bg-indigo-600 py-3 rounded font-bold hover:bg-indigo-700 transition">
            Acessar Painel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-200 p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-orbitron text-cyan-400">Painel de Controle</h1>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-400 hover:text-red-300">Sair</button>
      </header>

      <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 mb-8">
        <h2 className="text-xl font-bold mb-4 text-indigo-300">Novo Projeto</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Nome do Cliente" className="p-3 bg-slate-800 rounded border border-slate-700" 
            value={newProject.client_name} onChange={e => setNewProject({...newProject, client_name: e.target.value})} />
          <input placeholder="Título do Projeto" className="p-3 bg-slate-800 rounded border border-slate-700" 
            value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
          <input placeholder="Valor Total (R$)" type="number" className="p-3 bg-slate-800 rounded border border-slate-700" 
            value={newProject.total_value} onChange={e => setNewProject({...newProject, total_value: e.target.value})} />
        </div>
        <button onClick={createProject} className="mt-4 bg-emerald-600 px-6 py-2 rounded font-medium hover:bg-emerald-700">
          Cadastrar Projeto
        </button>
      </div>

      <div className="space-y-4">
        {projects.map((p: any) => (
          <div key={p.id} className="p-4 bg-slate-900/30 border border-slate-800 rounded-lg flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white">{p.title}</h3>
              <p className="text-sm text-slate-400">Cliente: {p.client_name}</p>
              <p className="text-xs text-cyan-500 mt-1">Link: /client/{p.access_token}</p>
            </div>
            <div className="text-right">
              <span className="block text-emerald-400 font-bold">R$ {p.total_value}</span>
              <span className="text-xs bg-slate-800 px-2 py-1 rounded">{p.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
