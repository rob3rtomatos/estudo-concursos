import { useState, useEffect } from 'react';

export function useIsMobile() {
  const getState = () => ({
    mobile:  window.innerWidth < 768,
    tablet:  window.innerWidth >= 768 && window.innerWidth < 1024,
    desktop: window.innerWidth >= 1024,
    width:   window.innerWidth
  });

  const [state, setState] = useState(getState);

  useEffect(() => {
    function handle() { setState(getState()); }
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  return state;
}
