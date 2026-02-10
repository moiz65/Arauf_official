import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SummaryCard from '../components/SummaryCard';
import InvoiceTable from '../components/InvoiceTable';
import TransactionHistory from '../components/TransactionHistory';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../config/api';

const Invoices = () => {
  const [summaryData, setSummaryData] = useState([
    {
      title: "Total Invoices",
      amount: "0",
      currency: "",
      indicator: { text: "Loading...", color: "gray" },
    },
    {
      title: "Awaiting Payment",
      amount: "0",
      currency: "PKR", 
      indicator: { text: "Loading...", color: "gray" },
    },
    {
      title: "Overdue Amount",
      amount: "0",
      currency: "PKR",
      indicator: { text: "Loading...", color: "gray" },
    },
    {
      title: "Paid Invoices",
      amount: "0",
      currency: "PKR",
      indicator: { text: "Loading...", color: "gray" },
    },
  ]);
  const [loading, setLoading] = useState(true);

  // Fetch real invoice statistics
  const fetchInvoiceStats = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL invoices in a single call (no filters) to get accurate counts
      const response = await fetch(`${API_ENDPOINTS.INVOICES.LIST}?limit=1000&_t=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }
      
      const data = await response.json();
      const allInvoices = data.data || data || [];
      
      // Separate invoices by type based on invoice_type field
      const poInvoices = allInvoices.filter(inv => inv && inv.invoice_type === 'po_invoice');
      const regularInvoices = allInvoices.filter(inv => inv && inv.invoice_type !== 'po_invoice');
      
      const totalInvoiceCount = allInvoices.length;
      const poCount = allInvoices.filter(inv => inv && inv.invoice_type === 'po_invoice').length;
      const regularCount = allInvoices.filter(inv => inv && inv.invoice_type !== 'po_invoice').length;

      // Derive counts by status similar to InvoiceTable.getTabCounts to avoid mismatches
      const counts = {
        'All': 0,
        'Paid': 0,
        'Pending': 0,
        'Overdue': 0,
        'Sent': 0,
        'Not Sent': 0,
        'PO Invoices': 0
      };

      allInvoices.forEach(inv => {
        if (!inv) return;
        // Count PO invoices separately
        if (inv.invoice_type === 'po_invoice') {
          counts['PO Invoices']++;
        }

        // Count by status for all invoices (both regular and PO)
        if (inv.status === 'Paid') {
          counts['Paid']++;
        } else if (inv.status === 'Pending') {
          counts['Pending']++;
        } else if (inv.status === 'Overdue') {
          counts['Overdue']++;
        } else if (inv.status === 'Sent') {
          counts['Sent']++;
        } else if (inv.status === 'Not Sent' || inv.status === 'Draft') {
          counts['Not Sent']++;
        }
      });

      // Ensure 'All' includes non-PO status-sum + PO invoices, same as InvoiceTable logic
      const statusSum = (counts['Paid'] || 0) + (counts['Pending'] || 0) + (counts['Overdue'] || 0) + (counts['Sent'] || 0) + (counts['Not Sent'] || 0);
      counts['All'] = statusSum + (counts['PO Invoices'] || 0);

      // Use derived counts to display totals (keeps consistency with InvoiceTable)
      const displayTotal = counts['All'];
      const displayPo = counts['PO Invoices'];
      const displayRegular = displayTotal - displayPo;

      console.log('Invoices.jsx - Derived counts from statuses:', counts, 'DisplayTotal:', displayTotal, 'Regular:', displayRegular, 'PO:', displayPo);

      // Helper to safely extract numeric amount from different API shapes
      const extractAmount = (inv) => {
        if (!inv) return 0;
        // Common field names used across endpoints
        const candidates = [
          inv.total_amount,
          inv.totalAmount,
          inv.total,
          inv.amount,
          inv.subtotal,
          inv.invoice_amount,
          inv.invoiceTotal,
          inv.final_amount
        ];
        for (const c of candidates) {
          const v = parseFloat(c);
          if (!isNaN(v)) return v;
        }
        return 0;
      };

      // Helper function to format currency
      const formatCurrency = (value) => {
        if (!value || isNaN(value)) return '0';
        return new Intl.NumberFormat('en-PK', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(value);
      };
      
      // Calculate statistics from ALL invoices (regular + PO combined)
      // All paid invoices (only Paid status)
      const paidInvoices = allInvoices.filter(inv => inv && inv.status === 'Paid');
      const paidAmount = paidInvoices.reduce((sum, inv) => sum + extractAmount(inv), 0);
      
      // Outstanding invoices (Not Sent, Draft, Sent, Pending - awaiting payment, excludes Paid and Overdue)
      const outstandingStatuses = ['Not Sent', 'Draft', 'Sent', 'Pending'];
      const outstandingInvoices = allInvoices.filter(inv => inv && outstandingStatuses.includes(inv.status));
      const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + extractAmount(inv), 0);
      
      // Overdue invoices (need immediate attention - separate category)
      const overdueInvoices = allInvoices.filter(inv => inv && inv.status === 'Overdue');
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + extractAmount(inv), 0);

      setSummaryData([
        {
          title: "Total Invoices",
          amount: displayTotal.toString(),
          currency: "",
          indicator: { 
            text: `${displayRegular} Regular + ${displayPo} PO`,
            color: displayTotal > 0 ? "blue" : "gray" 
          },
        },
        {
          title: "Pending Invoice Payment", 
          amount: formatCurrency(outstandingAmount),
          currency: "PKR",
          indicator: { 
            text: `${outstandingInvoices.length} Invoices`,
            color: outstandingInvoices.length > 0 ? "yellow" : "green" 
          },
        },
        {
          title: "Overdue Invoice Amount",
          amount: formatCurrency(overdueAmount),
          currency: "PKR",
          indicator: { 
            text: overdueInvoices.length > 0 ? `${overdueInvoices.length} Need Action` : "All Clear",
            color: overdueInvoices.length > 0 ? "red" : "green" 
          },
        },
        {
          title: "Paid Invoice Invoices",
          amount: formatCurrency(paidAmount),
          currency: "PKR",
          indicator: { 
            text: `${paidInvoices.length} Completed`,
            color: paidInvoices.length > 0 ? "green" : "gray" 
          },
        },
      ]);
      
    } catch (error) {
      console.error('Error fetching invoice statistics:', error);
      toast.error('Failed to load invoice statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceStats();
  }, []);

  // InvoiceTable and TransactionHistory components now fetch their own data

  const handleCreateInvoice = () => {
    toast.success('Creating a new invoice...', {
      description: 'Your new invoice is being prepared.',
    });
  };

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen p-4">
      {/* Sidebar */}
      <div className="hidden md:block fixed h-screen w-64 z-20">
        <Sidebar />
      </div>
      {/* Main Content */}
      <main className="flex-1 p-6 bg-[#F5F5F5] md:ml-64">
        <div className="flex justify-between items-center mb-6">
        
        </div>
  <Header />
        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          {summaryData.map((item, index) => (
            <SummaryCard
              key={index}
              title={item.title}
              amount={loading ? "..." : item.amount}
              currency={item.currency}
              indicator={item.indicator}
            />
          ))}
        </section>

        {/* Invoices - Full Width */}
        <section className="w-full mb-5">
          <InvoiceTable onCreateInvoice={handleCreateInvoice} />
        </section>

        {/* Transaction History */}
        <section className="mt-5">
          <TransactionHistory />
        </section>

      {/* Footer */}
      <Footer />
      </main>
      

    </div>
  );
};

export default Invoices;
