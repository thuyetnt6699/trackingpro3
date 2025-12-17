import { User, TrackingInfo } from '../types';

const KEYS = {
  USERS: 'chinatrack_users',
  CURRENT_USER: 'chinatrack_current_user',
  TRACKINGS: 'chinatrack_items',
  SETTINGS: 'chinatrack_settings',
};

// Simple "Encryption" helper (Base64 + Salt)
// In a real production app, you would use a proper hashing library like bcrypt/argon2 on a server.
// Since this is a frontend-only demo, we obfuscate the password so it's not plain text.
const hashPassword = (password: string): string => {
  const salt = 'china_track_secure_salt_v1_';
  return btoa(salt + password); 
};

// Initial Admin setup if empty
const setupInitialData = () => {
  const usersStr = localStorage.getItem(KEYS.USERS);
  if (!usersStr) {
    const adminUser: User = { 
      id: '1', 
      email: 'admin@test.com', 
      role: 'admin',
      passwordHash: hashPassword('admin123') // Default password: admin123
    };
    localStorage.setItem(KEYS.USERS, JSON.stringify([adminUser]));
  }
};

setupInitialData();

export const StorageService = {
  getUsers: (): User[] => {
    return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
  },

  // Modified: Internal use only mostly, consider using registerUser instead
  saveUserToStorage: (users: User[]) => {
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
  },

  // --- Auth Logic ---

  /**
   * Verifies email and password.
   * Returns the User object if successful, null otherwise.
   */
  verifyCredentials: (email: string, password: string): User | null => {
    const users = StorageService.getUsers();
    const inputHash = hashPassword(password);
    
    const user = users.find(u => u.email === email);
    
    if (user && user.passwordHash === inputHash) {
      return user;
    }
    return null;
  },

  /**
   * Registers a new user with encrypted password.
   * Throws error if email exists or registration disabled.
   */
  registerUser: (email: string, password: string): User => {
    const users = StorageService.getUsers();
    
    if (users.find(u => u.email === email)) {
      throw new Error('Email already exists.');
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      role: 'user',
      passwordHash: hashPassword(password)
    };

    users.push(newUser);
    StorageService.saveUserToStorage(users);
    
    return newUser;
  },

  // --- Admin User Management ---

  updateUser: (updatedUser: User) => {
    const users = StorageService.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      users[index] = updatedUser;
      StorageService.saveUserToStorage(users);
      
      // If updating current logged in user, update session
      const currentUser = StorageService.getCurrentUser();
      if (currentUser && currentUser.id === updatedUser.id) {
        StorageService.setCurrentUser(updatedUser);
      }
    }
  },

  deleteUser: (userId: string) => {
    const users = StorageService.getUsers().filter(u => u.id !== userId);
    StorageService.saveUserToStorage(users);
  }
};