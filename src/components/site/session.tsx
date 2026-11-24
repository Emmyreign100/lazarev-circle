import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ensureProfile, type Profile } from "@/lib/circle/api";

type SessionValue = {
  authPending: boolean;
  profile: Profile | null;
  profileReady: boolean;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const id = user?.id ?? null;

  useEffect(() => {
    if (isPending) return;
    if (!id) {
      setProfile(null);
      setProfileReady(true);
      return;
    }
    let live = true;
    setProfileReady(false);
    ensureProfile()
      .then((next) => {
        if (live) setProfile(next);
      })
      .catch(() => {
        if (live) setProfile(null);
      })
      .finally(() => {
        if (live) setProfileReady(true);
      });
    return () => {
      live = false;
    };
  }, [id, isPending]);

  return (
    <SessionContext.Provider value={{ authPending: isPending, profile, profileReady }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) throw new Error("Session is missing.");
  return value;
}
