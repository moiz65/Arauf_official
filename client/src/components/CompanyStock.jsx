import React, { useState, useEffect } from 'react';
import { Plus, Package, TrendingUp } from 'lucide-react';
import { Zap } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const CompanyStock = ({ onAddStock, refreshKey, onOpenRegistered = null }) => {
  const [totalStock, setTotalStock] = useState(0);
  const [stockItems, setStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [lastRestocked, setLastRestocked] = useState(null);
  // removed topCategories per request to hide categories

  useEffect(() => {
    fetchStockData();
  }, [refreshKey]);

  const fetchStockData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.STOCK.LIST);
      if (!response.ok) throw new Error('Failed to fetch stock');
      const data = await response.json();
      
      setStockItems(data);
      const total = data.reduce((sum, item) => sum + (parseFloat(item.quantity) || 0), 0);
      // value is quantity * price per unit
      const value = data.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.price_per_unit) || 0)), 0);
      // low stock threshold: mark as low if quantity <= 5
      const low = data.filter(i => Number(i.quantity) <= 5).length;
      // last restocked is latest purchase_date (fallback to created_at if available)
      const latest = data.reduce((acc, item) => {
        const date = item.purchase_date || item.created_at || null;
        if (!date) return acc;
        return !acc || new Date(date) > new Date(acc) ? date : acc;
      }, null);

      setTotalStock(total);
      setTotalValue(value);
      setLowStockCount(low);
      setLastRestocked(latest);
      // categories hidden by user preference — no topCategories computed
    } catch (err) {
      console.error('Error fetching stock:', err);
      setStockItems([]);
      setTotalStock(0);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStockSuccess = () => {
    fetchStockData();
  };

  const formatCurrency = (amt) => `PKR ${Number(amt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Package className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Company Stock</h2>
            <p className="text-sm text-gray-500">Current inventory status</p>
          </div>
        </div>
        <button
          onClick={onAddStock}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
      </div>

      {/* Stats cards moved to Registered Stock page */}

      {/* Recent Stock Items Preview */}
      {stockItems.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Items</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {stockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors">
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.item_name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      item.status === 'Active' ? 'bg-green-100 text-green-700' :
                      item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                      item.status === 'Discontinued' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{item.status || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{Number(item.quantity || 0).toFixed(2)} {item.unit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-600">{Number(item.quantity || 0).toFixed(2)} {item.unit}</div>
                  <div className="text-xs text-gray-500">{formatCurrency(Number(item.quantity || 0) * Number(item.price_per_unit || 0))}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Low Stock Items */}
      {stockItems.length > 0 && lowStockCount > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Low Stock Items</h3>
          <div className="bg-red-50 rounded-lg p-3">
            {stockItems.filter(i => Number(i.quantity) <= 5).slice(0, 5).map(i => (
              <div key={i.id} className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{i.item_name}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      i.status === 'Active' ? 'bg-green-100 text-green-700' :
                      i.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                      i.status === 'Discontinued' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>{i.status || 'Unknown'}</span>
                    <span className="text-xs text-gray-500">{Number(i.quantity || 0).toFixed(2)} {i.unit}</span>
                  </div>
                </div>
                <div className="text-sm text-red-700 font-semibold">{formatCurrency(Number(i.quantity || 0) * Number(i.price_per_unit || 0))}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top categories removed per user request */}

      {/* Action Buttons */}
      <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
        <button
          onClick={() => onAddStock && onAddStock()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Stock
        </button>
        <button
          onClick={() => onOpenRegistered && onOpenRegistered()}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          Registered Stock
        </button>
      </div>
    </div>
  );
};

export default CompanyStock;
