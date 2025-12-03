import { createContext } from "react";
import { AdminUser } from "../lib/types";

export const AuthContext = createContext({
  isAuthenticated: false,
  setIsAuthenticated: (value: boolean) => {},
  logout: () => {},
  currentUser: null as AdminUser | null,
  setCurrentUser: (user: AdminUser | null) => {}
});

// 对联历史记录上下文
export interface CoupletHistoryItem {
  id: string;
  timestamp: string;
  couplet: {
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  };
}

interface CoupletHistoryContextType {
  history: CoupletHistoryItem[];
  addToHistory: (couplet: {
    top: string;
    bottom: string;
    center: string;
    explanation: string;
  }) => void;
  clearHistory: () => void;
}

export const CoupletHistoryContext = createContext<CoupletHistoryContextType>({
  history: [],
  addToHistory: () => {},
  clearHistory: () => {},
});