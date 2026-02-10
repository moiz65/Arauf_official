import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_ENDPOINTS } from '../config/api';

const FinancialReport = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const generated = params.get('generated');

  const generatedDate = generated ? new Date(generated) : new Date();
  const reportId = params.get('id');
  const reportRange = params.get('range');
  const reportStart = params.get('start');
  const reportEnd = params.get('end');
  const download = params.get('download');

  const [autoDownloading, setAutoDownloading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [totals, setTotals] = useState({ debit: 0, credit: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const totalBalance = totals.debit - totals.credit;

  // Fetch financial data from API
  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Build query params
        const queryParams = new URLSearchParams();
        if (reportRange) queryParams.append('range', reportRange);
        if (reportRange === 'custom' && reportStart && reportEnd) {
          queryParams.append('startDate', reportStart);
          queryParams.append('endDate', reportEnd);
        }

        const response = await fetch(`${API_ENDPOINTS.FINANCIAL_REPORTS.CONTACT_BALANCES}?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch financial data');
        }

        const data = await response.json();

        if (data.success) {
          // Map API data to display format
          const mappedContacts = data.data.contacts.map(c => ({
            id: c.customer_id,
            name: c.company_name || c.contact_name,
            contact: c.contact_name,
            email: c.email,
            phone: c.phone,
            debit: Number(c.total_debit || 0),
            credit: Number(c.total_credit || 0)
          }));

          setContacts(mappedContacts);
          setTotals({
            debit: Number(data.data.totals.debit || 0),
            credit: Number(data.data.totals.credit || 0)
          });
        } else {
          throw new Error(data.error || 'Failed to load data');
        }
      } catch (err) {
        console.error('Error fetching financial data:', err);
        setError(err.message);
        // Set empty data on error
        setContacts([]);
        setTotals({ debit: 0, credit: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialData();
  }, [reportRange, reportStart, reportEnd]);

  const formatCurrency = (amt) => `PKR ${Number(amt || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const formatShortDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-GB');
    } catch (e) {
      return iso || '';
    }
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const footerHeight = 12;

      // Add header to first page
      const addHeader = () => {
        // Top border line
        doc.setDrawColor(52, 115, 214);
        doc.setLineWidth(0.5);
        doc.line(margin, 12, pageWidth - margin, 12);

        // Company logo/name section
        doc.setFontSize(16);
        doc.setTextColor(52, 115, 214);
        doc.setFont(undefined, 'bold');
        doc.text('A-RAUF TEXTILE', margin, 20);

        // Financial Report title
        doc.setFontSize(14);
        doc.setTextColor(34, 34, 34);
        doc.setFont(undefined, 'normal');
        doc.text('Financial Report', pageWidth / 2, 20, { align: 'center' });

        // Header details
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated: ${generatedDate.toLocaleString()}`, pageWidth - margin, 17, { align: 'right' });

        if (reportId) {
          doc.text(`Report ID: ${reportId}`, pageWidth - margin, 21, { align: 'right' });
        }

        // Separator line
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(margin, 24, pageWidth - margin, 24);
      };

      // Add header to first page
      addHeader();

      // Summary section
      let currentY = 28;
      doc.setFontSize(11);
      doc.setTextColor(52, 115, 214);
      doc.setFont(undefined, 'bold');
      doc.text('Summary', margin, currentY);
      currentY += 6;

      // Summary box background
      doc.setFillColor(245, 247, 250);
      doc.rect(margin, currentY, pageWidth - 2 * margin, 20, 'F');

      // Summary details
      doc.setFontSize(10);
      doc.setTextColor(34, 34, 34);
      doc.setFont(undefined, 'normal');

      doc.text(`Total Debit: ${formatCurrency(totals.debit)}`, margin + 3, currentY + 6);
      doc.text(`Total Credit: ${formatCurrency(totals.credit)}`, margin + 3, currentY + 12);
      doc.text(`Total Balance: ${formatCurrency(totalBalance)}`, margin + 3, currentY + 18);

      if (reportRange) {
        const rangeText = reportRange === 'custom' && reportStart && reportEnd
          ? `Period: ${formatShortDate(reportStart)} to ${formatShortDate(reportEnd)}`
          : `Period: ${reportRange}`;
        doc.text(rangeText, pageWidth - margin - 50, currentY + 6);
      }

      currentY += 26;

      // Contact Details section
      doc.setFontSize(11);
      doc.setTextColor(52, 115, 214);
      doc.setFont(undefined, 'bold');
      doc.text('Contact Balances', margin, currentY);
      currentY += 5;

      // Table data
      const head = [['Contact Person', 'Company/Name', 'Debit (PKR)', 'Credit (PKR)', 'Balance (PKR)']];
      const body = contacts.map(c => [
        c.contact || '-',
        c.name || '-',
        c.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        c.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        (c.debit - c.credit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]);

      // Add totals row
      body.push([
        '',
        'TOTALS',
        totals.debit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totals.credit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      ]);

      // Use autoTable function from the import
      autoTable(doc, {
        head,
        body,
        startY: currentY,
        margin: { top: 35, right: margin, bottom: footerHeight + 5, left: margin },
        pageBreak: 'auto',
        theme: 'grid',
        headStyles: {
          fillColor: [52, 115, 214],
          textColor: [255, 255, 255],
          halign: 'center',
          valign: 'middle',
          lineColor: [52, 115, 214],
          lineWidth: 0.5,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: [34, 34, 34],
          lineColor: [220, 220, 220],
          lineWidth: 0.3,
          halign: 'right'
        },
        footStyles: {
          fillColor: [245, 247, 250],
          textColor: [34, 34, 34],
          fontStyle: 'bold',
          lineColor: [52, 115, 214],
          lineWidth: 0.5
        },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'left' }
        },
        didDrawPage: (data) => {
          const pageNum = doc.internal.getNumberOfPages();

          // Add header to all pages
          if (pageNum > 1) {
            addHeader();
          }

          // Add footer
          const footerY = pageHeight - 8;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(margin, footerY - 3, pageWidth - margin, footerY - 3);

          doc.setFontSize(8);
          doc.setTextColor(120, 120, 120);
          doc.text(`Page ${pageNum}`, pageWidth / 2, footerY, { align: 'center' });
          doc.text('© 2025 A-Rauf Textile. All rights reserved.', margin, footerY + 3);
        }
      });

      doc.save('A-Rauf-Textile-Financial-Report.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error generating PDF: ' + err.message);
    }
  };

  // Auto-download when opened with download=1
  useEffect(() => {
    if (download) {
      setAutoDownloading(true);
      // Slight delay to allow page render
      setTimeout(() => {
        try {
          generatePDF();
        } finally {
          setAutoDownloading(false);
        }
      }, 250);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [download]);

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
              <h2 className="text-2xl font-bold text-gray-900">Financial Report</h2>
              <p className="text-sm text-gray-500">Generated report details</p>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-500">Report ID</p>
                <p className="font-mono text-sm">{reportId || 'N/A'}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Range</p>
                <p className="text-sm">{reportRange === 'custom' && reportStart && reportEnd ? `${formatShortDate(reportStart)} → ${formatShortDate(reportEnd)}` : (reportRange || 'All')}</p>
              </div>

              <div>
                <button onClick={() => navigate(-1)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Back</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700">Error loading report: {error}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Report ID</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-gray-800">{reportId || 'N/A'}</span>
                    {reportId && (
                      <button onClick={() => { navigator.clipboard?.writeText(reportId); alert('Report ID copied'); }} className="text-xs text-gray-500 hover:text-gray-700">Copy</button>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500">Range</p>
                  <p className="text-sm font-medium">{reportRange === 'custom' && reportStart && reportEnd ? `${reportStart} → ${reportEnd}` : (reportRange || 'All')}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500">Total Debit</p>
                  <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(totals.debit)}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500">Total Credit</p>
                  <p className="text-2xl font-bold mt-2 text-gray-900">{formatCurrency(totals.credit)}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-100">
                  <p className="text-xs text-gray-500">Total Balance</p>
                  <p className={`text-2xl font-bold mt-2 ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(totalBalance)}</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Contact Balances</h4>
                  <div className="flex items-center gap-2">
                    <button onClick={generatePDF} className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Download PDF</button>
                  </div>
                </div>
                {contacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No financial data available for the selected period.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Contact Person</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Company/Name</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Debit (PKR)</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Credit (PKR)</th>
                          <th className="px-4 py-3 text-right font-medium text-gray-700">Balance (PKR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((c) => (
                          <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-4 py-3">{c.contact}</td>
                            <td className="px-4 py-3">{c.name}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.debit)}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(c.credit)}</td>
                            <td className={`px-4 py-3 text-right font-medium ${ (c.debit - c.credit) >=0 ? 'text-green-600' : 'text-red-600' }`}>{formatCurrency(c.debit - c.credit)}</td>
                          </tr>
                        ))}

                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 font-semibold" colSpan="2">Totals</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(totals.debit)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(totals.credit)}</td>
                          <td className="px-4 py-3 text-right font-semibold">{formatCurrency(totalBalance)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default FinancialReport;
