import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  FileDown,
  Ellipsis,
  Edit,
  Trash2,
  Plus,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building
} from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { API_ENDPOINTS } from '../config/api';

console.log('CustomersTable - API_ENDPOINTS:', API_ENDPOINTS);

const ITEMS_PER_PAGE = 10;

const CustomersTable = () => {
  const [customersData, setCustomersData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const dropdownRef = useRef(null);

  // Add click outside handler for edit modal
  const editModalRef = useClickOutside(() => {
    if (showEditModal) {
      setShowEditModal(false);
      setEditingCustomer(null);
    }
  }, showEditModal);

  // Fetch customers data from API
  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.CUSTOMERS.LIST);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setCustomersData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers. Please try again later.');
      setCustomersData([]);
    } finally {
      setLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const navigate = useNavigate();

  const filteredCustomers = customersData
    .filter(customer =>
      (customer?.customer || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer?.phone || '').includes(searchTerm) ||
      (customer?.company || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    ;

  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleCustomers = filteredCustomers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Clamp currentPage if filters reduce totalPages
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages]);

  const toggleSelectAll = () => {
    if (selectedRows.length === visibleCustomers.length && visibleCustomers.length > 0) {
      setSelectedRows([]);
    } else {
      setSelectedRows(visibleCustomers.map(customer => customer.customer_id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedRows([]);
    }
  };

  // ...existing code...

  const formatDate = (iso) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    // dd/mm/yyyy
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // filters removed: searchTerm controls client-side filtering

  const toggleDropdown = (customerId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === customerId ? null : customerId);
  };

  const showNotification = (title, description, duration = 3000) => {
    setNotification({ title, description });
    setTimeout(() => setNotification(null), duration);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (customer) => {
    if (window.confirm(`Are you sure you want to delete customer "${customer.customer}"?`)) {
      try {
        const response = await fetch(API_ENDPOINTS.CUSTOMERS.UPDATE(customer.customer_id), {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete customer');
        }

        await fetchCustomers();
        showNotification("Contact Person deleted", `Contact Person '${customer.customer}' has been deleted.`);
      } catch (err) {
        console.error('Error deleting contact person:', err);
        showNotification("Error", "Failed to delete contact person. Please try again.");
      }
    }
    setActiveDropdown(null);
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} selected customers?`)) {
      setIsBulkDeleting(true);

      try {
        const deletePromises = selectedRows.map(id =>
          fetch(API_ENDPOINTS.CUSTOMERS.DELETE(id), {
            method: 'DELETE'
          })
        );

        await Promise.all(deletePromises);

        await fetchCustomers();
        showNotification("Bulk delete successful", `${selectedRows.length} customers have been deleted`);
        setSelectedRows([]);
      } catch (err) {
        console.error('Error during bulk delete:', err);
        showNotification("Error", "Failed to delete some customers. Please try again.");
      } finally {
        setIsBulkDeleting(false);
      }
    }
  };



  const handleAddCustomer = () => {
    const newCustomer = {
      customer: '',
      company: '',
      date: new Date().toISOString().split('T')[0],
      phone: '',
      address: '',
      email: '',
      stn: '',
      ntn: ''
    };

    setEditingCustomer(newCustomer);
    setShowEditModal(true);
  };

  // FIXED: send keys that match backend: customer, company, date, phone, address, email, stn, ntn
  const handleSaveCustomer = async (updatedCustomer) => {
    try {
      // Check for duplicate email, phone, STN, or NTN (excluding current customer when editing)
      const duplicateCheck = customersData.find(customer => {
        // Skip the current customer when editing
        if (updatedCustomer.customer_id && customer.customer_id === updatedCustomer.customer_id) {
          return false;
        }

        // Check if any unique identifier matches
        const emailMatch = customer.email && updatedCustomer.email && 
                          customer.email.toLowerCase() === updatedCustomer.email.toLowerCase();
        const phoneMatch = customer.phone && updatedCustomer.phone && 
                          customer.phone === updatedCustomer.phone;
        const stnMatch = customer.stn && updatedCustomer.stn && 
                        customer.stn === updatedCustomer.stn;
        const ntnMatch = customer.ntn && updatedCustomer.ntn && 
                        customer.ntn === updatedCustomer.ntn;

        return emailMatch || phoneMatch || stnMatch || ntnMatch;
      });

      if (duplicateCheck) {
        // Determine which field is duplicate
        let duplicateFields = [];
        if (duplicateCheck.email.toLowerCase() === updatedCustomer.email.toLowerCase()) {
          duplicateFields.push('Email');
        }
        if (duplicateCheck.phone === updatedCustomer.phone) {
          duplicateFields.push('Phone Number');
        }
        if (duplicateCheck.stn === updatedCustomer.stn) {
          duplicateFields.push('STN');
        }
        if (duplicateCheck.ntn === updatedCustomer.ntn) {
          duplicateFields.push('NTN');
        }

        showNotification(
          "Duplicate Co",
          `A customer with the same ${duplicateFields.join(', ')} already exists: "${duplicateCheck.customer}"`
        );
        return;
      }

      let response;

      const payload = {
        customer: updatedCustomer.customer,
        company: updatedCustomer.company || null,
        date: updatedCustomer.date,
        phone: updatedCustomer.phone,
        address: updatedCustomer.address,
        email: updatedCustomer.email,
        stn: updatedCustomer.stn,
        ntn: updatedCustomer.ntn
      };

      const baseApi = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

      if (updatedCustomer.customer_id) {
        const url = (API_ENDPOINTS && API_ENDPOINTS.CUSTOMERS && typeof API_ENDPOINTS.CUSTOMERS.UPDATE === 'function')
          ? API_ENDPOINTS.CUSTOMERS.UPDATE(updatedCustomer.customer_id)
          : `${baseApi}/v1/customertable/${updatedCustomer.customer_id}`;

        if (!url) {
          console.error('Update URL is undefined. API endpoints:', API_ENDPOINTS);
          throw new Error('API endpoint for updating customer is not configured');
        }

        console.log('Updating customer at:', url);
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      } else {
        const url = (API_ENDPOINTS && API_ENDPOINTS.CUSTOMERS && API_ENDPOINTS.CUSTOMERS.CREATE)
          ? API_ENDPOINTS.CUSTOMERS.CREATE
          : `${baseApi}/v1/customertable`;

        if (!url) {
          console.error('Create URL is undefined. API endpoints:', API_ENDPOINTS);
          throw new Error('API endpoint for creating customer is not configured');
        }

        console.log('Creating customer at:', url);
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        });
      }

      if (!response.ok) {
        // try to parse error body if available
        let errText = 'Failed to save customer';
        try {
          const errJson = await response.json();
          errText = errJson.message || JSON.stringify(errJson);
        } catch (_) {}
        throw new Error(errText);
      }

      await fetchCustomers();
      setShowEditModal(false);
      setEditingCustomer(null);

      showNotification(
        updatedCustomer.customer_id ? "Contact Person updated" : "Contact Person created",
        `Contact Person '${updatedCustomer.customer}' has been ${updatedCustomer.customer_id ? 'updated' : 'created'}.`
      );
    } catch (err) {
      console.error('Error saving contact person:', err);
      showNotification("Error", err.message || "Failed to save contact person. Please try again.");
    }
  };

  const handleAction = (action, customer) => {
    switch (action) {
      case 'edit':
        handleEdit(customer);
        break;
      case 'delete':
        handleDelete(customer);
        break;

      default:
        break;
    }
  };

  // Edit Modal Component
  const EditCustomerModal = () => {
    const [formData, setFormData] = useState(editingCustomer || {});

    // FIXED: re-sync form whenever editingCustomer changes
    useEffect(() => {
      setFormData(editingCustomer || {});
    }, [editingCustomer]);

    const handleChange = (e) => {
      const { name, value: rawValue } = e.target;
      let value = rawValue;

      // If editing customer name, allow letters and spaces only
      if (name === 'customer') {
        value = (value || '').toString().replace(/[^A-Za-z\s]/g, '');
        // collapse multiple spaces to a single space and preserve typing
        value = value.replace(/\s+/g, ' ');
      }

      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();

      // Basic validation: ensure required fields exist
      if (!formData.customer || !formData.email || !formData.phone || !formData.address || !formData.date || !formData.stn || !formData.ntn) {
        showNotification('Validation', 'Please fill all required fields including STN and NTN.');
        return;
      }

      // Validate customer name contains only letters and spaces
      const nameVal = (formData.customer || '').toString().trim();
      if (!/^[A-Za-z]+(?:\s[A-Za-z]+)*$/.test(nameVal)) {
        showNotification('Validation', 'Contact Person name can contain letters and spaces only');
        return;
      }

      handleSaveCustomer(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div ref={editModalRef} className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            {formData.customer_id ? 'Edit Contact Person' : 'Add New Contact Person'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person Name *</label>
              <input
                type="text"
                name="customer"
                value={formData.customer || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                name="company"
                value={formData.company || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={(e) => {
                  // Allow only numeric values, spaces, parentheses, and + or -
                  const filteredValue = e.target.value.replace(/[^0-9\-\+\(\)\s]/g, '');
                  handleChange({
                    target: {
                      name: 'phone',
                      value: filteredValue,
                    },
                  });
                }}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter phone number"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Enter full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">STN Number *</label>
              <input
                type="text"
                name="stn"
                value={formData.stn || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Sales Tax Number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NTN Number *</label>
              <input
                type="text"
                name="ntn"
                value={formData.ntn || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="National Tax Number"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => { setShowEditModal(false); setEditingCustomer(null); }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {formData.customer_id ? 'Update Contact Person' : 'Create Contact Person'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-500 mt-3">Loading customers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-500 mb-2">{error}</div>
          <button
            onClick={fetchCustomers}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-lg max-w-sm transition-opacity duration-300">
          <div className="font-bold">{notification.title}</div>
          <div>{notification.description}</div>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg flex justify-between items-center">
          <div className="text-sm text-blue-800 flex items-center gap-2">
            <span className="bg-blue-200 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center">
              {selectedRows.length}
            </span>
            <span>customer(s) selected</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-md text-sm hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              {isBulkDeleting ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Selected</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <User className="w-5 h-5" />
            Contact Persons
          </h2>
        </div>

        <div className="flex flex-col xs:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search customers..."
              className="pl-10 pr-4 py-2.5 border rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              onClick={handleAddCustomer}
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact Person</span>
            </button>
            <button className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors">
              <FileDown className="w-4 h-4" />
              <span className="hidden xs:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters removed - search input remains */}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-3">
                <input
                  type="checkbox"
                  checked={
                    visibleCustomers.length > 0 &&
                    selectedRows.length === visibleCustomers.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
              </th>
              <th className="px-6 py-3">Contact Person</th>
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3 hidden lg:table-cell">Date</th>
              <th className="px-6 py-3">Ledger</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400">
                    <User className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm">No customers found</p>
                    <button
                      onClick={handleAddCustomer}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Add your first customer
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              visibleCustomers.map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(customer.customer_id)}
                      onChange={() => toggleSelectRow(customer.customer_id)}
                      className="rounded text-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{customer.customer}</div>
                        {customer.company && (
                          <div className="text-xs text-gray-500 flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {customer.company}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {customer.email}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate max-w-xs">{customer.address}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(customer.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      onClick={() => navigate(`/ledger?customerId=${customer.customer_id}`)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
                    >
                      View Ledger
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                    <button
                      className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100 transition-colors"
                      onClick={(e) => toggleDropdown(customer.customer_id, e)}
                    >
                      <Ellipsis className="h-5 w-5" />
                    </button>

                    {activeDropdown === customer.customer_id && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 z-50 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1"
                      >
                        {/* View Ledger moved to its own column */}
                        <button
                          onClick={() => handleAction('edit', customer)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors"
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleAction('delete', customer)}
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>

                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredCustomers.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 bg-white gap-3 mt-4">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} results
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-2 py-1.5 text-gray-500">...</span>
            )}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                  currentPage === totalPages
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {totalPages}
              </button>
            )}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && <EditCustomerModal />}
    </div>
  );
};

export default CustomersTable;
