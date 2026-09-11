import React from "react";
import Sidebar from "@/components/Sidebar";
import styles from "./adminLayout.module.css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.adminContainer}>
      <Sidebar />
      <main className={styles.adminContent}>{children}</main>
    </div>
  );
}
