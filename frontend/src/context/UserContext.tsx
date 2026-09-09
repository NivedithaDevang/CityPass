import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types/auth";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUserState] = useState<User | null>(null);
  const [profileImage, setProfileImageState] = useState<string | null>(null);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    setProfileImageState(
      newUser?.id
        ? localStorage.getItem(`citypass-profile-image-${newUser.id}`)
        : null
    );
  }, []);

  const setProfileImage = useCallback((image: string | null) => {
    if (!user?.id) {
      return;
    }

    const storageKey = `citypass-profile-image-${user.id}`;
    if (image) {
      localStorage.setItem(storageKey, image);
    } else {
      localStorage.removeItem(storageKey);
    }
    setProfileImageState(image);
  }, [user?.id]);

  return (
    <UserContext.Provider value={{ user, setUser, profileImage, setProfileImage }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUser must be rendered inside UserProvider");
  }

  return context;
}