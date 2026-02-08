import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Persona, User, Notification } from '@/types';
import { notifications as initialNotifications } from '@/data';

interface AppState {
  user: User;
  persona: Persona;
  sidebarCollapsed: boolean;
  yantraAssistOpen: boolean;
  notifications: Notification[];
  searchQuery: string;
}

type AppAction =
  | { type: 'SET_PERSONA'; payload: Persona }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'TOGGLE_YANTRA_ASSIST' }
  | { type: 'SET_YANTRA_ASSIST'; payload: boolean }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string };

const defaultUser: User = {
  id: 'user-001',
  name: 'Sarah Mitchell',
  email: 'sarah.mitchell@rcha.org.uk',
  role: 'Housing Officer',
  persona: 'housing-officer',
  team: 'Southwark & Lewisham Team',
  patch: 'Oak Park & Elm Gardens',
};

// Load persisted persona from localStorage
function getPersistedPersona(): Persona {
  try {
    const stored = localStorage.getItem('socialhomes-persona');
    if (stored && ['coo', 'head-of-service', 'manager', 'housing-officer', 'operative'].includes(stored)) {
      return stored as Persona;
    }
  } catch {
    // localStorage unavailable
  }
  return 'housing-officer';
}

function getPersistedUser(persona: Persona): User {
  const personaNames: Record<Persona, { name: string; role: string }> = {
    'coo': { name: 'Helen Bradshaw', role: 'Chief Operating Officer' },
    'head-of-service': { name: 'Marcus Thompson', role: 'Head of Housing' },
    'manager': { name: 'Priya Sharma', role: 'Team Manager' },
    'housing-officer': { name: 'Sarah Mitchell', role: 'Housing Officer' },
    'operative': { name: 'Mark Stevens', role: 'Repairs Operative' },
  };
  const p = personaNames[persona];
  return { ...defaultUser, persona, name: p.name, role: p.role };
}

const persistedPersona = getPersistedPersona();

const initialState: AppState = {
  user: getPersistedUser(persistedPersona),
  persona: persistedPersona,
  sidebarCollapsed: false,
  yantraAssistOpen: false,
  notifications: initialNotifications,
  searchQuery: '',
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PERSONA': {
      const personaNames: Record<Persona, { name: string; role: string }> = {
        'coo': { name: 'Helen Bradshaw', role: 'Chief Operating Officer' },
        'head-of-service': { name: 'Marcus Thompson', role: 'Head of Housing' },
        'manager': { name: 'Priya Sharma', role: 'Team Manager' },
        'housing-officer': { name: 'Sarah Mitchell', role: 'Housing Officer' },
        'operative': { name: 'Mark Stevens', role: 'Repairs Operative' },
      };
      const p = personaNames[action.payload];
      // Persist persona selection to localStorage
      try { localStorage.setItem('socialhomes-persona', action.payload); } catch { /* noop */ }
      return {
        ...state,
        persona: action.payload,
        user: { ...state.user, persona: action.payload, name: p.name, role: p.role },
      };
    }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };
    case 'TOGGLE_YANTRA_ASSIST':
      return { ...state, yantraAssistOpen: !state.yantraAssistOpen };
    case 'SET_YANTRA_ASSIST':
      return { ...state, yantraAssistOpen: action.payload };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
