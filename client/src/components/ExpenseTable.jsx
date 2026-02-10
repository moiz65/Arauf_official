import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, FileDown, Ellipsis, Edit, Trash2, Plus } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { API_ENDPOINTS } from '../config/api';

const ITEMS_PER_PAGE = 10;

const ExpenseTable = ({ expensesData = [], onExpensesChange }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    title: '',
    vendor: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    category: '',
    status: ''
  });
  // Temporary filters used in the filter panel to avoid live-fluctuation while typing
  const [tempFilters, setTempFilters] = useState({
    title: '',
    vendor: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: '',
    category: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [error, setError] = useState(null);
  const [allCategories, setAllCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const dropdownRef = useRef(null);
  const filterPanelRef = useRef(null);

  // Add click outside handler for edit modal (disabled when category modal is open)
  const editModalRef = useClickOutside(() => {
    if (showEditModal && !showCategoryModal) {
      setShowEditModal(false);
      setEditingExpense(null);
    }
  }, showEditModal && !showCategoryModal);

  // Add click outside handler for category modal
  const categoryModalRef = useClickOutside(() => {
    if (showCategoryModal) {
      setShowCategoryModal(false);
    }
  }, showCategoryModal);

  // Close modals when user presses Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (showEditModal) {
          setShowEditModal(false);
          setEditingExpense(null);
        }
        if (showCategoryModal) {
          setShowCategoryModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal, showCategoryModal]);

  const statusOptions = ['All', 'Paid', 'Pending'];
  const paymentMethods = ['Bank Transfer', 'Cash', 'Credit Card', 'Check', 'Online Payment'];

  // Fetch categories data from API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await fetch(API_ENDPOINTS.CATEGORIES.LIST());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      // Fetch all active categories regardless of type
      const activeCategories = result.data.filter(cat => cat.status === 'Active');
      setAllCategories(activeCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setAllCategories([]); // Fallback
    } finally {
      setCategoriesLoading(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ignore clicks inside the filter panel so inputs keep focus
      if (filterPanelRef.current && filterPanelRef.current.contains(event.target)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keep tempFilters in sync when opening the panel or when filters change externally
  useEffect(() => {
    if (showFilters) {
      setTempFilters({ ...filters });
    }
  }, [showFilters, filters]);



  const filteredExpenses = expensesData
    .filter(expense => {
      const q = (searchTerm || '').toString().toLowerCase();
      const title = (expense.title || '').toString().toLowerCase();
      const vendor = (expense.vendor || '').toString().toLowerCase();
      const desc = (expense.description || '').toString().toLowerCase();
      return title.includes(q) || vendor.includes(q) || desc.includes(q);
    })
    .filter(expense => {
      const title = (expense.title || '').toString().toLowerCase();
      const vendor = (expense.vendor || '').toString().toLowerCase();
      const amt = Number(expense.amount) || 0;
      const min = filters.minAmount ? Number(filters.minAmount) : null;
      const max = filters.maxAmount ? Number(filters.maxAmount) : null;
      const date = expense.date ? new Date(expense.date) : null;
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to = filters.dateTo ? new Date(filters.dateTo) : null;

      return (
        (!filters.title || title.includes((filters.title || '').toLowerCase())) &&
        (!filters.vendor || vendor.includes((filters.vendor || '').toLowerCase())) &&
        (min === null || amt >= min) &&
        (max === null || amt <= max) &&
        (!from || (date && date >= from)) &&
        (!to || (date && date <= to)) &&
        (!filters.category || expense.category === filters.category) &&
        (!filters.status || expense.status === filters.status)
      );
    });

  // Sort logic:
  // 1) Pending expenses first (newest created at top)
  // 2) Paid expenses next (newest paid/date at top)
  // 3) Others last
  const statusPriority = (s) => {
    if (!s) return 99;
    const st = s.toString().toLowerCase();
    if (st === 'pending') return 1;
    if (st === 'paid') return 2;
    return 3;
  };

  const parseDate = (d) => {
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? 0 : dt.getTime();
  };

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const pa = statusPriority(a.status);
    const pb = statusPriority(b.status);
    if (pa !== pb) return pa - pb;

    // Same priority: newest first by date field
    return parseDate(b.date) - parseDate(a.date);
  });

  const totalPages = Math.ceil(sortedExpenses.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleExpenses = sortedExpenses.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Ensure current page is valid when the number of pages changes
  useEffect(() => {
    setCurrentPage(prev => {
      const maxPage = totalPages || 1;
      return prev > maxPage ? maxPage : prev;
    });
  }, [totalPages]);

  // Compute pages to display in pagination (max 5 visible pages, with ellipses)
  const maxVisiblePages = 5;
  const pages = [];
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    const half = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = startPage + maxVisiblePages - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisiblePages + 1;
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
  }

  const toggleSelectAll = () => {
    if (selectedRows.length === visibleExpenses.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(visibleExpenses.map(expense => expense.id));
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

  const getStatusClass = (status) => {
    switch(status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  // Update temporary filter values while user edits the panel
  const handleTempFilterChange = (e) => {
    const { name, value } = e.target;
    setTempFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    const cleared = {
      title: '',
      vendor: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: '',
      category: '',
      status: ''
    };
    setFilters(cleared);
    setTempFilters(cleared);
    setSearchTerm('');
  };

  const toggleDropdown = (expenseId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === expenseId ? null : expenseId);
  };

  // Action functions with API calls
  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (expense) => {
    if (window.confirm(`Are you sure you want to delete expense "${expense.title}"?`)) {
      try {
        const response = await fetch(API_ENDPOINTS.EXPENSES.DELETE(expense.id), {
          method: 'DELETE'
        });

        if (!response.ok) {
          throw new Error('Failed to delete expense');
        }

        // Refresh the data after successful deletion
        if (onExpensesChange) {
          await onExpensesChange();
        }
      } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Failed to delete expense. Please try again.');
      }
    }
    setActiveDropdown(null);
  };




  const handleAddExpense = () => {
    const newExpense = {
      title: '',
      date: new Date().toISOString().split('T')[0],
      vendor: '',
      amount: 0,
      category: '',
      categoryType: 'Expense',
      paymentMethod: 'Cash',
      description: '',
      status: 'Pending'
    };
    
    setEditingExpense(newExpense);
    setShowEditModal(true);
  };

  const handleSaveExpense = async (updatedExpense) => {
    try {
      // Debug logging
  console.debug('Sending expense data:', updatedExpense);
      
      let response;
      
      if (updatedExpense.id) {
        // Update existing expense
        response = await fetch(API_ENDPOINTS.EXPENSES.UPDATE(updatedExpense.id), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedExpense)
        });
      } else {
        // Add new expense
        response = await fetch(API_ENDPOINTS.EXPENSES.CREATE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedExpense)
        });
      }

      if (!response.ok) {
        // Get detailed error message from server
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error response:', errorData);
        throw new Error(errorData.message || `Server returned ${response.status}`);
      }

      const result = await response.json();
  console.debug('Expense saved successfully:', result);

      // Refresh the data
      if (onExpensesChange) {
        await onExpensesChange();
      }
      
      // Show success message
      const isNewExpense = !updatedExpense.id;
      alert(isNewExpense ? 'Expense created successfully!' : 'Expense updated successfully!');
      
      setShowEditModal(false);
      setEditingExpense(null);
    } catch (err) {
      console.error('Error saving expense:', err);
      alert(`Failed to save expense: ${err.message}`);
    }
  };

  const handleAction = (action, expense) => {
    switch (action) {
      case 'edit':
        handleEdit(expense);
        break;
      case 'delete':
        handleDelete(expense);
        break;

      default:
        break;
    }
  };

  // Create Category Modal Component
  const CreateCategoryModal = () => {
    const [categoryData, setCategoryData] = useState({
      name: '',
      type: 'Expense',
      description: '',
      status: 'Active'
    });
    const [saving, setSaving] = useState(false);

    const categoryTypes = ['Expense', 'Income', 'Asset', 'Liability'];

    const handleCategoryChange = (e) => {
      const { name, value } = e.target;
      setCategoryData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmitCategory = async (e) => {
      e.preventDefault();
      
      if (!categoryData.name.trim()) {
        alert('Please enter a category name');
        return;
      }

      setSaving(true);
      try {
        const response = await fetch(API_ENDPOINTS.CATEGORIES.LIST(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Failed to create category');
        }

        const result = await response.json();
        console.debug('Category created successfully:', result);

        // Refresh categories list
        await fetchCategories();
        
        // Close modal
        setShowCategoryModal(false);
        
        // Reset form
        setCategoryData({
          name: '',
          type: 'Expense',
          description: '',
          status: 'Active'
        });

        alert('Category created successfully!');
      } catch (err) {
        console.error('Error creating category:', err);
        alert(`Failed to create category: ${err.message}`);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={categoryModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Create New Category</h2>
          <form onSubmit={handleSubmitCategory}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={categoryData.name}
                  onChange={handleCategoryChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter category name"
                  required
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={categoryData.description}
                  onChange={handleCategoryChange}
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Optional description"
                />
              </div>

              
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Creating...' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Modal Component
  const EditExpenseModal = () => {
    const [formData, setFormData] = useState(editingExpense || {});
    const [expenseItems, setExpenseItems] = useState([
      { item_no: 1, description: '', quantity: 1, unit_price: 0, amount: 0 }
    ]);
    const [subcategory, setSubcategory] = useState('');
    
    useEffect(() => {
      if (editingExpense) {
        setFormData({
          ...editingExpense
        });
        // Set the existing category name
        setSubcategory(editingExpense.category || '');
        
        // If editing and has items, use them; otherwise use default single item
        if (editingExpense.items && editingExpense.items.length > 0) {
          setExpenseItems(editingExpense.items);
        } else {
          // Create single item from existing expense data
          setExpenseItems([{
            item_no: 1,
            description: editingExpense.title || '',
            quantity: 1,
            unit_price: editingExpense.amount || 0,
            amount: editingExpense.amount || 0
          }]);
        }
      } else {
        // Reset for new expense with proper default values
        const today = new Date().toISOString().split('T')[0];
        setFormData({
          title: '',
          date: today,
          vendor: '',
          amount: 0,
          category: '',
          paymentMethod: 'Cash',
          status: 'Pending',
          description: ''
        });
        setSubcategory('');
        setExpenseItems([
          { item_no: 1, description: '', quantity: 1, unit_price: 0, amount: 0 }
        ]);
      }
    }, [editingExpense]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubcategoryChange = (newSubcategory) => {
      setSubcategory(newSubcategory);
      setFormData(prev => ({
        ...prev,
        category: newSubcategory
      }));
    };

    // Handle item changes
    const handleItemChange = (index, field, value) => {
      const updatedItems = [...expenseItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Auto-calculate amount for quantity and unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = field === 'quantity' ? parseFloat(value) || 0 : updatedItems[index].quantity;
        const unitPrice = field === 'unit_price' ? parseFloat(value) || 0 : updatedItems[index].unit_price;
        updatedItems[index].amount = quantity * unitPrice;
      }
      
      setExpenseItems(updatedItems);
      
      // Update total amount in form data
      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      setFormData(prev => ({
        ...prev,
        amount: totalAmount
      }));
    };

    // Add new item
    const addNewItem = () => {
      const newItemNo = expenseItems.length + 1;
      setExpenseItems([...expenseItems, {
        item_no: newItemNo,
        description: '',
        quantity: 1,
        unit_price: 0,
        amount: 0
      }]);
    };

    // Remove item
    const removeItem = (index) => {
      if (expenseItems.length > 1) {
        const updatedItems = expenseItems.filter((_, i) => i !== index);
        // Update item numbers
        const reorderedItems = updatedItems.map((item, i) => ({
          ...item,
          item_no: i + 1
        }));
        setExpenseItems(reorderedItems);
        
        // Update total amount
        const totalAmount = reorderedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
        setFormData(prev => ({
          ...prev,
          amount: totalAmount
        }));
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Validate required fields
      if (!formData.title || !formData.date || !formData.vendor || !subcategory || !subcategory.trim() || !formData.paymentMethod) {
        alert('Please fill in all required fields: Title, Date, Vendor, Category, and Payment Method');
        return;
      }

      // Validate items
      const validItems = expenseItems.filter(item => 
        item.description && item.description.trim() !== '' && 
        item.quantity > 0 && 
        item.unit_price >= 0
      );

      if (validItems.length === 0) {
        alert('Please add at least one valid item with description, quantity, and unit price');
        return;
      }

      // Calculate total amount from valid items
      const totalAmount = validItems.reduce((sum, item) => sum + (item.amount || 0), 0);

      // Prepare data with items
      const expenseData = {
        ...formData,
        category: subcategory,
        amount: totalAmount,
        items: validItems.map((item, index) => ({
          ...item,
          item_no: index + 1
        }))
      };
      
  console.debug('Submitting expense data:', expenseData);
      handleSaveExpense(expenseData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div ref={editModalRef} className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">
            {formData.id ? 'Edit Expense' : 'Add New Expense'}
          </h2>
          <form onSubmit={handleSubmit}>
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor || ''}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="flex gap-2">
                  <select
                    value={subcategory}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    className="flex-1 p-2 border rounded-md"
                    required
                  >
                    <option value="">Select Category</option>
                    {categoriesLoading ? (
                      <option value="">Loading categories...</option>
                    ) : (
                      allCategories.map(cat => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowCategoryModal(true); }}
                    className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 whitespace-nowrap text-sm"
                    title="Create new category"
                  >
                    + New
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod || 'Cash'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {paymentMethods.map(method => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status || 'Pending'}
                  onChange={handleChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {statusOptions.filter(stat => stat !== 'All').map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Expense Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">Expense Items</label>
                <button
                  type="button"
                  onClick={addNewItem}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Description</th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">Qty</th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">Rate</th>
                      <th className="px-3 py-2 text-right text-sm font-medium text-gray-700">Amount</th>
                      <th className="px-3 py-2 text-center text-sm font-medium text-gray-700"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {expenseItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full p-1 border rounded text-sm"
                            placeholder="Item description"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full p-1 border rounded text-sm text-right"
                            min="0"
                            step="1"
                            required
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className="w-full p-1 border rounded text-sm text-right"
                            min="0"
                            step="0.01"
                            required
                          />
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {expenseItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-3 py-2 text-right font-semibold">Total Amount:</td>
                      <td className="px-3 py-2 text-right font-bold">
                        PKR {formData.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                rows="3"
                placeholder="Additional notes or description"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-[30px] shadow-sm border border-gray-100 p-4 sm:p-5">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Expenses</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Track and manage all your business expenses
          </p>
        </div>
        
        <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search expenses..." 
              className="pl-10 pr-3 py-1.5 sm:py-2 border rounded-md text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              className="flex items-center gap-1 bg-[#1976D2] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors"
              onClick={handleAddExpense}
            >
              <Plus className="w-4 h-4" />
              <span>Add Expense</span>
            </button>
            <button
              className="flex items-center gap-1 bg-white border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Filter</span>
            </button>
            <button className="flex items-center gap-1 bg-white border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50">
              <FileDown className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div ref={filterPanelRef} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Expense Title</label>
            <input
              type="text"
              name="title"
              className="w-full p-2 border rounded-md text-xs"
              value={tempFilters.title}
              onChange={handleTempFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Filter by title"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Vendor</label>
            <input
              type="text"
              name="vendor"
              className="w-full p-2 border rounded-md text-xs"
              value={tempFilters.vendor}
              onChange={(e) => {
                // Allow alphabetic characters and spaces only
                const sanitized = e.target.value.replace(/[^A-Za-z\s]/g, '');
                setTempFilters(prev => ({ ...prev, vendor: sanitized }));
              }}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Filter by vendor"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount</label>
            <input
              type="number"
              name="minAmount"
              className="w-full p-2 border rounded-md text-xs"
              value={tempFilters.minAmount}
              onChange={handleTempFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Minimum amount"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount</label>
            <input
              type="number"
              name="maxAmount"
              className="w-full p-2 border rounded-md text-xs"
              value={tempFilters.maxAmount}
              onChange={handleTempFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Maximum amount"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="dateFrom"
              className="w-full p-2 border rounded-md text-xs"
              value={tempFilters.dateFrom}
              onChange={handleTempFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="dateTo"
              className="w-full p-2 border rounded-md text-xs"
              value={tempFilters.dateTo}
              onChange={handleTempFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          {/* Category and Status filters intentionally hidden per user request */}
          <div className="md:col-span-5 flex justify-end gap-2">
            <button
              onClick={() => {
                // Apply tempFilters to actual filters
                setFilters({ ...tempFilters });
                setCurrentPage(1);
                setShowFilters(false);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Apply Filters
            </button>
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="relative min-w-full min-h-[350px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-center text-xs sm:text-sm font-normal text-black">
                <th className="pb-3 px-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={
                      visibleExpenses.length > 0 &&
                      selectedRows.length === visibleExpenses.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                </th>
                <th className="pb-3 px-2 whitespace-nowrap">Expense</th>
                <th className="pb-3 px-2 whitespace-nowrap">Date</th>
                <th className="pb-3 px-2 whitespace-nowrap hidden sm:table-cell">Vendor</th>
                <th className="pb-3 px-2 whitespace-nowrap">Amount</th>
                <th className="pb-3 px-2 whitespace-nowrap hidden md:table-cell">Payment Method</th>
                <th className="pb-3 px-2 whitespace-nowrap">Status</th>
                <th className="pb-3 px-2 whitespace-nowrap hidden lg:table-cell">Description</th>
                <th className="pb-3 px-2 whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody className="text-center divide-y divide-gray-100">
              {sortedExpenses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-4 text-center text-sm text-gray-500">
                    No expenses found matching your criteria
                  </td>
                </tr>
              ) : (
                visibleExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(expense.id)}
                        onChange={() => toggleSelectRow(expense.id)}
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {expense.title}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap hidden sm:table-cell">
                      {expense.vendor}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      PKR {expense.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap hidden md:table-cell">
                      {expense.paymentMethod}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full ${getStatusClass(expense.status)}`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap hidden lg:table-cell">
                      <div className="max-w-xs truncate">{expense.description}</div>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap relative">
                      <div className="flex justify-center">
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          onClick={(e) => toggleDropdown(expense.id, e)}
                        >
                          <Ellipsis className="h-5 w-5" />
                        </button>
                        
                        {activeDropdown === expense.id && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleAction('edit', expense)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleAction('delete', expense)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </button>

                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>

            </tfoot>
          </table>
        </div>
      </div>

      {/* Pagination */}
  {sortedExpenses.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t border-gray-200 bg-white gap-3">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, sortedExpenses.length)} of {sortedExpenses.length} expenses
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
              {pages.map((p, idx) => (
                p === '...' ? (
                  <div key={`dots-${idx}`} className="px-3 py-1 text-sm rounded-md min-w-[36px] flex items-center justify-center">...</div>
                ) : (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`px-3 py-1 text-sm rounded-md min-w-[36px] ${
                      currentPage === p
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                    } border`}
                  >
                    {p}
                  </button>
                )
              ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && <EditExpenseModal />}

      {/* Create Category Modal */}
      {showCategoryModal && <CreateCategoryModal />}
    </div>
  );
};

export default ExpenseTable;