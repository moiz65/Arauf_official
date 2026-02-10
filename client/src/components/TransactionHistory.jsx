import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [error, setError] = useState(null);
  
  const itemsPerPage = 5; // Show only 5 recent transactions

  // Fetch transaction history from API
  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/transaction-history?page=${page}&limit=${itemsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const result = await response.json();
      setTransactions(result.data || []);
      setPagination(result.pagination || {});
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Load transactions on component mount
  useEffect(() => {
    fetchTransactions(currentPage);
  }, [currentPage]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (pagination.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  const formatCurrency = (amount, currency = 'PKR') => {
    const formattedAmount = amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return `${currency} ${formattedAmount}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Transaction History</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-500">Loading transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[30px] shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Transaction History</h2>
        <button 
          onClick={() => fetchTransactions(currentPage)}
          className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors"
          title="Refresh transactions"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm text-gray-500">Recent Payments</h3>
          {pagination.totalRecords > 0 && (
            <span className="text-xs text-gray-400">
              {pagination.totalRecords} total
            </span>
          )}
        </div>
        
        {error ? (
          <div className="text-center py-6 text-red-500">
            <p className="text-sm">{error}</p>
            <button 
              onClick={() => fetchTransactions(currentPage)}
              className="mt-2 text-xs text-blue-500 hover:text-blue-700"
            >
              Try again
            </button>
          </div>
        ) : transactions.length > 0 ? (
          <>
            <div className="space-y-3 mb-4">
              {transactions.map((txn) => (
                <div key={`${txn.id}-${txn.invoice_id}`} className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="font-medium text-green-700 text-xs">{txn.initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-gray-900">{txn.name}</p>
                    <p className="text-xs text-gray-500">{txn.time} • {txn.transaction_type}</p>
                  </div>
                  <div className="text-sm font-semibold text-green-600">
                    +{formatCurrency(txn.amount, txn.currency)}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <svg className="mx-auto h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-sm">No paid invoices found</p>
            <p className="text-xs text-gray-400">Paid invoices will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionHistory;