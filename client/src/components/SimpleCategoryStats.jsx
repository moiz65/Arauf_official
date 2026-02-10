import React, { useState, useEffect } from 'react';

const SimpleCategoryStats = () => {
  const [categoryStats, setCategoryStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategoryStats();
  }, []);

  const fetchCategoryStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/expense-categories-stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setCategoryStats(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching category stats:', err);
      setError('Failed to fetch category statistics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-3"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!categoryStats) return null;

  const categories = [
    {
      title: 'Total Expenses',
      paidAmount: categoryStats.Expense?.paid_amount || 0,
      pendingAmount: categoryStats.Expense?.pending_amount || 0,
      paidCount: categoryStats.Expense?.paid_count || 0,
      pendingCount: categoryStats.Expense?.pending_count || 0,
      totalCount: categoryStats.Expense?.total_count || 0,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Total Income',
      paidAmount: categoryStats.Income?.paid_amount || 0,
      pendingAmount: categoryStats.Income?.pending_amount || 0,
      paidCount: categoryStats.Income?.paid_count || 0,
      pendingCount: categoryStats.Income?.pending_count || 0,
      totalCount: categoryStats.Income?.total_count || 0,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Total Assets',
      paidAmount: categoryStats.Asset?.paid_amount || 0,
      pendingAmount: categoryStats.Asset?.pending_amount || 0,
      paidCount: categoryStats.Asset?.paid_count || 0,
      pendingCount: categoryStats.Asset?.pending_count || 0,
      totalCount: categoryStats.Asset?.total_count || 0,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Total Liabilities',
      paidAmount: categoryStats.Liability?.paid_amount || 0,
      pendingAmount: categoryStats.Liability?.pending_amount || 0,
      paidCount: categoryStats.Liability?.paid_count || 0,
      pendingCount: categoryStats.Liability?.pending_count || 0,
      totalCount: categoryStats.Liability?.total_count || 0,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {categories.map((category, index) => (
        <div 
          key={index} 
          className={`${category.bgColor} ${category.borderColor} rounded-lg border p-6 hover:shadow-md transition-shadow`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">{category.title}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${category.bgColor} ${category.color}`}>
              {category.totalCount} items
            </span>
          </div>
          
          {/* Main Total Amount */}
          <div className={`text-2xl font-bold ${category.color} mb-3`}>
            {formatCurrency(category.paidAmount + category.pendingAmount)}
          </div>
          
          {/* Breakdown */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span className="text-green-600 font-medium">Paid ({category.paidCount})</span>
              <span className="text-green-600 font-semibold">{formatCurrency(category.paidAmount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-yellow-600 font-medium">Pending ({category.pendingCount})</span>
              <span className="text-yellow-600 font-semibold">{formatCurrency(category.pendingAmount)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SimpleCategoryStats;