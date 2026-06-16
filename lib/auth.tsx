"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./supabase/client";
import type { User } from "@supabase/supabase-js";

export type UserRole = "employee" | "admin";

export interface AuthUser {
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  signup: (email: string, password: string, role: UserRole) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  login: async () => ({}),
  signup: async () => ({}),
  logout: async () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url === "your-supabase-url-here") {
      setIsLoading(false);
      return;
    }

    const supabase = createClient();

    async function buildAuthUser(u: User): Promise<AuthUser> {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, role, full_name")
        .eq("id", u.id)
        .single();
      return {
        name: profile?.full_name || (u.user_metadata?.name as string) || u.email?.split("@")[0] || "User",
        email: u.email!,
        role: ((profile?.role ?? u.user_metadata?.role) as UserRole) ?? "employee",
        companyId: profile?.company_id ?? null,
      };
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(await buildAuthUser(session.user));
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(await buildAuthUser(session.user));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url === "your-supabase-url-here") {
      return { error: "Supabase is not configured yet. Add your credentials to .env.local." };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  };

  const signup = async (
    email: string,
    password: string,
    role: UserRole
  ): Promise<{ error?: string }> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url || url === "your-supabase-url-here") {
      return { error: "Supabase is not configured yet. Add your credentials to .env.local." };
    }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role,
          name: email.split("@")[0],
        },
      },
    });
    if (error) return { error: error.message };
    return {};
  };

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useRequireAuth(requiredRole?: UserRole) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    } else if (!isLoading && user && requiredRole && user.role !== requiredRole) {
      router.replace(user.role === "admin" ? "/admin" : "/employee");
    }
  }, [user, isLoading, router, requiredRole]);

  return { user, isLoading };
}
