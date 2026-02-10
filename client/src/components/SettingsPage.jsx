import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Lock, Mail, User, Building2, Phone, Eye, EyeOff, CheckCircle, Pencil, RefreshCcw, X, Shield, UserPlus, Settings as SettingsIcon, Users
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import defaultAvatar from '../assets/header/pfp.png';
import { rolesAPI, usersAPI } from '../services/roleService';

const SettingsPage = () => {
  // User data state
  const [userData, setUserData] = useState({
    id: null,
    name: '',
    email: '',
    phone: '',
    company: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    role: 'admin',
    twoFactorEnabled: true,
    notifications: true
  });

  // New user state
  const [newUser, setNewUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: null,
    company: '',
    profilePicture: null,
    profilePicturePreview: null
  });

  // Role management state
  const [roles, setRoles] = useState([]);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [editingRole, setEditingRole] = useState(null);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Modules state (simplified: just list of accessible modules)
  const [modules, setModules] = useState([]);
  const [availableModules] = useState([
    'dashboard', 'invoices', 'customers', 'expenses', 
    'purchaseOrders', 'stock', 'financialProgress', 'settings'
  ]);

  // Module descriptions for display
  const moduleDescriptions = {
    dashboard: { title: 'Dashboard' },
    invoices: { title: 'Invoices' },
    customers: { title: 'Customers' },
    expenses: { title: 'Expenses' },
    purchaseOrders: { title: 'Purchase Orders' },
    stock: { title: 'Stock' },
    financialProgress: { title: 'Financial Progress' },
    settings: { title: 'Settings' }
  };

  const [selectedUserForPrivileges, setSelectedUserForPrivileges] = useState('');

  // UI state
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [isEditing, setIsEditing] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
    newUserPassword: false,
    confirmNewUserPassword: false,
    editUserPassword: false
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [localInputs, setLocalInputs] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    company: '',
    profilePicture: null,
    profilePicturePreview: null
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  
  const auth = useAuth();

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setIsLoadingRoles(true);
        const response = await rolesAPI.getAll();
        if (response.success) {
          setRoles(response.data);
          // Set first role as selected if available
          if (response.data.length > 0) {
            setSelectedUserForPrivileges(response.data[0].name);
            // Also set the first role for new user form
            setNewUser(prev => ({
              ...prev,
              role: response.data[0].name
            }));
          }
        } else {
          console.error('Failed to fetch roles:', response.message);
        }
      } catch (error) {
        console.error('Error fetching roles:', error);
      } finally {
        setIsLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // Load modules when a role is selected
  useEffect(() => {
    if (!selectedUserForPrivileges || roles.length === 0) return;

    const selectedRole = roles.find(r => r.name === selectedUserForPrivileges);
    if (!selectedRole) return;

    const loadModules = async () => {
      try {
        const response = await rolesAPI.getModules(selectedRole.id);
        if (response.success) {
          setModules(response.data);
        } else {
          console.error('Failed to load modules:', response.message);
        }
      } catch (error) {
        console.error('Error loading modules:', error);
      }
    };

    loadModules();
  }, [selectedUserForPrivileges, roles]);

  // Role management functions
  const handleAddRole = async () => {
    if (newRole.name.trim() && newRole.description.trim()) {
      try {
        const response = await rolesAPI.create({
          name: newRole.name.trim(),
          description: newRole.description.trim()
        });
        
        if (response.success) {
          // Add new role to state
          setRoles([...roles, {
            id: response.data.id,
            name: response.data.name,
            description: response.data.description
          }]);
          setNewRole({ name: '', description: '' });
          setIsAddRoleModalOpen(false);
          showSuccess('Role added successfully!');
        } else {
          showError(response.message || 'Failed to add role');
        }
      } catch (error) {
        console.error('Error adding role:', error);
        showError('Failed to add role');
      }
    }
  };

  const handleDeleteRole = async (roleId) => {
    const roleToDelete = roles.find(r => r.id === roleId);
    if (roleToDelete) {
      try {
        const response = await rolesAPI.delete(roleId);
        
        if (response.success) {
          setRoles(roles.filter(r => r.id !== roleId));
          if (selectedUserForPrivileges === roleToDelete.name) {
            const remainingRoles = roles.filter(r => r.id !== roleId);
            setSelectedUserForPrivileges(remainingRoles[0]?.name || '');
          }
          showSuccess('Role deleted successfully!');
        } else {
          showError(response.message || 'Failed to delete role');
        }
      } catch (error) {
        console.error('Error deleting role:', error);
        showError('Failed to delete role');
      }
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setNewRole({ name: role.name, description: role.description });
    setIsAddRoleModalOpen(true);
  };

  const handleUpdateRole = async () => {
    if (editingRole && newRole.name.trim() && newRole.description.trim()) {
      try {
        const response = await rolesAPI.update(editingRole.id, {
          name: newRole.name.trim(),
          description: newRole.description.trim()
        });
        
        if (response.success) {
          setRoles(roles.map(r => 
            r.id === editingRole.id 
              ? { ...r, name: newRole.name.trim(), description: newRole.description.trim() }
              : r
          ));
          if (selectedUserForPrivileges === editingRole.name) {
            setSelectedUserForPrivileges(newRole.name.trim());
          }
          setNewRole({ name: '', description: '' });
          setEditingRole(null);
          setIsAddRoleModalOpen(false);
          showSuccess('Role updated successfully!');
        } else {
          showError(response.message || 'Failed to update role');
        }
      } catch (error) {
        console.error('Error updating role:', error);
        showError('Failed to update role');
      }
    }
  };

  // Helper function to show errors
  const showError = (message) => {
    setErrors({ general: message });
    setTimeout(() => setErrors({}), 5000);
  };
  const editingRef = useRef(isEditing);
  
  useEffect(() => { editingRef.current = isEditing; }, [isEditing]);

  // Load user data from database
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Try company settings endpoint first (no user ID dependency)
        try {
          const companyRes = await fetch(API_ENDPOINTS.SETTINGS.COMPANY);
          if (companyRes.ok) {
            const companyData = await companyRes.json();
            if (companyData && companyData.company) {
              if (!editingRef.current) {
                setUserData({
                  id: 1, // Use default ID for company-wide settings
                  name: companyData.company.name || 'A Rauf Textile',
                  email: companyData.company.email || '',
                  phone: companyData.company.phone || '',
                  company: companyData.company.name || 'A Rauf Textile',
                  address: companyData.company.address || '',
                  username: companyData.company.email?.split('@')[0] || '',
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                  twoFactorEnabled: false,
                  notifications: false,
                });
              }
              return; // Success, exit
            }
          }
        } catch (err) {
          console.debug('Company settings fetch failed, trying user settings:', err);
        }

        // Fallback to user-specific settings
        const currentUser = auth.user || {};
        const userId = currentUser.id || 1;
        
        const response = await fetch(API_ENDPOINTS.SETTINGS.USER(userId));
        if (!response.ok) {
          console.debug(`Settings endpoint returned ${response.status}. Using defaults.`);
          return;
        }
        const data = await response.json();

        if (data && data.success && data.data) {
          const { personal, security } = data.data;
          if (!editingRef.current) {
            setUserData({
              id: userId,
              name: `${personal.firstName} ${personal.lastName}`,
              email: personal.email,
              phone: personal.phone || '',
              company: personal.company || 'A Rauf Textile',
              address: personal.address || '',
              username: personal.email.split('@')[0],
              currentPassword: '',
              newPassword: '',
              confirmPassword: '',
              role: 'admin',
              twoFactorEnabled: security.twoFactorEnabled || false,
              notifications: security.loginNotifications || true
            });
            
            const profilePic = personal.profile_picture_url || personal.profilePicture || personal.avatar || personal.profilePictureUrl || null;
            if (profilePic) {
              const avatarUrl = /^https?:\/\//.test(profilePic)
                ? profilePic
                : `${process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000'}/uploads/profile-pictures/${profilePic}`;
              setAvatar(avatarUrl);
            }
            
            setLocalInputs({
              name: `${personal.firstName} ${personal.lastName}`,
              email: personal.email,
              phone: personal.phone || '',
              company: personal.company || 'A Rauf Textile'
            });
          }
        }
      } catch (error) {
        showError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [auth.user?.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalInputs(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, avatar: 'Image size should be less than 2MB' }));
      return;
    }

    if (!file.type.match('image.*')) {
      setErrors(prev => ({ ...prev, avatar: 'Please select an image file' }));
      return;
    }

    setIsUploading(true);
    setErrors(prev => ({ ...prev, avatar: '' }));

    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);

    const userId = (auth && auth.user && auth.user.id) || userData.id || 1;
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const res = await fetch(API_ENDPOINTS.SETTINGS.UPLOAD_PROFILE(userId), {
        method: 'POST',
        body: formData
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        setErrors(prev => ({ ...prev, avatar: result.message || 'Failed to upload profile picture' }));
        showError(result.message || 'Failed to upload profile picture');
        URL.revokeObjectURL(previewUrl);
        setIsUploading(false);
        return;
      }

      const serverUrl = result.data && result.data.profilePictureUrl ? result.data.profilePictureUrl : null;
      const baseUrl = process.env.REACT_APP_AUTH_BASE_URL || 'http://localhost:5000';
      const finalUrl = serverUrl ? (serverUrl.startsWith('http') ? serverUrl : `${baseUrl}${serverUrl}`) : previewUrl;
      setAvatar(finalUrl);
      showSuccess('Profile picture uploaded successfully');
      URL.revokeObjectURL(previewUrl);
    } catch (err) {
      setErrors(prev => ({ ...prev, avatar: 'Error uploading image' }));
      showError('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        const val = (value || '').toString().trim();
        if (!val) {
          newErrors.name = 'Full name is required';
        } else if (!/^[A-Za-z]+(?:\s[A-Za-z]+)*$/.test(val)) {
          newErrors.name = 'Full name can contain letters and spaces only';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value.trim()) newErrors.email = 'Email is required';
        else if (!/^\S+@\S+\.\S+$/.test(value)) newErrors.email = 'Invalid email format';
        else delete newErrors.email;
        break;
      case 'phone':
        if (!value.trim()) newErrors.phone = 'Phone is required';
        else if (!/^\d{10,15}$/.test(value)) newErrors.phone = 'Invalid phone number';
        else delete newErrors.phone;
        break;
      case 'newPassword':
        if (value && value.length < 8) newErrors.newPassword = 'Password must be at least 8 characters';
        else delete newErrors.newPassword;
        break;
      case 'confirmPassword':
        if (userData.newPassword && value !== userData.newPassword) newErrors.confirmPassword = 'Passwords do not match';
        else delete newErrors.confirmPassword;
        break;
      default:
        if (!value.trim()) newErrors[name] = 'This field is required';
        else delete newErrors[name];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleSubmit = async (section) => {
    setIsEditing(null);
    
    const fieldsToValidate = {
      profile: ['name', 'email', 'phone', 'company'],
      security: userData.newPassword ? ['newPassword', 'confirmPassword'] : []
    }[section];

    let isValid = true;
    const merged = { ...userData, ...localInputs };
    fieldsToValidate?.forEach(field => {
      if (!validateField(field, merged[field])) {
        isValid = false;
      }
    });

    if (!isValid) return;

    setIsLoading(true);
    
    try {
      if (section === 'profile') {
        const [firstName, ...lastNameParts] = merged.name.split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        const response = await fetch(API_ENDPOINTS.SETTINGS.USER(userData.id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personal: {
              firstName,
              lastName,
              email: merged.email,
              phone: merged.phone,
              company: merged.company
            },
            security: {
              twoFactorEnabled: userData.twoFactorEnabled,
              loginNotifications: userData.notifications
            }
          }),
        });
        
        if (!response.ok) {
          showError(`API error: ${response.status}. Profile updated locally.`);
          setLocalInputs({});
          return;
        }
        const data = await response.json();
        if (data.success) {
          showSuccess('Profile updated successfully');
          setLocalInputs({});
        } else {
          showError(data.message || 'Failed to update profile');
        }
      } else if (section === 'security' && userData.newPassword) {
        const response = await fetch(API_ENDPOINTS.SETTINGS.USER(userData.id), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: {
              currentPassword: userData.currentPassword,
              newPassword: userData.newPassword,
            }
          }),
        });
        
        if (!response.ok) {
          showError(`API error: ${response.status}. Please check your connection.`);
          return;
        }
        
        const data = await response.json();
        if (data.success) {
          setUserData(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          setLocalInputs({});
          showSuccess('Password updated successfully');
        } else {
          showError(data.message || 'Failed to update password');
        }
      }
    } catch (error) {
      showError('Failed to update settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setErrors({});
    setLocalInputs({});
  };

  // Handle creating a new user
  const handleCreateUser = async () => {
    // Validation
    if (!newUser.firstName.trim()) {
      showError('First name is required');
      return;
    }
    if (!newUser.lastName.trim()) {
      showError('Last name is required');
      return;
    }
    if (!newUser.email.trim()) {
      showError('Email is required');
      return;
    }
    if (!newUser.password) {
      showError('Password is required');
      return;
    }
    if (newUser.password !== newUser.confirmPassword) {
      showError('Passwords do not match');
      return;
    }
    if (!newUser.role) {
      showError('Role is required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      showError('Invalid email format');
      return;
    }

    try {
      setIsAddingUser(true);
      
      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append('firstName', newUser.firstName.trim());
      formData.append('lastName', newUser.lastName.trim());
      formData.append('email', newUser.email.trim());
      formData.append('phone', newUser.phone.trim() || '');
      formData.append('password', newUser.password);
      formData.append('role', newUser.role);
      formData.append('company', newUser.company.trim() || '');
      
      // Add profile picture if selected
      if (newUser.profilePicture) {
        formData.append('profilePicture', newUser.profilePicture);
      }

      // Call the users API to create the user
      const response = await fetch(API_ENDPOINTS.USERS.LIST, {
        method: 'POST',
        body: formData // Don't set Content-Type header, let browser set it with boundary
      });

      const data = await response.json();

      if (data.success) {
        showSuccess(`User ${newUser.firstName} ${newUser.lastName} created successfully!`);
        setNewUser({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          role: roles.length > 0 ? roles[0].name : null,
          company: '',
          profilePicture: null,
          profilePicturePreview: null
        });
        setErrors({});
      } else {
        showError(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Failed to create user. Please try again.');
    } finally {
      setIsAddingUser(false);
    }
  };

  // Handle profile picture selection for new user
  const handleNewUserProfilePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showError('Profile picture must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setNewUser(prev => ({
      ...prev,
      profilePicture: file,
      profilePicturePreview: previewUrl
    }));
  };

  const renderEditableField = (field, label, icon, type = 'text') => {
    const isEditingSection = isEditing === activeTab;
    
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          {icon}
          {label}
        </label>
        
        {isEditingSection ? (
          <div className="flex flex-col space-y-2">
            <div className="relative">
              <input
                type={type === 'password' && showPassword[field] ? 'text' : type}
                name={field}
                value={localInputs[field] !== undefined ? localInputs[field] : (userData[field] || '')}
                onChange={handleChange}
                className={`w-full px-4 py-3 border ${errors[field] ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${type === 'password' ? 'pr-10' : ''}`}
                placeholder={label}
              />
              {type === 'password' && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))}
                >
                  {showPassword[field] ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              )}
            </div>
            {errors[field] && (
              <p className="text-red-500 text-xs">{errors[field]}</p>
            )}
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg w-full">
              {type === 'password' ? '••••••••' : userData[field] || '-'}
            </p>
          </div>
        )}
      </div>
    );
  };

  // Fetch all users with their roles and modules
  const fetchAllUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const response = await usersAPI.getAll();
      if (response.success) {
        // Fetch modules for each user
        const usersWithModules = await Promise.all(
          response.data.map(async (user) => {
            if (user.role_id) {
              try {
                const modulesResponse = await rolesAPI.getModules(user.role_id);
                return {
                  ...user,
                  modules: modulesResponse.success ? modulesResponse.data : []
                };
              } catch (err) {
                return { ...user, modules: [] };
              }
            }
            return { ...user, modules: [] };
          })
        );
        setAllUsers(usersWithModules);
      } else {
        setAllUsers([]);
        setErrors(prev => ({ ...prev, general: 'Failed to fetch users' }));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAllUsers([]);
      setErrors(prev => ({ ...prev, general: 'Error loading users' }));
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Refresh modules for current user
  const refreshMyModules = async () => {
    try {
      const userId = auth?.user?.id;
      if (!userId) return;
      
      const response = await fetch(API_ENDPOINTS.USERS.MODULES(userId));
      const data = await response.json();
      
      if (data.success) {
        // Update user in context with new modules
        const updatedUser = { ...auth.user, modules: data.data };
        auth.login(updatedUser);
        showSuccess('Modules refreshed successfully! You now have access to ' + data.data.length + ' modules.');
      } else {
        showError(data.message || 'Failed to refresh modules');
      }
    } catch (error) {
      console.error('Error refreshing modules:', error);
      showError('Error refreshing modules');
    }
  };

  // Open edit modal for user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setEditUserForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      company: user.company || '',
      profilePicture: null,
      profilePicturePreview: user.profile_picture_url || null
    });
    setShowEditModal(true);
  };

  // Handle profile picture selection for edit user
  const handleEditUserProfilePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showError('Profile picture must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setEditUserForm(prev => ({
      ...prev,
      profilePicture: file,
      profilePicturePreview: previewUrl
    }));
  };

  // Save user changes
  const handleSaveUserChanges = async () => {
    if (!editUserForm.firstName || !editUserForm.lastName || !editUserForm.email) {
      setErrors(prev => ({ ...prev, userForm: 'First name, last name, and email are required' }));
      return;
    }

    try {
      setIsSavingUser(true);
      
      // Create FormData for multipart/form-data upload
      const formData = new FormData();
      formData.append('firstName', editUserForm.firstName);
      formData.append('lastName', editUserForm.lastName);
      formData.append('email', editUserForm.email);
      formData.append('phone', editUserForm.phone || '');
      formData.append('company', editUserForm.company || '');

      // Only include password if it was changed
      if (editUserForm.password) {
        formData.append('password', editUserForm.password);
      }

      // Add profile picture if selected
      if (editUserForm.profilePicture) {
        formData.append('profilePicture', editUserForm.profilePicture);
      }

      const response = await fetch(`${API_ENDPOINTS.USERS.LIST}/${editingUser.id}`, {
        method: 'PUT',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Refresh users list
        await fetchAllUsers();
        setShowEditModal(false);
        setEditingUser(null);
        setSuccessMessage('User updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors(prev => ({ ...prev, userForm: data.message || 'Failed to update user' }));
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors(prev => ({ ...prev, userForm: 'Error updating user' }));
    } finally {
      setIsSavingUser(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    try {
      const response = await usersAPI.delete(userId);
      
      if (response.success) {
        setAllUsers(prev => prev.filter(u => u.id !== userId));
        setShowDeleteConfirm(null);
        setSuccessMessage('User deleted successfully');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrors(prev => ({ ...prev, general: response.message || 'Failed to delete user' }));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setErrors(prev => ({ ...prev, general: 'Error deleting user' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Simplified Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2.5 rounded-lg shadow-md">
                <SettingsIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                <p className="text-sm text-gray-600">Manage your account and system preferences</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success message */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 text-green-700 px-5 py-4 rounded-lg flex items-center gap-3 shadow-md animate-in slide-in-from-top duration-300">
            <CheckCircle className="h-6 w-6 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
            <button 
              onClick={() => setSuccessMessage('')} 
              className="ml-auto text-green-700 hover:text-green-900 hover:bg-green-100 p-1 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {errors.general && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 text-red-700 px-5 py-4 rounded-lg flex items-center gap-3 shadow-md animate-in slide-in-from-top duration-300">
            <X className="h-6 w-6 flex-shrink-0" />
            <span className="font-medium">{errors.general}</span>
            <button 
              onClick={() => setErrors(prev => ({ ...prev, general: '' }))} 
              className="ml-auto text-red-700 hover:text-red-900 hover:bg-red-100 p-1 rounded transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </div>
            </button>
            <button
              onClick={() => setActiveTab('addUser')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'addUser'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add User
              </div>
            </button>
            <button
              onClick={() => setActiveTab('privileges')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'privileges'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privileges
              </div>
            </button>
            {/*
            <button
              onClick={() => {
                setActiveTab('security');
                setIsLoadingUsers(false);
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Security
              </div>
            </button>
            */}
            <button
              onClick={() => {
                setActiveTab('viewUsers');
                fetchAllUsers();
              }}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-all whitespace-nowrap ${
                activeTab === 'viewUsers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                View Users
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-96 gap-4">
            <RefreshCcw className="h-12 w-12 text-blue-500 animate-spin" />
            <p className="text-gray-600 font-medium">Loading settings...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-gray-600 mt-1">Your account details</p>
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> To edit your profile information, please use the <strong>View Users</strong> section in the Settings menu.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={refreshMyModules}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium shadow-sm"
                      title="Refresh module access"
                    >
                      <RefreshCcw className="h-4 w-4" />
                      Refresh Modules
                    </button>
                  </div>
                </div>

                {/* Profile Picture and Details in Single Row */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Company Logo Section */}
                  <div className="lg:col-span-1">
                    <div className="flex flex-col items-center lg:items-start">
                      <label className="text-sm font-medium text-gray-700 mb-3">Company Logo</label>
                      <div className="relative group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
                        <img
                          src={avatar || `${process.env.PUBLIC_URL}/logo.png`}
                          alt={userData.company || 'Company logo'}
                          onError={(e) => { e.target.onerror = null; e.target.src = `${process.env.PUBLIC_URL}/logo.png`; }}
                          className="relative h-28 w-28 rounded-lg object-contain border-3 border-white shadow-lg bg-white p-2"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-3 text-center lg:text-left">{userData.company || 'A Rauf Textile'}</p>
                    </div>
                  </div>

                  {/* Personal Details Section - Full Width */}
                  <div className="lg:col-span-4">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderEditableField('name', 'Full Name', <User className="h-4 w-4" />)}
                        {renderEditableField('email', 'Email', <Mail className="h-4 w-4" />, 'email')}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {renderEditableField('phone', 'Phone', <Phone className="h-4 w-4" />, 'tel')}
                        {renderEditableField('company', 'Company', <Building2 className="h-4 w-4" />)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Add User Tab */}
            {activeTab === 'addUser' && (
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">Add New User</h2>
                  <p className="text-gray-600 mt-1">Create a new user account and assign initial permissions</p>
                </div>

                <div className="max-w-7xl">
                  <div className="space-y-6">
                    {/* Profile Picture Upload */}
                    <div className="flex mb-6">
                      <div className="text-center">
                        <label className="text-sm font-medium text-gray-700 mb-3 block">
                          Profile Picture
                        </label>
                        <div className="relative inline-block">
                          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                            <img
                              src={newUser.profilePicturePreview || defaultAvatar}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                            <Pencil className="h-4 w-4" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleNewUserProfilePicture}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Max 5MB, JPG/PNG</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          First Name
                        </label>
                        <input
                          type="text"
                          value={newUser.firstName}
                          onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter first name"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={newUser.lastName}
                          onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Email
                        </label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="user@example.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Phone className="h-5 w-5" />
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={newUser.phone}
                          onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="03001234567"
                        />
                      </div>
                    </div>

                    {/* Company Field */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Company
                      </label>
                      <input
                        type="text"
                        value={newUser.company}
                        onChange={(e) => setNewUser({...newUser, company: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.newUserPassword ? 'text' : 'password'}
                            value={newUser.password}
                            onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                            placeholder="Enter password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(prev => ({ ...prev, newUserPassword: !prev.newUserPassword }))}
                          >
                            {showPassword.newUserPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Lock className="h-5 w-5" />
                          Confirm Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword.confirmNewUserPassword ? 'text' : 'password'}
                            value={newUser.confirmPassword}
                            onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                            placeholder="Confirm password"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(prev => ({ ...prev, confirmNewUserPassword: !prev.confirmNewUserPassword }))}
                          >
                            {showPassword.confirmNewUserPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Role
                      </label>
                      <select
                        value={newUser.role || ''}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="">Select a role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.name}>
                            {role.name} - {role.description}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => {
                          setNewUser({
                            firstName: '',
                            lastName: '',
                            email: '',
                            phone: '',
                            password: '',
                            confirmPassword: '',
                            role: roles.length > 0 ? roles[0].name : null,
                            company: '',
                            profilePicture: null,
                            profilePicturePreview: null
                          });
                        }}
                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={handleCreateUser}
                        disabled={isAddingUser}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAddingUser ? (
                          <>
                            <RefreshCcw className="h-5 w-5 animate-spin" />
                            Adding User...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-5 w-5" />
                            Add User
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privileges Tab */}
            {activeTab === 'privileges' && (
              <div className="p-8">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900">User Privileges</h2>
                  <p className="text-gray-600 mt-1">Manage access permissions for different users and roles</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* User Selection Sidebar */}
                  <div className="lg:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 sticky top-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Select User Role
                      </h3>
                      <button
                        onClick={() => setIsAddRoleModalOpen(true)}
                        className="w-full mb-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <UserPlus className="h-4 w-4" />
                        Add Role
                      </button>
                      <div className="space-y-2">
                        {roles.map((role) => (
                          <div key={role.id} className="relative group">
                            <div
                              onClick={() => setSelectedUserForPrivileges(role.name)}
                              className={`w-full text-left px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                                selectedUserForPrivileges === role.name
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  setSelectedUserForPrivileges(role.name);
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{role.name}</div>
                                  <div className="text-xs opacity-75 mt-1">
                                    {role.description}
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditRole(role);
                                    }}
                                    disabled={role.name === 'Admin'}
                                    className={`p-1 rounded hover:bg-opacity-20 ${
                                      role.name === 'Admin'
                                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                                        : selectedUserForPrivileges === role.name
                                        ? 'hover:bg-white text-white'
                                        : 'hover:bg-blue-100 text-blue-600'
                                    }`}
                                    title={role.name === 'Admin' ? 'Admin role cannot be edited' : 'Edit role'}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Delete role "${role.name}"?`)) {
                                        handleDeleteRole(role.id);
                                      }
                                    }}
                                    disabled={role.name === 'Admin'}
                                    className={`p-1 rounded hover:bg-opacity-20 ${
                                      role.name === 'Admin'
                                        ? 'opacity-50 cursor-not-allowed text-gray-400'
                                        : selectedUserForPrivileges === role.name
                                        ? 'hover:bg-white text-white'
                                        : 'hover:bg-red-100 text-red-600'
                                    }`}
                                    title={role.name === 'Admin' ? 'Admin role cannot be deleted' : 'Delete role'}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Module Access List */}
                  <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Access</h3>
                        <p className="text-sm text-gray-600 mb-6">Select modules this role can access. When a module is enabled, the role has full access to all features in that module.</p>
                        
                        <div className="space-y-3">
                          {availableModules.map((moduleName) => (
                            <label key={moduleName} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={modules.includes(moduleName)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setModules([...modules, moduleName]);
                                  } else {
                                    setModules(modules.filter(m => m !== moduleName));
                                  }
                                }}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                              />
                              <span className="ml-3 flex-1">
                                <div className="font-medium text-gray-900 capitalize">
                                  {moduleName.replace(/([A-Z])/g, ' $1').trim()}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {moduleName === 'dashboard' && 'View system dashboard and analytics'}
                                  {moduleName === 'invoices' && 'Manage invoices, payments, and billing'}
                                  {moduleName === 'customers' && 'Manage customer information and contacts'}
                                  {moduleName === 'expenses' && 'Track and manage business expenses'}
                                  {moduleName === 'purchaseOrders' && 'Create and manage purchase orders'}
                                  {moduleName === 'stock' && 'Manage inventory and stock levels'}
                                  {moduleName === 'financialProgress' && 'View financial reports and analytics'}
                                  {moduleName === 'settings' && 'Configure system and user settings'}
                                </div>
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                      <button
                        onClick={() => setModules([])}
                        disabled={selectedUserForPrivileges === 'Admin'}
                        className={`px-6 py-3 border border-gray-300 rounded-lg transition-colors ${
                          selectedUserForPrivileges === 'Admin'
                            ? 'opacity-50 cursor-not-allowed text-gray-400 bg-gray-50'
                            : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                        }`}
                        title={selectedUserForPrivileges === 'Admin' ? 'Cannot modify Admin role access' : 'Remove all module access'}
                      >
                        Remove All Access
                      </button>
                      <button
                        onClick={async () => {
                          const selectedRole = roles.find(r => r.name === selectedUserForPrivileges);
                          if (!selectedRole) {
                            showError({ message: 'Please select a role first' });
                            return;
                          }

                          try {
                            const response = await rolesAPI.updateModules(selectedRole.id, modules);
                            if (response.success) {
                              showSuccess('Module access updated successfully! Users with this role should click "Refresh Modules" in their profile to see the changes.');
                            } else {
                              showError({ message: response.message || 'Failed to update module access' });
                            }
                          } catch (error) {
                            showError({ message: error.message || 'Error saving module access' });
                          }
                        }}
                        disabled={selectedUserForPrivileges === 'Admin'}
                        className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-colors shadow-sm ${
                          selectedUserForPrivileges === 'Admin'
                            ? 'opacity-50 cursor-not-allowed bg-gray-400 text-white'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                        title={selectedUserForPrivileges === 'Admin' ? 'Cannot modify Admin role access' : 'Save module access settings'}
                      >
                        <CheckCircle className="h-5 w-5" />
                        Save Module Access
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/*
            Security Tab (commented out)
            {activeTab === 'security' && (
              <div className="p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
                    <p className="text-gray-600 mt-1">Manage your password and security preferences</p>
                  </div>
                  {isEditing !== 'security' ? (
                    <button
                      onClick={() => setIsEditing('security')}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      <Pencil className="h-5 w-5" />
                      Change Password
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelEdit}
                        className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSubmit('security')}
                        className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                      >
                        <CheckCircle className="h-5 w-5" />
                        Update Password
                      </button>
                    </div>
                  )}
                </div>

                <div className="max-w-3xl">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Password Requirements</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        At least 8 characters long
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Include uppercase and lowercase letters
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Include at least one number
                      </li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {renderEditableField('currentPassword', 'Current Password', <Lock className="h-5 w-5" />, 'password')}
                    {renderEditableField('newPassword', 'New Password', <Lock className="h-5 w-5" />, 'password')}
                    {renderEditableField('confirmPassword', 'Confirm New Password', <Lock className="h-5 w-5" />, 'password')}
                  </div>
                </div>
              </div>
            )}
            */}

            {/* View Users Tab */}
            {activeTab === 'viewUsers' && (
              <div className="p-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Manage Users</h2>
                    <p className="text-gray-600 mt-1">View all users with their roles and assigned privileges</p>
                  </div>
                </div>

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <RefreshCcw className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                      <p className="text-gray-600">Loading users...</p>
                    </div>
                  </div>
                ) : allUsers.length === 0 ? (
                  <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
                    <p className="text-gray-600">There are no users in the system yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Email</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Phone</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Password</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {allUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-semibold text-blue-600">
                                    {(user.firstName || 'U')[0]}
                                  </span>
                                </div>
                                <span className="text-sm font-medium text-gray-900">
                                  {user.firstName} {user.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{user.email}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm text-gray-600">{user.phone || '-'}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                {user.password || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                user.role_name === 'Admin' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role_name || 'No Role'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {user.email === 'admin@digious.com' ? (
                                  <span className="px-3 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded">Protected</span>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleEditUser(user)}
                                      className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                                      title="Edit user details"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => setShowDeleteConfirm(user.id)}
                                      className="px-3 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                                      title="Delete user"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Edit User: {editingUser.firstName} {editingUser.lastName}
                    </h3>
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    {errors.userForm && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {errors.userForm}
                      </div>
                    )}

                    {/* Profile Picture Upload */}
                    <div className="flex justify-center mb-4">
                      <div className="text-center">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">
                          Profile Picture
                        </label>
                        <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 bg-gray-100">
                            <img
                              src={editUserForm.profilePicturePreview || defaultAvatar}
                              alt="Profile preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-lg">
                            <Pencil className="h-3 w-3" />
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleEditUserProfilePicture}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Max 5MB</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={editUserForm.firstName}
                        onChange={(e) => setEditUserForm({...editUserForm, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={editUserForm.lastName}
                        onChange={(e) => setEditUserForm({...editUserForm, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editUserForm.email}
                        onChange={(e) => setEditUserForm({...editUserForm, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Phone
                      </label>
                      <input
                        type="text"
                        value={editUserForm.phone}
                        onChange={(e) => setEditUserForm({...editUserForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Company
                      </label>
                      <input
                        type="text"
                        value={editUserForm.company}
                        onChange={(e) => setEditUserForm({...editUserForm, company: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter company name"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-1">
                        Password (Leave empty to keep current)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword.editUserPassword ? 'text' : 'password'}
                          value={editUserForm.password}
                          onChange={(e) => setEditUserForm({...editUserForm, password: e.target.value})}
                          placeholder="Enter new password or leave empty"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => ({ ...prev, editUserPassword: !prev.editUserPassword }))}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword.editUserPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingUser(null);
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveUserChanges}
                      disabled={isSavingUser}
                      className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {isSavingUser ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg max-w-sm w-full mx-4">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Delete User
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Are you sure you want to delete this user? This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDeleteUser(showDeleteConfirm)}
                        className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Role Modal */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingRole ? 'Edit Role' : 'Add New Role'}
              </h3>
              <button
                onClick={() => {
                  setIsAddRoleModalOpen(false);
                  setEditingRole(null);
                  setNewRole({ name: '', description: '' });
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4" />
                  Role Name
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Sales Manager"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Description
                </label>
                <input
                  type="text"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="e.g., Access to sales and customer data"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsAddRoleModalOpen(false);
                  setEditingRole(null);
                  setNewRole({ name: '', description: '' });
                }}
                className="px-5 py-2.5 text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={editingRole ? handleUpdateRole : handleAddRole}
                disabled={!newRole.name.trim() || !newRole.description.trim()}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {editingRole ? 'Update Role' : 'Add Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
