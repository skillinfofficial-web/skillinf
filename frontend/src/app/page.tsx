import Navbar from '@/components/shared/Navbar';
import Footer from '@/components/shared/Footer';
import NewHomePage from '@/components/home/NewHomePage';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <NewHomePage />
      </main>
      <Footer />
    </>
  );
}
