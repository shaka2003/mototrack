'use client';

import { useEffect, useState } from 'react';
import { api, rp } from '@/lib/api';

const today = () => new Date().toISOString().slice(0, 10);
const blank = () => ({ vehicleId: '', date: today(), serviceType: '', partIds: [] });

export default function ServicesTab({ vehicles, parts, records, refresh, notify }) {
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null); // the record being edited
  const [summaryId, setSummaryId] = useState('');
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('all');

  // fall back to the first vehicle when nothing (or a deleted vehicle) is selected
  const vehicleId = vehicles.some((v) => v.id === form.vehicleId) ? form.vehicleId : vehicles[0]?.id ?? '';

  useEffect(() => {
    if (!vehicles.some((v) => v.id === summaryId)) setSummaryId(vehicles[0]?.id ?? '');
  }, [vehicles, summaryId]);

  useEffect(() => {
    if (!summaryId) {
      setSummary(null);
      return;
    }
    let alive = true;
    api(`/vehicles/${summaryId}/summary`)
      .then((d) => alive && setSummary(d))
      .catch(() => alive && setSummary(null));
    return () => {
      alive = false;
    };
  }, [summaryId, records]);

  const togglePart = (id) =>
    setForm((f) => ({
      ...f,
      partIds: f.partIds.includes(id) ? f.partIds.filter((x) => x !== id) : [...f.partIds, id],
    }));

  const estimate = form.partIds.reduce((sum, id) => sum + (parts.find((p) => p.id === id)?.price ?? 0), 0);

  function reset() {
    setForm(blank());
    setEditing(null);
  }

  async function submit(e) {
    e.preventDefault();
    if (!vehicleId) return notify('Register a vehicle first', 'error');
    const body = { ...form, vehicleId };
    try {
      if (editing) {
        await api(`/service-records/${editing.id}`, { method: 'PUT', body });
        notify('Service record updated');
      } else {
        await api('/service-records', { method: 'POST', body });
        notify('Service record saved');
      }
      reset();
      await refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  function edit(r) {
    setEditing(r);
    setForm({
      vehicleId: r.vehicleId,
      date: r.date,
      serviceType: r.serviceType,
      partIds: r.partIds.filter((id) => parts.some((p) => p.id === id)),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(r) {
    if (!confirm(`Delete service record ${r.id}? Used parts go back into stock.`)) return;
    try {
      await api(`/service-records/${r.id}`, { method: 'DELETE' });
      notify('Service record deleted, stock restored');
      if (editing?.id === r.id) reset();
      await refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  const visible = records.filter((r) => filter === 'all' || r.vehicleId === filter);

  return (
    <div className="layout">
      {/* Left panel: service entry form */}
      <section className="panel">
        <h2>{editing ? `Edit service ${editing.id}` : 'Log a service'}</h2>
        <form onSubmit={submit} className="form">
          <label>
            Vehicle
            <select value={vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              {vehicles.length === 0 && <option value="">No vehicles registered</option>}
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate} — {v.model}
                </option>
              ))}
            </select>
          </label>

          <div className="row two">
            <label>
              Date
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </label>
            <label>
              Service type
              <input
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                placeholder="Oil & brake check"
                required
              />
            </label>
          </div>

          <fieldset>
            <legend>Spare parts used</legend>
            {parts.length === 0 && <p className="empty">No spare parts in the catalog yet.</p>}
            {parts.map((p) => {
              const wasUsed = editing?.partIds.includes(p.id);
              const disabled = p.stock < 1 && !wasUsed;
              return (
                <label key={p.id} className={`check ${disabled ? 'disabled' : ''}`}>
                  <input
                    type="checkbox"
                    checked={form.partIds.includes(p.id)}
                    disabled={disabled}
                    onChange={() => togglePart(p.id)}
                  />
                  <span className="grow">{p.name}</span>
                  <span className="muted">{disabled ? 'Out of stock' : `${p.stock} in stock`}</span>
                  <span className="num">{rp(p.price)}</span>
                </label>
              );
            })}
          </fieldset>

          <div className="estimate">
            <span>Parts total</span>
            <strong>{rp(estimate)}</strong>
          </div>

          <div className="row">
            <button className="btn primary" type="submit" disabled={!vehicles.length}>
              {editing ? 'Save changes' : 'Save service record'}
            </button>
            {editing && (
              <button className="btn" type="button" onClick={reset}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Right panel: multi-entity summary */}
      <section className="panel">
        <h2>Vehicle service &amp; cost summary</h2>
        <label className="inline">
          Vehicle
          <select value={summaryId} onChange={(e) => setSummaryId(e.target.value)}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id} — {v.plate}
              </option>
            ))}
          </select>
        </label>

        {summary ? (
          <>
            <div className="stats">
              <div>
                <span className="muted">Services completed</span>
                <strong>{summary.totalServices}</strong>
              </div>
              <div>
                <span className="muted">Total spent on maintenance</span>
                <strong>{rp(summary.cumulativeCost)}</strong>
              </div>
            </div>

            {summary.records.length === 0 ? (
              <p className="empty">No services logged for this vehicle yet.</p>
            ) : (
              <ul className="itemized">
                {summary.records.map((r) => (
                  <li key={r.id}>
                    <div className="item-head">
                      <span>
                        {r.date} · {r.serviceType}
                      </span>
                      <strong>{rp(r.totalCost)}</strong>
                    </div>
                    {r.parts.length > 0 ? (
                      <ul>
                        {r.parts.map((p) => (
                          <li key={p.id}>
                            <span>{p.name}</span>
                            <span className="num">{rp(p.price)}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="muted">No parts used</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="empty">Select a vehicle to see its service history.</p>
        )}
      </section>

      {/* Full-width: history table */}
      <section className="panel wide">
        <div className="panel-head">
          <h2>Service history</h2>
          <label className="inline">
            Show
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All vehicles</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.plate}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Vehicle</th>
                <th>Date &amp; service type</th>
                <th>Parts used</th>
                <th className="num">Total cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan="6" className="empty">No service records to show.</td>
                </tr>
              )}
              {visible.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>{r.vehicle ? `${r.vehicle.plate} (${r.vehicle.model})` : '(deleted vehicle)'}</td>
                  <td>
                    {r.date} — {r.serviceType}
                  </td>
                  <td>{r.parts.length ? r.parts.map((p) => p.name).join(', ') : '—'}</td>
                  <td className="num">{rp(r.totalCost)}</td>
                  <td className="actions">
                    <button className="link" onClick={() => edit(r)}>Edit</button>
                    <button className="link danger" onClick={() => remove(r)}>Delete</button>
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
