const { filterInvoices } = require('./invoiceFilter');

const baseInvoices = [
  { id: 1, invoice_number: '100', customer_name: 'Alice', total_amount: 500, status: 'Pending', invoice_type: 'regular', bill_date: '2025-09-01' },
  { id: 2, invoice_number: '101', customer_name: 'Bob', total_amount: 1500, status: 'Paid', invoice_type: 'regular', bill_date: '2025-08-15' },
  { id: 3, invoice_number: 'PO-1', customer_name: 'Charlie', total_amount: 2000, status: 'Pending', invoice_type: 'po_invoice', bill_date: '2025-08-20' },
  { id: 4, invoice_number: '102', customer_name: 'Delta', total_amount: 300, status: 'Overdue', invoice_type: 'regular', bill_date: '2025-07-10' },
  { id: 5, invoice_number: 'PO-2', customer_name: 'Echo', total_amount: 800, status: 'Overdue', invoice_type: 'po_invoice', bill_date: '2025-07-01' },
];

test('All tab includes ALL invoices (regular + PO) and excludes Overdue when not in Overdue tab', () => {
  const result = filterInvoices(baseInvoices, 'All', {}, '');
  // Should INCLUDE PO invoices (not overdue)
  expect(result.find(i => i.id === 3)).toBeDefined();
  // Should exclude overdue ones (both regular and PO)
  expect(result.find(i => i.id === 4)).toBeUndefined();
  expect(result.find(i => i.id === 5)).toBeUndefined();
  // Should include non-overdue regular invoices
  expect(result.find(i => i.id === 1)).toBeDefined();
  expect(result.find(i => i.id === 2)).toBeDefined();
});

test('PO Invoices tab shows only PO invoices and excludes overdue if not Overdue tab behaviour', () => {
  const result = filterInvoices(baseInvoices, 'PO Invoices', {}, '');
  // PO invoices present
  expect(result.every(i => i.invoice_type === 'po_invoice')).toBe(true);
  // Overdue PO (id 5) should be excluded because activeTab !== 'Overdue' (we filter out Overdue first)
  expect(result.find(i => i.id === 5)).toBeUndefined();
});

test('Overdue tab shows overdue invoices including PO', () => {
  const result = filterInvoices(baseInvoices, 'Overdue', {}, '');
  expect(result.find(i => i.id === 4)).toBeDefined();
  expect(result.find(i => i.id === 5)).toBeDefined();
});

test('status tab Paid shows paid invoices and excludes overdue', () => {
  const result = filterInvoices(baseInvoices, 'Paid', {}, '');
  expect(result.find(i => i.id === 2)).toBeDefined();
  expect(result.find(i => i.id === 4)).toBeUndefined();
});

test('filters: date range and min/max amounts', () => {
  const filters = { dateFrom: '2025-08-01', dateTo: '2025-09-30', minAmount: '400', maxAmount: '1600' };
  const result = filterInvoices(baseInvoices, 'All', filters, '');
  // Candidate invoices within date: id 1 (500 on 2025-09-01), id2 (1500 2025-08-15) but id2 is Paid and allowed
  // Both are non-PO; id1 and id2 within amount range; but id2 is Paid and should still appear in All because it's not Overdue and not PO
  expect(result.find(i => i.id === 1)).toBeDefined();
  expect(result.find(i => i.id === 2)).toBeDefined();
});

test('searchTerm filters by customer_name and invoice_number', () => {
  const result1 = filterInvoices(baseInvoices, 'All', {}, 'Alice');
  expect(result1.length).toBeGreaterThan(0);
  expect(result1.find(i => i.customer_name === 'Alice')).toBeDefined();

  const result2 = filterInvoices(baseInvoices, 'All', {}, '100');
  expect(result2.find(i => i.invoice_number === '100')).toBeDefined();
});
