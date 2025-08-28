// src/contexts/AuthContext.jsx
import { createContext, useEffect, useState, useContext } from "react";
import { auth } from "../firebase";
import { onIdTokenChanged } from "firebase/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);        // <- storefront-visible user
  const [claims, setClaims] = useState(null);    // optional: downstream use
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // onIdTokenChanged also fires when custom claims refresh
    const unsub = onIdTokenChanged(auth, async (u) => {
      try {
        if (!u) {
          setUser(null);
          setClaims(null);
          setIsLoading(false);
          return;
        }
        const token = await u.getIdTokenResult();
        setClaims(token.claims || {});
        // Hide admin sessions from the storefront:
        if (token.claims?.isAdmin) {
          setUser(null);
        } else {
          setUser(u);
        }
      } catch (e) {
        // If anything goes wrong, fail closed (treat as signed out)
        setUser(null);
        setClaims(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, claims, isAdmin: !!claims?.isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
