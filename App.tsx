import React, { useState, useEffect } from 'react';
import { User, TrackingInfo, UserRole } from './types';
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
  AlertCircle,
  Users,
  Trash2,
  Shield,
  User as UserIcon,
  ArrowLeft
} from 'lucide-react';

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // App View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin'>('dashboard');

  // App Data State
  const [trackings, setTrackings] = useState<TrackingInfo[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // For Admin Panel
  
  // Form Inputs
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

  // Load users when entering admin view
  useEffect(() => {
    if (currentView === 'admin' && user?.role === 'admin') {
      setAllUsers(StorageService.getUsers());
    }
  }, [currentView, user]);

  // --- Auth Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    const foundUser = StorageService.verifyCredentials(email, password);
    
    if (foundUser) {
      StorageService.setCurrentUser(foundUser);
      setUser(foundUser);
      setTrackings(StorageService.getTrackings());
      setRegistrationEnabled(StorageService.getRegistrationEnabled());
      setPassword('');
    } else {
      setAuthError('Invalid email or password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!StorageService.getRegistrationEnabled()) {
      setAuthError('Registration is currently disabled by administrator.');
      return;
    }

    try {
      const newUser = StorageService.registerUser(email, password);
      StorageService.setCurrentUser(newUser);
      setUser(newUser);
      setTrackings(StorageService.getTrackings());
      setPassword('');
    } catch (error: any) {
      setAuthError(error.message || 'Registration failed');
    }
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setUser(null);
    setEmail('');
    setPassword('');
    setTrackings([]);
    setCurrentView('dashboard');
  };

  const toggleRegistration = () => {
    if (user?.role !== 'admin') return;
    const newState = !registrationEnabled;
    setRegistrationEnabled(newState);
    StorageService.setRegistrationEnabled(newState);
  };

  // --- Admin User Management Handlers ---

  const handlePromoteDemote = (targetUser: User) => {
    if (targetUser.id === user?.id) return; // Cannot change own role
    
    const newRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const updatedUser: User = { ...targetUser, role: newRole };
    
    StorageService.updateUser(updatedUser);
    setAllUsers(StorageService.getUsers()); // Refresh list
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === user?.id) return; // Cannot delete self
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    StorageService.deleteUser(userId);
    setAllUsers(StorageService.getUsers()); // Refresh list
  };

  // --- Tracking Handlers ---

  const addTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    
    if (!newTrackingNum) return;
    const normalizedNum = newTrackingNum.trim();
    
    const exists = trackings.some(t => t.trackingNumber === normalizedNum);
    if (exists) {
      setAddError(`Tracking number ${normalizedNum} already exists in your list.`);
      return;
    }

    setIsLoading(true);
    try {
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
      StorageService.saveTrackings(updatedList);
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
          return item; 
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
    const updatedList = trackings.filter(t => t.id !== id);
    setTrackings(updatedList);
    StorageService.saveTrackings(updatedList);
  };

  // --- Render Login Screen ---

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

  // Filter Logic for Dashboard
  const filteredTrackings = trackings.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  }).sort((a, b) => {
    const priority = { exception: 0, delivered: 3, in_transit: 1, pending: 2 };
    return (priority[a.status as keyof typeof priority] || 4) - (priority[b.status as keyof typeof priority] || 4);
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
            <div className="bg-blue-600 p-2 rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800 hidden sm:inline">ChinaTrack Pro</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Admin Toggle View Button */}
            {user.role === 'admin' && (
              <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                <button
                  onClick={() => setCurrentView(currentView === 'dashboard' ? 'admin' : 'dashboard')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                >
                  {currentView === 'dashboard' ? (
                    <>
                      <Users className="w-4 h-4" />
                      Admin Panel
                    </>
                  ) : (
                    <>
                      <ArrowLeft className="w-4 h-4" />
                      Dashboard
                    </>
                  )}
                </button>
              </div>
            )}

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            
            <Button variant="ghost" onClick={handleLogout} className="!p-2">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* --- View: Admin Panel --- */}
        {currentView === 'admin' && user.role === 'admin' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                  User Management
                </h2>
                <p className="text-gray-500 mt-1">Manage registered accounts and permissions.</p>
              </div>
              
              <button 
                onClick={toggleRegistration}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${registrationEnabled ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}
              >
                {registrationEnabled ? <Lock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                {registrationEnabled ? 'Registration Open' : 'Registration Closed'}
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">User ID</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {allUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 p-2 rounded-full">
                              <UserIcon className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="font-medium text-gray-900">{u.email}</span>
                            {u.id === user.id && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">(You)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                            {u.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                            {u.role.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-400">
                          {u.id}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handlePromoteDemote(u)}
                              disabled={u.id === user.id}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                            >
                              {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                            </button>
                            <span className="text-gray-300">|</span>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === user.id}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* --- View: Dashboard (Original Content) --- */
          <>
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
                        setAddError('');
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
                    isAdmin={true}
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
          </>
        )}
      </main>
    </div>
  );
}

export default App;