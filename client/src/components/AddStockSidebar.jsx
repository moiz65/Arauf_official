import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const AddStockSidebar = ({ isOpen, onClose, onSuccess, initialData = null }) => {
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

  useEffect(() => {
    if (initialData) {
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

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
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
      }, 300);
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!formData.item_name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      const method = initialData && initialData.id ? 'PUT' : 'POST';
      const url = initialData && initialData.id ? API_ENDPOINTS.STOCK.UPDATE(initialData.id) : API_ENDPOINTS.STOCK.CREATE;
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number(formData.quantity) || 0,
          price_per_unit: Number(formData.price_per_unit) || 0
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to add stock');
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to add stock item');
      console.error('Error adding stock:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-40" onClick={onClose}></div>

      {/* Sidebar */}
      <div className="relative ml-auto w-full max-w-md h-full bg-white shadow-xl overflow-y-auto transform transition-transform duration-300">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">{initialData ? 'Edit Stock Item' : 'Add New Stock Item'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <p className="text-green-700 text-sm font-medium">Stock item added successfully!</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name *</label>
            <input type="text" name="item_name" value={formData.item_name} onChange={handleInputChange}
              placeholder="e.g., Cotton Fabric Roll"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
              <input type="number" name="quantity" value={formData.quantity} onChange={handleInputChange} step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select name="unit" value={formData.unit} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>KG</option>
                <option>LB</option>
                <option>MTR</option>
                <option>PCS</option>
                <option>BOX</option>
                <option>ROLL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Unit (PKR)</label>
              <input type="number" name="price_per_unit" value={formData.price_per_unit} onChange={handleInputChange} step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input type="date" name="purchase_date" value={formData.purchase_date} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
              <input type="date" name="expiry_date" value={formData.expiry_date} onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
            <input type="text" name="supplier_name" value={formData.supplier_name} onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>



          <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
              {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockSidebar;
