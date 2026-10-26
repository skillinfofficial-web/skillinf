import { Metadata } from 'next';
import { getDatabase } from '@/lib/mongodb';
import MaintenanceClient from './MaintenanceClient';

export const metadata: Metadata = {
  title: 'Under Maintenance | Skillinf',
  description: 'Skillinf is currently under maintenance. We will be back soon!',
  robots: { index: false, follow: false },
};

const DEFAULTS = {
  maintenanceMessage:
    "We are currently performing scheduled maintenance. We'll be back shortly!\n\nFor urgent queries, contact us at support@skillinf.in",
};

async function getSettings() {
  try {
    const db  = await getDatabase();
    const doc = await db
      .collection('site_settings')
      .findOne({ _id: 'global' as unknown as import('mongodb').ObjectId });
    return { ...DEFAULTS, ...(doc ?? {}) };
  } catch {
    return DEFAULTS;
  }
}

export default async function MaintenancePage() {
  const settings = await getSettings();
  return <MaintenanceClient message={settings.maintenanceMessage} />;
}
