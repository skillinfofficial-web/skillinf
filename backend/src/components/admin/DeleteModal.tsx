import React from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './DeleteModal.module.css';

interface DeleteModalProps {
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

export default function DeleteModal({ name, onConfirm, onCancel, loading }: DeleteModalProps) {
  return (
    <div className={styles.overlay} onClick={!loading ? onCancel : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.icon}>
          <AlertTriangle size={28} />
        </div>
        <h2 className={styles.title}>Delete Content</h2>
        <p className={styles.body}>
          Are you sure you want to delete <strong>&ldquo;{name}&rdquo;</strong>?
          <br />
          <span className={styles.warning}>This action cannot be undone.</span>
        </p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
