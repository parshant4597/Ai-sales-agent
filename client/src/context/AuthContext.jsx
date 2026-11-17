import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchMe, login as apiLogin, logout as apiLogout, setUnauthorizedHandler } from '../api/client';
import { AuthContext } from '../hooks/useAuth';

const RETRY_AFTER_MS = 3000;

// Knows who is signed in. On start it asks the server ("am I still signed in?"), because the login
// itself lives in an HttpOnly cookie that page scripts cannot see.
export function AuthProvider({ children }) {
  const [state, setState] = useState({ user: null, checking: true, connectionError: '' });

  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    // Any later "401" (session ended, removed from the team) sends the person back to the login page.
    setUnauthorizedHandler(() => setState({ user: null, checking: false, connectionError: '' }));

    const check = () =>
      fetchMe()
        .then(({ user }) => !cancelled && setState({ user, checking: false, connectionError: '' }))
        .catch((error) => {
          if (cancelled) return;
          if (error.status === 401) {
            setState({ user: null, checking: false, connectionError: '' }); // really not signed in
            return;
          }
          // Server restarting or database reconnecting: that is not a logout. Stay on the loading
          // screen and ask again, so a signed-in person is never bounced to the login page.
          setState({ user: null, checking: true, connectionError: error.message });
          retryTimer = setTimeout(check, RETRY_AFTER_MS);
        });

    check();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      setUnauthorizedHandler(() => {});
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await apiLogin(email, password);
    setState({ user, checking: false, connectionError: '' });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setState({ user: null, checking: false, connectionError: '' });
    }
  }, []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
