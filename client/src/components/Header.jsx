import React, { useState, useEffect } from 'react';
import ProfileImage from '../assets/header/pfp.png';
import { Bell, BellOff, Settings, X, Check, ChevronDown, User as UserIcon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';

// Helper to safely parse localStorage JSON
const readJSON = (key, fallback = null) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
};

const Header = () => {
  const navigate = useNavigate();

  // Prefer AuthContext current user (set at login). Fall back to legacy localStorage keys if present.
  const auth = useAuth();
  const authUser = auth?.user || null;

  const storedUsers = readJSON('users', null);
  const storedUser = readJSON('user', null);
  const legacyUsers = Array.isArray(storedUsers) ? storedUsers : (storedUser ? [storedUser] : []);

  // Backwards-compatible alias used in UI rendering
  const users = legacyUsers;

  const storedActive = readJSON('activeUser', null);
  // activeUser initialization: prefer authUser, then activeUser, then legacy users
  const [activeUser, setActiveUser] = useState(authUser || storedActive || legacyUsers[0] || null);

  // Read settings cached by SettingsPage (company, phone, email, profilePictureUrl)
  const cachedSettings = readJSON('settings', {});

  // Prefer showing the active user's name when available; otherwise fall back to company name
  // Smart name parsing: if user has firstName/lastName use them; else if name exists, split on first space
  const getUserDisplayName = () => {
    if (!activeUser) return '';
    
    // If firstName exists, build full name from firstName + lastName (only if lastName is non-empty)
    if (activeUser.firstName) {
      const last = (activeUser.lastName || '').trim();
      return last ? `${activeUser.firstName.trim()} ${last}` : activeUser.firstName.trim();
    }
    
    // If name exists, split on first space: "Muhammad Hunain Khan" -> firstName="Muhammad", lastName="Hunain Khan"
    if (activeUser.name) {
      const nameParts = activeUser.name.trim().split(' ');
      if (nameParts.length === 1) {
        return nameParts[0]; // single word name
      }
      // First word is firstName, rest is lastName
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      // Store parsed values back to activeUser for consistency (optional, helps with future renders)
      activeUser.firstName = firstName;
      activeUser.lastName = lastName;
      return `${firstName} ${lastName}`.trim();
    }
    
    // Fallback to lastName only if it exists
    if (activeUser.lastName) {
      return activeUser.lastName.trim();
    }
    
    return '';
  };
  
  const userDisplayName = getUserDisplayName();
  const initialName = userDisplayName || cachedSettings.companyName || 'Company';

  const [name, setName] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [profileImg, setProfileImg] = useState(() => cachedSettings.profilePictureUrl || (activeUser && activeUser.profileImg) || ProfileImage);
  // modal to preview the canonical profile image (from server settings)
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Keep AuthContext and localStorage in sync when activeUser changes.
  useEffect(() => {
    if (activeUser) {
      // persist to legacy key for compatibility with other parts of the app
      try { localStorage.setItem('activeUser', JSON.stringify(activeUser)); } catch (e) {}
      try { localStorage.setItem('currentUser', JSON.stringify(activeUser)); } catch (e) {}
      if (activeUser.profileImg) setProfileImg(activeUser.profileImg);
    }

    // If AuthContext exists and is missing or out-of-date, update it to keep single source.
    // Only call auth.login when the relevant user fields actually differ to avoid infinite loops.
    try {
      if (auth && typeof auth.login === 'function') {
        const au = auth.user || null;
        const needUpdate = (() => {
          if (!au && activeUser) return true;
          if (!activeUser && au) return true;
          if (!au && !activeUser) return false;
          // Compare by id and profileImg/email/name to detect meaningful changes
          return (au.id !== activeUser.id) || (au.profileImg !== activeUser.profileImg) || (au.email !== activeUser.email);
        })();
        if (needUpdate) auth.login(activeUser);
      }
    } catch (e) {
      // ignore if auth provider is read-only or throws
    }
  }, [activeUser, auth]);

  // When settings change in localStorage (e.g., Settings page), update displayed name/img
  useEffect(() => {
    const onStorage = () => {
      const s = readJSON('settings', {});
      // Only update to company name if user doesn't have a personal name
      const userHasName = !!(activeUser && (activeUser.firstName || activeUser.name));
      if (!userHasName && s.companyName) setName(s.companyName);
      if (s.profilePictureUrl) setProfileImg(s.profilePictureUrl.startsWith('http') ? s.profilePictureUrl : s.profilePictureUrl);
    };
    window.addEventListener('storage', onStorage);
    // Same-tab updates: listen for custom event dispatched by SettingsPage
    const onSettingsUpdated = (e) => {
      try {
        const d = e?.detail || {};
        if (d.profilePictureUrl) setProfileImg(d.profilePictureUrl);
        // Only update displayed name to company name if there's no user display name available
        const userHasName = !!(activeUser && (activeUser.firstName || activeUser.name));
        if (!userHasName && d.companyName && d.companyName !== name) setName(d.companyName);
        // if the AuthContext user should also be updated, keep activeUser in sync
        if (d.profilePictureUrl) {
          setActiveUser(prev => ({ ...(prev || {}), profileImg: d.profilePictureUrl }));
        }
      } catch (err) {}
    };
    window.addEventListener('settings:updated', onSettingsUpdated);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('settings:updated', onSettingsUpdated);
    };
  }, []);

  // Notifications permission handling (best-effort in UI-only mode)
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Simulated incoming notifications when enabled (UI-only)
  useEffect(() => {
    if (!notificationsEnabled || !hasPermission) return;
    const id = setInterval(() => {
      // small chance to add notification
      if (Math.random() > 0.85) setUnreadCount(c => c + 1);
    }, 15000);
    return () => clearInterval(id);
  }, [notificationsEnabled, hasPermission]);

  const handleProfileClick = () => {
    // show the canonical profile image stored in server settings
    setShowProfileModal(true);
  };

  // Load canonical profile picture from server settings (if available)
  useEffect(() => {
    const loadProfileFromServer = async () => {
      try {
        // Try company settings first (more stable, doesn't depend on user ID)
        try {
          const companyRes = await fetch(API_ENDPOINTS.SETTINGS.COMPANY);
          if (companyRes.ok) {
            const companyData = await companyRes.json();
            if (companyData && companyData.company && companyData.company.logo_url) {
              const logoUrl = companyData.company.logo_url.startsWith('http')
                ? companyData.company.logo_url
                : `${process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000'}${companyData.company.logo_url}`;
              if (logoUrl && logoUrl !== profileImg) setProfileImg(logoUrl);
              return; // Success, exit
            }
          }
        } catch (err) {
          console.debug('Company settings fetch failed, trying user settings:', err);
        }

        // Fallback to user-specific settings
        const currentUser = auth?.user || (() => {
          try { return JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('activeUser') || 'null'); } catch { return null; }
        })();
        const userId = currentUser?.id;
        if (!userId) return;

        const res = await fetch(API_ENDPOINTS.SETTINGS.USER(userId));
        if (!res.ok) {
          console.debug(`Settings endpoint returned ${res.status}. Using defaults.`);
          return;
        }
        const data = await res.json();
        if (data && data.success && data.data && data.data.personal) {
          const personal = data.data.personal || {};
          const url = personal.profilePictureUrl;
          // server returns a relative path like /uploads/profile-pictures/xxx.jpg
          const baseUrl = process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000';
          const finalUrl = url ? (url.startsWith('http') ? url : `${baseUrl}${url}`) : null;
          if (finalUrl && finalUrl !== profileImg) setProfileImg(finalUrl);

          // declare variables in this outer scope so later blocks (outside the inner try) can reference them
          let firstName = activeUser?.firstName || '';
          let lastName = activeUser?.lastName || '';
          let email = activeUser?.email || null;
          let phone = activeUser?.phone || null;

          // Update activeUser with canonical fields from server
          try {
            // populate variables from server-provided personal object when available
            firstName = personal.firstName || personal.name || firstName || '';
            lastName = personal.lastName || lastName || '';
            email = personal.email || email || null;
            phone = personal.phone || phone || null;

            const au = { ...(activeUser || {}), firstName, lastName };
            if (email) au.email = email;
            if (phone) au.phone = phone;
            // only update if different to avoid render loops
            try {
              const sameAU = JSON.stringify(au) === JSON.stringify(activeUser || {});
              if (!sameAU) setActiveUser(au);
            } catch (e) {
              setActiveUser(au);
            }
            // Update displayed name to personal name if available
            if (firstName) {
              const newName = `${firstName}${lastName ? ' ' + lastName : ''}`;
              if (newName !== name) setName(newName);
            }
          } catch (e) {}

          // persist to cached settings so other components pick it up
          try {
            const s = readJSON('settings', {});
            if (finalUrl) s.profilePictureUrl = finalUrl;
            if (personal.company) s.companyName = personal.company;
            if (personal.email) s.email = personal.email;
            if (personal.phone) s.phone = personal.phone;
            localStorage.setItem('settings', JSON.stringify(s));
            // DO NOT overwrite displayed name with company name if user has a personal name
            // Only set company name as display name if there's no user name (firstName is empty)
            if (!firstName && personal.company && personal.company !== name) {
              setName(personal.company);
            }
          } catch (e) {}
        }
      } catch (err) {
        // ignore - keep cachedSettings or avatar already present
      }
    };

    loadProfileFromServer();
  }, [auth?.user?.id]);

  const handleNameChange = (e) => setName(e.target.value);
  const handleNameBlur = () => {
    setIsEditing(false);
    // persist company name in cached settings
    try {
      const s = readJSON('settings', {});
      s.companyName = name;
      localStorage.setItem('settings', JSON.stringify(s));
    } catch (e) {}
  };

  const toggleNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Browser does not support notifications');
      return;
    }
    if (Notification.permission === 'denied') {
      alert('Notifications blocked in browser settings');
      return;
    }
    if (Notification.permission !== 'granted') {
      const p = await Notification.requestPermission();
      setHasPermission(p === 'granted');
      setNotificationsEnabled(p === 'granted');
      if (p === 'granted') {
        new Notification('Notifications enabled', { body: 'You will receive demo notifications' });
        setUnreadCount(1);
      }
    } else {
      setNotificationsEnabled(v => !v);
      if (!notificationsEnabled) setUnreadCount(1);
      else setUnreadCount(0);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleUserSwitch = (u) => {
    setActiveUser(u);
    setShowUserDropdown(false);
  };

  return (
    <div className="flex justify-between items-center mb-6 p-4 sm:p-6 rounded-[18px] shadow-sm bg-white text-black">
      <div className="flex items-center relative">
        <div className="w-12 h-12 bg-gray-100 rounded-full mr-3 overflow-hidden flex items-center justify-center border border-gray-200">
          <img src={profileImg} alt="Profile" className="w-full h-full object-cover cursor-pointer" onClick={handleProfileClick} />
        </div>

        <div className="flex flex-col min-w-0">
          <div className="text-gray-500 text-xs">Welcome Back!</div>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <input autoFocus value={name} onChange={handleNameChange} onBlur={handleNameBlur} className="text-lg sm:text-2xl font-extrabold text-gray-900 border-b border-gray-200 focus:outline-none" />
            ) : (
              <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 truncate" onDoubleClick={() => setIsEditing(true)}>{name}</h1>
            )}
          </div>
          {activeUser?.email && <div className="text-sm text-gray-600 mt-0.5 truncate" style={{ maxWidth: 420 }}>{activeUser.email}</div>}
        </div>

        {users.length > 1 && (
          <div className="relative ml-4">
            <button onClick={() => setShowUserDropdown(v => !v)} className="flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
              <UserIcon className="w-4 h-4 mr-1" />
              Switch
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {showUserDropdown && (
              <div className="absolute left-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                {users.map(u => (
                  <button key={u.email} onClick={() => handleUserSwitch(u)} className={`flex items-center w-full px-3 py-2 text-sm hover:bg-blue-50 ${u.email === activeUser?.email ? 'bg-blue-100 font-semibold' : ''}`}>
                    <img src={u.profileImg || ProfileImage} alt="User" className="w-6 h-6 rounded-full mr-2 border-2 border-blue-300" />
                    <span className="truncate">{(u.firstName || u.lastName) ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : (u.name || u.email)}</span>
                    {u.email === activeUser?.email && <span className="ml-auto bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        <button className="p-2 relative rounded-full hover:bg-gray-100 transition-colors" onClick={toggleNotifications} aria-label="Toggle notifications">
          {notificationsEnabled ? <Bell className="w-5 h-5 text-gray-600" /> : <BellOff className="w-5 h-5 text-gray-400" />}
          {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">{unreadCount}</span>}
        </button>

        <div className="relative">
          <button onClick={() => setShowSettings(v => !v)} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Settings">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>

          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 p-4">
              <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500" /> Settings</h3>
                  <button onClick={() => setShowSettings(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Company logo" className="w-14 h-14 rounded-full border-2 border-blue-400 object-cover" />
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 text-lg">{name}</div>
                      <div className="text-xs text-gray-500">{activeUser?.email}</div>
                      { (cachedSettings.phone || activeUser?.phone) && (
                        <div className="text-xs text-gray-500">{cachedSettings.phone || activeUser?.phone}</div>
                      ) }
                      <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center"><span className="w-28 text-gray-500">Company</span><span className="text-gray-800">{cachedSettings.companyName || name}</span></div>
                        <div className="flex items-center"><span className="w-28 text-gray-500">Email</span><span className="text-gray-800">{cachedSettings.email || activeUser?.email || '-'}</span></div>
                        <div className="flex items-center"><span className="w-28 text-gray-500">Phone</span><span className="text-gray-800">{cachedSettings.phone || '-'}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <button onClick={handleLogout} className="w-full py-2 px-4 bg-red-500 hover:bg-red-600 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2"><LogOut className="w-4 h-4" /> Logout</button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {showProfileModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
              <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold">Profile Image</h4>
                  <button onClick={() => setShowProfileModal(false)} className="p-1 rounded-full hover:bg-gray-100"><X className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center justify-center">
                  <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Company logo" className="max-h-72 object-contain rounded-md" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
