import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function ServicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: "var(--nav-height)" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
