import React, { useState, useEffect, useRef } from 'react';
import { Search, Edit2, Trash2, Plus, AlertCircle, ChevronLeft, ChevronRight, TrendingUp, Zap } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import AddStockModal from './AddStockModal';
import AddStockSidebar from './AddStockSidebar';
import StockDetailsSidebar from './StockDetailsSidebar';

const RegisteredStockPage = ({ openAddSidebar, openEditStock, refreshKey }) => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategory] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSidebar, setShowAddSidebar] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [showDetailsSidebar, setShowDetailsSidebar] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('item_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [totalStock, setTotalStock] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lastRestocked, setLastRestocked] = useState(null);
  
  const itemsPerPage = 10;

  useEffect(() => {
    fetchStocks();
  }, [refreshKey]);

  useEffect(() => {
    applyFilters();
  }, [stocks, searchTerm, categoryFilter, statusFilter, sortBy, sortOrder]);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.STOCK.LIST);
      if (!response.ok) throw new Error('Failed to fetch stocks');
      const data = await response.json();
      setStocks(data || []);
      
      // Calculate stats
      const total = data.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      const value = data.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price_per_unit) || 0)), 0);
      const low = data.filter(i => Number(i.quantity) <= 5).length;
      const latest = data.reduce((acc, item) => {
        const date = item.purchase_date || item.created_at || null;
        if (!date) return acc;
        return !acc || new Date(date) > new Date(acc) ? date : acc;
      }, null);
      
      setTotalStock(total);
      setTotalValue(value);
      setLowStockCount(low);
      setLastRestocked(latest);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stocks];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(stock =>
        stock.item_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(stock => stock.category === categoryFilter);
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(stock => stock.status === statusFilter);
    }

    // Sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    setFilteredStocks(filtered);
    setCurrentPage(1);
  };

  const handleDeleteStock = async (id) => {
    if (window.confirm('Are you sure you want to delete this stock item?')) {
      try {
        const response = await fetch(API_ENDPOINTS.STOCK.DELETE(id), {
          method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete stock');
        fetchStocks();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const formatCurrency = (amt) => `PKR ${Number(amt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getUniqueCategories = () => {
    const categories = new Set(stocks.map(s => s.category).filter(Boolean));
    return ['All', ...Array.from(categories)];
  };

  const getUniqueStatuses = () => {
    const statuses = new Set(stocks.map(s => s.status).filter(Boolean));
    return ['All', ...Array.from(statuses)];
  };

  const paginatedStocks = filteredStocks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredStocks.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {/* Total Stock */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Stock Items</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{totalStock}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-400 opacity-50" />
          </div>
        </div>

        {/* Total Stock Value */}
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-indigo-600 font-medium">Total Stock Value</p>
              <p className="text-3xl font-bold text-indigo-900 mt-2">{formatCurrency(totalValue)}</p>
            </div>
            <TrendingUp className="w-10 h-10 text-indigo-400 opacity-50" />
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600 font-medium">Low Stock</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{lowStockCount}</p>
            </div>
            <Zap className="w-10 h-10 text-yellow-400 opacity-50" />
          </div>
        </div>

        {/* Last Updated */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 font-medium">Last Updated</p>
              <p className="text-lg font-bold text-purple-900 mt-2">
                {lastRestocked ? new Date(lastRestocked).toLocaleDateString() : new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-400 opacity-20 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Registered Stock</h1>
          <p className="text-gray-600 text-sm mt-1">Manage all company stock items</p>
        </div>
        <button
          onClick={() => {
            setEditingStock(null);
            // If parent provides a function for opening, use it, otherwise use local showAddSidebar
            if (typeof openAddSidebar === 'function') {
              openAddSidebar(null);
            } else {
              setShowAddSidebar(true);
            }
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Stock
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getUniqueCategories().map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {getUniqueStatuses().map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="item_name">Sort by Name</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="price_per_unit">Sort by Price</option>
            <option value="purchase_date">Sort by Date</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filteredStocks.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No stock items found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Item Name</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Category</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Quantity</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Unit</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Price/Unit</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Total Value</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-6 py-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStocks.map((stock, index) => {
                    // Ensure numeric conversions to avoid .toFixed errors when values are strings or null
                    const quantity = Number(stock.quantity) || 0;
                    const pricePerUnit = Number(stock.price_per_unit) || 0;
                    const totalValue = quantity * pricePerUnit;
                    return (
                      <tr
                        key={stock.id || index}
                        className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 cursor-pointer" onClick={() => { setSelectedStock(stock); setShowDetailsSidebar(true); }}>{stock.item_name}</td>
                        <td className="px-6 py-4 text-gray-600">{stock.category || '-'}</td>
                        <td className="px-6 py-4 text-gray-600">{stock.quantity}</td>
                        <td className="px-6 py-4 text-gray-600">{stock.unit || '-'}</td>
                        <td className="px-6 py-4 text-gray-600">PKR {pricePerUnit.toFixed(2)}</td>
                        <td className="px-6 py-4 font-medium text-gray-900">PKR {totalValue.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            stock.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : stock.status === 'Low Stock'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {stock.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // If parent provided an edit handler, use it to open the same central sidebar
                                if (typeof openEditStock === 'function') {
                                  openEditStock(stock);
                                } else {
                                  setEditingStock(stock);
                                  setShowAddSidebar(true);
                                }
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStock(stock.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStocks.length)} of {filteredStocks.length}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Stock Modal */}
      {/* Modal kept for backward compatibility; new default is sidebar */}
      <AddStockModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingStock(null);
        }}
        onSuccess={() => {
          fetchStocks();
        }}
      />

      {/* Local AddStockSidebar fallback when parent doesn't provide a centralized sidebar */}
      {!openAddSidebar && (
        <AddStockSidebar
          isOpen={showAddSidebar}
          onClose={() => {
            setShowAddSidebar(false);
            setEditingStock(null);
          }}
          onSuccess={() => {
            fetchStocks();
          }}
          initialData={editingStock}
        />
      )}

      <StockDetailsSidebar
        isOpen={showDetailsSidebar}
        onClose={() => setShowDetailsSidebar(false)}
        stock={selectedStock}
        onEdit={(s) => { setShowDetailsSidebar(false); setEditingStock(s); setShowAddSidebar(true); }}
      />
    </div>
  );
};

export default RegisteredStockPage;
