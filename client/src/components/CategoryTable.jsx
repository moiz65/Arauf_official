import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, FileDown, Ellipsis, Edit, Trash2, Printer, Download, Plus, Tag, FolderOpen } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { API_ENDPOINTS } from '../config/api';

const ITEMS_PER_PAGE = 10;

const CategoryTable = () => {
  const [categoriesData, setCategoriesData] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    description: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const dropdownRef = useRef(null);

  // Add click outside handler for edit modal
  const editModalRef = useClickOutside(() => {
    if (showEditModal) {
      setShowEditModal(false);
      setEditingCategory(null);
    }
  }, showEditModal);

  // Show notification
  const showNotification = (title, description, duration = 3000) => {
    setNotification({ title, description });
    setTimeout(() => setNotification(null), duration);
  };

  // Fetch categories data from API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.CATEGORIES.LIST());
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Transform API data to match component expectations
      // Filter out the "All" category from the table display
      const transformedData = result.data
        .filter(category => category.name !== 'All')
        .map(category => ({
          id: category.id,
          name: category.name,
          description: category.description || '',
          type: category.type,
          status: category.status,
          color: '#3B82F6', // Default color - you can add this to backend later
          icon: 'FolderOpen', // Default icon - you can add this to backend later
          createdDate: category.created_date ? new Date(category.created_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          expenseCount: category.expense_count || 0
        }));
      
      setCategoriesData(transformedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories. Please try again later.');
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

  const filteredCategories = categoriesData
    .filter(category =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(category =>
      (!filters.name || category.name.toLowerCase().includes(filters.name.toLowerCase())) &&
      (!filters.description || category.description.toLowerCase().includes(filters.description.toLowerCase()))
    );

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visibleCategories = filteredCategories.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const toggleSelectAll = () => {
    if (selectedRows.length === visibleCategories.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(visibleCategories.map(category => category.id));
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
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeClass = (type) => {
    switch(type) {
      case 'Expense': return 'bg-red-100 text-red-800';
      case 'Income': return 'bg-green-100 text-green-800';
      case 'Asset': return 'bg-blue-100 text-blue-800';
      case 'Liability': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      name: '',
      description: ''
    });
    setSearchTerm('');
    showNotification('Filters Reset', 'All filters have been cleared');
  };

  const toggleDropdown = (categoryId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === categoryId ? null : categoryId);
  };

  // Action functions
  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (category) => {
    if (category.expenseCount > 0) {
      alert(`Cannot delete category "${category.name}" because it has ${category.expenseCount} associated expenses. Please move or delete those expenses first.`);
      setActiveDropdown(null);
      return;
    }

    if (window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/categories/${category.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to delete category: ${errorData}`);
        }

        showNotification('Category Deleted', `Category "${category.name}" has been deleted successfully`);
        
        // Refresh the categories list
        await fetchCategories();
      } catch (err) {
        console.error('Error deleting category:', err);
        showNotification('Error', 'Failed to delete category. Please try again.');
      }
    }
    setActiveDropdown(null);
  };



  const handleAddCategory = () => {
    const newCategory = {
      name: '',
      description: '',
      type: 'Expense',
      status: 'Active'
    };
    
    setEditingCategory(newCategory);
    setShowEditModal(true);
  };

  const handleSaveCategory = async (updatedCategory) => {
    try {
      if (updatedCategory.id) {
        // Update existing category
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/categories/${updatedCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: updatedCategory.name,
            description: updatedCategory.description || '',
            type: updatedCategory.type || 'Expense',
            status: updatedCategory.status || 'Active'
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to update category: ${errorData}`);
        }

        showNotification('Category Updated', `Category "${updatedCategory.name}" has been updated successfully`);
      } else {
        // Add new category with default type and status
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: updatedCategory.name,
            description: updatedCategory.description || '',
            type: 'Expense', // Default type
            status: 'Active' // Default status
          }),
        });

        if (!response.ok) {
          const errorData = await response.text();
          throw new Error(`Failed to create category: ${errorData}`);
        }

        showNotification('Category Created', `Category "${updatedCategory.name}" has been created successfully`);
      }

      // Refresh the categories list
      await fetchCategories();
      setShowEditModal(false);
      setEditingCategory(null);
    } catch (err) {
      console.error('Error saving category:', err);
      showNotification('Error', 'Failed to save category. Please try again.');
    }
  };

  const handleAction = (action, category) => {
    switch (action) {
      case 'edit':
        handleEdit(category);
        break;
      case 'delete':
        handleDelete(category);
        break;

      default:
        break;
    }
  };

  // Edit Modal Component
  const EditCategoryModal = () => {
    const [formData, setFormData] = useState(editingCategory || {});
    const iconOptions = ['FolderOpen', 'Tag'];
    const colorOptions = [
      '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6366F1', 
      '#14B8A6', '#10B981', '#F97316', '#EC4899', '#84CC16'
    ];
    
    useEffect(() => {
      setFormData(editingCategory || {});
    }, []);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      handleSaveCategory(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div ref={editModalRef} className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">
            {formData.id ? 'Edit Category' : 'Create New Category'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
                placeholder="Enter category name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                rows="3"
                placeholder="Enter category description (optional)"
              />
            </div>
            
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
                {formData.id ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl sm:rounded-[30px] shadow-sm border border-gray-100 p-4 sm:p-5 flex justify-center items-center h-64">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl sm:rounded-[30px] shadow-sm border border-gray-100 p-4 sm:p-5 flex justify-center items-center h-64">
        <div className="text-red-500 text-center">
          <div>{error}</div>
          <button 
            onClick={fetchCategories}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl sm:rounded-[30px] shadow-sm border border-gray-100 p-4 sm:p-5">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="font-bold">{notification.title}</div>
          <div>{notification.description}</div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Categories</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Create and manage expense categories
          </p>
        </div>
        
        <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search categories..." 
              className="pl-10 pr-3 py-1.5 sm:py-2 border rounded-md text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <button 
              className="flex items-center gap-1 bg-[#1976D2] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors"
              onClick={handleAddCategory}
            >
              <Plus className="w-4 h-4" />
              <span>Create Category</span>
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
        <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              name="name"
              className="w-full p-2 border rounded-md text-xs"
              value={filters.name}
              onChange={handleFilterChange}
              placeholder="Filter by name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              name="description"
              className="w-full p-2 border rounded-md text-xs"
              value={filters.description}
              onChange={handleFilterChange}
              placeholder="Filter by description"
            />
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
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
                      visibleCategories.length > 0 &&
                      selectedRows.length === visibleCategories.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                </th>
                <th className="pb-3 px-2 whitespace-nowrap text-left">Category</th>
                <th className="pb-3 px-2 whitespace-nowrap">Description</th>
                <th className="pb-3 px-2 whitespace-nowrap hidden md:table-cell">Created Date</th>
                <th className="pb-3 px-2 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="text-center divide-y divide-gray-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-sm text-gray-500">
                    No categories found matching your criteria
                  </td>
                </tr>
              ) : (
                visibleCategories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(category.id)}
                        onChange={() => toggleSelectRow(category.id)}
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap text-left">
                      <div className="flex items-center gap-2">
                        {category.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap max-w-xs">
                      <div className="truncate">{category.description}</div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap hidden md:table-cell">
                      {new Date(category.createdDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap relative">
                      <div className="flex justify-center">
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          onClick={(e) => toggleDropdown(category.id, e)}
                        >
                          <Ellipsis className="h-5 w-5" />
                        </button>
                        
                        {activeDropdown === category.id && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleAction('edit', category)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleAction('delete', category)}
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
          </table>
        </div>
      </div>

      {/* Pagination */}
      {filteredCategories.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t border-gray-200 bg-white gap-3">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredCategories.length)} of {filteredCategories.length} categories
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
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
                  className={`px-3 py-1 text-sm rounded-md ${
                    currentPage === pageNum
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  } border`}
                >
                  {pageNum}
                </button>
              );
            })}
            
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
      {showEditModal && <EditCategoryModal />}
    </div>
  );
};

export default CategoryTable;