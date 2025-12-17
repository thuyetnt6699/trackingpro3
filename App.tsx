import React, { useState, useEffect } from 'react';
import { User, TrackingInfo, TrackingStatus } from './types';
import { StorageService } from './services/storage';
import { TrackingApi } from './services/trackingApi';
import { CHINA_CARRIERS } from './constants';
import { Button } from './components/Button';
import { TrackingCard } from './components/TrackingCard';
import { 
  LogOut, 
  Plus, 
  RefreshCw, 
  Search, 
  Filter, 
  ShieldCheck, 
  LayoutDashboard,
  Lock,
  Truck,
  Package,
  AlertCircle
} from 'lucide-react';

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Mock password for demo
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // App State
  const [trackings, setTrackings] = useState<TrackingInfo[]>([]);
  const [newTrackingNum, setNewTrackingNum] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState(CHINA_CARRIERS[0].code);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  
  // Form Error State
  const [addError, setAddError] = useState('');

  // Load initial data
  useEffect(() => {
    const currentUser = StorageService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setTrackings(StorageService.getTrackings());
      setRegistrationEnabled(StorageService.getRegistrationEnabled());
    }
  }, []);

  // --- Auth Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const users = StorageService.getUsers();
    // Simple email match for demo. In real app, verify password hash.
    const foundUser = users.find(u => u.email === email);
    
    if (foundUser) {
      StorageService.setCurrentUser(foundUser);
      setUser(foundUser);
      setTrackings(StorageService.getTrackings());
      setRegistrationEnabled(StorageService.getRegistrationEnabled());
    } else {
      setAuthError('User not found. Please register.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!StorageService.getRegistrationEnabled()) {
      setAuthError('Registration is currently disabled by administrator.');
      return;
    }

    const users = StorageService.getUsers();
    if (users.find(u => u.email === email)) {
      setAuthError('Email already exists.');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      role: 'user' // Default to user
    };

    StorageService.saveUser(newUser);
    StorageService.setCurrentUser(newUser);
    setUser(newUser);
    setTrackings(StorageService.getTrackings());
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setUser(null);
    setEmail('');
    setPassword('');
    setTrackings([]);
  };

  const toggleRegistration = () => {
    if (user?.role !== 'admin') return;
    const newState = !registrationEnabled;
    setRegistrationEnabled(newState);
    StorageService.setRegistrationEnabled(newState);
  };

  // --- Tracking Handlers ---

  const addTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(''); // Clear previous errors
    
    if (!newTrackingNum) return;
    
    const normalizedNum = newTrackingNum.trim();
    
    // --- DATABASE CHECK: DUPLICATE PREVENTION ---
    // Check if the tracking number already exists in the current list
    const exists = trackings.some(t => t.trackingNumber === normalizedNum);
    if (exists) {
      setAddError(`Tracking number ${normalizedNum} already exists in your list.`);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Fetch initial status from Real API
      const details = await TrackingApi.getStatus(normalizedNum, selectedCarrier);
      
      const newItem: TrackingInfo = {
        id: Date.now().toString(),
        trackingNumber: normalizedNum,
        carrierCode: selectedCarrier,
        status: details.status || 'pending',
        lastUpdate: details.lastUpdate || new Date().toISOString(),
        description: details.description || 'Tracking initialized',
        events: details.events || [],
        addedAt: Date.now()
      };

      const updatedList = [newItem, ...trackings];
      setTrackings(updatedList);
      StorageService.saveTrackings(updatedList); // This saves to "Database" (LocalStorage)
      setNewTrackingNum('');
    } catch (error: any) {
      setAddError(error.message || "Failed to add tracking");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAll = async () => {
    setIsLoading(true);
    try {
      const promises = trackings.map(async (item) => {
        try {
          const updates = await TrackingApi.getStatus(item.trackingNumber, item.carrierCode);
          return { ...item, ...updates };
        } catch (e) {
          console.error(`Failed to refresh ${item.trackingNumber}`, e);
          return item; // Keep old state if update fails
        }
      });

      const updatedList = await Promise.all(promises);
      setTrackings(updatedList);
      StorageService.saveTrackings(updatedList);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTracking = (id: string) => {
    // Modified: Allow users to delete their own trackings, not just admin
    // if (user?.role !== 'admin') return; 
    const updatedList = trackings.filter(t => t.id !== id);
    setTrackings(updatedList);
    StorageService.saveTrackings(updatedList);
  };

  // --- Render ---

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Truck className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">ChinaTrack Pro</h1>
          <p className="text-center text-gray-500 mb-8">
            {isRegistering ? 'Create an account to start tracking' : 'Welcome back, please login'}
          </p>

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            
            {authError && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {authError}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isRegistering && !registrationEnabled}>
              {isRegistering ? 'Create Account' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError('');
              }}
              className="text-sm text-blue-600 hover:underline font-medium"
            >
              {isRegistering 
                ? 'Already have an account? Sign in' 
                : registrationEnabled 
                  ? "Don't have an account? Sign up" 
                  : "Registration is closed"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter Logic
  const filteredTrackings = trackings.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  }).sort((a, b) => {
    // Sort by status priority roughly
    const priority = { exception: 0, delivered: 3, in_transit: 1, pending: 2 };
    return (priority[a.status as keyof typeof priority] || 4) - (priority[b.status as keyof typeof priority] || 4);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800 hidden sm:inline">ChinaTrack Pro</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            
            {user.role === 'admin' && (
              <button 
                onClick={toggleRegistration}
                className={`p-2 rounded-full transition-colors ${registrationEnabled ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}
                title={registrationEnabled ? 'Registration Open' : 'Registration Closed'}
              >
                <Lock className="w-5 h-5" />
              </button>
            )}
            
            <Button variant="ghost" onClick={handleLogout} className="!p-2">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Add Tracking Section */}
        <section className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-500" />
            Add New Tracking
          </h2>
          <form onSubmit={addTracking}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Enter tracking number..."
                  className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg focus:ring-2 focus:bg-white transition-all outline-none ${addError ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`}
                  value={newTrackingNum}
                  onChange={(e) => {
                    setNewTrackingNum(e.target.value);
                    setAddError(''); // Clear error on typing
                  }}
                />
              </div>
              <div className="md:w-64">
                <select
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
                  value={selectedCarrier}
                  onChange={(e) => setSelectedCarrier(e.target.value)}
                >
                  {CHINA_CARRIERS.map(carrier => (
                    <option key={carrier.code} value={carrier.code}>
                      {carrier.name}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={!newTrackingNum} isLoading={isLoading}>
                Track Package
              </Button>
            </div>
            {/* Error Message Display */}
            {addError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg inline-block">
                <AlertCircle className="w-4 h-4" />
                {addError}
              </div>
            )}
          </form>
        </section>

        {/* List Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            <Filter className="w-4 h-4 text-gray-500" />
            {['all', 'in_transit', 'delivered', 'exception'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filterStatus === status 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>

          <Button variant="secondary" onClick={refreshAll} isLoading={isLoading} className="w-full sm:w-auto">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh All
          </Button>
        </div>

        {/* Tracking List */}
        <div className="space-y-4">
          {filteredTrackings.length > 0 ? (
            filteredTrackings.map(item => (
              <TrackingCard 
                key={item.id} 
                item={item} 
                onDelete={deleteTracking}
                isAdmin={true /* Allow all users to delete in this demo */}
              />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="bg-gray-50 p-4 rounded-full inline-block mb-4">
                <Package className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No shipments found</h3>
              <p className="text-gray-500 mt-1">Add a tracking number to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;