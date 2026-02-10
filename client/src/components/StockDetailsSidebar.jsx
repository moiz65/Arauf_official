import React from 'react';
import { X, Edit2 } from 'lucide-react';

const StockDetailsSidebar = ({ isOpen, onClose, stock, onEdit }) => {
  if (!isOpen || !stock) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black bg-opacity-30" onClick={onClose}></div>
      <div className="relative ml-auto w-full max-w-md h-full bg-white shadow-xl overflow-y-auto transform transition-transform duration-300">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900">{stock.item_name}</h2>
            <span className="px-2 py-1 rounded-full bg-gray-100 text-xs text-gray-700">{stock.status}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit && onEdit(stock)} className="px-2 py-1 text-blue-600 hover:bg-blue-50 rounded">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Category</h3>
            <p className="text-gray-900">{stock.category || '-'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Quantity</h3>
              <p className="text-gray-900">{Number(stock.quantity || 0)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Unit</h3>
              <p className="text-gray-900">{stock.unit || '-'}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Price / Unit</h3>
            <p className="text-gray-900">PKR {(Number(stock.price_per_unit) || 0).toFixed(2)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Total Value</h3>
            <p className="text-gray-900">PKR {(Number(stock.quantity || 0) * (Number(stock.price_per_unit) || 0)).toFixed(2)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Supplier</h3>
            <p className="text-gray-900">{stock.supplier_name || '-'}</p>
            {stock.supplier_email && <p className="text-sm text-gray-500">{stock.supplier_email}</p>}
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Location</h3>
            <p className="text-gray-900">{stock.location || '-'}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Description</h3>
            <p className="text-gray-900">{stock.description || '-'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Created At</h3>
              <p className="text-gray-900">{stock.created_at || '-'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-1">Updated At</h3>
              <p className="text-gray-900">{stock.updated_at || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockDetailsSidebar;
