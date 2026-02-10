import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Eye, EyeOff } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Logo from '../assets/Logo/Logo.png';
import { API_ENDPOINTS } from '../config/api';

const InvoiceDetailsLayoutImproved = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const invoiceRef = useRef();

  // PDF Generation Function using browser's print functionality (same as original)
  const generatePDF = () => {
    try {
      const printWindow = window.open('', '_blank', 'width=800,height=600');
      
      if (!printWindow) {
        alert('Pop-up blocked. Please allow pop-ups for this site to generate PDF.');
        return;
      }

      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoice.invoice_number || id}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: white;
              color: #333;
              line-height: 1.4;
              padding: 20px;
            }
            
            .invoice-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 0;
            }
            
            .company-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 30px;
              padding: 20px;
              border-bottom: 1px solid #e5e5e5;
            }
            
            .company-info {
              display: block;
              align-items: center;
              gap: 20px;
            }
            
            .company-logo {
              width: 15rem;
              padding-bottom: 20px;
            }
            
            .company-details h2 {
              font-size: 16px;
              font-weight: 600;
              color: #333843;
              margin-bottom: 8px;
            }
            
            .company-details p {
              font-size: 12px;
              color: #667085;
              margin-bottom: 2px;
            }
            
            .invoice-meta {
              text-align: right;
            }
            
            .invoice-number {
              background: #f4f5f6;
              padding: 8px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .total-amount {
              font-size: 18px;
              font-weight: bold;
              color: #333843;
            }
            
            .total-label {
              font-size: 12px;
              color: #667085;
              margin-bottom: 4px;
            }
            
            .billing-section {
              display: grid;
              grid-template-columns: 1fr 2fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            
            .bill-dates {
              background: #1976d2;
              color: white;
              padding: 20px;
              border-radius: 8px;
            }
            
            .bill-dates p {
              margin-bottom: 15px;
            }
            
            .bill-dates .label {
              font-size: 14px;
              margin-bottom: 5px;
            }
            
            .bill-dates .value {
              font-size: 16px;
              font-weight: 500;
            }
            
            .billing-address h3 {
              font-size: 15px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .customer-name {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 5px;
            }
            
            .billing-address p {
              font-size: 14px;
              color: #666;
              margin-bottom: 2px;
            }
            
            .note-section {
              margin-top: 20px;
            }
            
            .note-section h4 {
              font-size: 15px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            
            .invoice-table th {
              background: #f8f9fa;
              padding: 12px 8px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              color: #667085;
              border-bottom: 1px solid #e5e5e5;
            }
            
            .invoice-table td {
              padding: 15px 8px;
              font-size: 14px;
              border-bottom: 1px solid #f0f0f0;
            }
            
            .invoice-table th:first-child,
            .invoice-table td:first-child {
              text-align: left;
            }
            
            .invoice-table th:not(:first-child),
            .invoice-table td:not(:first-child) {
              text-align: right;
            }
            
            .summary-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 30px;
            }
            
            .summary-table {
              width: 300px;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
            }
            
            .summary-row:last-child {
              border-bottom: 2px solid #333;
              font-weight: bold;
              font-size: 16px;
              padding-top: 12px;
            }
            
            .terms {
              border-top: 1px solid #e5e5e5;
              padding-top: 20px;
            }
            
            .terms h4 {
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .terms p {
              font-size: 14px;
              color: #666;
            }
            
            @media print {
              body { margin: 0; padding: 10px; }
              .invoice-container { margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <div class="company-header">
              <div class="company-info">
                <img src="${Logo}" alt="Company Logo" class="company-logo">
                <div class="company-details">
                  <h2>A Rauf Brother Textile</h2>
                  <p>Room No.205 Floor Saleha Chamber, Plot No. 8-9/C-1 Site, Karachi</p>
                  <p>contact@araufbrothe.com</p>
                  <p><strong>S.T. Reg.No:</strong> 3253255666541</p>
                  <p>Telephone No: 021-36404043</p>
                  <p><strong>NTN No:</strong> 7755266214-8</p>
                </div>
              </div>
              <div class="invoice-meta">
                <div class="invoice-number">#${invoice.bill_date ? new Date(invoice.bill_date).toISOString().split('T')[0] : 'N/A'}</div>
                <div class="total-label">Total Amount</div>
                <div class="total-amount">${invoice.currency || 'PKR'} ${parseFloat(invoice.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 24px; font-weight: bold; color: #333843;">Invoice #${invoice.invoice_number || id}</h1>
              <p style="color: #667085; margin-top: 8px;">Invoice Date: ${invoice.bill_date ? new Date(invoice.bill_date).toLocaleDateString('en-GB', { 
                day: 'numeric',
                month: 'short', 
                year: 'numeric'
              }).toUpperCase() : 'N/A'}</p>
            </div>
            
            <div class="billing-section">
              <div class="bill-dates">
                <div>
                  <div class="label">Bill Date</div>
                  <div class="value">${invoice.bill_date ? new Date(invoice.bill_date).toLocaleDateString('en-GB') : 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Delivery Date</div>
                  <div class="value">${invoice.delivery_date ? new Date(invoice.delivery_date).toLocaleDateString('en-GB') : 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Terms of Payment</div>
                  <div class="value">${invoice.terms_of_payment || 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Payment Days</div>
                  <div class="value">${invoice.payment_days !== null && invoice.payment_days !== undefined ? invoice.payment_days : 'N/A'}</div>
                </div>
                <div>
                  <div class="label">Due Date</div>
                  <div class="value">${invoice.payment_deadline ? new Date(invoice.payment_deadline).toLocaleDateString('en-GB') : 'N/A'}</div>
                </div>
              </div>
              
              <div class="billing-address">
                <h3>Billing Address</h3>
                <div class="customer-name">${invoice.customer_name || 'N/A'}</div>
                <p>${invoice.address || 'N/A'}</p>
                <p>${invoice.customer_email || 'N/A'}</p>
                ${invoice.st_reg_no ? `<p><strong>S.T. Reg.No:</strong> ${invoice.st_reg_no}</p>` : ''}
                ${invoice.p_number ? `<p><strong>Telephone No:</strong> ${invoice.p_number}</p>` : ''}
                ${invoice.ntn_number ? `<p><strong>NTN No:</strong> ${invoice.ntn_number}</p>` : ''}
                
                <div class="note-section">
                  <h4>Note</h4>
                  <p>${invoice.note || 'No additional notes'}</p>
                </div>
              </div>
            </div>
            
            <table class="invoice-table">
              <thead>
                <tr>
                  <th>NO.</th>
                  <th>DESCRIPTION OF GOODS</th>
                  <th>QUANTITY</th>
                  <th>NET WEIGHT IN KG</th>
                  <th>RATE</th>
                  <th>AMOUNT OF SALES TAX</th>
                  <th>FINAL AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items && invoice.items.length > 0 ? 
                  invoice.items.map((item, index) => `
                    <tr>
                      <td>${item.item_no || (index + 1)}</td>
                      <td>${item.description || 'N/A'}</td>
                      <td>${parseFloat(item.quantity || 0).toLocaleString()}</td>
                      <td>-</td>
                      <td>${parseFloat(item.rate || 0).toLocaleString()}</td>
                      <td>-</td>
                      <td><strong>${parseFloat(item.amount || 0).toLocaleString()}</strong></td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td>1</td>
                      <td>${invoice.item_name || 'N/A'}</td>
                      <td>${parseFloat(invoice.quantity || 0).toLocaleString()}</td>
                      <td>-</td>
                      <td>${parseFloat(invoice.rate || 0).toLocaleString()}</td>
                      <td>${parseFloat(invoice.tax_amount || 0).toLocaleString()}</td>
                      <td><strong>${parseFloat(invoice.item_amount || 0).toLocaleString()}</strong></td>
                    </tr>
                  `
                }
              </tbody>
            </table>
            
            <div class="summary-section">
              <div class="summary-table">
                <div class="summary-row">
                  <span>Subtotal:</span>
                  <span>${parseFloat(invoice.subtotal || 0).toLocaleString()}</span>
                </div>
                <div class="summary-row">
                  <span>Tax Rate:</span>
                  <span>${invoice.tax_rate || 0}%</span>
                </div>
                <div class="summary-row">
                  <span>Sales Tax:</span>
                  <span>${parseFloat(invoice.salesTax || 0).toLocaleString()}</span>
                </div>
                <div class="summary-row">
                  <span>Total Price:</span>
                  <span>${parseFloat(invoice.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div class="terms">
              <h4>Terms & Conditions</h4>
              <p>${invoice.terms_of_payment ? `Please pay ${invoice.terms_of_payment.toLowerCase()}.` : (invoice.payment_days ? `Payment must be made within ${invoice.payment_days} day(s) from invoice date.` : 'Please pay within 15 days of receiving this invoice.') }</p>
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printHTML);
      printWindow.document.close();

      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          setTimeout(() => {
            printWindow.close();
          }, 1000);
        }, 500);
      };

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/invoices/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }
        
        const data = await response.json();
        setInvoice(data);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-500">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error loading invoice</div>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Invoice not found</div>
          <button
            onClick={() => navigate('/invoices')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background" style={{ backgroundColor: "#F4F5F6" }}>
      {/* Sidebar */}
      <div className="hidden md:block fixed h-full w-64 z-20">
        <Sidebar />
      </div>

      {/* Main Content */}
    <div className="flex-1 flex flex-col md:ml-64 relative">
      {/* Header */}
      <Header />        {/* Main Container - Better Layout */}
        <div className="flex-1 p-6">
          {/* Enhanced Invoice Header with better spacing */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 bg-white rounded-lg shadow-sm p-6">
            {/* Left Side: Invoice Info */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/invoices')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Invoices</span>
              </button>
              <div className="border-l border-gray-300 pl-4">
                <h1 className="text-[24px] font-bold text-[#333843]">Invoice #{invoice.invoice_number || id}</h1>
                <p className="text-[16px] text-[#667085]">Invoice Date : {invoice.bill_date ? new Date(invoice.bill_date).toLocaleDateString('en-GB', { 
                  day: 'numeric',
                  month: 'short', 
                  year: 'numeric'
                }).toUpperCase() : 'N/A'}</p>
              </div>
            </div>

            {/* Right Side: Action Buttons */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {showPaymentHistory ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span>{showPaymentHistory ? 'Hide' : 'Show'} History</span>
              </button>
              <button 
                onClick={generatePDF}
                className="flex flex-row justify-center items-center px-5 py-2 gap-[10px] bg-[#1976D2] rounded-lg hover:bg-[#1565C0] transition-colors"
              >
                <Printer className="w-5 h-5 text-white" />
                <span className="font-semibold text-[18px] text-white">Print PDF</span>
              </button>
            </div>
          </div>

          {/* Main Content Grid - Better Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            
            {/* Invoice Content - Takes 3 columns on xl screens */}
            <div className="xl:col-span-3">
              <div ref={invoiceRef} className="bg-white rounded-lg shadow-sm overflow-hidden">
                
                {/* Company Header - Improved layout */}
                <div className="flex justify-between items-center gap-6 px-8 py-6 border-b border-gray-200">
                  {/* Company Info */}
                  <div className="flex flex-col gap-5">
                    <div className="w-[15rem] flex-shrink-0">
                      <img src={Logo} alt="Company Logo" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[#333843] mb-2">A Rauf Brother Textile</h2>
                      <div className="space-y-1 text-sm text-[#667085]">
                        <p>Room No.205 Floor Saleha Chamber, Plot No. 8-9/C-1 Site, Karachi</p>
                        <p>contact@araufbrothe.com</p>
                        <p><strong>S.T. Reg.No:</strong> 3253255666541 | Telephone No: 021-36404043</p>
                        <p><strong>NTN No:</strong> 7755266214-8</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Number and Total Amount */}
                  <div className="text-right">
                    <div className="bg-[#F4F5F6] px-3 py-2 rounded-lg mb-4">
                      <span className="text-sm font-semibold text-[#333843]">
                        #{invoice.bill_date ? new Date(invoice.bill_date).toISOString().split('T')[0] : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-[#667085] block mb-1">Total Amount</span>
                      <span className="text-xl font-bold text-[#333843]">
                        {invoice.currency || 'PKR'} {parseFloat(invoice.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Billing Information Section - Better Grid Layout */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
                    {/* Bill Dates - Blue section */}
                    <div className="lg:col-span-2 bg-[#1976D2] rounded-lg text-white p-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm opacity-90 mb-1">Bill Date</p>
                          <p className="font-semibold">{invoice.bill_date ? new Date(invoice.bill_date).toLocaleDateString('en-GB') : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-90 mb-1">Delivery Date</p>
                          <p className="font-semibold">{invoice.delivery_date ? new Date(invoice.delivery_date).toLocaleDateString('en-GB') : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-90 mb-1">Terms of Payment</p>
                          <p className="font-semibold">{invoice.terms_of_payment || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm opacity-90 mb-1">Payment Deadline</p>
                          <p className="font-semibold">{invoice.payment_deadline ? new Date(invoice.payment_deadline).toLocaleDateString('en-GB') : 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Billing Address */}
                    <div className="lg:col-span-3">
                      <h3 className="text-lg font-semibold text-[#333] mb-4">Billing Address</h3>
                      <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-[#333]">{invoice.customer_name || 'N/A'}</h4>
                        <div className="text-sm text-[#666] space-y-1">
                          <p>{invoice.address || 'N/A'}</p>
                          <p>{invoice.customer_email || 'N/A'}</p>
                          {invoice.st_reg_no && <p><strong>S.T. Reg.No:</strong> {invoice.st_reg_no}</p>}
                          {invoice.p_number && <p><strong>Telephone No:</strong> {invoice.p_number}</p>}
                          {invoice.ntn_number && <p><strong>NTN No:</strong> {invoice.ntn_number}</p>}
                        </div>
                        
                        {invoice.note && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h5 className="font-medium text-[#333] mb-2">Note</h5>
                            <p className="text-sm text-[#666]">{invoice.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Invoice Table */}
                  <div className="mb-6">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NO.</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DESCRIPTION OF GOODS</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">QUANTITY</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">NET WEIGHT IN KG</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">RATE</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">AMOUNT OF SALES TAX</th>
                            <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">FINAL AMOUNT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.items && invoice.items.length > 0 ? (
                            invoice.items.map((item, index) => (
                              <tr key={item.id || index} className="border-b border-gray-100">
                                <td className="py-4 px-4 text-sm text-gray-600">{item.item_no || (index + 1)}</td>
                                <td className="py-4 px-4 text-sm text-gray-600">{item.description || 'N/A'}</td>
                                <td className="py-4 px-4 text-sm text-gray-600 text-right">{parseFloat(item.quantity || 0).toLocaleString()}</td>
                                <td className="py-4 px-4 text-sm text-gray-600 text-right">-</td>
                                <td className="py-4 px-4 text-sm text-gray-600 text-right">{parseFloat(item.rate || 0).toLocaleString()}</td>
                                <td className="py-4 px-4 text-sm text-gray-600 text-right">-</td>
                                <td className="py-4 px-4 text-sm font-semibold text-gray-900 text-right">{parseFloat(item.amount || 0).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            // Fallback to old single item structure if no items array
                            <tr className="border-b border-gray-100">
                              <td className="py-4 px-4 text-sm text-gray-600">1</td>
                              <td className="py-4 px-4 text-sm text-gray-600">{invoice.item_name || 'N/A'}</td>
                              <td className="py-4 px-4 text-sm text-gray-600 text-right">{parseFloat(invoice.quantity || 0).toLocaleString()}</td>
                              <td className="py-4 px-4 text-sm text-gray-600 text-right">-</td>
                              <td className="py-4 px-4 text-sm text-gray-600 text-right">{parseFloat(invoice.rate || 0).toLocaleString()}</td>
                              <td className="py-4 px-4 text-sm text-gray-600 text-right">{parseFloat(invoice.tax_amount || 0).toLocaleString()}</td>
                              <td className="py-4 px-4 text-sm font-semibold text-gray-900 text-right">{parseFloat(invoice.item_amount || 0).toLocaleString()}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="flex justify-end mb-6">
                    <div className="w-full max-w-sm">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Subtotal</span>
                          <span className="text-sm font-semibold text-gray-900">{parseFloat(invoice.subtotal || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Tax Rate</span>
                          <span className="text-sm font-semibold text-gray-900">{invoice.tax_rate || 0}%</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-sm font-medium text-gray-700">Sales Tax</span>
                          <span className="text-sm font-semibold text-gray-900">{parseFloat(invoice.salesTax || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between py-3 pt-4 border-t-2 border-gray-800">
                          <span className="text-lg font-bold text-gray-900">Total Price</span>
                          <span className="text-lg font-bold text-gray-900">{parseFloat(invoice.total_amount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Terms & Conditions</h4>
                    <p className="text-sm text-gray-600">{invoice.terms_of_payment ? `Please pay ${invoice.terms_of_payment.toLowerCase()}.` : 'Please pay within 15 days of receiving this invoice.'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sidebar - Takes 1 column on xl screens */}
            <div className="xl:col-span-1">
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-6">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Invoice Status</h3>
                </div>
                <div className="p-4">
                  <div className={`inline-flex items-center px-3 py-2 rounded-lg font-medium ${
                    invoice.status === 'Paid' 
                      ? 'bg-green-100 text-green-800'
                      : invoice.status === 'Pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {invoice.status || 'Pending'}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500 mb-1">Total Amount Due</div>
                    <div className="text-xl font-bold text-gray-900">
                      {invoice.currency || 'PKR'} {parseFloat(invoice.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Box - Improved */}
              <div className="bg-white border border-gray-100 shadow-sm rounded-lg p-6">
                <h3 className="font-semibold text-[#333843] mb-4 text-center">
                  {invoice.is_sent ? 'Invoice sent!' : 'Invoice not yet sent!'}
                </h3>
                <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#1976D2] text-white rounded-lg hover:bg-[#1565C0] transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.3334 9.99935L1.66675 9.99935M18.3334 9.99935L11.6667 16.666M18.3334 9.99935L11.6667 3.33268"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="font-semibold">Send Invoice</span>
                </button>
              </div>

              {/* Payment History - Only show when toggled */}
              {showPaymentHistory && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 mt-6 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment History</h3>
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No payment history available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsLayoutImproved;