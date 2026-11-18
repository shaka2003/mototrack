'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const empty = { plate: '', model: '', odometerKm: '' };

export default function VehiclesTab({ vehicles, refresh, notify }) {
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function reset() {
    setForm(empty);
    setEditingId(null);
  }

  async function submit(e) {
    e.preventDefault();
    const body = { ...form, odometerKm: form.odometerKm === '' ? NaN : Number(form.odometerKm) };
    try {
      if (editingId) {
        await api(`/vehicles/${editingId}`, { method: 'PUT', body });
        notify('Vehicle updated');
      } else {
        await api('/vehicles', { method: 'POST', body });
        notify('Vehicle registered');
      }
      reset();
      await refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  function edit(v) {
    setEditingId(v.id);
    setForm({ plate: v.plate, model: v.model, odometerKm: String(v.odometerKm) });
  }

  async function remove(v) {
    if (!confirm(`Delete ${v.plate} (${v.model})?`)) return;
    try {
      await api(`/vehicles/${v.id}`, { method: 'DELETE' });
      notify('Vehicle deleted');
      if (editingId === v.id) reset();
      await refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  return (
    <div className="layout">
      <section className="panel">
        <h2>{editingId ? `Edit vehicle ${editingId}` : 'Register a vehicle'}</h2>
        <form onSubmit={submit} className="form">
          <label>
            License plate
            <input value={form.plate} onChange={set('plate')} placeholder="D 4512 ABC" required />
          </label>
          <label>
            Model
            <input value={form.model} onChange={set('model')} placeholder="Honda PCX 160" required />
          </label>
          <label>
            Odometer (km)
            <input type="number" min="0" value={form.odometerKm} onChange={set('odometerKm')} required />
          </label>
          <div className="row">
            <button className="btn primary" type="submit">
              {editingId ? 'Save changes' : 'Register vehicle'}
            </button>
            {editingId && (
              <button className="btn" type="button" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="panel">
        <h2>Registered vehicles</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Plate</th>
                <th>Model</th>
                <th className="num">Odometer</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty">No vehicles yet. Register your first motorcycle.</td>
                </tr>
              )}
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td>{v.id}</td>
                  <td>{v.plate}</td>
                  <td>{v.model}</td>
                  <td className="num">{v.odometerKm.toLocaleString('id-ID')} km</td>
                  <td className="actions">
                    <button className="link" onClick={() => edit(v)}>Edit</button>
                    <button className="link danger" onClick={() => remove(v)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
