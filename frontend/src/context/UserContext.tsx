import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

import axios from "axios";
import type { User } from "../types/auth";
import { API_BASE_URL } from "../config/config";

interface UserContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(
  undefined
);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [profileImage, setProfileImageState] =
    useState<string | null>(null);

  /*
   * Convert relative profile image path
   * into a complete image URL.
   */
  const getImageUrl = useCallback(
    (image: string | null | undefined) => {
      if (!image) {
        return null;
      }

      if (
        image.startsWith("http://") ||
        image.startsWith("https://")
      ) {
        return image;
      }

      return `${API_BASE_URL.replace(/\/$/, "")}/${image.replace(
        /^\/+/,
        ""
      )}`;
    },
    []
  );

  const setUser = useCallback(
    (newUser: User | null) => {
      setUserState(newUser);

      setProfileImageState(
        getImageUrl(newUser?.profile_image)
      );
    },
    [getImageUrl]
  );

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/v1/auth/profile`,
          {
            withCredentials: true,
          }
        );

        setUser(response.data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [setUser]);


  const clearUser = useCallback(() => {
    setUserState(null);
    setProfileImageState(null);
  }, []);

  
  const setProfileImage = useCallback(
    (image: string | null) => {
      const fullImageUrl = getImageUrl(image);

      setProfileImageState(fullImageUrl);

      setUserState((currentUser) => {
        if (!currentUser) {
          return currentUser;
        }

        return {
          ...currentUser,
          profile_image: image,
        };
      });
    },
    [getImageUrl]
  );

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        setUser,
        clearUser,
        profileImage,
        setProfileImage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error(
      "useUser must be rendered inside UserProvider"
    );
  }

  return context;
}