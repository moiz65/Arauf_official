import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/api';
import Logo from "../assets/Logo/rauf textile png.png"; // updated to user's logo
import Logo2 from "../assets/Logo/Logo-2.png"; // Ensure this path is correct

const NavItem = ({
  icon,
  label,
  isActive = false,
  isCollapsed = false,
  to,
}) => {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
        isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:text-gray-900"
      }`}
      title={isCollapsed ? label : undefined}
    >
      <div className={isActive ? "text-blue-600" : "text-gray-500"}>
        {React.cloneElement(icon, { className: "w-6 h-6" })}
      </div>
      {!isCollapsed && (
        <span className="font-semibold text-sm sm:text-base whitespace-nowrap">
          {label}
        </span>
      )}
    </Link>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const auth = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  // read dynamic company settings from localStorage if present
  const [companyName, setCompanyName] = useState(() => {
    try {
      const raw = localStorage.getItem('settings');
      const s = raw ? JSON.parse(raw) : {};
      return s.companyName || 'A Rauf Textile';
    } catch (e) {
      return 'A Rauf Textile';
    }
  });
  const [companyLogo, setCompanyLogo] = useState(() => {
    try {
      const raw = localStorage.getItem('settings');
      const s = raw ? JSON.parse(raw) : {};
      // prefer explicit company logo, fall back to profile picture (some installs store logo there)
      return s.companyLogoUrl || s.profilePictureUrl || Logo;
    } catch (e) {
      return Logo;
    }
  });

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileMenu = () => setIsMobileOpen(!isMobileOpen);

  // Fetch company logo and name from the database on mount
  useEffect(() => {
    const fetchCompanySettings = async () => {
        const currentUser = auth?.user || (() => {
          try { 
            return JSON.parse(localStorage.getItem('currentUser') || localStorage.getItem('activeUser') || 'null'); 
          } catch { 
            return null; 
          }
        })();
        const userId = currentUser?.id;
        if (!userId) return;

        try {
          // Prefer global company settings (stable endpoint) to avoid relying on a specific user id
          try {
            const companyRes = await fetch(API_ENDPOINTS.SETTINGS.COMPANY);
            if (companyRes.ok) {
              const companyData = await companyRes.json();
              if (companyData && companyData.company) {
                if (companyData.company.name) setCompanyName(companyData.company.name);
                if (companyData.company.logo_url) {
                  const logo = companyData.company.logo_url.startsWith('http')
                    ? companyData.company.logo_url
                    : `${process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000'}${companyData.company.logo_url}`;
                  setCompanyLogo(logo);
                  try {
                    const raw = localStorage.getItem('settings');
                    const s = raw ? JSON.parse(raw) : {};
                    s.companyLogoUrl = logo;
                    s.companyName = companyData.company.name || s.companyName;
                    localStorage.setItem('settings', JSON.stringify(s));
                  } catch (e) {}
                }
                // We have company settings; no need to fetch user-specific settings for logo/name
                return;
              }
            }
          } catch (err) {
            // Ignore and fall back to user-specific settings below
            console.debug('Company settings fetch failed, falling back to user settings:', err);
          }

          // Fallback: fetch user-specific settings
          const res = await fetch(API_ENDPOINTS.SETTINGS.USER(userId));
          if (!res.ok) {
            console.warn(`Settings endpoint returned ${res.status}. Using defaults.`);
            return;
          }
          const data = await res.json();
          
          if (data && data.success && data.data && data.data.personal) {
            const personal = data.data.personal || {};
            
            // Update company name if available
            if (personal.company) {
              setCompanyName(personal.company);
            }
            
            // Use profilePictureUrl as the company logo (stored in profile_picture_url column)
            // The server returns it as /api/profile-picture/view/filename
          const logoUrl = personal.profilePictureUrl;
          if (logoUrl) {
            const baseUrl = process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000';
            const companyLogoUrl = logoUrl.startsWith('http') 
              ? logoUrl 
              : `${baseUrl}${logoUrl}`;
            setCompanyLogo(companyLogoUrl);
            
            // Persist to localStorage for other components
            try {
              const raw = localStorage.getItem('settings');
              const s = raw ? JSON.parse(raw) : {};
              s.companyName = personal.company || s.companyName;
              s.companyLogoUrl = companyLogoUrl;
              localStorage.setItem('settings', JSON.stringify(s));
            } catch (e) {}
          }
        }
      } catch (err) {
        // Silently fail and use default logo
        console.warn('Failed to fetch company settings:', err);
      }
    };

    fetchCompanySettings();
  }, [auth?.user?.id]);

  // Listen for settings updates from SettingsPage
  useEffect(() => {
    const onSettings = (e) => {
      const detail = e && e.detail ? e.detail : {};
      try {
        // Update displayed company name if provided
        if (detail.companyName) setCompanyName(detail.companyName);

        // Prefer explicit companyLogoUrl, but accept profilePictureUrl as a fallback
        const logo = detail.companyLogoUrl || detail.profilePictureUrl;
        if (logo) {
          setCompanyLogo(logo);
          // persist to localStorage so other components and reloads pick it up
          try {
            const raw = localStorage.getItem('settings');
            const s = raw ? JSON.parse(raw) : {};
            s.companyLogoUrl = logo;
            if (detail.companyName) s.companyName = detail.companyName;
            // also keep profilePictureUrl for compatibility
            if (detail.profilePictureUrl) s.profilePictureUrl = detail.profilePictureUrl;
            localStorage.setItem('settings', JSON.stringify(s));
          } catch (err) {}
        }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('settings:updated', onSettings);
    return () => window.removeEventListener('settings:updated', onSettings);
  }, []);

  const navItems = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      ),
      label: "Dashboard",
      to: "/dashboard",
      moduleName: "dashboard",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      ),
      label: "Invoices",
      to: "/invoices",
      moduleName: "invoices",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
      label: "Reports",
      to: "/report",
      hidden: true, // Temporarily hidden as per requirements
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      label: "Contact Persons",
      to: "/customers",
      moduleName: "customers",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-user-icon lucide-user"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      label: "Employees",
      to: "#",
      hidden: true, // Hide Employees menu item from sidebar per request
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-history-icon lucide-history"
        >
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
          <path d="M12 7v5l4 2" />
        </svg>
      ),
      label: "Expenses",
      to: "/expense",
      moduleName: "expenses",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M16 3h5v5M4 21l5-5M21 3l-16 16" />
          <path d="M21 21v-5h-5M4 4h5v5" />
        </svg>
      ),
      label: "Purchase Order",
      to: "/purchase-order",
      moduleName: "purchaseOrders",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      ),
      label: "Stock",
      to: "/stock",
      moduleName: "stock",
    },
    {
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 14l3-3 6 6 4-8" />
          <path d="M7 10l3-3 6 6" opacity="0.3" />
        </svg>
      ),
      label: "Financial Progress",
      to: "/company-financial-progress",
      moduleName: "financialProgress",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      ),
      label: "Settings",
      to: "/settings",
      moduleName: "settings",
    },
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear auth and other local storage items and redirect to login
    try {
      localStorage.clear();
    } catch (e) {
      console.warn('Failed to clear localStorage during logout', e);
    }
    navigate('/login');
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleMobileMenu}
        className="sm:hidden fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md"
        aria-label="Open menu"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Sidebar */}
      <div
        className={`
        fixed sm:relative z-20
        ${isCollapsed ? "w-16" : "w-56 sm:w-64"}
        ${isMobileOpen ? "left-0" : "-left-full sm:left-0"}
        min-w-[80px] bg-white border-r border-gray-200 p-3 sm:p-6
        flex flex-col min-h-screen transition-all duration-300 ease-in-out
        shadow-lg sm:shadow-none rounded-[30px]
      `}
      >
        {/* Logo and Collapse button */}
        <div className="flex items-center justify-between mb-4 p-2">
              {!isCollapsed ? (
            <div className="flex items-center gap-3 rounded-full">
              <img
                src={companyLogo}
                alt={companyName}
                className="h-14 w-auto object-contain"
              />
              <div className="hidden sm:block">
                <div className="text-lg font-bold text-gray-800">{companyName}</div>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 flex items-center justify-center">
              <img
                src={companyLogo || Logo2}
                alt="Company Logo"
                className="h-10 w-15 object-contain"
              />
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="hidden sm:block p-1 rounded-full hover:bg-gray-100 ml-auto"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-500"
            >
              {isCollapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation items */}
        <div className="space-y-3 overflow-y-auto flex-grow">
          {navItems
            .filter(item => {
              // Hide items explicitly marked as hidden
              if (item.hidden) return false;
              
              // If user has modules array, filter by module access
              if (auth.user?.modules && item.moduleName) {
                return auth.user.modules.includes(item.moduleName);
              }
              
              // If no modules array, show all items (admin access)
              return true;
            })
            .map((item) => (
              <NavItem
                key={item.to}
                icon={item.icon}
                label={item.label}
                isActive={location.pathname === item.to}
                isCollapsed={isCollapsed}
                to={item.to}
              />
            ))}
        </div>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={toggleMobileMenu}
            className="sm:hidden mt-auto p-3 text-gray-500 hover:bg-gray-100 rounded-md w-full text-left flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Close Menu
          </button>
        )}

        {/* Logout area pinned to bottom */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${isCollapsed ? 'justify-center bg-transparent text-gray-700 hover:bg-red-50 hover:text-red-600' : 'bg-red-600 text-white hover:bg-red-700 shadow-sm'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 sm:hidden"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
};

export default Sidebar;
