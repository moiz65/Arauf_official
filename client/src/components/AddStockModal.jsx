import React, { useState, useRef, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { API_ENDPOINTS } from '../config/api';

const AddStockModal = ({ isOpen, onClose, onSuccess, initialData = null }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    quantity: '',
    unit: 'KG',
    price_per_unit: '',
    supplier_name: '',
    supplier_email: '',
    supplier_phone: '',
    purchase_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'Active'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const modalRef = useClickOutside(() => {
    if (isOpen) {
      handleClose();
    }
  }, isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData && isOpen) {
      setFormData({
        item_name: initialData.item_name || '',
        quantity: initialData.quantity || '',
        unit: initialData.unit || 'KG',
        price_per_unit: initialData.price_per_unit || '',
        supplier_name: initialData.supplier_name || '',
        supplier_email: initialData.supplier_email || '',
        supplier_phone: initialData.supplier_phone || '',
        purchase_date: initialData.purchase_date || new Date().toISOString().split('T')[0],
        expiry_date: initialData.expiry_date || '',
        status: initialData.status || 'Active'
      });
    }
  }, [initialData, isOpen]);

  const handleClose = () => {
    setFormData({
      item_name: '',
      quantity: '',
      unit: 'KG',
      price_per_unit: '',
      supplier_name: '',
      supplier_email: '',
      supplier_phone: '',
      purchase_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      status: 'Active'
    });
    setError(null);
    setSuccess(false);
    onClose();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.item_name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const method = initialData && initialData.id ? 'PUT' : 'POST';
      const url = initialData && initialData.id ? `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/stock/${initialData.id}` : `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/stock`;
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseFloat(formData.quantity),
          price_per_unit: parseFloat(formData.price_per_unit) || 0
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add stock');
      }

      setSuccess(true);
      setFormData({
        item_name: '',
        quantity: '',
        unit: 'KG',
        price_per_unit: '',
        supplier_name: '',
        supplier_email: '',
        supplier_phone: '',
        purchase_date: new Date().toISOString().split('T')[0],
        expiry_date: '',
        status: 'Active'
      });

      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to add stock item');
      console.error('Error adding stock:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Add New Stock Item</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <p className="text-green-700 text-sm font-medium">Stock item added successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Item Details Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Item Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="item_name"
                  value={formData.item_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Cotton Fabric Roll"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>KG</option>
                  <option>LB</option>
                  <option>MTR</option>
                  <option>PCS</option>
                  <option>BOX</option>
                  <option>ROLL</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price Per Unit (PKR)
                </label>
                <input
                  type="number"
                  name="price_per_unit"
                  value={formData.price_per_unit}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

            </div>
          </div>

          {/* Dates Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date
                </label>
                <input
                  type="date"
                  name="expiry_date"
                  value={formData.expiry_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Supplier Information Section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4 text-sm">Supplier Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  name="supplier_name"
                  value={formData.supplier_name}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Textiles Ltd"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Email
                </label>
                <input
                  type="email"
                  name="supplier_email"
                  value={formData.supplier_email}
                  onChange={handleInputChange}
                  placeholder="supplier@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Phone
                </label>
                <input
                  type="tel"
                  name="supplier_phone"
                  value={formData.supplier_phone}
                  onChange={handleInputChange}
                  placeholder="+92-XXX-XXXXXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Low Stock</option>
              <option>Discontinued</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding Stock...' : 'Add Stock Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockModal;
