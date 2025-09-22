import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './index.css';
import { useAuth } from './store/auth';
import { setAuth, api } from './lib/api';

const qc = new QueryClient();

function Login() {
  const setToken = useAuth(s => s.setToken);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = new FormData(e.target as HTMLFormElement);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const { data } = await api.post('/auth/login', { email, password });
    setAuth(data.token); setToken(data.token);
  }
  return (
    <form className="p-6 space-y-3 max-w-sm mx-auto" onSubmit={onSubmit}>
      <h1 className="text-2xl font-bold">SMTA Login</h1>
      <input name="email" placeholder="email" className="border p-2 w-full" />
      <input name="password" placeholder="password" type="password" className="border p-2 w-full" />
      <button className="bg-black text-white px-3 py-2 w-full">Sign in</button>
    </form>
  );
}

function Dashboard() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">SMTA Dashboard</h1>
      <a className="underline" href="http://localhost:4000/api/health" target="_blank">API health</a>
    </div>
  );
}

function App() {
  const token = useAuth(s => s.token);
  React.useEffect(() => setAuth(token), [token]);
  return (
    <BrowserRouter>
      <nav className="p-4 border-b flex gap-4">
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
      </nav>
      <Routes>
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}><App /></QueryClientProvider>
  </React.StrictMode>
);
