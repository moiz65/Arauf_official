import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';

const FinancialYearManager = ({ customerId, onClose }) => {
  const [financialYears, setFinancialYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedFY, setSelectedFY] = useState(null);
  const [formData, setFormData] = useState({
    fy_name: '',
    start_date: '',
    end_date: '',
    opening_debit: 0,
    opening_credit: 0,
    notes: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch financial years for customer
  const fetchFinancialYears = async () => {
    if (!customerId) {
      console.warn('No customerId provided');
      return;
    }
    
    setLoading(true);
    try {
      console.log('Fetching financial years for customer:', customerId);
      const response = await fetch(API_ENDPOINTS.FINANCIAL_YEARS.GET(customerId));
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch financial years');
      }
      
      const data = await response.json();
      console.log('Fetched financial years:', data);
      setFinancialYears(data);
      setError('');
    } catch (err) {
      console.error('Error fetching financial years:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialYears();
  }, [customerId]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('debit') || name.includes('credit') ? parseFloat(value) || 0 : value
    }));
  };

  // Create new financial year
  const handleCreateFY = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.fy_name || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.FINANCIAL_YEARS.LIST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: customerId,
          ...formData
        })
      });

      if (!response.ok) throw new Error('Failed to create financial year');
      
      setSuccess('Financial year created successfully!');
      setFormData({
        fy_name: '',
        start_date: '',
        end_date: '',
        opening_debit: 0,
        opening_credit: 0,
        notes: ''
      });
      setShowForm(false);
      fetchFinancialYears();
    } catch (err) {
      setError(err.message);
    }
  };

  // Close financial year
  const handleCloseFY = async (fy_id) => {
    if (!window.confirm('Are you sure you want to close this financial year? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.FINANCIAL_YEARS.CLOSE(fy_id), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closing_date: new Date().toISOString().split('T')[0]
        })
      });

      if (!response.ok) throw new Error('Failed to close financial year');
      
      const result = await response.json();
      setSuccess(`Financial year closed successfully! Closing Balance: Rs ${result.closing_balance.balance.toLocaleString()}`);
      fetchFinancialYears();
    } catch (err) {
      setError(err.message);
    }
  };

  // View FY details
  const handleViewDetails = (fy) => {
    setSelectedFY(fy);
  };

  const formatCurrency = (amount) => {
    return `Rs ${parseFloat(amount || 0).toLocaleString('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center border-b">
          <h2 className="text-2xl font-bold">Financial Year Manager</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-2 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Alerts */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => { setShowForm(false); setSelectedFY(null); }}
              className={`px-4 py-2 font-medium transition-colors ${
                !showForm && !selectedFY
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Financial Years List
            </button>
            <button
              onClick={() => { setShowForm(true); setSelectedFY(null); }}
              className={`px-4 py-2 font-medium transition-colors ${
                showForm
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create New
            </button>
            {selectedFY && (
              <button
                onClick={() => setSelectedFY(null)}
                className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Back
              </button>
            )}
          </div>

          {/* Create Form */}
          {showForm && !selectedFY && (
            <form onSubmit={handleCreateFY} className="space-y-4 bg-slate-50 p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Financial Year Name *
                  </label>
                  <input
                    type="text"
                    name="fy_name"
                    placeholder="e.g., FY 2025-2026"
                    value={formData.fy_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Opening Debit (PKR)
                  </label>
                  <input
                    type="number"
                    name="opening_debit"
                    value={formData.opening_debit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Opening Credit (PKR)
                  </label>
                  <input
                    type="number"
                    name="opening_credit"
                    value={formData.opening_credit}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notes
                  </label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Optional notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Create Financial Year
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Financial Years List */}
          {!showForm && !selectedFY && (
            <div>
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading financial years...</div>
              ) : financialYears.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No financial years created yet.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Financial Year
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {financialYears.map(fy => (
                    <div
                      key={fy.fy_id}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{fy.fy_name}</h3>
                          <p className="text-sm text-slate-600">
                            {new Date(fy.start_date).toLocaleDateString()} → {new Date(fy.end_date).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          fy.status === 'open' ? 'bg-green-100 text-green-700' :
                          fy.status === 'closed' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {fy.status.charAt(0).toUpperCase() + fy.status.slice(1)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                        <div>
                          <p className="text-slate-600">Opening Balance</p>
                          <p className="font-bold text-slate-900">{formatCurrency(fy.opening_balance)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Closing Balance</p>
                          <p className="font-bold text-slate-900">
                            {fy.status === 'closed' ? formatCurrency(fy.closing_balance) : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">Opening Debit</p>
                          <p className="font-bold text-slate-900">{formatCurrency(fy.opening_debit)}</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Opening Credit</p>
                          <p className="font-bold text-slate-900">{formatCurrency(fy.opening_credit)}</p>
                        </div>
                      </div>

                      {fy.notes && (
                        <p className="text-sm text-slate-600 mb-3">
                          <span className="font-medium">Notes:</span> {fy.notes}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewDetails(fy)}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm font-medium"
                        >
                          View Details
                        </button>
                        {fy.status === 'open' && (
                          <button
                            onClick={() => handleCloseFY(fy.fy_id)}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            Close Year
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* FY Details View */}
          {selectedFY && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4">{selectedFY.fy_name}</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Period</p>
                    <p className="font-bold text-slate-900">
                      {new Date(selectedFY.start_date).toLocaleDateString()} to {new Date(selectedFY.end_date).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Status</p>
                    <p className="font-bold text-slate-900 capitalize">{selectedFY.status}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Opening Debit</p>
                    <p className="font-bold text-slate-900">{formatCurrency(selectedFY.opening_debit)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Opening Credit</p>
                    <p className="font-bold text-slate-900">{formatCurrency(selectedFY.opening_credit)}</p>
                  </div>

                  <div>
                    <p className="text-sm text-slate-600 mb-1">Opening Balance</p>
                    <p className="font-bold text-lg text-slate-900">{formatCurrency(selectedFY.opening_balance)}</p>
                  </div>

                  {selectedFY.status === 'closed' && (
                    <>
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Closing Debit</p>
                        <p className="font-bold text-slate-900">{formatCurrency(selectedFY.closing_debit)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 mb-1">Closing Credit</p>
                        <p className="font-bold text-slate-900">{formatCurrency(selectedFY.closing_credit)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-600 mb-1">Closing Balance</p>
                        <p className="font-bold text-lg text-slate-900">{formatCurrency(selectedFY.closing_balance)}</p>
                      </div>
                    </>
                  )}
                </div>

                {selectedFY.notes && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-slate-600 mb-1">Notes</p>
                    <p className="text-slate-900">{selectedFY.notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-6 rounded-lg">
                <p className="text-sm text-slate-600 mb-2">Created At</p>
                <p className="text-slate-900">{new Date(selectedFY.created_at).toLocaleString()}</p>
                {selectedFY.updated_at && (
                  <>
                    <p className="text-sm text-slate-600 mb-2 mt-3">Last Updated</p>
                    <p className="text-slate-900">{new Date(selectedFY.updated_at).toLocaleString()}</p>
                  </>
                )}
              </div>

              {selectedFY.status === 'closed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-bold text-green-900 mb-3">Financial Year Closed</h4>
                  <p className="text-green-800 text-sm mb-4">
                    The closing balance is <strong>{formatCurrency(selectedFY.closing_balance)}</strong>
                  </p>
                  <p className="text-green-800 text-sm">
                    This closing balance will become the opening balance for the next financial year.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialYearManager;
