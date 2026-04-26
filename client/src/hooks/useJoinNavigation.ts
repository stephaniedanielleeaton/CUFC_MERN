import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const INTRO_SECTION_ID = 'intro-classes';

export function useJoinNavigation() {
  const { isAuthenticated } = useAuth0();
  const navigate = useNavigate();
  const location = useLocation();

  const handleJoinClick = useCallback(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }

    if (location.pathname === '/') {
      const element = document.getElementById(INTRO_SECTION_ID);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/');
    }
  }, [isAuthenticated, location.pathname, navigate]);

  return { handleJoinClick, isAuthenticated };
}
