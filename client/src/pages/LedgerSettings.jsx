import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LedgerSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Ledger settings state
  const [settings, setSettings] = useState({
    taxReturnPeriodFrom: '2024-07-01',
    taxReturnPeriodTo: '2025-10-30',
    companyName: 'A-Rauf Textile',
    fiscalYearStart: '2024-07-01',
    fiscalYearEnd: '2025-06-30',
    defaultCurrency: 'PKR',
    decimalPlaces: 2,
    dateFormat: 'DD/MM/YYYY',
    enableAutoBalance: true,
    enableDaysCalculation: true,
    defaultPaymentMode: 'Cash',
    allowFutureDates: false,
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('ledgerSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (err) {
        console.error('Error loading settings:', err);
      }
    }
  }, []);

  // Handle input changes
  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setSaved(false);
  };

  // Handle toggle changes
  const handleToggle = (field) => {
    setSettings(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
    setSaved(false);
  };

  // Save settings to localStorage
  const handleSave = () => {
    setLoading(true);
    try {
      localStorage.setItem('ledgerSettings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Are you sure? This will reset all settings to defaults.')) {
      const defaultSettings = {
        taxReturnPeriodFrom: '2024-07-01',
        taxReturnPeriodTo: '2025-10-30',
        companyName: 'A-Rauf Textile',
        fiscalYearStart: '2024-07-01',
        fiscalYearEnd: '2025-06-30',
        defaultCurrency: 'PKR',
        decimalPlaces: 2,
        dateFormat: 'DD/MM/YYYY',
        enableAutoBalance: true,
        enableDaysCalculation: true,
        defaultPaymentMode: 'Cash',
        allowFutureDates: false,
      };
      setSettings(defaultSettings);
      localStorage.setItem('ledgerSettings', JSON.stringify(defaultSettings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* === HEADER === */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-bold text-white">Ledger Settings</h1>
              <p className="text-gray-400 text-sm mt-1">Configure your ledger preferences and tax settings</p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="mb-6 bg-green-900 bg-opacity-30 border border-green-700 text-green-100 px-4 py-3 rounded-lg flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">Settings saved successfully!</span>
          </div>
        )}

        {/* Settings Form */}
        <div className="space-y-6">
          {/* ===== SECTION 1: TAX RETURN WORK PERIOD ===== */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-all shadow-lg">
            <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 bg-opacity-20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white">Tax Return Work Period</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Period From</label>
                  <input
                    type="date"
                    value={settings.taxReturnPeriodFrom}
                    onChange={(e) => handleInputChange('taxReturnPeriodFrom', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 hover:border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Period To</label>
                  <input
                    type="date"
                    value={settings.taxReturnPeriodTo}
                    onChange={(e) => handleInputChange('taxReturnPeriodTo', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 hover:border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Timeline Preview */}
              <div className="bg-blue-600 bg-opacity-20 rounded-lg p-4 border border-blue-700 border-opacity-50">
                <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">Preview</p>
                <div className="flex items-center gap-4 text-white">
                  <div className="text-sm font-medium">
                    {new Date(settings.taxReturnPeriodFrom).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                  <div className="flex-1 h-1 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
                  <div className="text-sm font-medium">
                    {new Date(settings.taxReturnPeriodTo).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 2: COMPANY INFORMATION ===== */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-all shadow-lg">
            <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 bg-opacity-20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white">Company Information</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Company Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 hover:border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  placeholder="A-Rauf Textiles"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Fiscal Year Start</label>
                  <input
                    type="date"
                    value={settings.fiscalYearStart}
                    onChange={(e) => handleInputChange('fiscalYearStart', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 hover:border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">Fiscal Year End</label>
                  <input
                    type="date"
                    value={settings.fiscalYearEnd}
                    onChange={(e) => handleInputChange('fiscalYearEnd', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 hover:border-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION 4: FEATURES & BEHAVIOR ===== */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-all shadow-lg">
            <div className="px-6 py-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-750">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-600 bg-opacity-20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-white">Features & Behavior</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-700 bg-opacity-50 hover:bg-opacity-70 transition-all">
                <div>
                  <p className="font-medium text-white">Auto Balance Calculation</p>
                  <p className="text-sm text-gray-400 mt-1">Automatically calculate balance after each entry</p>
                </div>
                <button
                  onClick={() => handleToggle('enableAutoBalance')}
                  className={`relative inline-flex w-12 h-7 rounded-full transition-all ${
                    settings.enableAutoBalance ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform ${
                      settings.enableAutoBalance ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-700 bg-opacity-50 hover:bg-opacity-70 transition-all">
                <div>
                  <p className="font-medium text-white">Days Calculation</p>
                  <p className="text-sm text-gray-400 mt-1">Calculate days outstanding for aging analysis</p>
                </div>
                <button
                  onClick={() => handleToggle('enableDaysCalculation')}
                  className={`relative inline-flex w-12 h-7 rounded-full transition-all ${
                    settings.enableDaysCalculation ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform ${
                      settings.enableDaysCalculation ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-700 bg-opacity-50 hover:bg-opacity-70 transition-all">
                <div>
                  <p className="font-medium text-white">Allow Future Dates</p>
                  <p className="text-sm text-gray-400 mt-1">Allow entries with dates in the future</p>
                </div>
                <button
                  onClick={() => handleToggle('allowFutureDates')}
                  className={`relative inline-flex w-12 h-7 rounded-full transition-all ${
                    settings.allowFutureDates ? 'bg-blue-600' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform rounded-full bg-white transition-transform ${
                      settings.allowFutureDates ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
            </div>
          </div>

          {/* === ACTION BUTTONS === */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset to Defaults
            </button>
            <button
              onClick={() => navigate(-1)}
              className="flex-1 px-6 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold transition-all"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-blue-600 opacity-75 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LedgerSettings;
