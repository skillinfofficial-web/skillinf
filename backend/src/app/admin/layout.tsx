import React from "react";
import Sidebar from "@/components/Sidebar";
import { NotificationProvider } from "@/components/NotificationProvider";
import ToastContainer from "@/components/ToastContainer";
import styles from "./adminLayout.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      <div className={styles.adminContainer}>
        <Sidebar />
        <main className={styles.adminContent}>{children}</main>
      </div>
      <ToastContainer />
    </NotificationProvider>
  );
}
