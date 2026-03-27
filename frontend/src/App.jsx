import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import LoadingSkeleton from './components/common/LoadingSkeleton';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PhaseDetection from './components/PhaseDetection';
import ViolationsFeed from './components/ViolationsFeed';
import ZoneStats from './components/ZoneStats';
import ToolsSlider from './components/ToolsSlider';
import CityFeed from './components/CityFeed';
import Footer from './components/Footer';
import Toast from './components/Toast';

import AdminDashboard from './pages/AdminDashboard';

import SignInModal from './components/modals/SignInModal';
import SignUpModal from './components/modals/SignUpModal';
import CameraModal from './components/modals/CameraModal';
import UploadModal from './components/modals/UploadModal';

gsap.registerPlugin(ScrollTrigger);

function AppInner() {
  const { currentUser, loading } = useAuth();
  const [modal, setModal] = useState(null); // 'signin' | 'signup' | 'camera' | 'upload'
  const [returnTo, setReturnTo] = useState(null);

  const openModal = (name, back = null) => {
    setModal(name);
    if (back) setReturnTo(back);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = (wasSuccess = false) => {
    const success = wasSuccess === true;
    if (success && returnTo) {
      setModal(returnTo);
      setReturnTo(null);
    } else {
      setModal(null);
      setReturnTo(null);
      document.body.style.overflow = '';
    }
  };

  // GSAP scroll + nav effects — only on landing page
  // ⚠️ MUST be called BEFORE any early returns (React hooks rule)
  useEffect(() => {
    if (currentUser) return; // skip when dashboard is shown

    // Delay to ensure DOM is fully rendered
    const setupAnimations = () => {
      const reveals = document.querySelectorAll('.reveal');
      console.log(`Found ${reveals.length} reveal elements`);
      
      reveals.forEach((el) => {
        // Check if element is already visible in viewport
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('up');
        } else {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 88%',
            onEnter: () => el.classList.add('up'),
          });
        }
      });
    };

    // Give DOM time to render all reveal elements
    const timeout = setTimeout(setupAnimations, 100);

    // Set up board 3D effect
    const board = document.querySelector('.case-board');
    let boardCleanup;
    if (board) {
      const onMove = (e) => {
        const r = board.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(board, { rotateY: x * 6, rotateX: -y * 4, transformPerspective: 1200, ease: 'power2.out', duration: 0.4 });
      };
      const onLeave = () => gsap.to(board, { rotateY: 0, rotateX: 0, duration: 0.7, ease: 'elastic.out(1,.6)' });
      board.addEventListener('mousemove', onMove);
      board.addEventListener('mouseleave', onLeave);
      boardCleanup = () => { board.removeEventListener('mousemove', onMove); board.removeEventListener('mouseleave', onLeave); };
    }

    const nav = document.querySelector('nav');
    const handleScroll = () => {
      if (!nav) return;
      if (window.scrollY > 60) { nav.style.height = '54px'; nav.style.background = '#0A2E6E'; }
      else { nav.style.height = '64px'; nav.style.background = '#0B3D91'; }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(timeout);
      if (boardCleanup) boardCleanup();
      ScrollTrigger.getAll().forEach((st) => st.kill());
      window.removeEventListener('scroll', handleScroll);
    };
  }, [currentUser]);

  // Show loading skeleton while auth is initializing
  if (loading) {
    return <LoadingSkeleton type="full-page" />;
  }

  // ── PROTECTED: Admin dashboard (authenticated users only) ──
  if (currentUser) {
    return (
      <>
        <AdminDashboard onOpenModal={openModal} />
        <Toast />

        <CameraModal
          open={modal === 'camera'}
          onClose={closeModal}
          onOpenUpload={() => openModal('upload')}
          onSignIn={(back) => openModal('signin', back)}
        />
        <UploadModal
          open={modal === 'upload'}
          onClose={closeModal}
          onBack={() => openModal('camera')}
        />
      </>
    );
  }

  // ── PUBLIC: Landing page (unauthenticated users only) ──
  try {
    return (
      <>
        <Navbar onOpenModal={openModal} />
        <Hero onOpenSignIn={() => openModal('signin')} />
        <PhaseDetection />
        <ViolationsFeed />
        <ZoneStats />
        <ToolsSlider />
        <CityFeed />
        <Footer />
        <Toast />

      <SignInModal
        open={modal === 'signin'}
        onClose={closeModal}
        onSwitchToSignUp={() => openModal('signup')}
      />
      <SignUpModal
        open={modal === 'signup'}
        onClose={closeModal}
        onSwitchToSignIn={() => openModal('signin')}
      />
      <CameraModal
        open={modal === 'camera'}
        onClose={closeModal}
        onOpenUpload={() => openModal('upload')}
        onSignIn={(back) => openModal('signin', back)}
      />
      <UploadModal
        open={modal === 'upload'}
        onClose={closeModal}
        onBack={() => openModal('camera')}
      />
      </>
    );
  } catch (err) {
    console.error('Landing page render error:', err);
    return (
      <>
        <Navbar onOpenModal={openModal} />
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#fff',
          background: 'rgba(198, 40, 40, 0.1)',
          margin: '20px'
        }}>
          <h2>⚠️ Page Load Error</h2>
          <p>{err?.message || 'Failed to load landing page'}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      </>
    );
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </ErrorBoundary>
  );
}
