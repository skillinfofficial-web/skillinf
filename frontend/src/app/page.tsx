import Navbar from '@/components/shared/Navbar';
import AnnouncementBar from '@/components/home/AnnouncementBar';
import Footer from '@/components/shared/Footer';
import LiveRegistrationPopup from '@/components/home/LiveRegistrationPopup';

export default function Home() {
  return (
    <>
      <Navbar />
      <AnnouncementBar />
      <main />
      <Footer />
      <LiveRegistrationPopup />
    </>
  );
}
