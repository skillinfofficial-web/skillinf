'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  User, Shield, Plus, Trash2, Loader2, AlertCircle,
  CheckCircle, Eye, Edit3, ChevronDown, ChevronUp,
  Lock, Key, BadgeCheck, X,
} from 'lucide-react';
import styles from './profile.module.css';

/* ── Types ─────────────────────────────────────────────────────────────── */
interface PageDef { key: string; label: string; path: string; }
interface PagePermission { key: string; view: boolean; edit: boolean; }
interface Credential {
  _id: string; label: string; email: string;
  permissions: PagePermission[]; createdAt: string;
}

/* ── Page content groups for the permission selector ───────────────────── */
const PAGE_GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Main',       keys: ['dashboard', 'add-content'] },
  { title: 'Content',    keys: ['internships', 'programs', 'projects', 'company-internships', 'domains', 'batches', 'platforms', 'announcement'] },
  { title: 'Management', keys: ['applications', 'e-certificate', 'linkedin-verify', 'physical-certs', 'payments', 'referrals', 'email-status', 'offer-codes'] },
];

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function AdminProfilePage() {
  const [tab, setTab] = useState<'profile' | 'credentials'>('profile');

  /* ── Credentials state ── */
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [pages,       setPages]       = useState<PageDef[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  /* ── New credential form ── */
  const [showForm, setShowForm] = useState(false);
  const [newLabel,    setNewLabel]    = useState('');
  const [newEmail,    setNewEmail]    = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPerms,    setNewPerms]    = useState<PagePermission[]>([]);
  const [masterPwd,   setMasterPwd]   = useState('');
  const [formStep,    setFormStep]    = useState<1 | 2>(1); // 1=details, 2=permissions
  const [formError,   setFormError]   = useState('');
  const [formSaving,  setFormSaving]  = useState(false);
  const [formSuccess, setFormSuccess] = useState('');

  /* ── Delete ── */
  const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null);
  const [deletePwd,    setDeletePwd]    = useState('');
  const [deleteError,  setDeleteError]  = useState('');
  const [deleting,     setDeleting]     = useState(false);

  /* ── Expanded credential detail ── */
  const [expanded, setExpanded] = useState<string | null>(null);

  /* ── Load ── */
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/admin/credentials');
      const d = await r.json();
      if (d.success) { setCredentials(d.credentials); setPages(d.pages); }
      else setError(d.message || 'Failed to load credentials.');
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Permission toggle helpers ── */
  const togglePerm = (key: string, type: 'view' | 'edit') => {
    setNewPerms(prev => {
      const existing = prev.find(p => p.key === key);
      if (!existing) {
        // add with this permission
        return [...prev, { key, view: type === 'view', edit: type === 'edit' }];
      }
      const updated = { ...existing, [type]: !existing[type] };
      // If both false, remove entry
      if (!updated.view && !updated.edit) return prev.filter(p => p.key !== key);
      return prev.map(p => p.key === key ? updated : p);
    });
  };

  const getPerm = (key: string): PagePermission =>
    newPerms.find(p => p.key === key) ?? { key, view: false, edit: false };

  const toggleGroup = (keys: string[], type: 'view' | 'edit', value: boolean) => {
    setNewPerms(prev => {
      const next = [...prev];
      keys.forEach(key => {
        const idx = next.findIndex(p => p.key === key);
        if (value) {
          if (idx >= 0) next[idx] = { ...next[idx], [type]: true };
          else next.push({ key, view: type === 'view', edit: type === 'edit' });
        } else {
          if (idx >= 0) {
            const u = { ...next[idx], [type]: false };
            if (!u.view && !u.edit) next.splice(idx, 1);
            else next[idx] = u;
          }
        }
      });
      return next;
    });
  };

  /* ── Step 1 → 2 validation ── */
  const goToPermissions = () => {
    setFormError('');
    if (!newLabel.trim()) { setFormError('Credential name is required.'); return; }
    if (!newEmail.trim() || !newEmail.includes('@')) { setFormError('Valid email is required.'); return; }
    if (newPassword.length < 6) { setFormError('Password must be at least 6 characters.'); return; }
    // Init permissions array with all pages as view=false, edit=false
    if (newPerms.length === 0) {
      setNewPerms(pages.map(p => ({ key: p.key, view: false, edit: false })));
    }
    setFormStep(2);
  };

  /* ── Submit ── */
  const handleCreate = async () => {
    setFormError(''); setFormSaving(true);
    try {
      const res = await fetch('/api/admin/credentials', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          label: newLabel.trim(), email: newEmail.trim(),
          password: newPassword, permissions: newPerms,
          masterPassword: masterPwd,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormSuccess('Credential created successfully!');
        setNewLabel(''); setNewEmail(''); setNewPassword('');
        setNewPerms([]); setMasterPwd(''); setFormStep(1); setShowForm(false);
        setTimeout(() => setFormSuccess(''), 4000);
        load();
      } else {
        setFormError(data.message || 'Failed.');
      }
    } catch { setFormError('Network error.'); }
    finally { setFormSaving(false); }
  };

  /* ── Delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(''); setDeleting(true);
    try {
      const res = await fetch('/api/admin/credentials', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: deleteTarget._id, masterPassword: deletePwd }),
      });
      const data = await res.json();
      if (data.success) { setDeleteTarget(null); setDeletePwd(''); load(); }
      else setDeleteError(data.message || 'Failed.');
    } catch { setDeleteError('Network error.'); }
    finally { setDeleting(false); }
  };

  const resetForm = () => {
    setNewLabel(''); setNewEmail(''); setNewPassword('');
    setNewPerms([]); setMasterPwd(''); setFormError('');
    setFormStep(1); setShowForm(false);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.avatarWrap}>
          <div className={styles.avatar}>SA</div>
          <div>
            <h1 className={styles.name}>Skillinf Admin</h1>
            <p className={styles.email}>skillinfofficial@gmail.com</p>
            <span className={styles.masterBadge}><BadgeCheck size={13} /> Master Admin</span>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          id="tab-profile"
          className={`${styles.tabBtn} ${tab === 'profile' ? styles.tabActive : ''}`}
          onClick={() => setTab('profile')}
        >
          <User size={15} /> Profile
        </button>
        <button
          id="tab-credentials"
          className={`${styles.tabBtn} ${tab === 'credentials' ? styles.tabActive : ''}`}
          onClick={() => setTab('credentials')}
        >
          <Shield size={15} /> Credentials
          {credentials.length > 0 && (
            <span className={styles.tabBadge}>{credentials.length}</span>
          )}
        </button>
      </div>

      {/* ══ PROFILE TAB ══ */}
      {tab === 'profile' && (
        <div className={styles.profileCard}>
          <div className={styles.profileRow}><span className={styles.profileLabel}>Role</span><span className={styles.profileValue}>Master Administrator</span></div>
          <div className={styles.profileRow}><span className={styles.profileLabel}>Email</span><span className={styles.profileValue}>skillinfofficial@gmail.com</span></div>
          <div className={styles.profileRow}><span className={styles.profileLabel}>Access</span><span className={styles.profileValue}>Full — all pages, view &amp; edit</span></div>
          <div className={styles.profileRow}><span className={styles.profileLabel}>Session</span><span className={styles.profileValue}>8 hours</span></div>
        </div>
      )}

      {/* ══ CREDENTIALS TAB ══ */}
      {tab === 'credentials' && (
        <>
          <div className={styles.credHeader}>
            <div>
              <p className={styles.credDesc}>
                Create login credentials for team members with specific page-level access.
              </p>
            </div>
            <button
              id="add-credential-btn"
              className={styles.addBtn}
              onClick={() => { setShowForm(true); setFormStep(1); }}
            >
              <Plus size={15} /> Add Credential
            </button>
          </div>

          {formSuccess && (
            <div className={styles.successBox}><CheckCircle size={16} />{formSuccess}</div>
          )}

          {/* ── Create Form ── */}
          {showForm && (
            <div className={styles.formCard}>
              <div className={styles.formCardHeader}>
                <h2 className={styles.formTitle}>
                  {formStep === 1 ? '① Credential Details' : '② Page Permissions'}
                </h2>
                <button className={styles.formClose} onClick={resetForm}><X size={16} /></button>
              </div>

              {formError && (
                <div className={styles.formError}><AlertCircle size={14} />{formError}</div>
              )}

              {/* Step 1 — Details */}
              {formStep === 1 && (
                <div className={styles.formFields}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Credential Name / Role <span className={styles.req}>*</span></label>
                    <input
                      id="cred-label"
                      className={styles.fieldInput}
                      placeholder="e.g. Verifier, Data Reviewer, Support Staff"
                      value={newLabel}
                      onChange={e => setNewLabel(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Email Address <span className={styles.req}>*</span></label>
                    <input
                      id="cred-email"
                      type="email"
                      className={styles.fieldInput}
                      placeholder="person@example.com"
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Password <span className={styles.req}>*</span></label>
                    <input
                      id="cred-password"
                      type="password"
                      className={styles.fieldInput}
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                    />
                  </div>
                  <button className={styles.nextBtn} onClick={goToPermissions}>
                    Next: Set Permissions →
                  </button>
                </div>
              )}

              {/* Step 2 — Permissions */}
              {formStep === 2 && (
                <div className={styles.permSection}>
                  <p className={styles.permHint}>
                    Select which pages this credential can access and what they can do.
                  </p>

                  {PAGE_GROUPS.map(group => {
                    const groupPages = pages.filter(p => group.keys.includes(p.key));
                    const allView = groupPages.every(p => getPerm(p.key).view);
                    const allEdit = groupPages.every(p => getPerm(p.key).edit);
                    return (
                      <div key={group.title} className={styles.permGroup}>
                        <div className={styles.permGroupHeader}>
                          <span className={styles.permGroupTitle}>{group.title}</span>
                          <div className={styles.permGroupActions}>
                            <label className={styles.groupToggle}>
                              <input
                                type="checkbox"
                                checked={allView}
                                onChange={e => toggleGroup(group.keys, 'view', e.target.checked)}
                              />
                              <Eye size={12} /> All View
                            </label>
                            <label className={styles.groupToggle}>
                              <input
                                type="checkbox"
                                checked={allEdit}
                                onChange={e => toggleGroup(group.keys, 'edit', e.target.checked)}
                              />
                              <Edit3 size={12} /> All Edit
                            </label>
                          </div>
                        </div>
                        <div className={styles.permRows}>
                          {groupPages.map(page => {
                            const perm = getPerm(page.key);
                            return (
                              <div key={page.key} className={`${styles.permRow} ${(perm.view || perm.edit) ? styles.permRowActive : ''}`}>
                                <span className={styles.permPageLabel}>{page.label}</span>
                                <div className={styles.permChecks}>
                                  <label className={`${styles.permCheck} ${perm.view ? styles.permCheckOn : ''}`}>
                                    <input
                                      type="checkbox"
                                      checked={perm.view}
                                      onChange={() => togglePerm(page.key, 'view')}
                                    />
                                    <Eye size={12} /> View
                                  </label>
                                  <label className={`${styles.permCheck} ${perm.edit ? styles.permCheckOnEdit : ''}`}>
                                    <input
                                      type="checkbox"
                                      checked={perm.edit}
                                      onChange={() => togglePerm(page.key, 'edit')}
                                    />
                                    <Edit3 size={12} /> Edit
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Master password verify */}
                  <div className={styles.masterVerify}>
                    <div className={styles.masterVerifyIcon}><Lock size={18} /></div>
                    <div className={styles.masterVerifyContent}>
                      <p className={styles.masterVerifyTitle}>Confirm with Master Password</p>
                      <p className={styles.masterVerifyHint}>Your admin password is required to create credentials.</p>
                      <input
                        id="master-pwd-confirm"
                        type="password"
                        className={styles.fieldInput}
                        placeholder="Enter master admin password"
                        value={masterPwd}
                        onChange={e => setMasterPwd(e.target.value)}
                        style={{ marginTop: 10 }}
                      />
                    </div>
                  </div>

                  <div className={styles.formActions}>
                    <button className={styles.backBtn} onClick={() => { setFormStep(1); setFormError(''); }}>
                      ← Back
                    </button>
                    <button
                      id="create-credential-btn"
                      className={styles.createBtn}
                      onClick={handleCreate}
                      disabled={formSaving || !masterPwd}
                    >
                      {formSaving
                        ? <><Loader2 size={14} className={styles.spin} /> Creating…</>
                        : <><Key size={14} /> Create Credential</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Credentials List ── */}
          {loading && (
            <div className={styles.stateBox}><Loader2 size={24} className={styles.spin} /><span>Loading…</span></div>
          )}
          {error && !loading && (
            <div className={styles.errorBox}><AlertCircle size={16} />{error}</div>
          )}
          {!loading && !error && credentials.length === 0 && (
            <div className={styles.emptyBox}>
              <Shield size={40} className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No credentials yet</p>
              <p className={styles.emptyHint}>Click &ldquo;Add Credential&rdquo; to share admin access with a team member.</p>
            </div>
          )}

          {!loading && credentials.map(cred => {
            const isExpanded = expanded === cred._id;
            const grantedPages = cred.permissions.filter(p => p.view || p.edit);
            return (
              <div key={cred._id} className={styles.credCard}>
                <div className={styles.credCardHead} onClick={() => setExpanded(isExpanded ? null : cred._id)}>
                  <div className={styles.credAvatarWrap}>
                    <div className={styles.credAvatar}>
                      {cred.label.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className={styles.credLabel}>{cred.label}</p>
                      <p className={styles.credEmail}>{cred.email}</p>
                    </div>
                  </div>
                  <div className={styles.credCardRight}>
                    <span className={styles.credPageCount}>{grantedPages.length} pages</span>
                    <span className={styles.credDate}>{fmtDate(cred.createdAt)}</span>
                    <button
                      className={styles.deleteBtn}
                      onClick={e => { e.stopPropagation(); setDeleteTarget(cred); setDeletePwd(''); setDeleteError(''); }}
                    >
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} className={styles.chevron} /> : <ChevronDown size={16} className={styles.chevron} />}
                  </div>
                </div>

                {/* Expanded: permissions breakdown */}
                {isExpanded && (
                  <div className={styles.credPermGrid}>
                    {grantedPages.length === 0 ? (
                      <p className={styles.noPerms}>No page access granted.</p>
                    ) : (
                      grantedPages.map(p => {
                        const pageDef = pages.find(pg => pg.key === p.key);
                        return (
                          <div key={p.key} className={styles.credPermItem}>
                            <span className={styles.credPermLabel}>{pageDef?.label ?? p.key}</span>
                            <div className={styles.credPermBadges}>
                              {p.view && <span className={styles.viewBadge}><Eye size={10} /> View</span>}
                              {p.edit && <span className={styles.editBadge}><Edit3 size={10} /> Edit</span>}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── Delete Modal ── */}
      {deleteTarget && (
        <div className={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}><Trash2 size={22} /></div>
            <h3 className={styles.modalTitle}>Delete Credential</h3>
            <p className={styles.modalDesc}>
              This will permanently remove access for <strong>{deleteTarget.label}</strong> ({deleteTarget.email}).
            </p>
            <div className={styles.fieldGroup} style={{ marginTop: 16 }}>
              <label className={styles.fieldLabel}>Enter Master Password to confirm</label>
              <input
                type="password"
                className={styles.fieldInput}
                placeholder="Master admin password"
                value={deletePwd}
                onChange={e => setDeletePwd(e.target.value)}
              />
            </div>
            {deleteError && <p className={styles.modalError}><AlertCircle size={13} />{deleteError}</p>}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button
                id="confirm-delete-credential-btn"
                className={styles.confirmDeleteBtn}
                onClick={handleDelete}
                disabled={deleting || !deletePwd}
              >
                {deleting ? <><Loader2 size={13} className={styles.spin} /> Deleting…</> : <><Trash2 size={13} /> Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
