import Navbar from '@/components/shared/Navbar';
import AnnouncementBar from '@/components/home/AnnouncementBar';
import Footer from '@/components/shared/Footer';
import NewHomePage from '@/components/home/NewHomePage';

export default function Home() {
  return (
    <>
      <Navbar />
      <AnnouncementBar />
      <main>
        <NewHomePage />
      </main>
      <Footer />
    </>
  );
}
