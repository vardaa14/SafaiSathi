import { useState, useEffect } from 'react';
import { AdminDashboard } from './pages/AdminDashboard';
import { CitizenPortal } from './pages/CitizenPortal';
import { DriverPortal } from './pages/DriverPortal';
import { IntroPage } from './pages/IntroPage';

export function App() {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname.includes('/driver') || hash.includes('/driver')) {
        return '/driver';
      }
      if (pathname.includes('/user') || hash.includes('/user')) {
        return '/user';
      }
      if (pathname.includes('/admin') || hash.includes('/admin')) {
        return '/admin';
      }
      if (pathname.includes('/intro') || hash.includes('/intro')) {
        return '/intro';
      }
    }
    // Default entry: Intro simulation page with skip button
    return '/intro';
  });

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      if (pathname.includes('/driver') || hash.includes('/driver')) {
        setCurrentPath('/driver');
      } else if (pathname.includes('/user') || hash.includes('/user')) {
        setCurrentPath('/user');
      } else if (pathname.includes('/admin') || hash.includes('/admin')) {
        setCurrentPath('/admin');
      } else if (pathname.includes('/intro') || hash.includes('/intro')) {
        setCurrentPath('/intro');
      } else {
        setCurrentPath('/intro');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
    }
  };

  if (currentPath === '/driver') {
    return (
      <DriverPortal
        onNavigateToAdmin={() => navigateTo('/admin')}
        onNavigateToCitizen={() => navigateTo('/user')}
        onNavigateToIntro={() => navigateTo('/intro')}
      />
    );
  }

  if (currentPath === '/user') {
    return (
      <CitizenPortal
        onNavigateToAdmin={() => navigateTo('/admin')}
        onNavigateToDriver={() => navigateTo('/driver')}
        onNavigateToIntro={() => navigateTo('/intro')}
      />
    );
  }

  if (currentPath === '/admin') {
    return (
      <AdminDashboard
        onNavigateToUser={() => navigateTo('/user')}
        onNavigateToDriver={() => navigateTo('/driver')}
        onNavigateToIntro={() => navigateTo('/intro')}
      />
    );
  }

  // Default: Interactive Intro Page with Skip Button
  return (
    <IntroPage
      onEnterAdmin={() => navigateTo('/admin')}
      onEnterCitizen={() => navigateTo('/user')}
      onEnterDriver={() => navigateTo('/driver')}
      onSkip={() => navigateTo('/admin')}
    />
  );
}

export default App;
