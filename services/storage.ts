import { User, TrackingInfo } from '../types';

const KEYS = {
  USERS: 'chinatrack_users',
  CURRENT_USER: 'chinatrack_current_user',
  TRACKINGS: 'chinatrack_items',
  SETTINGS: 'chinatrack_settings',
};

// Initial Admin setup if empty
const setupInitialData = () => {
  const users = localStorage.getItem(KEYS.USERS);
  if (!users) {
    const adminUser: User = { id: '1', email: 'admin@test.com', role: 'admin' };
    localStorage.setItem(KEYS.USERS, JSON.stringify([adminUser]));
    // Password handling is omitted for this frontend demo simplicity
  }
};

setupInitialData();

export const StorageService = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  saveUser: (user: User) => {
    const users = StorageService.getUsers();
    users.push(user);
    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(KEYS.CURRENT_USER);
    return stored ? JSON.parse(stored) : null;
  },

  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.CURRENT_USER);
    }
  },

  getTrackings: (): TrackingInfo[] => {
    return JSON.parse(localStorage.getItem(KEYS.TRACKINGS) || '[]');
  },

  saveTrackings: (trackings: TrackingInfo[]) => {
    localStorage.setItem(KEYS.TRACKINGS, JSON.stringify(trackings));
  },

  getRegistrationEnabled: (): boolean => {
    const settings = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
    return settings.registrationEnabled !== false; // Default true
  },

  setRegistrationEnabled: (enabled: boolean) => {
    const settings = JSON.parse(localStorage.getItem(KEYS.SETTINGS) || '{}');
    settings.registrationEnabled = enabled;
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  }
};