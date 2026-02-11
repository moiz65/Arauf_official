import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  FileDown, 
  Ellipsis, 
  Edit, 
  Trash2, 
  Printer, 
  Download, 

  Plus, 
  Eye,
  X,
  History,
  DollarSign,
  TrendingUp,
  Clock,
  XCircle,
  RotateCcw
} from 'lucide-react';
import { useClickOutside } from '../hooks/useClickOutside';
import { generatePOId } from '../utils/idGenerator';
import { API_ENDPOINTS } from '../config/api';

const ITEMS_PER_PAGE = 10;

const PurchaseOrderTable = ({ onViewDetails, openEditPOId = null }) => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [filters, setFilters] = useState({
    supplier: '',
    minAmount: '',
    maxAmount: '',
    dateFrom: '',
    dateTo: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [editingPO, setEditingPO] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [poSummaries, setPOSummaries] = useState({});
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedPOHistory, setSelectedPOHistory] = useState(null);
  const [invoiceHistory, setInvoiceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Customers for supplier autocomplete (shared with modal)
  const [customers, setCustomers] = useState([]);
  // Note: we intentionally use customers.length === 0 to determine loading state
  
  const dropdownRef = useRef(null);
  const filterPanelRef = useRef(null);

  // Add click outside handler for edit modal
  const editModalRef = useClickOutside(() => {
    if (showEditModal) {
      setShowEditModal(false);
      setEditingPO(null);
    }
  }, showEditModal);

  // Add click outside handler for history modal
  const historyModalRef = useClickOutside(() => {
    if (showHistoryModal) {
      setShowHistoryModal(false);
      setSelectedPOHistory(null);
    }
  }, showHistoryModal);

  const statusTabs = ['All', 'Draft', 'Pending', 'Approved', 'Completed'];

  // Fetch purchase orders from API
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
  console.debug('Fetching purchase orders from API...');
      
      const response = await fetch(API_ENDPOINTS.PURCHASE_ORDERS.LIST);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
  console.debug('API Response:', data);
      
      // Transform API data to match frontend format
      const transformedData = data.map(po => ({
        id: po.po_number || po.id,
        date: po.po_date,
        supplier: po.supplier_name,
        totalAmount: parseFloat(po.total_amount) || 0,
        currency: po.currency || 'PKR',
        status: po.status,
        items: po.items_count || 0,
        // Store original data for editing
        originalData: po
      }));
      
      setPurchaseOrders(transformedData);
      setError(null);
  console.debug('Transformed data:', transformedData);
      
      // Fetch PO summaries for invoice tracking
      await fetchPOSummaries();
      
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      setError(`Failed to load purchase orders: ${error.message}`);
      showNotification('Error', `Failed to load purchase orders: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch PO invoice summaries
  const fetchPOSummaries = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/po-summaries`);
      if (response.ok) {
        const summaries = await response.json();
        const summaryMap = {};
        summaries.forEach(summary => {
          summaryMap[summary.po_number] = summary;
        });
        setPOSummaries(summaryMap);
      }
    } catch (error) {
      console.error('Error fetching PO summaries:', error);
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  // Fetch customers for supplier autocomplete
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
  // Use the v1 customertable endpoint which returns contact persons
  const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/v1/customertable`);
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
      }
    };
    fetchCustomers();
  }, []);

  // If a parent requests a PO to be opened in edit mode (via openEditPOId),
  // try to find that PO after the list is loaded and open the edit modal.
  useEffect(() => {
    if (!openEditPOId) return;
    // Ensure we have purchaseOrders loaded
    if (purchaseOrders.length === 0) return;

    const matching = purchaseOrders.find(po => {
      // po.id is the displayed PO id (po_number) and originalData.po_number may exist
      const poNumber = (po.id || '').toString();
      const originalNumber = (po.originalData?.po_number || '').toString();
      return poNumber === openEditPOId.toString() || originalNumber === openEditPOId.toString();
    });

    if (matching) {
      // Open edit for the matched PO
      handleEdit(matching);
    } else {
      // If not found in current list, attempt to fetch the PO directly and open edit
      (async () => {
        try {
          const resp = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${openEditPOId}`);
          if (!resp.ok) return;
          const po = await resp.json();
          // Create a transformed object like in fetchPurchaseOrders
          const transformed = {
            id: po.po_number || po.id,
            date: po.po_date,
            supplier: po.supplier_name,
            totalAmount: parseFloat(po.total_amount) || 0,
            currency: po.currency || 'PKR',
            status: po.status,
            items: po.items_count || 0,
            originalData: po
          };
          handleEdit(transformed);
        } catch (err) {
          console.error('Failed to auto-open PO edit for', openEditPOId, err);
        }
      })();
    }
  }, [openEditPOId, purchaseOrders]);

  // Calculate counts for each status
  const getStatusCounts = () => {
    const basePOs = purchaseOrders
      .filter(po =>
        po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (po.originalData?.po_number || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(po =>
        (!filters.supplier || po.supplier.toLowerCase().includes(filters.supplier.toLowerCase())) &&
        (!filters.minAmount || po.totalAmount >= parseFloat(filters.minAmount)) &&
        (!filters.maxAmount || po.totalAmount <= parseFloat(filters.maxAmount)) &&
        (!filters.dateFrom || new Date(po.date) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(po.date) <= new Date(filters.dateTo))
      );

    // Identify completed POs first (explicitly Completed OR fully invoiced)
    const completedSet = new Set();
    basePOs.forEach(po => {
      if (po.status === 'Completed') {
        completedSet.add(po.id);
        return;
      }
      const summary = poSummaries[po.id];
      if (summary && summary.po_total_amount) {
        const percentage = (summary.total_invoiced_amount / summary.po_total_amount) * 100;
        if (percentage >= 100) completedSet.add(po.id);
      }
    });

    // Now compute other buckets excluding Completed items to avoid double-counting
    const draftCount = basePOs.filter(po => !completedSet.has(po.id) && po.status === 'Draft').length;
    const pendingCount = basePOs.filter(po => !completedSet.has(po.id) && po.status === 'Pending').length;
    const approvedCount = basePOs.filter(po => !completedSet.has(po.id) && po.status === 'Approved').length;
    const completedCount = basePOs.filter(po => completedSet.has(po.id)).length;

    const counts = {
      // 'All' equals the sum of our defined buckets to ensure consistency with tab counts
      'All': draftCount + pendingCount + approvedCount + completedCount,
      'Draft': draftCount,
      'Pending': pendingCount,
      'Approved': approvedCount,
      'Completed': completedCount,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  const showNotification = (title, description, type = 'success', duration = 5000) => {
    setNotification({ title, description, type });
    setTimeout(() => setNotification(null), duration);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Approved': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoicingStatus = (poNumber) => {
    const summary = poSummaries[poNumber];
    if (!summary) return { status: 'Not Invoiced', color: 'gray', percentage: 0 };
    
    const percentage = summary.po_total_amount > 0 ? 
      (summary.total_invoiced_amount / summary.po_total_amount) * 100 : 0;
    
    if (percentage >= 100) {
      return { status: 'Fully Invoiced', color: 'green', percentage: 100 };
    } else if (percentage > 0) {
      return { status: 'Partially Invoiced', color: 'blue', percentage: Math.round(percentage) };
    } else {
      return { status: 'Not Invoiced', color: 'gray', percentage: 0 };
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const filteredPOs = purchaseOrders
    .filter(po =>
      po.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (po.originalData?.po_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(po => {
      if (activeTab === 'All') return true;
      if (activeTab === 'Completed') {
        // Consider a PO completed if its status is 'Completed' OR if PO summary shows it fully invoiced
        const summary = poSummaries[po.id];
        const percentage = summary && summary.po_total_amount > 0 ? (summary.total_invoiced_amount / summary.po_total_amount) * 100 : 0;
        const fullyInvoiced = percentage >= 100;
        return po.status === 'Completed' || fullyInvoiced;
      }
      return po.status === activeTab;
    })
    .filter(po => {
      // Normalize dates to start of day for proper comparison (inclusive of from/to dates)
      const poDate = po.date ? new Date(new Date(po.date).setHours(0, 0, 0, 0)) : null;
      const fromDate = filters.dateFrom ? new Date(new Date(filters.dateFrom).setHours(0, 0, 0, 0)) : null;
      const toDate = filters.dateTo ? new Date(new Date(filters.dateTo).setHours(23, 59, 59, 999)) : null;

      return (
        (!filters.supplier || po.supplier.toLowerCase().includes(filters.supplier.toLowerCase())) &&
        (!filters.minAmount || po.totalAmount >= parseFloat(filters.minAmount)) &&
        (!filters.maxAmount || po.totalAmount <= parseFloat(filters.maxAmount)) &&
        (!fromDate || (poDate && poDate >= fromDate)) &&
        (!toDate || (poDate && poDate <= toDate))
      );
    });

  // Sort so that fully-invoiced / Completed POs appear at the end of the list.
  // Among fully-invoiced POs, order by last invoice/payment date (older first, newest last).
  // For non-fully-invoiced POs, show most recent PO date first.
  const comparePOs = (a, b) => {
    const summaryA = poSummaries[a.id];
    const summaryB = poSummaries[b.id];

    const getInvoiceGroup = (po, summary) => {
      // 0 = Not Invoiced, 1 = Partially Invoiced, 2 = Fully Invoiced / Completed
      const isCompleted = po.status === 'Completed';
      const total = summary && summary.po_total_amount ? Number(summary.po_total_amount) : 0;
      const invoiced = summary && summary.total_invoiced_amount ? Number(summary.total_invoiced_amount) : 0;

      if (isCompleted || (total > 0 && invoiced >= total)) return 2;
      const percentage = total > 0 ? (invoiced / total) * 100 : 0;
      if (percentage > 0) return 1;
      return 0;
    };

    const groupA = getInvoiceGroup(a, summaryA);
    const groupB = getInvoiceGroup(b, summaryB);

    // Primary: group order (Not -> Partially -> Fully)
    if (groupA !== groupB) return groupA - groupB;

    // Secondary: within group ordering
    if (groupA === 2) {
      // Fully invoiced: order by last invoice/payment date (newest first)
      const dateA = summaryA && summaryA.last_invoice_date ? new Date(summaryA.last_invoice_date).getTime() : 0;
      const dateB = summaryB && summaryB.last_invoice_date ? new Date(summaryB.last_invoice_date).getTime() : 0;
      return dateB - dateA;
    }

    // Not or Partially invoiced: order by PO date (newest first)
    const poDateA = a.date ? new Date(a.date).getTime() : 0;
    const poDateB = b.date ? new Date(b.date).getTime() : 0;
    return poDateB - poDateA;
  };

  // Apply the sort creating a new array to avoid mutating original purchaseOrders
  const sortedFilteredPOs = filteredPOs.slice().sort(comparePOs);

  const totalPages = Math.ceil(sortedFilteredPOs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const visiblePOs = sortedFilteredPOs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // If filtering or data changes reduce the total pages, ensure currentPage is within range
  useEffect(() => {
    if (totalPages === 0) {
      if (currentPage !== 1) setCurrentPage(1);
      return;
    }
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  // Compute pages to display in pagination (max 5 visible pages, with ellipses)
  const maxVisiblePages = 10;
  const pages = [];
  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    // Center current page within the window when possible
    const half = Math.floor(maxVisiblePages / 2);
    let startPage = Math.max(1, currentPage - half);
    let endPage = startPage + maxVisiblePages - 1;

    // If we overflow the total pages, shift back
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = endPage - maxVisiblePages + 1;
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) pages.push(i);

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
  }

  const toggleSelectAll = () => {
    if (selectedRows.length === visiblePOs.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(visiblePOs.map(po => po.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
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
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      supplier: '',
      minAmount: '',
      maxAmount: '',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
    setActiveTab('All');
    setCurrentPage(1);
    showNotification('Filters Reset', 'All filters have been cleared');
  };

  const toggleDropdown = (poId, e) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === poId ? null : poId);
  };

  // Action handlers
  const handleView = (po) => {
    onViewDetails(po.id);
    setActiveDropdown(null);
  };

  const handleEdit = async (po) => {
    try {
      // Fetch complete PO data including items from API
  console.debug('handleEdit: Editing PO:', po);
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${po.originalData?.id || po.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch PO details');
      }
      
      const completePoData = await response.json();
  console.debug('handleEdit: Complete PO data from server:', completePoData);
      
      // Use originalData for editing to ensure all fields are populated
      const poToEdit = {
        ...completePoData,
        // Ensure the transformed fields are also available
        id: po.id,
        totalAmount: po.totalAmount
      };
      
  console.debug('handleEdit: Setting editingPO to:', poToEdit);
      setEditingPO(poToEdit);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching PO details for editing:', error);
      showNotification('Error', 'Failed to load PO details for editing', 'error');
    }
    setActiveDropdown(null);
  };

  // Cancel PO (move to cancelled status)
  const handleCancel = async (po) => {
    if (window.confirm(`Are you sure you want to cancel PO ${po.id}?`)) {
      try {
        // Store original status for potential restoration
        const updatedPO = {
          ...po.originalData,
          status: 'Cancelled',
          previous_status: po.status // Store current status for restoration
        };

        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${po.originalData?.id || po.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedPO)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to cancel PO: ${response.statusText}`);
        }

        showNotification('PO Cancelled', `Purchase Order ${po.id} has been cancelled`);
        // Refresh the list to reflect changes
        fetchPurchaseOrders();
        
      } catch (error) {
        console.error('Error cancelling PO:', error);
        showNotification('Error', `Failed to cancel PO: ${error.message}`, 'error');
      }
    }
    setActiveDropdown(null);
  };

  // Restore cancelled PO to previous status
  const handleRestore = async (po) => {
    if (window.confirm(`Are you sure you want to restore PO ${po.id}?`)) {
      try {
        const restoreStatus = po.originalData?.previous_status || 'Draft';
        const updatedPO = {
          ...po.originalData,
          status: restoreStatus,
          previous_status: null // Clear previous status
        };

        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${po.originalData?.id || po.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedPO)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to restore PO: ${response.statusText}`);
        }

        // Get the updated PO data with all fields populated
        const updatedData = await response.json();
        
        showNotification('PO Restored', `Purchase Order ${po.id} has been restored to ${restoreStatus}`);
        
        // Refresh the list to reflect changes
        fetchPurchaseOrders();
        
        // Ensure the PO is properly updated in the system so related invoices appear
        // We need to ensure the PO invoices are visible in the invoice lists
        await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/po-summaries`, {
          method: 'GET'
        });
        
      } catch (error) {
        console.error('Error restoring PO:', error);
        showNotification('Error', `Failed to restore PO: ${error.message}`, 'error');
      }
    }
    setActiveDropdown(null);
  };

  // Permanently delete PO from database
  const handlePermanentDelete = async (po) => {
    if (window.confirm(`⚠️ PERMANENT DELETE ⚠️\n\nThis will completely remove PO ${po.id} from the database.\nThis action CANNOT be undone!\n\nAre you absolutely sure?`)) {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${po.originalData?.id || po.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to permanently delete PO: ${response.statusText}`);
        }
        
        showNotification('PO Permanently Deleted', `Purchase Order ${po.id} has been permanently removed`, 'error');
        // Refresh the list to reflect changes
        fetchPurchaseOrders();
        
      } catch (error) {
        console.error('Error permanently deleting PO:', error);
        showNotification('Error', `Failed to permanently delete PO: ${error.message}`, 'error');
      }
    }
    setActiveDropdown(null);
  };

  const handleViewHistory = async (po) => {
    setSelectedPOHistory(po);
    setLoadingHistory(true);
    setShowHistoryModal(true);
    
    try {
      const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${po.id}/invoices`);
      if (response.ok) {
        const history = await response.json();
        setInvoiceHistory(history);
      } else {
        setInvoiceHistory([]);
        showNotification('Info', 'No invoice history found for this PO', 'info');
      }
    } catch (error) {
      console.error('Error fetching invoice history:', error);
      setInvoiceHistory([]);
      showNotification('Error', 'Failed to load invoice history', 'error');
    } finally {
      setLoadingHistory(false);
    }
    setActiveDropdown(null);
  };

  const handlePrint = (po) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Purchase Order: ${po.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .po-details { border: 1px solid #ddd; padding: 20px; max-width: 600px; }
            .row { display: flex; margin-bottom: 10px; }
            .label { font-weight: bold; width: 150px; }
            .value { flex: 1; }
          </style>
        </head>
        <body>
          <h1>Purchase Order Details</h1>
          <div class="po-details">
            <div class="row"><div class="label">PO ID:</div><div class="value">${po.id}</div></div>
            <div class="row"><div class="label">Date:</div><div class="value">${po.date}</div></div>
            <div class="row"><div class="label">Supplier:</div><div class="value">${po.supplier}</div></div>
            <div class="row"><div class="label">Amount:</div><div class="value">${po.currency} ${formatCurrency(po.totalAmount)}</div></div>
            <div class="row"><div class="label">Status:</div><div class="value">${po.status}</div></div>
            <div class="row"><div class="label">Items:</div><div class="value">${po.items}</div></div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setActiveDropdown(null);
  };

  const handleDownload = (po) => {
    const data = {
      id: po.id,
      date: po.date,
      supplier: po.supplier,
      totalAmount: po.totalAmount,
      currency: po.currency,
      status: po.status,
      items: po.items
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PO_${po.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setActiveDropdown(null);
    showNotification('Download Complete', `PO data downloaded successfully`);
  };

  const generateNewPOId = () => {
    return generatePOId(purchaseOrders);
  };

  const handleAddPO = () => {
    // Clear editing state to trigger new PO creation
    setEditingPO(null);
    setShowEditModal(true);
  };

  const handleSavePO = async (poData) => {
  console.debug('Saving PO:', poData);
    
    try {
      const isEditing = editingPO && editingPO.id;
      const url = isEditing ? 
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${editingPO.id}` : 
        `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Prepare the data for backend
      const submitData = {
        po_number: poData.po_number || poData.id,
        po_date: poData.po_date || poData.date,
        supplier_name: poData.supplier_name || poData.supplier,
        supplier_email: poData.supplier_email || '',
        supplier_phone: poData.supplier_phone || '',
        supplier_address: poData.supplier_address || '',
        subtotal: poData.subtotal || 0,
        tax_rate: poData.tax_rate || 0,
        tax_amount: poData.tax_amount || 0,
        total_amount: poData.total_amount || poData.totalAmount || 0,
        currency: poData.currency || 'PKR',
        status: poData.status || 'Draft',
        payment_days: poData.payment_days || 30,
        notes: poData.notes || '',
        items: poData.items || []
      };

  console.debug('Sending to backend:', submitData);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const result = await response.json();
  console.debug('Backend response:', result);

      if (isEditing) {
        // Update existing PO in local state
        setPurchaseOrders(prev => prev.map(po => 
          po.id === editingPO.id ? {
            ...po,
            ...result.purchase_order,
            id: result.purchase_order.po_number,
            date: result.purchase_order.po_date,
            supplier: result.purchase_order.supplier_name,
            totalAmount: result.purchase_order.total_amount,
            items: result.purchase_order.items?.length || 0
          } : po
        ));
        showNotification('PO Updated', `Purchase Order ${result.purchase_order.po_number} has been updated successfully`);
      } else {
        // Add new PO to local state
        const newPO = {
          id: result.purchase_order.po_number,
          date: result.purchase_order.po_date,
          supplier: result.purchase_order.supplier_name,
          totalAmount: result.purchase_order.total_amount,
          currency: result.purchase_order.currency,
          status: result.purchase_order.status,
          items: result.purchase_order.items?.length || 0
        };
        
        setPurchaseOrders(prev => [...prev, newPO]);
        showNotification('PO Created', `Purchase Order ${result.purchase_order.po_number} has been created successfully`);
      }
      
      setShowEditModal(false);
      setEditingPO(null);
      
      // Refresh the purchase orders list
      fetchPurchaseOrders();
      
    } catch (error) {
      console.error('Error saving PO:', error);
      showNotification('Error', `Failed to save purchase order: ${error.message}`, 'error');
    }
  };



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ignore clicks inside the filter panel so inputs keep focus
      if (filterPanelRef.current && filterPanelRef.current.contains(event.target)) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // History Modal Component
  const HistoryModal = () => {
    const invoiceStatus = selectedPOHistory ? getInvoicingStatus(selectedPOHistory.id) : null;
    const summary = selectedPOHistory ? poSummaries[selectedPOHistory.id] : null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div ref={historyModalRef} className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Invoice History - {selectedPOHistory?.id}</h2>
            <button
              onClick={() => setShowHistoryModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* PO Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">PO Total</div>
                <div className="font-semibold text-lg">
                  {selectedPOHistory && formatCurrency(selectedPOHistory.totalAmount)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Total Invoiced</div>
                <div className="font-semibold text-lg text-blue-600">
                  {summary ? formatCurrency(summary.total_invoiced_amount) : formatCurrency(0)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Remaining</div>
                <div className="font-semibold text-lg text-green-600">
                  {summary ? formatCurrency(summary.remaining_amount) : formatCurrency(selectedPOHistory?.totalAmount || 0)}
                </div>
              </div>
                <div>
                <div className="text-sm text-gray-600">Status</div>
                <div className={`inline-flex items-center justify-center px-2 py-1 text-xs font-semibold rounded-full ${
                  invoiceStatus?.color === 'green' ? 'bg-green-100 text-green-800' :
                  invoiceStatus?.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {invoiceStatus?.status || 'Not Invoiced'}
                </div>
              </div>
            </div>
          </div>

          {/* Invoice History Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Person Name
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loadingHistory ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Loading invoice history...</span>
                      </div>
                    </td>
                  </tr>
                ) : invoiceHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No invoices created for this Purchase Order yet
                    </td>
                  </tr>
                ) : (
                  invoiceHistory.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {invoice.invoice_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(invoice.invoice_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 inline-flex items-center justify-center text-xs leading-5 font-semibold rounded-full ${
                          invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                          invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {invoice.customer_name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setShowHistoryModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit PO Modal Component
  const EditPOModal = () => {
    const [formData, setFormData] = useState(editingPO || {});
    const [poItems, setPOItems] = useState([
      { item_no: 1, description: '', quantity: 1, unit: 'pcs', unit_price: 0, amount: 0, specifications: '' }
    ]);
  const [taxRate, setTaxRate] = useState(0);
    
    // Supplier autocomplete state (moved inside modal)
    const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

    useEffect(() => {
      let cancelled = false;

      const ensureItems = (items) => {
        if (!Array.isArray(items) || items.length === 0) return null;
        // Normalize items to include expected fields
        return items.map((it, idx) => ({
          item_no: it.item_no || it.id || idx + 1,
          description: it.description || it.desc || it.description_text || '',
          quantity: parseFloat(it.quantity != null ? it.quantity : (it.qty || 1)) || 0,
          unit: it.unit || 'pcs',
          net_weight: parseFloat(it.net_weight != null ? it.net_weight : 0) || 0,
          unit_price: parseFloat(it.unit_price != null ? it.unit_price : (it.unitPrice || it.rate || 0)) || 0,
          amount: parseFloat(it.amount != null ? it.amount : (it.total || ( (it.quantity || 1) * (it.unit_price || it.unitPrice || it.rate || 0) ))) || 0,
          specifications: it.specifications || it.specs || ''
        }));
      };

      const fetchItemsFromServer = async (poId) => {
        try {
          // Try to fetch PO by numeric id first, then by po_number
          const url = `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${poId}`;
          console.debug('EditPOModal: Fetching PO details from:', url);
          const res = await fetch(url);
          if (!res.ok) {
            console.warn('EditPOModal: Failed to fetch PO details, status:', res.status);
            return null;
          }
          const data = await res.json();
          console.debug('EditPOModal: Received PO data:', data);
          console.debug('EditPOModal: PO items array:', data.items);
          return ensureItems(data.items || []);
        } catch (err) {
          console.error('Failed to fetch PO items for edit modal:', err);
          return null;
        }
      };

      (async () => {
        if (editingPO) {
          console.debug('EditPOModal: Setting up for editing PO:', editingPO);
          
          // Helper function to format date correctly (prevents timezone offset issues)
          const formatDateForInput = (dateValue) => {
            if (!dateValue) return '';
            // If it's already in YYYY-MM-DD format, return as-is
            if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
              return dateValue;
            }
            // Parse the date and format it without timezone conversion
            try {
              const date = new Date(dateValue);
              // Get local date components to avoid timezone shift
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            } catch (e) {
              return '';
            }
          };
          
          // Ensure all numeric fields are parsed as numbers to prevent string concatenation
          const normalizedFormData = {
            ...editingPO,
            // Format the date properly to prevent timezone offset issues
            po_date: formatDateForInput(editingPO.po_date || editingPO.date),
            // Initialize supplier_name to prevent uncontrolled to controlled warning
            supplier_name: editingPO.supplier_name || editingPO.supplier || '',
            supplier_email: editingPO.supplier_email || '',
            supplier_phone: editingPO.supplier_phone || '',
            supplier_address: editingPO.supplier_address || '',
            subtotal: parseFloat(editingPO.subtotal) || 0,
            tax_rate: parseFloat(editingPO.tax_rate) || 0,
            tax_amount: parseFloat(editingPO.tax_amount) || 0,
            total_amount: parseFloat(editingPO.total_amount) || parseFloat(editingPO.totalAmount) || 0
          };
          setFormData(normalizedFormData);
          setTaxRate(parseFloat(editingPO.tax_rate) || 0);
          setSupplierSearchTerm(editingPO.supplier_name || editingPO.supplier || '');

          // Prefer items already present on editingPO
          console.debug('EditPOModal: editingPO.items:', editingPO.items);
          const normalized = ensureItems(editingPO.items);
          console.debug('EditPOModal: Normalized items from editingPO:', normalized);
          if (normalized && normalized.length > 0) {
            console.debug('EditPOModal: Using items from editingPO');
            setPOItems(normalized);
            return;
          }

          // Otherwise attempt to fetch detailed PO data (including items)
          console.debug('EditPOModal: No items in editingPO, fetching from server...');
          const fetched = await fetchItemsFromServer(editingPO.id || editingPO.databaseId || editingPO.po_number);
          if (!cancelled) {
            console.debug('EditPOModal: Fetched items from server:', fetched);
            if (fetched && fetched.length > 0) {
              console.debug('EditPOModal: Setting fetched items');
              setPOItems(fetched);
            } else {
              console.debug('EditPOModal: No items found, using default empty item');
              // fallback default
              setPOItems([{
                item_no: 1,
                description: '',
                quantity: 1,
                unit: 'pcs',
                net_weight: 0,
                unit_price: 0,
                amount: 0
              }]);
            }
          }
        } else {
          // Reset for new PO with proper default values
          const today = new Date().toISOString().split('T')[0];
          const newPOId = generateNewPOId();

          setFormData({
            id: newPOId,
            po_number: newPOId,
            po_date: today,
            supplier_name: '', // Initialize to prevent uncontrolled to controlled warning
            supplier_email: '',
            supplier_phone: '',
            supplier_address: '',
            subtotal: 0,
            tax_rate: 0,
            tax_amount: 0,
            total_amount: 0,
            currency: 'PKR',
            status: 'Draft',
            payment_days: 30,
            notes: ''
          });
          setTaxRate(0);
          setSupplierSearchTerm('');
          setPOItems([
            { item_no: 1, description: '', quantity: 1, unit: 'pcs', unit_price: 0, amount: 0 }
          ]);
        }
      })();

      return () => { cancelled = true; };
    }, [editingPO]);

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };

    // Supplier autocomplete handlers
    const handleSupplierSearchChange = (e) => {
      const value = e.target.value;
      setSupplierSearchTerm(value);
      setShowSupplierDropdown(true);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        supplier_name: value,
        supplier_email: '',
        supplier_phone: '',
        supplier_address: ''
      }));
    };

    const handleSupplierSelect = (customer) => {
      setSupplierSearchTerm(customer.customer);
      setShowSupplierDropdown(false);
      
      // Auto-fill supplier details
      setFormData(prev => ({
        ...prev,
        supplier_name: customer.customer,
        supplier_email: customer.email || '',
        supplier_phone: customer.phone || '',
        supplier_address: customer.address || ''
      }));
    };

    const handleSupplierInputFocus = () => {
      if (customers.length > 0) {
        setShowSupplierDropdown(true);
      }
    };

    const handleSupplierInputBlur = () => {
      // Delay to allow click on dropdown item
      setTimeout(() => setShowSupplierDropdown(false), 200);
    };

    // Filter customers based on search term
    const filteredSuppliers = customers.filter(customer =>
      customer.customer.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
      (customer.company && customer.company.toLowerCase().includes(supplierSearchTerm.toLowerCase())) ||
      (customer.email && customer.email.toLowerCase().includes(supplierSearchTerm.toLowerCase()))
    );

    const handleTaxRateChange = (e) => {
      const newTaxRate = parseFloat(e.target.value) || 0;
      setTaxRate(newTaxRate);
      
      // Recalculate totals - ensure all values are numbers
      const subtotal = poItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const taxAmount = subtotal * (newTaxRate / 100);
      const total = subtotal + taxAmount;
      
      setFormData(prev => ({
        ...prev,
        tax_rate: newTaxRate,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2))
      }));
    };

    // Handle item changes
    const handleItemChange = (index, field, value) => {
      const updatedItems = [...poItems];
      updatedItems[index] = { ...updatedItems[index], [field]: value };
      
      // Auto-calculate amount for quantity and unit_price changes
      if (field === 'quantity' || field === 'unit_price') {
        const quantity = field === 'quantity' ? parseFloat(value) || 0 : updatedItems[index].quantity;
        const unitPrice = field === 'unit_price' ? parseFloat(value) || 0 : updatedItems[index].unit_price;
        updatedItems[index].amount = quantity * unitPrice;
      }
      
      setPOItems(updatedItems);
      
      // Update totals in form data - ensure all values are numbers
      const subtotal = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      const taxAmount = subtotal * (parseFloat(taxRate) / 100);
      const total = subtotal + taxAmount;
      
      setFormData(prev => ({
        ...prev,
        subtotal: parseFloat(subtotal.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        total_amount: parseFloat(total.toFixed(2)),
        items: updatedItems.length // Update items count for display
      }));
    };

    // Add new item
    const addNewItem = () => {
      const newItemNo = poItems.length + 1;
      setPOItems([...poItems, {
        item_no: newItemNo,
        description: '',
        quantity: 1,
        unit: 'pcs',
        net_weight: 0,
        unit_price: 0,
        amount: 0
      }]);
    };

    // Remove item
    const removeItem = (index) => {
      if (poItems.length > 1) {
        const updatedItems = poItems.filter((_, i) => i !== index);
        // Update item numbers
        const reorderedItems = updatedItems.map((item, i) => ({
          ...item,
          item_no: i + 1
        }));
        setPOItems(reorderedItems);
        
        // Update totals - ensure all values are numbers
        const subtotal = reorderedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const taxAmount = subtotal * (parseFloat(taxRate) / 100);
        const total = subtotal + taxAmount;
        
        setFormData(prev => ({
          ...prev,
          subtotal: parseFloat(subtotal.toFixed(2)),
          tax_amount: parseFloat(taxAmount.toFixed(2)),
          total_amount: parseFloat(total.toFixed(2)),
          items: reorderedItems.length
        }));
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // Validate required fields - only PO Number and Supplier Name are mandatory
      // Date can be empty or unchanged when editing
      if (!formData.po_number || !formData.supplier_name) {
        alert('Please fill in all required fields: PO Number and Supplier Name');
        return;
      }

      // Validate items
      const validItems = poItems.filter(item => 
        item.description && item.description.trim() !== '' && 
        item.quantity > 0 && 
        item.unit_price >= 0
      );

      if (validItems.length === 0) {
        alert('Please add at least one valid item with description & specifications, quantity, and unit price');
        return;
      }

      // Prepare data with items
      const poData = {
        ...formData,
        items: validItems.map((item, index) => ({
          ...item,
          item_no: index + 1
        }))
      };
      
  console.debug('Submitting PO data:', poData);
      handleSavePO(poData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div ref={editModalRef} className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4">
            {editingPO ? 'Edit Purchase Order' : 'Create New Purchase Order'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PO Number and Date */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  PO Number * {!editingPO && <span className="text-xs text-green-600">(Auto-generated)</span>}
                </label>
                <input
                  type="text"
                  name="po_number"
                  value={formData.po_number || formData.id || ''}
                  readOnly
                  disabled={!!editingPO}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed focus:outline-none"
                  required
                />
              </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">PO Date</label>
                  <input
                    type="date"
                    name="po_date"
                    value={formData.po_date || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

            </div>

            {/* Supplier Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Supplier Information</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-gray-700 font-medium mb-2">Supplier Name *</label>
                  <input
                    type="text"
                    value={supplierSearchTerm}
                    onChange={handleSupplierSearchChange}
                    onFocus={handleSupplierInputFocus}
                    onBlur={handleSupplierInputBlur}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    placeholder={customers.length === 0 ? "Loading suppliers..." : "Type supplier name to search..."}
                    disabled={customers.length === 0}
                  />
                  
                  {/* Dropdown suggestions */}
                  {showSupplierDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuppliers.map((customer) => (
                        <div
                          key={customer.customer_id}
                          onClick={() => handleSupplierSelect(customer)}
                          className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-semibold text-sm">
                                {customer.customer.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {customer.customer}
                              </div>
                              {customer.company && (
                                <div className="text-sm text-gray-500 truncate">
                                  {customer.company}
                                </div>
                              )}
                              <div className="text-sm text-gray-500 truncate">
                                {customer.email}
                              </div>
                              {customer.phone && (
                                <div className="text-xs text-gray-400">
                                  {customer.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* No results message */}
                      {filteredSuppliers.length === 0 && supplierSearchTerm.length > 0 && (
                        <div className="p-4 text-center text-gray-500">
                          <div className="text-sm">No suppliers found</div>
                          <div className="text-xs text-gray-400">Try a different search term or create a new contact person</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Supplier Email</label>
                  <input
                    type="email"
                    name="supplier_email"
                    value={formData.supplier_email || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Supplier Phone</label>
                  <input
                    type="tel"
                    name="supplier_phone"
                    value={formData.supplier_phone || ''}
                    onChange={(e) => {
                      // Allow only numeric values, spaces, parentheses, and + or -
                      const filteredValue = e.target.value.replace(/[^0-9\-\+\(\)\s]/g, '');
                      handleChange({
                        target: {
                          name: 'supplier_phone',
                          value: filteredValue,
                        },
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-2">Supplier Address</label>
                  <input
                    type="text"
                    name="supplier_address"
                    value={formData.supplier_address || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Purchase Order Items */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-gray-700">Purchase Order Items</h4>
                <button
                  type="button"
                  onClick={addNewItem}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  + Add Item
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border border-gray-300 px-3 py-3 text-left text-sm font-medium">Item #</th>
                      <th className="border border-gray-300 px-3 py-3 text-left text-sm font-medium">Item Description & Specifications *</th>
                      <th className="border border-gray-300 px-3 py-3 text-left text-sm font-medium">Quantity</th>
                      <th className="border border-gray-300 px-3 py-3 text-left text-sm font-medium">Net Weight (KG)</th>
                      <th className="border border-gray-300 px-3 py-3 text-left text-sm font-medium">Rate (PKR)</th>
                      <th className="border border-gray-300 px-3 py-3 text-left text-sm font-medium">Amount (PKR)</th>
                      <th className="border border-gray-300 px-3 py-3 text-center text-sm font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          <span className="font-medium text-gray-700">{item.item_no}</span>
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <textarea
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                            rows="3"
                            placeholder="Enter item description and specifications..."
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            step="1"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <input
                            type="number"
                            value={item.net_weight || ''}
                            onChange={(e) => handleItemChange(index, 'net_weight', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3">
                          <input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            min="0"
                            step="0.01"
                            required
                          />
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-right">
                          <span className="font-bold text-gray-800">
                            {(item.amount || 0).toLocaleString('en-PK', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </td>
                        <td className="border border-gray-300 px-3 py-3 text-center">
                          {poItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800 text-lg font-bold"
                              title="Remove Item"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Purchase Order Totals */}
              <div className="mt-4 bg-white p-4 rounded-lg border">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2"></div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Subtotal:</span>
                      <span className="font-medium">
                        PKR {(formData.subtotal || 0).toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">Tax Rate:</span>
                        <input
                          type="number"
                          value={taxRate}
                          onChange={handleTaxRateChange}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          step="0.5"
                        />
                        <span className="text-gray-600">%</span>
                      </div>
                    </div>

                    {/* Tax Summary Note */}
                    {taxRate > 0 && (
                      <div className="bg-blue-50 p-3 rounded border border-blue-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Tax Rate Note:</span> A tax rate of <span className="font-bold text-blue-700">{taxRate}%</span> is being applied on the subtotal amount of <span className="font-bold text-blue-700">PKR {(formData.subtotal || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 })}</span>.
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="font-bold text-lg text-gray-800">Total Amount:</span>
                      <span className="font-bold text-lg text-blue-600">
                        PKR {(formData.total_amount || 0).toLocaleString('en-PK', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Status</label>
                <select
                  name="status"
                  value={formData.status || 'Draft'}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  
                </select>
              </div>
              <div></div>
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Payment Terms (Days)</label>
              <input
                type="number"
                name="payment_days"
                value={formData.payment_days || 30}
                onChange={handleChange}
                min="0"
                max="365"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30"
              />
              <p className="text-sm text-gray-500 mt-1">Number of days for payment (e.g., 30 for "Net 30")</p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Notes</label>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes or instructions"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPO(null);
                }}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingPO ? 'Update PO' : 'Create PO'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };



  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded ${
          notification.type === 'error' 
            ? 'bg-red-100 border border-red-400 text-red-700' 
            : 'bg-green-100 border border-green-400 text-green-700'
        }`}>
          <div className="font-bold">{notification.title}</div>
          <div>{notification.description}</div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Purchase Orders</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {selectedRows.length > 0 
              ? `${selectedRows.length} selected` 
              : 'Manage all your purchase orders and suppliers'}
          </p>
        </div>
        
        <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search purchase orders..." 
              className="pl-10 pr-3 py-1.5 sm:py-2 border rounded-md text-xs sm:text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            {/* PO bulk delete is disabled as per user request */}
            {/* selectedRows.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm(`Delete ${selectedRows.length} selected Purchase Order(s)?`)) {
                    (async () => {
                      try {
                        for (const poId of selectedRows) {
                          await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders/${poId}`, {
                            method: 'DELETE'
                          });
                        }
                        showNotification('Success', `${selectedRows.length} Purchase Order(s) deleted successfully`);
                        setSelectedRows([]);
                        fetchPurchaseOrders();
                      } catch (error) {
                        console.error('Error deleting POs:', error);
                        showNotification('Error', 'Failed to delete some Purchase Orders', 'error');
                      }
                    })();
                  }
                }}
                className="flex items-center gap-1 bg-red-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete ({selectedRows.length})</span>
              </button>
            ) */}
            
            <button 
              className="flex items-center gap-1 bg-[#1976D2] text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-600 transition-colors"
              onClick={handleAddPO}
            >
              <Plus className="w-4 h-4" />
              <span>Create PO</span>
            </button>
            
            <button
              className="flex items-center gap-1 bg-green-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors"
              onClick={fetchPOSummaries}
              title="Refresh Invoice Status"
            >
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button
              className="flex items-center gap-1 bg-white border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Filter</span>
            </button>
            
            <button className="flex items-center gap-1 bg-white border rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50">
              <FileDown className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div ref={filterPanelRef} className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
            <input
              type="text"
              name="supplier"
              className="w-full p-2 border rounded-md text-xs"
              value={filters.supplier}
              onChange={handleFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
              placeholder="Filter by supplier"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Amount</label>
            <input
              type="number"
              name="minAmount"
              value={filters.minAmount}
              onChange={handleFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full p-2 border rounded-md text-xs"
              placeholder="Minimum amount"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Amount</label>
            <input
              type="number"
              name="maxAmount"
              value={filters.maxAmount}
              onChange={handleFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full p-2 border rounded-md text-xs"
              placeholder="Maximum amount"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleFilterChange}
              onMouseDown={(e) => e.stopPropagation()}
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
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full p-2 border rounded-md text-xs"
            />
          </div>
          <div className="md:col-span-5 flex justify-end gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="overflow-x-auto mb-4">
        <div className="flex border-b w-max min-w-full">
          {statusTabs.map(tab => (
            <button
              key={tab}
              className={`px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                setActiveTab(tab);
                setCurrentPage(1);
              }}
            >
              <span className="flex items-center gap-1">
                {tab}
                <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
                  activeTab === tab
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {statusCounts[tab]}
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <div className="relative min-w-full min-h-[350px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-center text-xs sm:text-sm font-normal text-black">
                <th className="pb-3 px-2 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={
                      visiblePOs.length > 0 &&
                      selectedRows.length === visiblePOs.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                </th>
                <th className="pb-3 px-2 whitespace-nowrap text-left">PO ID</th>
                <th className="pb-3 px-2 whitespace-nowrap">Date</th>
                <th className="pb-3 px-2 whitespace-nowrap text-left">Supplier</th>
                <th className="pb-3 px-2 whitespace-nowrap">Amount</th>
                <th className="pb-3 px-2 whitespace-nowrap">Status</th>
                <th className="pb-3 px-2 whitespace-nowrap hidden md:table-cell">Invoice Status</th>
                <th className="pb-3 px-2 whitespace-nowrap hidden sm:table-cell">Remaining</th>

                <th className="pb-3 px-2 whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="text-center divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-sm text-gray-500">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span>Loading purchase orders...</span>
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-sm text-red-500">
                    <div className="flex flex-col items-center space-y-2">
                      <span>{error}</span>
                      <button 
                        onClick={fetchPurchaseOrders}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-4 text-center text-sm text-gray-500">
                    No purchase orders found matching your criteria
                  </td>
                </tr>
              ) : (
                visiblePOs.map((po) => {
                  const invoiceStatus = getInvoicingStatus(po.id);
                  const summary = poSummaries[po.id];
                  
                  return (
                  <tr key={po.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(po.id)}
                        onChange={() => toggleSelectRow(po.id)}
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap text-left">
                      <div className="flex items-center space-x-2">
                        <span>{po.id}</span>
                        {invoiceStatus.status === 'Partially Invoiced' && (
                          <div className="flex items-center">
                            <Clock className="w-3 h-3 text-blue-500" title="Invoice in Progress" />
                          </div>
                        )}
                        {invoiceStatus.status === 'Fully Invoiced' && (
                          <div className="flex items-center">
                            <DollarSign className="w-3 h-3 text-green-500" title="Fully Invoiced" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(po.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap text-left">
                      <div className="max-w-xs truncate">{po.supplier}</div>
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {po.currency} {formatCurrency(typeof po.totalAmount === 'string' ? parseFloat(po.totalAmount) : po.totalAmount)}
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap text-center">
                      <span className={`px-2 py-1 inline-flex items-center justify-center text-xs font-semibold rounded-full ${getStatusClass(po.status)}`}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm whitespace-nowrap hidden md:table-cell">
                      <div className="flex flex-col items-center space-y-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          invoiceStatus.color === 'green' ? 'bg-green-100 text-green-800' :
                          invoiceStatus.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {invoiceStatus.status}
                        </span>
                        {invoiceStatus.percentage > 0 && (
                          <div className="w-16 bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${
                                invoiceStatus.color === 'green' ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${invoiceStatus.percentage}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap hidden sm:table-cell">
                      {summary ? (
                        <div className="text-center">
                          <div className="font-medium">
                            {formatCurrency(summary.remaining_amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            of {formatCurrency(summary.po_total_amount)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-sm whitespace-nowrap relative">
                      <div className="flex justify-center">
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          onClick={(e) => toggleDropdown(po.id, e)}
                        >
                          <Ellipsis className="h-5 w-5" />
                        </button>
                        
                        {activeDropdown === po.id && (
                          <div
                            ref={dropdownRef}
                            className="absolute right-0 z-50 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200"
                          >
                            <div className="py-1">
                              {/* Always available actions */}
                              <button
                                onClick={() => handleView(po)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </button>
                              
                              {/* Edit - Only for non-cancelled POs */}
                              {po.status !== 'Cancelled' && (
                                <button
                                  onClick={() => handleEdit(po)}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </button>
                              )}

                              {/* Cancel/Delete actions based on status */}
                              {po.status !== 'Cancelled' ? (
                                // For active POs - show Permanent Delete option (cancel removed)
                                <button
                                  onClick={() => handlePermanentDelete(po)}
                                  className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Permanent Delete
                                </button>
                              ) : (
                                // For cancelled POs - show Restore and Permanent Delete
                                <>
                                  <button
                                    onClick={() => handleRestore(po)}
                                    className="flex items-center px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 w-full text-left"
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Restore
                                  </button>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  <button
                                    onClick={() => handlePermanentDelete(po)}
                                    className="flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 w-full text-left"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Permanent Delete
                                  </button>
                                </>
                              )}

                              {/* Other actions - always available */}
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                onClick={() => handleViewHistory(po)}
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                              >
                                <History className="w-4 h-4 mr-2" />
                                View History
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
      {filteredPOs.length > ITEMS_PER_PAGE && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t border-gray-200 bg-white gap-3">
          <div className="text-sm text-gray-700">
            <div>Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredPOs.length)} of {filteredPOs.length} purchase orders</div>
            <div className="text-xs text-gray-500 mt-1">Page {currentPage} of {totalPages}</div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {pages.map((page, index) => (
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-3 py-1 text-sm text-gray-500">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    currentPage === page
                      ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100 hover:border-gray-400"
                  } border`}
                >
                  {page}
                </button>
              )
            ))}
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditModal && <EditPOModal />}
      {showHistoryModal && <HistoryModal />}
    </div>
  );
};

export default PurchaseOrderTable;