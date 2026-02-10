import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper: load image URL or convert known repo path to served public path
// Simple in-memory cache for the logo to speed repeated PDF generations in the same session
const _logoCache = { path: null, dataUrl: null };

const loadImageAsDataURL = async (path) => {
  if (!path) return null;

  // If user passed absolute repo path like '/home/.../client/public/logo.png', map it to '/logo.png'
  try {
    const normalized = String(path || '');
    if (normalized.includes('/client/public/') || normalized.includes('public/logo')) {
      path = '/logo.png';
    }
  } catch (e) {
    // ignore
  }

  // Return from cache when the same path is requested
  try {
    if (_logoCache.path === path && _logoCache.dataUrl) {
      return _logoCache.dataUrl;
    }

    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // cache result for subsequent calls
    _logoCache.path = path;
    _logoCache.dataUrl = dataUrl;
    return dataUrl;
  } catch (e) {
    return null;
  }
};

// Preload default logo into cache on module load so repeated calls are faster in the same session
(async () => {
  try {
    await loadImageAsDataURL('/logo.png');
  } catch (e) {
    // ignore preload errors
  }
})();

/**
 * Helper function to generate short ref (same as frontend table)
 */
const getShortRef = (billNo, invoiceId, isManualEntry) => {
  if (!billNo && !invoiceId) return '-';
  
  // For manual entries, use billNo directly (the user's input)
  if (isManualEntry) {
    return billNo || '-';
  }
  
  // For invoices, use invoiceId (database ID)
  if (invoiceId) {
    const idStr = invoiceId.toString();
    // If it already starts with "INV-" or "PO", use as-is
    if (idStr.includes('-')) {
      return idStr;
    }
    // Otherwise prepend "INV-"
    return `INV-${idStr}`;
  }
  
  // If billNo is short (like already formatted), use it
  if (billNo && billNo.length < 20) {
    return billNo;
  }
  
  // Fallback to billNo as-is
  return billNo || '-';
};

/**
 * Generate a professional detailed PDF of the General Ledger
 * @param {Array} entries - Ledger entries data
 * @param {Object} customer - Customer information
 * @param {String} fromDate - Filter start date
 * @param {String} toDate - Filter end date
 * @param {Object} settings - Company settings
 */
export const generateLedgerPDF = async (entries, customer, fromDate, toDate, settings = {}) => {
  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait orientation (A4)
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  // Reserve area for footer so rows aren't drawn under it
  const footerHeight = 16; // mm
  
  const colWidths = {
    date: 18,
    ref: 18,
    description: 75,
    debit: 20,
    credit: 20,
    balance: 20
  };

  let yPosition = margin;
  let pageNum = 1;
  
  // Try to preload logo (async). Prefer settings.logoDataUrl or settings.logoPath
  let logoDataUrl = settings.logoDataUrl || null;
  if (!logoDataUrl) {
    const logoPath = settings.logoPath || '/logo.png';
    logoDataUrl = await loadImageAsDataURL(logoPath);
  }

  // ============ PROFESSIONAL HEADER ============
  const addPageHeader = () => {
    yPosition = margin;

    // Company Logo Area (placeholder with colored box)
    if (logoDataUrl) {
      try {
        doc.addImage(logoDataUrl, 'PNG', margin, yPosition, 15, 12);
      } catch (e) {
        // fallback to colored box
        doc.setFillColor(41, 128, 185);
        doc.rect(margin, yPosition, 15, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('AR', margin + 4, yPosition + 7.5, { align: 'center' });
      }
    } else {
      doc.setFillColor(41, 128, 185); // Professional blue
      doc.rect(margin, yPosition, 15, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text('AR', margin + 4, yPosition + 7.5, { align: 'center' });
    }

    // Company Info - Right side of header
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(String(settings.companyName || 'A-Rauf Textile'), margin + 20, yPosition + 3);

    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(60, 60, 60);
    doc.text('General Ledger Statement', margin + 20, yPosition + 8);
    
    // Horizontal line under header
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition + 13, pageWidth - margin, yPosition + 13);

    yPosition += 16;

    // Customer Information Section
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('Customer Information', margin, yPosition);

    yPosition += 5;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);

    const customerInfo = [
      `Customer Name: ${customer?.customer_name || customer?.customer || 'N/A'}`,
      `Customer ID: ${customer?.customer_id || 'N/A'}`,
      `Account Type: General Ledger`
    ];

    customerInfo.forEach((info) => {
      doc.text(String(info), margin, yPosition);
      yPosition += 4.5;
    });

    // Date Range and Report Info
    yPosition += 2;
    doc.setFont(undefined, 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text('Report Details', margin, yPosition);

    yPosition += 5;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);

    const dateRange = fromDate && toDate
      ? `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}`
      : `Report Date: ${formatDate(new Date().toISOString().split('T')[0])}`;

    const reportInfo = [
      dateRange,
      `Generated: ${new Date().toLocaleString('en-PK')}`,
      `Total Entries: ${entries.length}`
    ];

    reportInfo.forEach((info) => {
      doc.text(String(info), margin, yPosition);
      yPosition += 4.5;
    });

    yPosition += 5;
  };

  // Check if we need a new page
  const checkPageBreak = (requiredSpace = 25) => {
    if (yPosition + requiredSpace > pageHeight - margin - footerHeight) {
      doc.addPage();
      pageNum++;
      addPageHeader();
      drawTableHeader();
    }
  };

  // Draw improved table header
  const drawTableHeader = () => {
    const headers = ['Date', 'Ref #', 'Description', 'Debit (PKR)', 'Credit (PKR)', 'Balance (PKR)'];
    const columnKeys = ['date', 'ref', 'description', 'debit', 'credit', 'balance'];

    const headerHeight = 12;
    
    // Header background
    doc.setFillColor(41, 128, 185);
    
    // Draw header cells with text first
    let xPosition = margin;
    headers.forEach((header, idx) => {
      const colWidth = colWidths[columnKeys[idx]];
      
      // Draw filled rectangle for background
      doc.rect(xPosition, yPosition, colWidth, headerHeight, 'F');
      
      xPosition += colWidth;
    });

    // Draw text on top
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(7.5);

    xPosition = margin;
    headers.forEach((header, idx) => {
      const colWidth = colWidths[columnKeys[idx]];
      const padding = 0.5;
      const textY = yPosition + 7;

      if (idx === 2) {
        // Left align for Description
        doc.text(String(header), xPosition + padding, textY, { 
          maxWidth: colWidth - (padding * 2), 
          align: 'left'
        });
      } else {
        // Center align for others
        doc.text(String(header), xPosition + (colWidth / 2), textY, { 
          maxWidth: colWidth - (padding * 2), 
          align: 'center'
        });
      }
      xPosition += colWidth;
    });

    // Draw borders around entire header
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.3);
    xPosition = margin;
    headers.forEach((header, idx) => {
      const colWidth = colWidths[columnKeys[idx]];
      doc.rect(xPosition, yPosition, colWidth, headerHeight, 'S');
      xPosition += colWidth;
    });

    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    yPosition += headerHeight;
  };

  // Draw table row with improved formatting
  const drawTableRow = (data, isAlt = false, isTotal = false) => {
    const columnKeys = ['date', 'ref', 'description', 'debit', 'credit', 'balance'];
    const rowHeight = 12; // Increased from 10 to make table larger

    if (isTotal) {
      // Totals row styling
      doc.setFillColor(230, 240, 250);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(41, 128, 185);
    } else if (isAlt) {
      // Alternate row styling
      doc.setFillColor(245, 248, 250);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
    } else {
      // Regular row
      doc.setFillColor(255, 255, 255);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
    }

    // Draw background
    let xPosition = margin;
    columnKeys.forEach((key) => {
      const colWidth = colWidths[key];
      doc.rect(xPosition, yPosition, colWidth, rowHeight, 'F');
      xPosition += colWidth;
    });

    // Draw borders
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.2);
    xPosition = margin;
    columnKeys.forEach((key) => {
      const colWidth = colWidths[key];
      doc.rect(xPosition, yPosition, colWidth, rowHeight, 'S');
      xPosition += colWidth;
    });

    // Draw text
    xPosition = margin;
    const padding = 1;

    columnKeys.forEach((key) => {
      const colWidth = colWidths[key];
      let text = String(data[key] || '-');

      const maxChars = {
        'date': 10,
        'ref': 15,
        'description': 60,
        'debit': 14,
        'credit': 14,
        'balance': 14
      };

      if (text.length > (maxChars[key] || 15)) {
        text = text.substring(0, (maxChars[key] || 15) - 2) + '..';
      }

      const textY = yPosition + 6.5;

      if (key === 'debit' || key === 'credit' || key === 'balance') {
        doc.text(text, xPosition + colWidth - padding, textY, {
          align: 'right',
          maxWidth: colWidth - (padding * 2)
        });
      } else if (key === 'description') {
        doc.text(text, xPosition + padding, textY, {
          maxWidth: colWidth - (padding * 2),
          align: 'left'
        });
      } else {
        doc.text(text, xPosition + (colWidth / 2), textY, {
          maxWidth: colWidth - (padding * 2),
          align: 'center'
        });
      }

      xPosition += colWidth;
    });

    yPosition += rowHeight;
  };

  // Add first page header
  addPageHeader();
  drawTableHeader();

  // Process and display ledger entries
  let rowCount = 0;
  const displayedEntries = []; // Track all entries for totals calculation
  
  entries.forEach((entry) => {
    displayedEntries.push(entry); // Add all entries

    checkPageBreak(10);

    // Handle multiple material entries - combine them with bullet points
    let description = '-';
    if (entry.itemsDetails && entry.itemsDetails.trim().length > 0) {
      const items = entry.itemsDetails.split(':::').map((s) => {
        const parts = s.split('|||');
        return {
          description: parts[0] || '',
          quantity: parts[1] ? Number(parts[1]) : 0,
          rate: parts[2] ? Number(parts[2]) : 0
        };
      });
      description = items
        .map(item => `• ${item.description}${item.quantity ? ` (${item.quantity})` : ''}`)
        .join(' | ');
    } else if (entry.description) {
      description = entry.description;
    }

    const rowData = {
      date: formatDate(entry.date),
      ref: getShortRef(entry.billNo, entry.invoiceId, entry.isManualEntry),
      description: description,
      debit: entry._displayDebit ? formatCurrency(entry._displayDebit) : '-',
      credit: entry._displayCredit ? formatCurrency(entry._displayCredit) : '-',
      balance: formatCurrency(entry.balance)
    };

    drawTableRow(rowData, rowCount % 2 === 1, false);
    rowCount++;
  });

  // Calculate and display totals - only from displayed entries (non-tax)
  // Use _displayDebit/_displayCredit which already have the correct paid/unpaid logic
  const totalDebit = displayedEntries.reduce((sum, e) => {
    const val = e._displayDebit !== null && e._displayDebit !== undefined ? parseFloat(e._displayDebit) : 0;
    return sum + val;
  }, 0);
  const totalCredit = displayedEntries.reduce((sum, e) => {
    const val = e._displayCredit !== null && e._displayCredit !== undefined ? parseFloat(e._displayCredit) : 0;
    return sum + val;
  }, 0);
  const currentBalance = displayedEntries.length > 0 ? (parseFloat(displayedEntries[displayedEntries.length - 1].balance) || 0) : 0;

  // Totals row
  checkPageBreak(10);
  const totalsData = {
    date: '',
    ref: '',
    description: 'TOTAL',
    debit: formatCurrency(totalDebit),
    credit: formatCurrency(totalCredit),
    balance: formatCurrency(currentBalance)
  };

  drawTableRow(totalsData, false, true);

  // Summary Section
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text('Account Summary', margin, yPosition);

  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);

  const summaryLines = [
    ['Total Entries:', `${displayedEntries.length}`],
    ['Total Debits:', formatCurrency(totalDebit)],
    ['Total Credits:', formatCurrency(totalCredit)],
    ['Account Balance:', formatCurrency(currentBalance)],
    ['Balance Type:', currentBalance > 0 ? 'Customer Owes Us (Receivable)' : currentBalance < 0 ? 'We Owe Customer (Payable)' : 'Zero Balance']
  ];

  summaryLines.forEach(([label, value]) => {
    doc.setFont(undefined, 'bold');
    doc.text(String(label), margin, yPosition, { maxWidth: 40 });
    doc.setFont(undefined, 'normal');
    doc.text(String(value), margin + 50, yPosition);
    yPosition += 5;
  });

  // Footer section
  yPosition += 5;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);

  yPosition += 6;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, 'italic');
  doc.text('This is a computer-generated report and does not require a signature.', margin, yPosition);

  // Add page numbers to all pages
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont(undefined, 'normal');
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 15,
      pageHeight - margin + 3
    );
    
    // Add footer line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin);
  }

  // Save the PDF
  const fileName = `Ledger_${customer?.customer_name || customer?.customer || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

// ============ HELPER FUNCTIONS ============
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return '-';
  }
};

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return '-';
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);
};

export default generateLedgerPDF;
