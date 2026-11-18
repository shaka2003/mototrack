'use client';

import { useState } from 'react';
import { api, rp } from '@/lib/api';

const empty = { name: '', price: '', stock: '' };

export default function PartsTab({ parts, refresh, notify }) {
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function reset() {
    setForm(empty);
    setEditingId(null);
  }

  async function submit(e) {
    e.preventDefault();
    const body = {
      name: form.name,
      price: form.price === '' ? NaN : Number(form.price),
      stock: form.stock === '' ? NaN : Number(form.stock),
    };
    try {
      if (editingId) {
        await api(`/spare-parts/${editingId}`, { method: 'PUT', body });
        notify('Spare part updated');
      } else {
        await api('/spare-parts', { method: 'POST', body });
        notify('Spare part added');
      }
      reset();
      await refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  function edit(p) {
    setEditingId(p.id);
    setForm({ name: p.name, price: String(p.price), stock: String(p.stock) });
  }

  async function remove(p) {
    if (!confirm(`Delete "${p.name}" from the catalog?`)) return;
    try {
      await api(`/spare-parts/${p.id}`, { method: 'DELETE' });
      notify('Spare part deleted');
      if (editingId === p.id) reset();
      await refresh();
    } catch (err) {
      notify(err.message, 'error');
    }
  }

  return (
    <div className="layout">
      <section className="panel">
        <h2>{editingId ? `Edit part ${editingId}` : 'Add a spare part'}</h2>
        <form onSubmit={submit} className="form">
          <label>
            Part name
            <input value={form.name} onChange={set('name')} placeholder="Air Filter Element" required />
          </label>
          <label>
            Unit price (Rp)
            <input type="number" min="0" value={form.price} onChange={set('price')} required />
          </label>
          <label>
            Stock
            <input type="number" min="0" step="1" value={form.stock} onChange={set('stock')} required />
          </label>
          <div className="row">
            <button className="btn primary" type="submit">
              {editingId ? 'Save changes' : 'Add part'}
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
        <h2>Spare parts catalog</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Part</th>
                <th className="num">Unit price</th>
                <th className="num">Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {parts.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty">The catalog is empty. Add a spare part to get started.</td>
                </tr>
              )}
              {parts.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td className="num">{rp(p.price)}</td>
                  <td className="num">
                    <span className={`stock ${p.stock === 0 ? 'out' : p.stock <= 2 ? 'low' : ''}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="link" onClick={() => edit(p)}>Edit</button>
                    <button className="link danger" onClick={() => remove(p)}>Delete</button>
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
