'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import VehiclesTab from '@/components/VehiclesTab';
import PartsTab from '@/components/PartsTab';
import ServicesTab from '@/components/ServicesTab';

const TABS = [
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'parts', label: 'Spare Parts' },
  { id: 'services', label: 'Service Logs' },
];

export default function Home() {
  const [tab, setTab] = useState('services');
  const [vehicles, setVehicles] = useState([]);
  const [parts, setParts] = useState([]);
  const [records, setRecords] = useState([]);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const notify = useCallback((message, type = 'ok') => {
    setToast({ message, type });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [v, p, s] = await Promise.all([
        api('/vehicles'),
        api('/spare-parts'),
        api('/service-records'),
      ]);
      setVehicles(v);
      setParts(p);
      setRecords(s);
    } catch (e) {
      notify(e.message, 'error');
    }
  }, [notify]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const shared = { vehicles, parts, records, refresh, notify };

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <h1 className="brand">MotoTrack</h1>
          <nav className="tabs" aria-label="Sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab ${tab === t.id ? 'active' : ''}`}
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="page">
        {tab === 'vehicles' && <VehiclesTab {...shared} />}
        {tab === 'parts' && <PartsTab {...shared} />}
        {tab === 'services' && <ServicesTab {...shared} />}
      </main>

      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.message}
        </div>
      )}
    </>
  );
}
