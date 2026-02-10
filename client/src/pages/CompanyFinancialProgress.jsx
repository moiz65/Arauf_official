import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
// charts removed from this page per request
import { Download, Filter, MoreVertical, ChevronDown, Calendar } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api';

const formatCurrency = (amt) => `PKR ${Number(amt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const sampleMonthly = [
  { month: 'Jan', revenue: 120000, expenses: 90000 },
  { month: 'Feb', revenue: 150000, expenses: 110000 },
  { month: 'Mar', revenue: 140000, expenses: 95000 },
  { month: 'Apr', revenue: 180000, expenses: 120000 },
  { month: 'May', revenue: 200000, expenses: 145000 },
  { month: 'Jun', revenue: 220000, expenses: 160000 },
  { month: 'Jul', revenue: 210000, expenses: 180000 },
  { month: 'Aug', revenue: 230000, expenses: 170000 },
  { month: 'Sep', revenue: 240000, expenses: 200000 },
  { month: 'Oct', revenue: 260000, expenses: 215000 },
  { month: 'Nov', revenue: 280000, expenses: 225000 },
  { month: 'Dec', revenue: 300000, expenses: 250000 },
];

const CompanyFinancialProgress = () => {
  const [range, setRange] = useState('1y');
  const [showFilters, setShowFilters] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const navigate = useNavigate();

  const [data, setData] = useState(sampleMonthly);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuRect, setMenuRect] = useState(null);
  // sample AR/AP
  // Receivables / Payables examples removed per design decision

  // Note: summary metric boxes removed; keep `data` for potential charts or reports

  // Convert YYYY-MM-DD format to dd/mm/yyyy display
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      // If it's already in YYYY-MM-DD format (from date input)
      if (dateStr.includes('-') && dateStr.length === 10) {
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
      }
      // If it's an ISO date string
      return new Date(dateStr).toLocaleDateString('en-GB'); // dd/mm/yyyy
    } catch (e) {
      return dateStr;
    }
  };

  // Convert dd/mm/yyyy or YYYY-MM-DD to YYYY-MM-DD for date input value attribute
  const formatDateForInput = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('-') && dateStr.length === 10) return dateStr; // already in YYYY-MM-DD
    // Convert dd/mm/yyyy to YYYY-MM-DD
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateStr;
  };

  useEffect(() => {
    // Attempt to fetch real data from server endpoints if they exist
    // We'll attempt to fetch a combined endpoint then fallback to the sample
    const fetchData = async () => {
      setLoading(true);
      try {
        // Example endpoint: /api/dashboard/monthly-financials
        const res = await fetch(API_ENDPOINTS.DASHBOARD.MONTHLY_FINANCIALS);
        if (!res.ok) throw new Error('No monthly financials API');
        const json = await res.json();
        if (json && json.data) {
          setData(json.data);
          setError(null);
        } else {
          setData(sampleMonthly);
        }
      } catch (err) {
        // if API not present, use sample data
        setData(sampleMonthly);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Load saved reports from database
    const fetchReports = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.FINANCIAL_REPORTS.STORAGE_LIST);
        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.data)) {
            // Map database fields to expected format
            const mapped = data.data.map((r) => ({
              id: r.report_id,
              generated: r.generated_at,
              description: r.description,
              range: r.range_type,
              start: r.start_date,
              end: r.end_date,
              shortId: r.short_id,
              dbId: r.id
            }));
            setReports(mapped);
          }
        } else {
          // Fallback to empty if API fails
          setReports([]);
        }
      } catch (e) {
        console.warn('Failed to fetch reports from database:', e);
        setReports([]);
      }
    };
    
    fetchReports();
  }, []);

  // helper to create a short compact id: FR-<base36 5 chars>
  const makeShortId = (iso) => {
    try {
      const ms = iso ? new Date(iso).getTime() : Date.now();
      const s = ms.toString(36).slice(-5).toUpperCase();
      return `FR-${s}`;
    } catch (e) {
      return `FR-${String(iso).slice(0, 5)}`;
    }
  };

  // close open menus when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest || (!e.target.closest('.report-menu') && !e.target.closest('.report-menu-btn'))) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const filtered = () => {
    // filter data for the requested range
    if (range === '3m') return data.slice(-3);
    if (range === '6m') return data.slice(-6);
    if (range === '1y') return data.slice(-12);
    return data;
  };

  const showData = filtered();

  const rangeLabel = () => {
    if (range === '3m') return '3 months';
    if (range === '6m') return '6 months';
    if (range === '1y') return '1 year';
    if (range === 'custom') {
      if (customFrom && customTo) return `${formatShortDate(customFrom)} → ${formatShortDate(customTo)}`;
      return 'Custom Range';
    }
    return 'All';
  };

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen p-4">
      <div className="hidden md:block fixed h-screen w-64 z-20">
        <Sidebar />
      </div>

      <main className="flex-1 p-6 bg-[#F5F5F5] md:ml-64">
        <Header />

        <div className="mb-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Company Financial Progress</h2>
              <p className="text-sm text-gray-500">At a glance progress of revenue, expenses and profitability</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button onClick={() => setShowFilters(!showFilters)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm">{rangeLabel()}</span>
                  <ChevronDown className={`w-4 h-4 ${showFilters ? 'rotate-180' : ''}`} />
                </button>
                {showFilters && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-100 rounded-md shadow-lg overflow-hidden z-20">
                    {['3m', '6m', '1y', 'all'].map((r) => (
                      <button key={r} onClick={() => { setRange(r); setShowFilters(false); setShowCustomPicker(false); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${range===r ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}>
                        {r === '3m' ? '3 Months' : r === '6m' ? '6 Months' : r === '1y' ? '1 Year' : 'All Time'}
                      </button>
                    ))}
                      <div className="border-t mt-1 pt-1">
                      <button onClick={() => { setShowCustomPicker((s) => !s); setShowFilters(true); }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${showCustomPicker ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}>
                        Custom Range
                      </button>
                      {showCustomPicker && (
                        <div className="p-3 bg-gray-50 border-t border-gray-100">
                          <div className="grid grid-cols-1 gap-3">
                            <div className="relative">
                              <label className="text-xs text-gray-600 font-medium">From</label>
                              <div className="mt-1 relative">
                                <input
                                  type="date"
                                  value={customFrom}
                                  onChange={(e) => setCustomFrom(e.target.value)}
                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                              </div>
                            </div>
                            <div className="relative">
                              <label className="text-xs text-gray-600 font-medium">To</label>
                              <div className="mt-1 relative">
                                <input
                                  type="date"
                                  value={customTo}
                                  onChange={(e) => setCustomTo(e.target.value)}
                                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                              </div>
                            </div>
                            {customFrom && customTo && (
                              <div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
                                <strong className="text-sm">Selected:</strong> {formatShortDate(customFrom)} → {formatShortDate(customTo)}
                              </div>
                            )}
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setShowCustomPicker(false); setCustomFrom(''); setCustomTo(''); setShowFilters(false); }}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  if (!customFrom || !customTo) {
                                    alert('Please select both start and end dates');
                                    return;
                                  }
                                  const startDate = new Date(customFrom);
                                  const endDate = new Date(customTo);
                                  if (startDate > endDate) {
                                    alert('Start date must be before end date');
                                    return;
                                  }
                                  setRange('custom');
                                  setShowCustomPicker(false);
                                  setShowFilters(false);
                                }}
                                disabled={!customFrom || !customTo}
                                className={`px-3 py-1 rounded text-sm ${(!customFrom || !customTo) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

                <button onClick={async () => {
                const iso = new Date().toISOString();
                const sid = makeShortId(iso);
                
                // Save report to database
                try {
                  const response = await fetch(API_ENDPOINTS.FINANCIAL_REPORTS.GENERATE, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      reportId: iso,
                      shortId: sid,
                      description: 'A-Rauf Financial Report',
                      rangeType: range,
                      startDate: range === 'custom' ? customFrom : null,
                      endDate: range === 'custom' ? customTo : null,
                      totalDebit: 0,
                      totalCredit: 0,
                      contacts: [],
                      generatedBy: 'user'
                    })
                  });

                  if (response.ok) {
                    const data = await response.json();
                    const newReport = {
                      id: iso,
                      generated: iso,
                      description: 'A-Rauf Financial Report',
                      range,
                      start: range === 'custom' ? customFrom : undefined,
                      end: range === 'custom' ? customTo : undefined,
                      shortId: sid,
                      dbId: data.data.id
                    };
                    setReports([newReport, ...reports]);
                  } else {
                    alert('Failed to save report');
                  }
                } catch (err) {
                  console.error('Error generating report:', err);
                  alert('Error generating report');
                }
              }} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2">
                <Download className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          </div>
        </div>
        {/* Render portal menu outside the table to avoid clipping */}
        <ReportsMenuPortal openMenuId={openMenuId} menuRect={menuRect} reports={reports} onClose={() => setOpenMenuId(null)} navigate={navigate} setReports={setReports} />

        {/* Top summary boxes removed per request */}

          {/* Profit & Loss, Receivables & Payables removed per request */}

        {/* Revenue vs Expenses and Net Profit (Monthly) removed per request */}

        {/* Recent transactions / summary */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Financial Report</h3>
            <div className="text-xs text-gray-500">Generated: {new Date().toLocaleString()}</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Financial ID</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Generated date &amp; time</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Range</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Description</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.length === 0 ? (
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3" colSpan={5}>No reports generated yet. Click <strong>Generate Report</strong> to create one.</td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 relative">
                      <td className="px-4 py-3 font-mono text-sm" title={r.id}>{r.shortId || makeShortId(r.generated || r.id)}</td>
                      <td className="px-4 py-3">{new Date(r.generated).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {r.range === 'custom' && r.start && r.end ? `${formatShortDate(r.start)} → ${formatShortDate(r.end)}` : (
                          r.range === '3m' ? '3 Months' : r.range === '6m' ? '6 Months' : r.range === '1y' ? '1 Year' : (r.range || 'All')
                        )}
                      </td>
                      <td className="px-4 py-3">{r.description}</td>
                      <td className="px-4 py-3">
                                <div className="relative inline-block">
                                  <button onClick={(e) => {
                                    e.stopPropagation();
                                    const btnRect = e.currentTarget.getBoundingClientRect();
                                    setMenuRect(btnRect);
                                    setOpenMenuId(openMenuId === r.id ? null : r.id);
                                  }} className="p-2 rounded-md hover:bg-gray-100 report-menu-btn">
                                    <MoreVertical className="w-5 h-5 text-gray-600" />
                                  </button>
                                </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Local small component to avoid repetition and keep handler clean */}
        

        <Footer />
      </main>
    </div>
  );
};

export default CompanyFinancialProgress;

// Portal-rendered menu anchored to the menu button rect to avoid clipping by table overflow
function ReportsMenuPortal({ openMenuId, menuRect, reports, onClose, navigate, setReports }) {
  if (!openMenuId || !menuRect) return null;
  const r = reports.find((x) => x.id === openMenuId);
  if (!r) return null;

  const style = {
    position: 'fixed',
    left: Math.max(8, menuRect.right - 160),
    top: menuRect.bottom + 8,
    width: 160,
    zIndex: 9999
  };

  return createPortal(
    <div className="bg-white border border-gray-200 rounded-md shadow-lg report-menu" style={style} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => { onClose(); navigate(`/financial-report?generated=${encodeURIComponent(r.generated)}&id=${encodeURIComponent(r.shortId || r.id)}&range=${encodeURIComponent(r.range||'all')}${r.start && r.end ? `&start=${encodeURIComponent(r.start)}&end=${encodeURIComponent(r.end)}` : ''}`); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">View</button>
      <button onClick={() => { onClose(); window.open(`/financial-report?generated=${encodeURIComponent(r.generated)}&id=${encodeURIComponent(r.shortId || r.id)}&download=1${r.start && r.end ? `&start=${encodeURIComponent(r.start)}&end=${encodeURIComponent(r.end)}` : ''}`, '_blank'); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Download</button>
      <button onClick={() => { navigator.clipboard?.writeText(r.shortId || r.id); onClose(); }} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">Copy ID</button>
      <button onClick={async () => {
        onClose();
        if (!window.confirm('Delete this report? This action cannot be undone.')) return;
        try {
          const response = await fetch(API_ENDPOINTS.FINANCIAL_REPORTS.STORAGE_GET(r.shortId || r.id), {
            method: 'DELETE'
          });
          if (response.ok) {
            setReports(prev => prev.filter(er => er.id !== r.id));
          } else {
            alert('Failed to delete report');
          }
        } catch (err) {
          console.error('Error deleting report:', err);
          alert('Error deleting report');
        }
      }} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50">Delete</button>
    </div>,
    document.body
  );
}
