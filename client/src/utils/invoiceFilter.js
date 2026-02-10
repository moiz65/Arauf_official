// invoiceFilter.js
// Pure utility to filter and sort invoices for use by InvoiceTable

function filterInvoices(invoicesData = [], activeTab = 'All', filters = {}, searchTerm = '') {
  let filtered = Array.isArray(invoicesData) ? invoicesData.slice() : [];

  // Do not exclude Overdue invoices from other tabs — we will prioritize them via sorting
  // (This allows Overdue invoices to appear at the top of lists unless a tab explicitly scopes results)

  // Tab-based filtering
  if (activeTab === 'PO Invoices') {
    filtered = filtered.filter(inv => inv.invoice_type === 'po_invoice');
  } else if (activeTab === 'All') {
    // For "All" tab, show ALL invoices (including PO invoices)
    // No filtering needed - show everything except overdue (already filtered above)
  } else if (activeTab === 'Overdue') {
    filtered = filtered.filter(inv => inv.status === 'Overdue');
  } else if (activeTab === 'Not Sent') {
    // "Not Sent" tab includes both "Not Sent" and "Draft" statuses
    filtered = filtered.filter(inv => inv.status === 'Not Sent' || inv.status === 'Draft');
  } else if (activeTab !== 'All') {
    // Other status-specific tabs (Paid, Pending, Sent, etc.)
    filtered = filtered.filter(inv => inv.status === activeTab);
  }

  // Search term filtering (client-side quick search)
  if (searchTerm && typeof searchTerm === 'string' && searchTerm.trim() !== '') {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(inv =>
      (inv.customer_name || '').toLowerCase().includes(s) ||
      (inv.supplier_name || '').toLowerCase().includes(s) ||
      (String(inv.invoice_number || '')).toLowerCase().includes(s)
    );
  }

  // Apply additional filters
  if (filters) {
    if (filters.customer && filters.customer.trim()) {
      const s = filters.customer.toLowerCase();
      filtered = filtered.filter(inv =>
        (inv.customer_name || '').toLowerCase().includes(s) ||
        (inv.supplier_name || '').toLowerCase().includes(s)
      );
    }

    if (filters.invoice_number && filters.invoice_number.trim()) {
      const s = filters.invoice_number.toLowerCase();
      filtered = filtered.filter(inv => (String(inv.invoice_number || '')).toLowerCase().includes(s));
    }

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      if (!isNaN(from)) {
        // Normalize to local date-only (midnight) to avoid timezone issues
        const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate());
        filtered = filtered.filter(inv => {
          const invDateRaw = inv.bill_date || inv.invoice_date || null;
          const invDate = invDateRaw ? new Date(invDateRaw) : null;
          if (!invDate || isNaN(invDate)) return false;
          const invDateOnly = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate());
          return invDateOnly >= fromDateOnly;
        });
      }
    }

    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      if (!isNaN(to)) {
        // Normalize to local date-only (midnight) so the entire day is included
        const toDateOnly = new Date(to.getFullYear(), to.getMonth(), to.getDate());
        filtered = filtered.filter(inv => {
          const invDateRaw = inv.bill_date || inv.invoice_date || null;
          const invDate = invDateRaw ? new Date(invDateRaw) : null;
          if (!invDate || isNaN(invDate)) return false;
          const invDateOnly = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate());
          return invDateOnly <= toDateOnly;
        });
      }
    }

    if (filters.minAmount && !isNaN(parseFloat(filters.minAmount))) {
      const minA = parseFloat(filters.minAmount);
      filtered = filtered.filter(inv => {
        const amount = parseFloat(inv.total_amount || inv.invoice_amount || 0) || 0;
        return amount >= minA;
      });
    }

    if (filters.maxAmount && !isNaN(parseFloat(filters.maxAmount))) {
      const maxA = parseFloat(filters.maxAmount);
      filtered = filtered.filter(inv => {
        const amount = parseFloat(inv.total_amount || inv.invoice_amount || 0) || 0;
        return amount <= maxA;
      });
    }
  }

  // Sorting behaviour changed: Put Paid invoices after all other invoices.
  // For non-paid invoices, show the most recently created invoices first (newest first).
  // For paid invoices, show most recently updated/payments first (newest first), but
  // they should appear after non-paid invoices in the overall list.
  const safeDate = (val) => {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  const getCreatedDate = (inv) => safeDate(inv.created_at) || safeDate(inv.bill_date) || safeDate(inv.invoice_date) || null;
  const getUpdatedDate = (inv) => safeDate(inv.updated_at) || getCreatedDate(inv);

  filtered.sort((a, b) => {
    const aPaid = String(a.status || '').toLowerCase() === 'paid';
    const bPaid = String(b.status || '').toLowerCase() === 'paid';

    // Put non-paid before paid
    if (aPaid !== bPaid) return aPaid ? 1 : -1;

    // Both are paid OR both are non-paid
    if (!aPaid) {
      // Non-paid: newest created first
      const ac = getCreatedDate(a);
      const bc = getCreatedDate(b);
      if (ac && bc) return bc - ac;
      if (ac && !bc) return -1;
      if (!ac && bc) return 1;
      return 0;
    }

    // Both paid: newest updated first
    const au = getUpdatedDate(a);
    const bu = getUpdatedDate(b);
    if (au && bu) return bu - au;
    if (au && !bu) return -1;
    if (!au && bu) return 1;
    return 0;
  });

  return filtered;
}

module.exports = { filterInvoices };
