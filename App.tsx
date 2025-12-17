import React, { useState, useEffect, useMemo } from 'react';
import { User, TrackingInfo, UserRole } from './types';
import { StorageService } from './services/storage';
import { TrackingApi } from './services/trackingApi';
import { CHINA_CARRIERS } from './constants';
import { Button } from './components/Button';
import { TrackingCard } from './components/TrackingCard';
import { ConfirmationModal } from './components/ConfirmationModal';
import { Badge } from './components/Badge';
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
  ArrowLeft,
  RotateCcw,
  CheckSquare,
  Square,
  X
} from 'lucide-react';

function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); 
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');

  // App View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'admin' | 'trash'>('dashboard');

  // App Data State
  const [trackings, setTrackings] = useState<TrackingInfo[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // For Admin Panel
  
  // Trash Selection State
  const [selectedTrashIds, setSelectedTrashIds] = useState<Set<string>>(new Set());

  // Form Inputs
  const [newTrackingNum, setNewTrackingNum] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState(CHINA_CARRIERS[0].code);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  
  // Form Error State
  const [addError, setAddError] = useState('');

  // Delete Confirmation State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'user' | 'tracking_soft' | 'tracking_permanent' | null;
    id: string | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: null,
    id: null,
    title: '',
    message: ''
  });

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

  // Derived State
  const activeTrackings = useMemo(() => trackings.filter(t => !t.deletedAt), [trackings]);
  const trashedTrackings = useMemo(() => trackings.filter(t => t.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0)), [trackings]);

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

  // --- Trash & Restore Logic ---

  const toggleTrashSelection = (id: string) => {
    const newSet = new Set(selectedTrashIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedTrashIds(newSet);
  };

  const toggleSelectAllTrash = () => {
    if (selectedTrashIds.size === trashedTrackings.length) {
      setSelectedTrashIds(new Set());
    } else {
      setSelectedTrashIds(new Set(trashedTrackings.map(t => t.id)));
    }
  };

  const restoreTracking = (ids: string[]) => {
    const updatedList = trackings.map(t => {
      if (ids.includes(t.id)) {
        return { ...t, deletedAt: undefined };
      }
      return t;
    });
    setTrackings(updatedList);
    StorageService.saveTrackings(updatedList);
    setSelectedTrashIds(new Set()); // Clear selection
  };

  const restoreAll = () => {
    const updatedList = trackings.map(t => ({ ...t, deletedAt: undefined }));
    setTrackings(updatedList);
    StorageService.saveTrackings(updatedList);
    setSelectedTrashIds(new Set());
  };

  // --- Delete Logic with Modal ---

  const initiateDeleteUser = (userId: string) => {
    if (userId === user?.id) return;
    setDeleteModal({
      isOpen: true,
      type: 'user',
      id: userId,
      title: 'Delete User Account',
      message: 'Are you sure you want to permanently delete this user? They will no longer be able to sign in. This action cannot be undone.'
    });
  };

  const initiateSoftDeleteTracking = (trackingId: string) => {
    const item = trackings.find(t => t.id === trackingId);
    setDeleteModal({
      isOpen: true,
      type: 'tracking_soft',
      id: trackingId,
      title: 'Move to Trash',
      message: `Are you sure you want to move tracking ${item?.trackingNumber} to the trash? You can restore it later.`
    });
  };

  const initiatePermanentDeleteTracking = (trackingId: string) => {
    const item = trackings.find(t => t.id === trackingId);
    setDeleteModal({
      isOpen: true,
      type: 'tracking_permanent',
      id: trackingId,
      title: 'Permanently Delete',
      message: `This will permanently delete tracking ${item?.trackingNumber}. This action cannot be undone.`
    });
  };

  const handleConfirmDelete = () => {
    const { type, id } = deleteModal;
    if (!id || !type) return;

    if (type === 'user') {
      StorageService.deleteUser(id);
      setAllUsers(StorageService.getUsers());
    } else if (type === 'tracking_soft') {
      // Soft Delete: Set deletedAt
      const updatedList = trackings.map(t => 
        t.id === id ? { ...t, deletedAt: Date.now() } : t
      );
      setTrackings(updatedList);
      StorageService.saveTrackings(updatedList);
    } else if (type === 'tracking_permanent') {
      // Hard Delete: Remove from array
      const updatedList = trackings.filter(t => t.id !== id);
      setTrackings(updatedList);
      StorageService.saveTrackings(updatedList);
      // Remove from selection if present
      if (selectedTrashIds.has(id)) {
        const newSet = new Set(selectedTrashIds);
        newSet.delete(id);
        setSelectedTrashIds(newSet);
      }
    }

    setDeleteModal(prev => ({ ...prev, isOpen: false }));
  };

  // --- Admin User Management Handlers ---

  const handlePromoteDemote = (targetUser: User) => {
    if (targetUser.id === user?.id) return; // Cannot change own role
    
    const newRole: UserRole = targetUser.role === 'admin' ? 'user' : 'admin';
    const updatedUser: User = { ...targetUser, role: newRole };
    
    StorageService.updateUser(updatedUser);
    setAllUsers(StorageService.getUsers()); // Refresh list
  };

  // --- Tracking Handlers ---

  const addTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    
    if (!newTrackingNum) return;
    const normalizedNum = newTrackingNum.trim();
    
    // Check if exists in Active list
    const existsActive = activeTrackings.some(t => t.trackingNumber === normalizedNum);
    if (existsActive) {
      setAddError(`Tracking number ${normalizedNum} is already in your dashboard.`);
      return;
    }

    // Check if exists in Trash list (Prevent duplicates in trash/restore issues)
    const existsTrash = trashedTrackings.some(t => t.trackingNumber === normalizedNum);
    if (existsTrash) {
      setAddError(`Tracking number ${normalizedNum} is currently in the Trash. Please restore it from there.`);
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
      // Only refresh active trackings
      const promises = activeTrackings.map(async (item) => {
        try {
          const updates = await TrackingApi.getStatus(item.trackingNumber, item.carrierCode);
          return { ...item, ...updates };
        } catch (e) {
          console.error(`Failed to refresh ${item.trackingNumber}`, e);
          return item; 
        }
      });

      const updatedActive = await Promise.all(promises);
      
      // Merge updated active items with existing trashed items
      // Ensure we don't duplicate logic, keep original array structure but update content
      const updatedMap = new Map(updatedActive.map(i => [i.id, i]));
      
      const updatedList = trackings.map(t => {
        if (updatedMap.has(t.id)) {
          return updatedMap.get(t.id)!;
        }
        return t;
      });
      
      setTrackings(updatedList);
      StorageService.saveTrackings(updatedList);
    } finally {
      setIsLoading(false);
    }
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
  const filteredActiveTrackings = activeTrackings.filter(t => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  }).sort((a, b) => {
    const priority = { exception: 0, delivered: 3, in_transit: 1, pending: 2 };
    return (priority[a.status as keyof typeof priority] || 4) - (priority[b.status as keyof typeof priority] || 4);
  });

  return (
    <div className="min-h-screen bg-slate-50 relative">
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
            
            {/* Nav: Admin */}
            {user.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}

            {/* Nav: Trash */}
            <button
              onClick={() => setCurrentView('trash')}
              className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${currentView === 'trash' ? 'bg-red-100 text-red-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Trash</span>
              {trashedTrackings.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {trashedTrackings.length}
                </span>
              )}
            </button>

            {/* Nav: Dashboard (if not active) */}
            {currentView !== 'dashboard' && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors sm:hidden"
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
            )}

            <div className="text-right hidden sm:block border-l border-gray-200 pl-4">
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
            </div>
            
            <Button variant="ghost" onClick={handleLogout} className="!p-2">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* === View: Admin Panel === */}
        {currentView === 'admin' && user.role === 'admin' && (
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
                              onClick={() => initiateDeleteUser(u.id)}
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
        )}

        {/* === View: Trash === */}
        {currentView === 'trash' && (
           <div className="space-y-6">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Trash2 className="w-6 h-6 text-red-500" />
                    Recycle Bin
                  </h2>
                  <p className="text-gray-500 mt-1">
                    Recover deleted shipments or permanently remove them.
                  </p>
                </div>
                
                {trashedTrackings.length > 0 && (
                  <Button variant="secondary" onClick={restoreAll} className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Restore All
                  </Button>
                )}
             </div>

             {/* Bulk Actions Bar */}
             {selectedTrashIds.size > 0 && (
               <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                    <CheckSquare className="w-4 h-4" />
                    {selectedTrashIds.size} items selected
                  </div>
                  <div className="flex items-center gap-2">
                     <button 
                       onClick={() => restoreTracking(Array.from(selectedTrashIds))}
                       className="text-sm bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors font-medium flex items-center gap-1"
                     >
                       <RotateCcw className="w-3.5 h-3.5" />
                       Restore Selected
                     </button>
                  </div>
               </div>
             )}

             {trashedTrackings.length > 0 ? (
               <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 text-gray-900 font-semibold border-b border-gray-200">
                      <tr>
                        <th className="w-12 px-6 py-4">
                          <button onClick={toggleSelectAllTrash} className="flex items-center text-gray-400 hover:text-gray-600">
                            {selectedTrashIds.size === trashedTrackings.length && trashedTrackings.length > 0 ? (
                              <CheckSquare className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-4">Tracking Number</th>
                        <th className="px-4 py-4 hidden sm:table-cell">Carrier</th>
                        <th className="px-4 py-4 hidden sm:table-cell">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {trashedTrackings.map((item) => {
                        const isSelected = selectedTrashIds.has(item.id);
                        return (
                          <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}>
                            <td className="px-6 py-4">
                              <button 
                                onClick={() => toggleTrashSelection(item.id)}
                                className="flex items-center"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-300 hover:text-gray-400" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-4 font-medium text-gray-900">
                              {item.trackingNumber}
                            </td>
                            <td className="px-4 py-4 hidden sm:table-cell">
                              {CHINA_CARRIERS.find(c => c.code === item.carrierCode)?.name || item.carrierCode}
                            </td>
                            <td className="px-4 py-4 hidden sm:table-cell">
                               <Badge status={item.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => restoreTracking([item.id])}
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Restore"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                  <span className="hidden sm:inline">Restore</span>
                                </button>
                                <span className="text-gray-200">|</span>
                                <button
                                  onClick={() => initiatePermanentDeleteTracking(item.id)}
                                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Forever"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  <span className="hidden sm:inline">Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
               </div>
             ) : (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                  <div className="bg-gray-50 p-4 rounded-full inline-block mb-4">
                    <Trash2 className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Trash is empty</h3>
                  <p className="text-gray-500 mt-1">Items moved to trash will appear here.</p>
                </div>
             )}
           </div>
        )}

        {/* === View: Dashboard === */}
        {currentView === 'dashboard' && (
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
              {filteredActiveTrackings.length > 0 ? (
                filteredActiveTrackings.map(item => (
                  <TrackingCard 
                    key={item.id} 
                    item={item} 
                    onDelete={initiateSoftDeleteTracking} // Use Soft Delete here
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

      {/* Global Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
        type={deleteModal.type === 'tracking_permanent' || deleteModal.type === 'user' ? 'danger' : 'warning'}
      />
    </div>
  );
}

export default App;