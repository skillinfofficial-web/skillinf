'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Tag, Plus, Pencil, Trash2, X, CheckCircle,
  AlertCircle, Loader2, Check,
} from 'lucide-react';
import styles from './domains.module.css';

interface Domain { name: string; }

export default function DomainsPage() {
  const [domains, setDomains]   = useState<Domain[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error,   setError]     = useState('');

  // Add state
  const [addInput,   setAddInput]   = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError,   setAddError]   = useState('');
  const [addSuccess, setAddSuccess] = useState('');

  // Edit state
  const [editingName,  setEditingName]  = useState<string | null>(null);
  const [editInput,    setEditInput]    = useState('');
  const [editLoading,  setEditLoading]  = useState(false);
  const [editError,    setEditError]    = useState('');

  // Delete state
  const [deleteTarget,  setDeleteTarget]  = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError,   setDeleteError]   = useState('');

  /* ── Load ───────────────────────────────────────────────────────────────── */
  const load = useCallback(() => {
    setLoading(true); setError('');
    fetch('/api/domains')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setDomains(d.domains);
        else setError(d.message || 'Failed to load.');
      })
      .catch(() => setError('Network error.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Add ────────────────────────────────────────────────────────────────── */
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(''); setAddSuccess('');
    if (!addInput.trim()) { setAddError('Please enter a domain name.'); return; }
    setAddLoading(true);
    try {
      const res  = await fetch('/api/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setAddSuccess('Domain added!');
        setAddInput('');
        load();
        setTimeout(() => setAddSuccess(''), 2500);
      } else {
        setAddError(data.message || 'Failed to add.');
      }
    } catch {
      setAddError('Network error.');
    } finally {
      setAddLoading(false);
    }
  };

  /* ── Edit ───────────────────────────────────────────────────────────────── */
  const startEdit = (name: string) => {
    setEditingName(name);
    setEditInput(name);
    setEditError('');
  };
  const cancelEdit = () => { setEditingName(null); setEditInput(''); setEditError(''); };

  const handleEdit = async (oldName: string) => {
    setEditError('');
    if (!editInput.trim()) { setEditError('Name cannot be empty.'); return; }
    if (editInput.trim() === oldName) { cancelEdit(); return; }
    setEditLoading(true);
    try {
      const res  = await fetch('/api/domains', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName, newName: editInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        cancelEdit();
        load();
      } else {
        setEditError(data.message || 'Failed to update.');
      }
    } catch {
      setEditError('Network error.');
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true); setDeleteError('');
    try {
      const res  = await fetch('/api/domains', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: deleteTarget }),
      });
      const data = await res.json();
      if (data.success) {
        setDomains((prev) => prev.filter((d) => d.name !== deleteTarget));
        setDeleteTarget(null);
      } else {
        setDeleteError(data.message || 'Failed to delete.');
      }
    } catch {
      setDeleteError('Network error.');
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Domains</h1>
          <p className={styles.desc}>
            Manage the internship domains shown in the company internship dropdown and student sign-up page.
          </p>
        </div>
        <div className={styles.countBadge}>
          <Tag size={14} />
          {loading ? '…' : `${domains.length} domain${domains.length !== 1 ? 's' : ''}`}
        </div>
      </header>

      {/* Add Domain Card */}
      <div className={styles.addCard}>
        <p className={styles.addCardTitle}>Add New Domain</p>
        <form onSubmit={handleAdd} className={styles.addForm}>
          <input
            id="add-domain-input"
            type="text"
            className={styles.addInput}
            placeholder="e.g. AI & Machine Learning"
            value={addInput}
            onChange={(e) => { setAddInput(e.target.value); setAddError(''); }}
          />
          <button type="submit" className={styles.addBtn} disabled={addLoading} id="add-domain-btn">
            {addLoading ? <Loader2 size={15} className={styles.spin} /> : <Plus size={15} />}
            {addLoading ? 'Adding…' : 'Add Domain'}
          </button>
        </form>
        {addError   && <p className={styles.formError}><AlertCircle size={14} />{addError}</p>}
        {addSuccess && <p className={styles.formSuccess}><CheckCircle size={14} />{addSuccess}</p>}
      </div>

      {/* States */}
      {loading && (
        <div className={styles.stateBox}>
          <Loader2 size={26} className={styles.spin} />
          <span>Loading domains…</span>
        </div>
      )}
      {error && !loading && (
        <div className={`${styles.stateBox} ${styles.stateError}`}>
          <AlertCircle size={20} /><span>{error}</span>
        </div>
      )}
      {!loading && !error && domains.length === 0 && (
        <div className={styles.stateBox}>
          <Tag size={36} className={styles.emptyIcon} />
          <p className={styles.emptyTitle}>No domains yet</p>
          <p className={styles.emptyHint}>Add your first domain using the form above.</p>
        </div>
      )}

      {/* Domain List */}
      {!loading && !error && domains.length > 0 && (
        <div className={styles.list}>
          {domains.map((d, i) => (
            <div key={d.name} className={styles.row}>
              <span className={styles.rowNum}>{i + 1}</span>

              {editingName === d.name ? (
                /* ── Inline edit ── */
                <div className={styles.editGroup}>
                  <input
                    className={styles.editInput}
                    value={editInput}
                    autoFocus
                    onChange={(e) => { setEditInput(e.target.value); setEditError(''); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEdit(d.name);
                      if (e.key === 'Escape') cancelEdit();
                    }}
                  />
                  {editError && <span className={styles.inlineErr}>{editError}</span>}
                  <button
                    className={styles.saveBtn}
                    onClick={() => handleEdit(d.name)}
                    disabled={editLoading}
                    title="Save"
                  >
                    {editLoading ? <Loader2 size={14} className={styles.spin} /> : <Check size={14} />}
                  </button>
                  <button className={styles.cancelBtn} onClick={cancelEdit} title="Cancel">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                /* ── Display row ── */
                <>
                  <span className={styles.domainName}>{d.name}</span>
                  <div className={styles.rowActions}>
                    <button
                      className={styles.editBtn}
                      title="Edit"
                      id={`edit-domain-${i}`}
                      onClick={() => startEdit(d.name)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={styles.deleteBtn}
                      title="Delete"
                      id={`delete-domain-${i}`}
                      onClick={() => { setDeleteTarget(d.name); setDeleteError(''); }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className={styles.overlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={`${styles.modalIcon} ${styles.modalIconDanger}`}><Trash2 size={18} /></div>
              <div>
                <h2 className={styles.modalTitle}>Delete Domain?</h2>
                <p className={styles.modalSub}>
                  "<strong>{deleteTarget}</strong>" will be removed from the dropdown and sign-up page.
                  This cannot be undone.
                </p>
              </div>
              <button className={styles.modalClose} onClick={() => setDeleteTarget(null)}><X size={18} /></button>
            </div>
            {deleteError && (
              <p className={styles.formError}><AlertCircle size={14} />{deleteError}</p>
            )}
            <div className={styles.modalActions}>
              <button className={styles.cancelActionBtn} onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
                Cancel
              </button>
              <button className={styles.confirmDeleteBtn} onClick={handleDelete} disabled={deleteLoading} id="confirm-delete-domain-btn">
                {deleteLoading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
