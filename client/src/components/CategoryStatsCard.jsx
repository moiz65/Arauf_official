import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, PiggyBank, AlertTriangle } from 'lucide-react';

const CategoryStatsCard = ({ categoryType, stats, color }) => {
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return `PKR ${Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  const getIcon = (type) => {
    switch (type) {
      case 'Expense':
        return <TrendingDown className="w-6 h-6" />;
      case 'Income':
        return <TrendingUp className="w-6 h-6" />;
      case 'Asset':
        return <PiggyBank className="w-6 h-6" />;
      case 'Liability':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <DollarSign className="w-6 h-6" />;
    }
  };

  const getColorClasses = (type) => {
    switch (type) {
      case 'Expense':
        return {
          bg: 'bg-red-50',
          text: 'text-red-600',
          border: 'border-red-200',
          iconBg: 'bg-red-100'
        };
      case 'Income':
        return {
          bg: 'bg-green-50',
          text: 'text-green-600',
          border: 'border-green-200',
          iconBg: 'bg-green-100'
        };
      case 'Asset':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-600',
          border: 'border-blue-200',
          iconBg: 'bg-blue-100'
        };
      case 'Liability':
        return {
          bg: 'bg-orange-50',
          text: 'text-orange-600',
          border: 'border-orange-200',
          iconBg: 'bg-orange-100'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          iconBg: 'bg-gray-100'
        };
    }
  };

  const colors = getColorClasses(categoryType);

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-6 transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`${colors.iconBg} ${colors.text} p-3 rounded-lg`}>
          {getIcon(categoryType)}
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${colors.text}`}>
            {formatCurrency(stats.total_amount)}
          </div>
          <div className="text-sm text-gray-500">
            {stats.expense_count} transactions
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{categoryType}</span>
          <span className={`text-sm font-semibold ${colors.text}`}>
            {((stats.total_amount / (stats.total_amount || 1)) * 100).toFixed(0)}%
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Paid:</span>
          <span className="text-green-600 font-medium">
            {formatCurrency(stats.paid_amount)}
          </span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Pending:</span>
          <span className="text-amber-600 font-medium">
            {formatCurrency(stats.pending_amount)}
          </span>
        </div>

        {/* Progress bar for paid vs pending */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Payment Status</span>
            <span>{stats.total_amount > 0 ? ((stats.paid_amount / stats.total_amount) * 100).toFixed(0) : 0}% Paid</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: stats.total_amount > 0 ? `${(stats.paid_amount / stats.total_amount) * 100}%` : '0%' 
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Categories breakdown */}
      {stats.categories && stats.categories.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">Top Categories:</div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {stats.categories.slice(0, 3).map((category, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-gray-600 truncate">{category.name}</span>
                <span className={`font-medium ${colors.text}`}>
                  {formatCurrency(category.total_amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryStatsCard;