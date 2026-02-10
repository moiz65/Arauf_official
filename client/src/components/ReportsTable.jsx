import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Filter,
  FileDown,
  Ellipsis,
  Edit,
  Trash2,
  Printer,
  Download,
  Copy,
  Plus,
  Eye,
} from "lucide-react";
import { API_ENDPOINTS } from '../config/api';

const REPORT_TABS = [
  "All",
  "Pending",
  "Preparing",
  "On the way",
  "Delivered",
  "Cancelled",
];
const ITEMS_PER_PAGE_OPTIONS = [4, 10, 20, 50];
const DEFAULT_ITEMS_PER_PAGE = 4;

const ReportsTable = ({
  activeTab,
  setActiveTab,
  onCreateReport,
  reports: initialReports = [],
}) => {
  // State management
  const [reports, setReports] = useState([]);
  const [originalReports, setOriginalReports] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusCounts, setStatusCounts] = useState({});
  
  // Notification system
  const [notification, setNotification] = useState(null);
  const showNotification = (title, description, duration = 3000) => {
    setNotification({ title, description });
    setTimeout(() => setNotification(null), duration);
  };
  
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    customer: "",
    minPrice: "",
    maxPrice: "",
    dateFrom: "",
    dateTo: "",
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingReport, setEditingReport] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingReport, setViewingReport] = useState(null);
  const [reportDetails, setReportDetails] = useState(null);
  const dropdownRefs = useRef([]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "Preparing":
        return "bg-blue-100 text-blue-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "On the way":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate pagination info
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleReports = Array.isArray(reports) ? reports : [];

  const toggleSelectAll = () => {
    if (selectedRows.length === visibleReports.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(visibleReports.map((report) => report.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setSelectedRows([]);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setFilters({
      customer: "",
      minPrice: "",
      maxPrice: "",
      dateFrom: "",
      dateTo: "",
    });
    setSearchTerm("");
    setActiveTab("All");
    setCurrentPage(1);
    showNotification("Filters reset", "All filters have been cleared");
  };

  const toggleDropdown = (dropdownKey, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === dropdownKey ? null : dropdownKey);
  };

  const handleView = (report) => {
    // Try to find detailed data from ReportData.js by id or orderId
    try {
      import("../data/ReportData.js").then((module) => {
        const reportData = module.default;
        // Try to match by id or orderId
        const detail = reportData.find(
          (r) => r.id === report.id || r.orderId === report.id
        );
        setReportDetails(detail || null);
        setViewingReport(report);
        setShowViewModal(true);
        setActiveDropdown(null);
      }).catch(error => {
        console.error("Error loading report details:", error);
        // Fallback to basic report data
        setReportDetails(null);
        setViewingReport(report);
        setShowViewModal(true);
        setActiveDropdown(null);
      });
    } catch (error) {
      console.error("Error loading report details:", error);
      // Fallback to basic report data
      setReportDetails(null);
      setViewingReport(report);
      setShowViewModal(true);
      setActiveDropdown(null);
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setShowEditModal(true);
    setActiveDropdown(null);
  };

  // Enable delete functionality in live mode
  const handleDelete = async (report) => {
    if (!window.confirm(`Are you sure you want to delete report ${report.id}?`)) {
      setActiveDropdown(null);
      return;
    }
    try {
      // Try both id and orderId for compatibility
      let deleteUrl = API_ENDPOINTS.REPORTS.DELETE(encodeURIComponent(report.id));
      let response = await fetch(deleteUrl, { method: 'DELETE' });
      // If not ok, try with orderId if present and different
      if (!response.ok && report.orderId && report.id !== report.orderId) {
        deleteUrl = API_ENDPOINTS.REPORTS.DELETE(encodeURIComponent(report.orderId));
        response = await fetch(deleteUrl, { method: 'DELETE' });
      }
      if (!response.ok) {
        // Try to get backend error message
        let errorMsg = 'Failed to delete report';

        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          // If not JSON, try text
          try {
            const errorText = await response.text();
            if (errorText) errorMsg = errorText;
          } catch {}
        }
        throw new Error(errorMsg);
      }
      // Refresh reports and status counts
      fetchReports();
      fetchStatusCounts();
      showNotification("Report deleted", `Report ${report.id} has been deleted`);
    } catch (err) {
      showNotification('Error', 'Error deleting report: ' + err.message);
    }
    setActiveDropdown(null);
  };


  // Generate a sequential ID for new reports, starting from 01
  function generateUniqueReportId() {
    // Find the highest numeric id in the current reports
    let maxId = 0;
    reports.forEach(r => {
      // Accept both string and number ids, e.g. '01', '02', ...
      let num = 0;
      if (typeof r.id === 'string' && /^\d+$/.test(r.id)) {
        num = parseInt(r.id, 10);
      } else if (typeof r.id === 'number') {
        num = r.id;
      }
      if (num > maxId) maxId = num;
    });
    // Next id, padded to 2 digits
    const nextId = (maxId + 1).toString().padStart(2, '0');
    return nextId;
  }

  const handleAddReport = () => {
    const newReport = {
      id: generateUniqueReportId(),
      date: new Date().toISOString().slice(0, 10),
      customer: "",
      price: 0,
      status: "Pending",
    };
    setEditingReport(newReport);
    setShowEditModal(true);
  };

  // Enable duplicate functionality in live mode
  const handleDuplicate = async (report) => {
    const duplicate = {
      ...report,
      id: generateUniqueReportId(),
      date: new Date().toISOString().slice(0, 10),
    };
    try {
      const response = await fetch(API_ENDPOINTS.REPORTS.LIST, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicate)
      });
      if (!response.ok) {
        let errorMsg = 'Failed to duplicate report';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      // Refresh reports and status counts
      fetchReports();
      fetchStatusCounts();
      showNotification("Report duplicated", `New report created from ${report.id}`);
    } catch (err) {
      showNotification('Error', 'Error duplicating report: ' + err.message);
    }
    setActiveDropdown(null);
  };

  // Fetch reports with filtering and pagination
  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      // Add filters
      if (activeTab !== 'All') params.append('status', activeTab);
      if (searchTerm) params.append('search', searchTerm);
      if (filters.customer) params.append('customer', filters.customer);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      
      const response = await fetch(`${API_ENDPOINTS.REPORTS.LIST}?${params}`);
      const result = await response.json();
      
      if (response.ok) {
        setReports(result.data || []);
        setTotalPages(result.pagination?.totalPages || 0);
        setTotalRecords(result.pagination?.totalRecords || 0);
      } else {
        throw new Error(result.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error("Error fetching reports:", err);
      setReports([]);
      showNotification('Error', 'Failed to fetch reports: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch status counts for tab labels
  const fetchStatusCounts = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.REPORTS.STATS);
      const stats = await response.json();
      
      if (response.ok) {
        setStatusCounts(stats);
      }
    } catch (err) {
      console.error("Error fetching status counts:", err);
    }
  };

  // Save (Create or Update) report
  const handleSaveReport = async (formData) => {
    try {
      let response;
      if (reports.some((r) => r.id === formData.id)) {
        // Update existing report
        response = await fetch(`${API_ENDPOINTS.REPORTS.GET(formData.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      } else {
        // Create new report
        response = await fetch(API_ENDPOINTS.REPORTS.LIST, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }
      if (!response.ok) {
        let errorMsg = 'Failed to save report';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }
      setShowEditModal(false);
      setEditingReport(null);
      fetchReports();
      fetchStatusCounts();
      showNotification("Report saved", `Report ${formData.id} has been saved`);
    } catch (err) {
      showNotification('Error', 'Error saving report: ' + err.message);
    }
  };



  const EditReportModal = () => {
    const [formData, setFormData] = useState(editingReport);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const customerInputRef = useRef(null);
    const suggestionTimeoutRef = useRef(null);

    // Always keep ID field disabled and auto-generate for new/duplicate
    useEffect(() => {
      // If creating a new report (id is empty or not in ORD- format), generate a new one
      if (!formData.id || !/^ORD-\d{13}-\d{4}$/.test(formData.id)) {
        setFormData((prev) => ({
          ...prev,
          id: generateUniqueReportId(),
        }));
      }
    }, [formData.id]);

    // Fetch customer suggestions from database
    const fetchCustomerSuggestions = async (searchTerm) => {
      if (!searchTerm || searchTerm.length < 1) {
        setCustomerSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        setIsLoadingSuggestions(true);
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/v1/customers/suggestions?q=${encodeURIComponent(searchTerm)}`
        );
        
        if (response.ok) {
          const suggestions = await response.json();
          setCustomerSuggestions(suggestions.slice(0, 5)); // Limit to 5 suggestions
          setShowSuggestions(suggestions.length > 0);
        } else {
          // If the API endpoint doesn't exist, fallback to existing reports
          const reportsResponse = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/v1/reports?limit=100`);
          if (reportsResponse.ok) {
            const reportsData = await reportsResponse.json();
            const uniqueCustomers = [...new Set(
              reportsData.data
                .map(report => report.customer)
                .filter(customer => 
                  customer && 
                  customer.toLowerCase().startsWith(searchTerm.toLowerCase())
                )
            )].slice(0, 5);
            
            setCustomerSuggestions(uniqueCustomers);
            setShowSuggestions(uniqueCustomers.length > 0);
          }
        }
      } catch (error) {
        console.error('Error fetching customer suggestions:', error);
        setCustomerSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));

      // Handle customer autocomplete
      if (name === 'customer') {
        // Clear existing timeout
        if (suggestionTimeoutRef.current) {
          clearTimeout(suggestionTimeoutRef.current);
        }

        // Debounce the search to avoid too many API calls
        suggestionTimeoutRef.current = setTimeout(() => {
          fetchCustomerSuggestions(value);
        }, 300);
      }
    };

    // Handle customer selection from suggestions
    const handleCustomerSelect = (selectedCustomer) => {
      setFormData((prev) => ({
        ...prev,
        customer: selectedCustomer,
      }));
      setShowSuggestions(false);
      setCustomerSuggestions([]);
    };

    // Handle keyboard navigation in suggestions
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    const handleKeyDown = (e) => {
      if (!showSuggestions || customerSuggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < customerSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : customerSuggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0) {
            handleCustomerSelect(customerSuggestions[selectedSuggestionIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
        default:
          setSelectedSuggestionIndex(-1);
      }
    };

    // Handle clicking outside to close suggestions
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (customerInputRef.current && !customerInputRef.current.contains(event.target)) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        if (suggestionTimeoutRef.current) {
          clearTimeout(suggestionTimeoutRef.current);
        }
      };
    }, []);

    const handleSubmit = (e) => {
      e.preventDefault();
      // Ensure status is always one of the allowed MySQL values
      let status = formData.status;
      if (status === "Being Prepared") status = "Preparing";
      if (status === "On The Way") status = "On the way";
      handleSaveReport({ ...formData, status });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">
            {editingReport && editingReport.id ? "Edit Report" : "Create New Report"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Order ID
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                className="w-full p-2 border rounded-md bg-gray-100 cursor-not-allowed"
                required
                disabled
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <div className="relative" ref={customerInputRef}>
                <input
                  type="text"
                  name="customer"
                  value={formData.customer}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (formData.customer && customerSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Start typing customer name..."
                  required
                  autoComplete="off"
                />
                
                {/* Loading indicator */}
                {isLoadingSuggestions && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}

                {/* Suggestions dropdown */}
                {showSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {customerSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleCustomerSelect(suggestion)}
                        className={`px-4 py-2 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 transition-colors ${
                          index === selectedSuggestionIndex
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-blue-50 hover:text-blue-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-xs ${
                            index === selectedSuggestionIndex
                              ? 'bg-blue-200 text-blue-800'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {suggestion.charAt(0).toUpperCase()}
                          </div>
                          <span>{suggestion}</span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Footer showing count */}
                    <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
                      {customerSuggestions.length} suggestion{customerSuggestions.length !== 1 ? 's' : ''} found
                      <span className="ml-2 text-gray-400">
                        (Use ↑↓ to navigate, Enter to select, Esc to close)
                      </span>
                    </div>
                  </div>
                )}

                {/* No suggestions message */}
                {showSuggestions && customerSuggestions.length === 0 && !isLoadingSuggestions && formData.customer && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No matching customers found
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (PKR)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
                min="0"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="Pending">Pending</option>
                <option value="Preparing">Preparing</option>
                <option value="On the way">On the way</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ViewReportModal = () => {
    // Use reportDetails if available, else fallback to viewingReport
    const data = reportDetails || viewingReport;
    
    if (!data) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">View Report Details</h2>
            <p className="text-gray-500">No report data available.</p>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => { setShowViewModal(false); setReportDetails(null); }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">View Report Details</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Order ID</h3>
              <p className="mt-1 text-sm text-gray-900">{data.id || data.orderId}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Date</h3>
              <p className="mt-1 text-sm text-gray-900">{data.date}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
              <p className="mt-1 text-sm text-gray-900">{data.customer}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Price</h3>
              <p className="mt-1 text-sm text-gray-900">PKR {Number(data.price).toLocaleString()}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <p className="mt-1">
                <span className={`px-2 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full ${getStatusClass(data.status)}`}>
                  {data.status}
                </span>
              </p>
            </div>
            {/* Show extra details if available */}
            {data.particulars && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Particulars</h3>
                <p className="mt-1 text-sm text-gray-900">{data.particulars}</p>
              </div>
            )}
            {data.rate !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Rate</h3>
                <p className="mt-1 text-sm text-gray-900">{data.rate}</p>
              </div>
            )}
            {data.quantity !== undefined && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Quantity</h3>
                <p className="mt-1 text-sm text-gray-900">{data.quantity}</p>
              </div>
            )}
            {data.mtr && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Meters</h3>
                <p className="mt-1 text-sm text-gray-900">{data.mtr}</p>
              </div>
            )}
            {data.credit && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Credit</h3>
                <p className="mt-1 text-sm text-gray-900">{data.credit}</p>
              </div>
            )}
            {data.debit && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Debit</h3>
                <p className="mt-1 text-sm text-gray-900">{data.debit}</p>
              </div>
            )}
            {data.balance && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Balance</h3>
                <p className="mt-1 text-sm text-gray-900">{data.balance}</p>
              </div>
            )}
            {data.billsCHQ && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Bills/CHQ</h3>
                <p className="mt-1 text-sm text-gray-900">{data.billsCHQ}</p>
              </div>
            )}
            {data.days && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Days</h3>
                <p className="mt-1 text-sm text-gray-900">{data.days}</p>
              </div>
            )}
            {data.dueDate && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                <p className="mt-1 text-sm text-gray-900">{data.dueDate}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => { setShowViewModal(false); setReportDetails(null); }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Fetch reports when filters change
  useEffect(() => {
    fetchReports();
  }, [currentPage, itemsPerPage, activeTab, searchTerm, filters]);

  // Fetch status counts on component mount
  useEffect(() => {
    fetchStatusCounts();
  }, []);

  // Refetch status counts when reports change
  useEffect(() => {
    fetchStatusCounts();
  }, [reports]);

  // Bulk delete selected reports
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    if (!window.confirm(`Delete ${selectedRows.length} selected reports?`)) return;
    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedRows.map(id =>
        fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/v1/reports/${id}`, { method: 'DELETE' })
      ));
      setSelectedRows([]);
      fetchReports();
      fetchStatusCounts();
      showNotification("Bulk delete successful", `${selectedRows.length} reports have been deleted`);
    } catch (err) {
      showNotification('Error', 'Error deleting selected reports.');
    }
    setIsBulkDeleting(false);
  };

  const handlePrint = (report) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Report: ${report.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .report { border: 1px solid #ddd; padding: 20px; max-width: 500px; margin: 0 auto; }
            .row { display: flex; margin-bottom: 10px; }
            .label { font-weight: bold; width: 150px; }
            .value { flex: 1; }
            .status {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .Pending { background-color: #fef3c7; color: #92400e; }
            .Preparing { background-color: #dbeafe; color: #1e40af; }
            .Cancelled { background-color: #fee2e2; color: #991b1b; }
            .Delivered { background-color: #dcfce7; color: #166534; }
            .On\\ the\\ way { background-color: #dbeafe; color: #1e40af; }
          </style>
        </head>
        <body>
          <h1>Order Report</h1>
          <div class="report">
            <div class="row"><div class="label">Order ID:</div><div class="value">${
              report.id
            }</div></div>
            <div class="row"><div class="label">Date:</div><div class="value">${
              report.date
            }</div></div>
            <div class="row"><div class="label">Contact Person:</div><div class="value">${
              report.customer
            }</div></div>
            <div class="row"><div class="label">Price:</div><div class="value">PKR ${Number(
              report.price
            ).toLocaleString()}</div></div>
            <div class="row"><div class="label">Status:</div><div class="value"><span class="status ${report.status.replace(
              " ",
              "\\ "
            )}">${report.status}</span></div></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setActiveDropdown(null);
  };

  const handleDownload = (report) => {
    const data = {
      orderId: report.id,
      date: report.date,
      customer: report.customer,
      price: `PKR ${Number(report.price).toLocaleString()}`,
      status: report.status,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${report.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActiveDropdown(null);
  };

  // --- MAIN RENDER ---
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
      {/* Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <div className="font-bold">{notification.title}</div>
          <div>{notification.description}</div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Reports</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            View and manage all your reports in one place
          </p>
        </div>

        <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-10 pr-3 py-1.5 sm:py-2 border rounded-md text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAddReport}
              className="flex items-center gap-1 bg-[#1976D2] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Report</span>
            </button>

            <button
              className={`flex items-center gap-1 border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors ${
                showFilters ? 'bg-gray-100 border-gray-300' : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Filter</span>
            </button>

            <div className="relative">
              <button className="flex items-center gap-1 bg-white border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50">
                <FileDown className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md flex justify-between items-center">
          <div className="text-sm text-blue-800">
            {selectedRows.length} report(s) selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-xs hover:bg-red-100 disabled:opacity-50"
            >
              {isBulkDeleting ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Selected</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Contact Person</label>
            <input
              type="text"
              name="customer"
              className="w-full p-2 border rounded-md text-xs"
              value={filters.customer}
              onChange={handleFilterChange}
              placeholder="Filter by customer name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Price</label>
            <input
              type="number"
              name="minPrice"
              value={filters.minPrice}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-xs"
              placeholder="Minimum price"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Price</label>
            <input
              type="number"
              name="maxPrice"
              value={filters.maxPrice}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-xs"
              placeholder="Maximum price"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded-md text-xs"
            />
          </div>
          <div className="md:col-span-5 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Items per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="p-1 border rounded text-xs"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-xs"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation with Counts */}
      <div className="overflow-x-auto mb-4">
        <div className="flex border-b w-max min-w-full">
          {REPORT_TABS.map((tab) => {
            const count = statusCounts[tab];
            const showCount = count !== undefined && count > 0;
            return (
              <button
                key={tab}
                className={`px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
              >
                {tab} {showCount && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table with fixed height */}
      <div className="overflow-x-auto">
        <div className="relative min-w-full min-h-[350px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-center text-xs sm:text-sm font-normal text-black">
                <th className="pb-3 px-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={
                      visibleReports.length > 0 &&
                      selectedRows.length === visibleReports.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                </th>
                <th className="pb-3 px-2 whitespace-nowrap">Order ID</th>
                <th className="pb-3 px-2 whitespace-nowrap">Date</th>
                <th className="pb-3 px-2 whitespace-nowrap">Contact Person</th>
                <th className="pb-3 px-2 whitespace-nowrap">Price</th>
                <th className="pb-3 px-2 whitespace-nowrap">Status</th>
                <th className="pb-3 px-2 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="text-center divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
                      Loading reports...
                    </div>
                  </td>
                </tr>
              ) : visibleReports.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="py-4 text-center text-sm text-gray-500"
                  >
                    No reports found matching your criteria
                  </td>
                </tr>
              ) : (
                visibleReports.map((report, index) => {
                  const dropdownKey = report.id + "-" + index;
                  return (
                    <tr key={dropdownKey} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(report.id)}
                          onChange={() => toggleSelectRow(report.id)}
                          className="rounded text-blue-500 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {report.id}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {report.date}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {report.customer}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        PKR {Number(report.price).toLocaleString()}
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap text-center">
                        <span
                          className={`px-2 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full ${getStatusClass(
                            report.status
                          )}`}
                        >
                          {report.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm whitespace-nowrap relative">
                        <div className="flex justify-center">
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => toggleDropdown(dropdownKey, e)}
                          >
                            <Ellipsis className="h-5 w-5" />
                          </button>
                          {activeDropdown === dropdownKey && (
                            <div
                              ref={(el) => (dropdownRefs.current[index] = el)}
                              className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200"
                              style={{
                                top: "100%",
                                maxHeight: "200px",
                                overflowY: "auto",
                              }}
                            >
                              <div className="py-1">
                                <button
                                  onClick={() => handleView(report)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View
                                </button>
                                <button
                                  onClick={() => handleEdit(report)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(report)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </button>

                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t border-gray-200 bg-white gap-3">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, totalRecords)} of {totalRecords} reports
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 text-sm rounded-md min-w-[36px] ${
                    currentPage === pageNum
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                  } border`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <span className="px-1 flex items-center">...</span>
            )}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <button
                onClick={() => handlePageChange(totalPages)}
                className={`px-3 py-1 text-sm rounded-md min-w-[36px] ${
                  currentPage === totalPages
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
                } border`}
              >
                {totalPages}
              </button>
            )}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && <EditReportModal />}
      {showViewModal && <ViewReportModal />}
    </div>
  );
};

export default ReportsTable;