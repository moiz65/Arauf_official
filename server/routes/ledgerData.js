const express = require('express');
const router = express.Router();
const db = require('../src/config/db');

// Get ledger entries for a specific customer
// Combines invoice and PO invoice data
// Supports optional date filtering via query parameters: ?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
router.get('/:customer_id', async (req, res) => {
  const customerId = req.params.customer_id;
  const { fromDate, toDate } = req.query;

  if (!customerId) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  try {
    // Build WHERE clause for date filtering if provided
    let invoiceDateFilter = '';
    let poDateFilter = '';
    let queryParams = [customerId];

    if (fromDate && toDate) {
      invoiceDateFilter = 'AND i.bill_date >= ? AND i.bill_date <= ?';
      poDateFilter = 'AND poi.invoice_date >= ? AND poi.invoice_date <= ?';
      queryParams.push(fromDate, toDate);
    }

    // Detect if the ledger_entries table has the `entry_type` column.
    // Some installations may not have the migration applied yet.
    let hasEntryType = false;
    try {
      const [cols] = await db.query("SHOW COLUMNS FROM ledger_entries LIKE 'entry_type'");
      hasEntryType = Array.isArray(cols) && cols.length > 0;
    } catch (colErr) {
      // If the query fails (table missing or permission), assume false and continue
      console.warn('[ledgerData] Could not detect entry_type column:', colErr.message);
      hasEntryType = false;
    }

    // Query to fetch normal invoices for the customer
    // EXCLUDE invoices that already have automatic ledger entries (to avoid duplication)
    const invoiceNotExistsClause = hasEntryType
      ? `AND NOT EXISTS (
          SELECT 1 FROM ledger_entries le 
          WHERE LOWER(le.bill_no) = LOWER(i.invoice_number) 
          AND le.customer_id = i.customer_id
          AND le.entry_type IN ('invoice', 'invoice_tax')
        )`
      : `AND NOT EXISTS (
          SELECT 1 FROM ledger_entries le 
          WHERE LOWER(le.bill_no) = LOWER(i.invoice_number) 
          AND le.customer_id = i.customer_id
        )`;

    const invoiceQuery = `
      SELECT 
        i.id,
        CONCAT(i.id, ' - ', i.invoice_number) as 'particulars',
          i.bill_date as 'date',
          i.created_at as 'created_at',
        i.payment_deadline as 'dueDate',
        i.payment_days,
  GROUP_CONCAT(DISTINCT ii.description SEPARATOR ', ') as 'description',
  -- itemsDetails encodes description,quantity,rate per item separated by ':::' between items and '|||' between fields
  GROUP_CONCAT(DISTINCT CONCAT(ii.description, '|||', COALESCE(ii.quantity,0), '|||', COALESCE(ii.rate,0)) SEPARATOR ':::') as 'itemsDetails',
  SUM(COALESCE(ii.quantity, 0)) as 'mtr',
  COALESCE((SELECT rate FROM invoice_items WHERE invoice_id = i.id LIMIT 1), 0) as 'rate',
        i.id as 'invoiceId',
        i.invoice_number as 'billNo',
        NULL as 'paymentMode',
        NULL as 'chequeNo',
        i.total_amount as 'totalAmount',
        i.subtotal as 'subtotal',
        COALESCE(i.tax_rate, 0) as 'taxRate',
        COALESCE(i.tax_amount, 0) as 'taxAmount',
        CASE WHEN LOWER(i.status) = 'paid' THEN 0 ELSE i.total_amount END as 'debit',
        CASE WHEN LOWER(i.status) = 'paid' THEN i.total_amount ELSE 0 END as 'credit',
        'Invoice' as 'type',
        i.status
      FROM invoice i
      LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
      WHERE i.customer_id = ? ${invoiceDateFilter}
        ${invoiceNotExistsClause}
      GROUP BY i.id
      ORDER BY i.bill_date DESC
    `;

    // Query to fetch PO invoices for the customer (with tax data)
    // Filter by matching customer name with the current customer's name
    // Description: Get item descriptions from po_invoice_items, fallback to purchase_order_items, then notes field
    // EXCLUDE PO invoices that already have automatic ledger entries (to avoid duplication)
    const poNotExistsClause = hasEntryType
      ? `AND NOT EXISTS (
          SELECT 1 FROM ledger_entries le 
          WHERE LOWER(le.bill_no) = LOWER(poi.invoice_number)
          AND le.entry_type IN ('po_invoice', 'po_invoice_tax')
        )`
      : `AND NOT EXISTS (
          SELECT 1 FROM ledger_entries le 
          WHERE LOWER(le.bill_no) = LOWER(poi.invoice_number)
        )`;

    const poInvoiceQuery = `
      SELECT 
        poi.id,
        CONCAT(poi.id, ' - ', poi.invoice_number) as 'particulars',
        poi.invoice_date as 'date',
        poi.created_at as 'created_at',
        poi.due_date as 'dueDate',
        poi.payment_days,
        CASE 
          WHEN GROUP_CONCAT(DISTINCT pii.description) IS NOT NULL AND GROUP_CONCAT(DISTINCT pii.description) != '' 
            THEN GROUP_CONCAT(DISTINCT pii.description SEPARATOR ', ')
          WHEN poi.notes IS NOT NULL AND poi.notes != '' AND poi.notes NOT LIKE 'Generated from Purchase Order:%'
            THEN poi.notes
          ELSE COALESCE(GROUP_CONCAT(DISTINCT poi2.description SEPARATOR ', '), '')
        END as 'description',
        NULL as 'itemsDetails',
        -- Prefer summed item-level invoiced_quantity, fall back to invoice-level invoiced_quantity if no items exist
        COALESCE(SUM(pii.invoiced_quantity), poi.invoiced_quantity, 0) as 'mtr',
        -- Prefer an item-level unit_price when available; otherwise compute rate = subtotal / invoiced_quantity (safe against zero)
        COALESCE(
          (SELECT CAST(unit_price AS DECIMAL(15,2)) FROM po_invoice_items WHERE po_invoice_id = poi.id LIMIT 1),
          CASE WHEN COALESCE(SUM(pii.invoiced_quantity), poi.invoiced_quantity, 0) > 0 THEN (poi.subtotal / COALESCE(SUM(pii.invoiced_quantity), poi.invoiced_quantity)) ELSE 0 END,
          0
        ) as 'rate',
        poi.invoice_number as 'invoiceId',
        poi.invoice_number as 'billNo',
        NULL as 'paymentMode',
        NULL as 'chequeNo',
        poi.total_amount as 'totalAmount',
        poi.subtotal as 'subtotal',
        COALESCE(poi.tax_amount, 0) as 'taxAmount',
        COALESCE(poi.tax_rate, 0) as 'taxRate',
        CASE WHEN LOWER(poi.status) = 'paid' THEN 0 ELSE poi.total_amount END as 'debit',
        CASE WHEN LOWER(poi.status) = 'paid' THEN poi.total_amount ELSE 0 END as 'credit',
        'PO Invoice' as 'type',
        poi.status
      FROM po_invoices poi
      LEFT JOIN po_invoice_items pii ON poi.id = pii.po_invoice_id
      LEFT JOIN purchase_orders po ON poi.po_id = po.id
      LEFT JOIN purchase_order_items poi2 ON po.id = poi2.purchase_order_id
      WHERE poi.customer_name = (SELECT customer FROM customertable WHERE customer_id = ?) ${poDateFilter}
        ${poNotExistsClause}
      GROUP BY poi.id, poi.invoice_number, poi.invoice_date, poi.due_date, poi.payment_days, poi.total_amount, poi.subtotal, poi.tax_rate, poi.tax_amount, poi.status, poi.notes, poi.invoiced_quantity
      ORDER BY poi.invoice_date DESC
    `;

    // Prepare query params for both queries
    const invoiceParams = [customerId];
    const poParams = [customerId];
    
    if (fromDate && toDate) {
      invoiceParams.push(fromDate, toDate);
      poParams.push(fromDate, toDate);
    }

    // Execute both queries (promise style)
    const [invoiceResults] = await db.query(invoiceQuery, invoiceParams);
    const [poResults] = await db.query(poInvoiceQuery, poParams);

    console.log(`📋 Found ${poResults?.length || 0} PO invoices for the company`);
    if (poResults && poResults.length > 0) {
      poResults.forEach(po => {
        console.log(`   - PO Invoice ID=${po.id}, InvoiceID=${po.invoiceId}`);
        console.log(`     📊 Amount=${po.totalAmount}, Tax=${po.taxAmount}`);
        console.log(`     📏 MTR/QTY=${po.mtr} (type: ${typeof po.mtr}), RATE=${po.rate} (type: ${typeof po.rate})`);
        console.log(`     📝 Description="${po.description}"`);
      });
    }

    // Process invoices to split tax entries
    const processedInvoices = [];
    let sequenceNumber = 0;

    // Process regular invoices
    (invoiceResults || []).forEach(invoice => {
          const taxAmount = parseFloat(invoice.taxAmount) || 0;
          const taxRate = parseFloat(invoice.taxRate) || 0;
          const totalAmount = parseFloat(invoice.totalAmount) || 0;
          const subtotal = parseFloat(invoice.subtotal) || 0;
          
          // Calculate product amount (subtract tax from total)
          const productAmount = taxAmount > 0 ? (subtotal > 0 ? subtotal : totalAmount - taxAmount) : totalAmount;
          
          console.log(`📊 Invoice ${invoice.invoiceId}: Total=${totalAmount}, Subtotal=${subtotal}, Tax=${taxAmount}, Product=${productAmount}`);
          
          // Add sequence to keep invoice and tax together
          const currentSequence = sequenceNumber;
          sequenceNumber++;
          
          // Main invoice entry (product amount without tax)
          processedInvoices.push({
            ...invoice,
            debit: productAmount,
            credit: 0,
            sequence: currentSequence,
            created_at: invoice.created_at
          });
          console.log(`✅ Added main entry for INV-${invoice.invoiceId}: Debit=${productAmount}`);
          
          // If tax exists, add separate tax entry right after
          if (taxAmount > 0) {
            const taxEntry = {
              date: invoice.date,
              particulars: `Sales Tax Rate @ INV-${invoice.invoiceId}`,
              description: `${taxRate}% sales tax`,
              dueDate: invoice.dueDate,
              payment_days: invoice.payment_days,
              itemsDetails: null,
              mtr: null,
              rate: null,
              invoiceId: invoice.invoiceId,
              paymentMode: null,
              chequeNo: null,
              totalAmount: taxAmount,
              subtotal: 0,
              taxRate: 0,
              taxAmount: 0,
              debit: taxAmount,
              credit: 0,
              type: 'Tax',
              status: invoice.status,
              sequence: currentSequence + 0.5 // Place right after invoice
            };
            taxEntry.created_at = invoice.created_at;
            processedInvoices.push(taxEntry);
            console.log(`💰 Added tax entry for INV-${invoice.invoiceId}: Debit=${taxAmount}, Particulars="${taxEntry.particulars}"`);
          }
        });
        
  // Process PO invoices (same tax split logic)
  const processedPOInvoices = [];
  (poResults || []).forEach(poInvoice => {
          const taxAmount = parseFloat(poInvoice.taxAmount) || 0;
          const taxRate = parseFloat(poInvoice.taxRate) || 0;
          const totalAmount = parseFloat(poInvoice.totalAmount) || 0;
          const subtotal = parseFloat(poInvoice.subtotal) || 0;
          
          // Calculate product amount (subtract tax from total)
          const productAmount = taxAmount > 0 ? (subtotal > 0 ? subtotal : totalAmount - taxAmount) : totalAmount;
          
          console.log(`📊 PO Invoice ${poInvoice.invoiceId}: Total=${totalAmount}, Subtotal=${subtotal}, Tax=${taxAmount}, Product=${productAmount}`);
          
          // Add sequence to keep PO invoice and tax together
          const currentSequence = sequenceNumber;
          sequenceNumber++;
          
          // Main PO invoice entry (product amount without tax)
          processedPOInvoices.push({
            ...poInvoice,
            debit: productAmount,
            credit: 0,
            sequence: currentSequence,
            created_at: poInvoice.created_at
          });
          console.log(`✅ Added main PO entry for ${poInvoice.invoiceId}: Debit=${productAmount}, Description="${poInvoice.description}"`);
          
          // If tax exists, add separate tax entry right after
          if (taxAmount > 0) {
            const taxEntry = {
              date: poInvoice.date,
              particulars: `Sales Tax Rate @ ${poInvoice.invoiceId}`,
              description: `${taxRate}% sales tax`,
              dueDate: poInvoice.dueDate,
              payment_days: poInvoice.payment_days,
              itemsDetails: null,
              mtr: null,
              rate: null,
              invoiceId: poInvoice.invoiceId,
              paymentMode: null,
              chequeNo: null,
              totalAmount: taxAmount,
              subtotal: 0,
              taxRate: 0,
              taxAmount: 0,
              debit: taxAmount,
              credit: 0,
              type: 'PO Tax',
              status: poInvoice.status,
              sequence: currentSequence + 0.5 // Place right after PO invoice
            };
            taxEntry.created_at = poInvoice.created_at;
            processedPOInvoices.push(taxEntry);
            console.log(`💰 Added PO tax entry for ${poInvoice.invoiceId}: Debit=${taxAmount}, Particulars="${taxEntry.particulars}"`);
          }
        });
        
    // Sort primarily by created_at ASC (oldest first) so that the most recently created invoice appears last
    const displayOrderResults = [
      ...processedInvoices,
      ...processedPOInvoices
    ].sort((a, b) => {
          // Sort by created_at ASCENDING first (oldest first)
          const createdCompare = new Date(a.created_at || a.date || 0) - new Date(b.created_at || b.date || 0);
          if (createdCompare !== 0) return createdCompare;

          // Then by date ASCENDING (oldest first)
          const dateCompare = new Date(a.date) - new Date(b.date);
          if (dateCompare !== 0) return dateCompare;

          // Then by sequence ASCENDING to keep invoice before tax (main entry first, then tax)
          return (a.sequence || 0) - (b.sequence || 0);
        });

        // Calculate balance from TOP TO BOTTOM (oldest to newest in chronological order)
        let runningBalance = 0;
        const ledgerWithBalance = displayOrderResults.map((entry) => {
          const debit = parseFloat(entry.debit) || 0;
          const credit = parseFloat(entry.credit) || 0;
          runningBalance += (debit - credit);
          
          // Calculate days outstanding
          const invoiceDate = new Date(entry.date);
          const today = new Date();
          const diffTime = Math.abs(today - invoiceDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          return {
            ...entry,
            balance: runningBalance,
            days: diffDays,
            daysOutstanding: entry.payment_days || 0
          };
        });

    console.log(`📤 Processing ${processedInvoices.length} regular invoice entries (with tax split)`);
    console.log(`📤 Processing ${processedPOInvoices.length} PO invoice entries (with tax split)`);
    console.log(`📤 Sending ${ledgerWithBalance.length} total ledger entries to client`);
    res.json({ success: true, data: ledgerWithBalance });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

module.exports = router;
