/* PurchaseOrder.jsx */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PurchaseOrderTable from '../components/PurchaseOrderTable';
import PurchaseOrderDetails from '../components/PurchaseOrderDetails';
import { API_ENDPOINTS } from '../config/api';

const PurchaseOrder = () => {
  const { poId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  // If another page (InvoiceTable) requested opening PO edit, it will pass state.editPOId
  const editPOIdFromState = location?.state?.editPOId || null;
  const [activeView, setActiveView] = useState('list'); // 'list' or 'details'
  const [selectedPOId, setSelectedPOId] = useState(null);
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Handle URL parameter changes
  useEffect(() => {
    if (poId) {
      setSelectedPOId(poId);
      setActiveView('details');
    } else {
      setActiveView('list');
      setSelectedPOId(null);
    }
    fetchSummaryData();
  }, [poId]);

  const fetchSummaryData = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.PURCHASE_ORDERS.LIST);
      if (response.ok) {
        const data = await response.json();
        
        // Helper function to format currency values properly
        const formatCurrency = (value) => {
          if (!value || isNaN(value)) return '0';
          return new Intl.NumberFormat('en-PK', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          }).format(value);
        };

        // Calculate current month and last month for comparisons
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Calculate statistics from the data
        const totalOrders = data.length;
        const pendingOrders = data.filter(po => po.status === 'Pending').length;
        const approvedOrders = data.filter(po => po.status === 'Approved').length;
        const completedOrders = data.filter(po => po.status === 'Completed').length;
        const cancelledOrders = data.filter(po => po.status === 'Cancelled').length;
        
        // Analyze invoice status for better insights
        const fullyInvoicedOrders = data.filter(po => po.invoice_status === 'Fully Invoiced').length;
        const partiallyInvoicedOrders = data.filter(po => po.invoice_status === 'Partially Invoiced').length;
        const notInvoicedOrders = data.filter(po => !po.invoice_status || po.invoice_status === 'Not Invoiced').length;
        
        const totalValue = data.reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);
        const invoicedValue = data.reduce((sum, po) => {
          // Calculate invoiced amount based on remaining value
          const total = parseFloat(po.total_amount) || 0;
          const remaining = parseFloat(po.remaining_amount) || 0;
          return sum + (total - remaining);
        }, 0);
        
        // Calculate this month's orders and value
        const thisMonthOrders = data.filter(po => {
          const poDate = new Date(po.po_date);
          return poDate.getMonth() === currentMonth && poDate.getFullYear() === currentYear;
        });
        const thisMonthValue = thisMonthOrders.reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);
        const thisMonthCount = thisMonthOrders.length;

        // Calculate last month's orders for comparison
        const lastMonthOrders = data.filter(po => {
          const poDate = new Date(po.po_date);
          return poDate.getMonth() === lastMonth && poDate.getFullYear() === lastMonthYear;
        });
        const lastMonthValue = lastMonthOrders.reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);
        const lastMonthCount = lastMonthOrders.length;

        // Calculate percentage changes
        const orderCountChange = lastMonthCount > 0 ? ((thisMonthCount - lastMonthCount) / lastMonthCount * 100) : (thisMonthCount > 0 ? 100 : 0);
        const valueChange = lastMonthValue > 0 ? ((thisMonthValue - lastMonthValue) / lastMonthValue * 100) : (thisMonthValue > 0 ? 100 : 0);

        // Calculate meaningful pending insights
        const activeOrdersCount = pendingOrders + approvedOrders; // Orders that need attention
        const ordersReadyForInvoicing = approvedOrders - fullyInvoicedOrders; // Approved but not fully invoiced

        setSummaryData([
          {
            title: "Total Purchase Orders",
            amount: totalOrders.toString(),
            currency: "",
            indicator: { 
              text: orderCountChange >= 0 ? `+${Math.round(orderCountChange)}%` : `${Math.round(orderCountChange)}%`,
              color: orderCountChange >= 0 ? "green" : "red"
            },
          },
          {
            title: "Active Orders",
            amount: approvedOrders.toString(),
            currency: "",
            indicator: { 
              text: partiallyInvoicedOrders > 0 ? `${partiallyInvoicedOrders} In Progress` : (fullyInvoicedOrders > 0 ? "All Complete" : `${approvedOrders} Approved`),
              color: partiallyInvoicedOrders > 0 ? "yellow" : (fullyInvoicedOrders > 0 ? "green" : "blue")
            },
          },
          {
            title: "Total Value",
            amount: formatCurrency(totalValue),
            currency: "PKR",
            indicator: { 
              text: invoicedValue > 0 ? `${((invoicedValue / totalValue) * 100).toFixed(0)}% Invoiced` : "0% Invoiced",
              color: invoicedValue === totalValue ? "green" : (invoicedValue > 0 ? "yellow" : "red")
            },
          },
          {
            title: "This Month",
            amount: formatCurrency(thisMonthValue),
            currency: "PKR",
            indicator: { 
              text: `${thisMonthCount} New`,
              color: thisMonthCount > 0 ? "blue" : "gray"
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching summary data:', error);
      // Set default values on error with logical defaults
      setSummaryData([
        {
          title: "Total Purchase Orders",
          amount: "0",
          currency: "",
          indicator: { text: "0%", color: "gray" },
        },
        {
          title: "Active Orders",
          amount: "0",
          currency: "",
          indicator: { text: "None Yet", color: "gray" },
        },
        {
          title: "Total Value",
          amount: "0",
          currency: "PKR",
          indicator: { text: "0% Invoiced", color: "gray" },
        },
        {
          title: "This Month",
          amount: "0",
          currency: "PKR",
          indicator: { text: "0 New", color: "gray" },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };



  const handleViewPODetails = (poId) => {
    // Navigate to the detailed view with PO ID in URL
    navigate(`/purchase-order/${poId}`);
  };

  const handleBackToList = () => {
    // Navigate back to the list view
    navigate('/purchase-order');
  };

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen p-4">
      {/* Sidebar */}
      <div className="hidden md:block fixed h-screen w-64 z-20">
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 bg-[#F5F5F5] md:ml-64">
        <Header />

        {/* Toggle between List and Details View */}
        {activeView === 'list' ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {summaryData.map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 mb-1">{item.title}</h3>
                      <div className="flex items-baseline gap-2">
                        {item.currency && (
                          <span className="text-xs text-gray-500">{item.currency}</span>
                        )}
                        <span className="text-2xl font-bold text-gray-900">{item.amount}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3h5v5M4 21l5-5M21 3l-16 16" />
                        <path d="M21 21v-5h-5M4 4h5v5" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      item.indicator.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                      item.indicator.color === 'red' ? 'bg-red-100 text-red-800' :
                      item.indicator.color === 'green' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.indicator.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
                
            {/* Purchase Order Table */}
            <PurchaseOrderTable onViewDetails={handleViewPODetails} openEditPOId={editPOIdFromState} />
          </>
        ) : (
          <PurchaseOrderDetails 
            poId={selectedPOId} 
            onBack={handleBackToList}
          />
        )}
        
        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default PurchaseOrder;