/**
 * Utility functions for generating efficient, memorable, and unique IDs
 */

/**
 * Generate a new Purchase Order ID in format: PO24-9-001
 * @param {Array} existingPOs - Array of existing purchase orders
 * @returns {string} - New unique PO ID
 */
export const generatePOId = (existingPOs = []) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = now.getMonth() + 1; // Month without padding
  
  // Find the highest sequential number for current year-month combination
  const currentPeriodPrefix = `PO${year}-${month}-`;
  let maxSequential = 0;
  
  existingPOs.forEach(po => {
    const poId = po.id || po.po_number;
    if (poId && poId.startsWith(currentPeriodPrefix)) {
      const sequentialPart = poId.substring(currentPeriodPrefix.length);
      const sequential = parseInt(sequentialPart);
      if (!isNaN(sequential) && sequential > maxSequential) {
        maxSequential = sequential;
      }
    }
  });
  
  // Generate new sequential number
  const nextSequential = (maxSequential + 1).toString().padStart(3, '0');
  const finalId = `${currentPeriodPrefix}${nextSequential}`;
  
  // Backup check - if somehow this ID exists, add a random suffix
  let counter = 1;
  let backupId = finalId;
  
  while (existingPOs.some(po => (po.id === backupId || po.po_number === backupId))) {
    backupId = `${finalId}-${counter}`;
    counter++;
  }
  
  return backupId;
};

/**
 * Generate a new Invoice ID in format: INV24-9-001
 * @param {Array} existingInvoices - Array of existing invoices
 * @returns {string} - New unique Invoice ID
 */
export const generateInvoiceId = (existingInvoices = []) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = now.getMonth() + 1; // Month without padding
  
  // Find the highest sequential number for current year-month combination
  const currentPeriodPrefix = `INV${year}-${month}-`;
  let maxSequential = 0;
  
  existingInvoices.forEach(invoice => {
    const invoiceId = invoice.invoice_number || invoice.bill_id;
    if (invoiceId && invoiceId.startsWith(currentPeriodPrefix)) {
      const sequentialPart = invoiceId.substring(currentPeriodPrefix.length);
      const sequential = parseInt(sequentialPart);
      if (!isNaN(sequential) && sequential > maxSequential) {
        maxSequential = sequential;
      }
    }
  });
  
  // Generate new sequential number
  const nextSequential = (maxSequential + 1).toString().padStart(3, '0');
  const finalId = `${currentPeriodPrefix}${nextSequential}`;
  
  // Backup check - if somehow this ID exists, add a random suffix
  let counter = 1;
  let backupId = finalId;
  
  while (existingInvoices.some(invoice => 
    (invoice.invoice_number === backupId || invoice.bill_id === backupId))) {
    backupId = `${finalId}-${counter}`;
    counter++;
  }
  
  return backupId;
};

/**
 * Generate a new PO Invoice ID in format: PI25-001, PI25-002, etc.
 * @param {Array} existingInvoices - Array of existing PO invoices
 * @returns {string} - New unique PO Invoice ID
 */
export const generatePOInvoiceId = (existingInvoices = []) => {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits of year
  
  // Use PI (Purchase Invoice) prefix for shorter IDs
  const currentYearPrefix = `PI${year}-`;
  let maxSequential = 0;
  
  existingInvoices.forEach(invoice => {
    const invoiceId = invoice.invoice_number || invoice.bill_id;
    if (invoiceId && invoiceId.startsWith(currentYearPrefix)) {
      const sequentialPart = invoiceId.substring(currentYearPrefix.length);
      const sequential = parseInt(sequentialPart);
      if (!isNaN(sequential) && sequential > maxSequential) {
        maxSequential = sequential;
      }
    }
  });
  
  // Generate new sequential number (yearly sequence)
  const nextSequential = (maxSequential + 1).toString().padStart(3, '0');
  const finalId = `${currentYearPrefix}${nextSequential}`;
  
  // Backup check - if somehow this ID exists, add a random suffix
  let counter = 1;
  let backupId = finalId;
  
  while (existingInvoices.some(invoice => 
    (invoice.invoice_number === backupId || invoice.bill_id === backupId))) {
    backupId = `${finalId}-${counter}`;
    counter++;
  }
  
  return backupId;
};

/**
 * Generate incremental PO Invoice ID for same PO (PI25-001-1, PI25-001-2, etc.)
 * @param {Array} existingPOInvoices - Array of existing invoices for this specific PO
 * @param {Array} allPOInvoices - Array of all PO invoices for base ID generation
 * @returns {string} - New unique PO Invoice ID with incremental suffix
 */
export const generateIncrementalPOInvoiceId = (existingPOInvoices = [], allPOInvoices = []) => {
  // If no invoices exist for this PO, generate the base ID
  if (existingPOInvoices.length === 0) {
    return generatePOInvoiceId(allPOInvoices);
  }
  
  // Find the base ID from existing invoices for this PO
  const firstInvoice = existingPOInvoices[0];
  const baseId = firstInvoice.invoice_number || firstInvoice.bill_id;
  
  if (!baseId) {
    // Fallback: generate a new base ID
    return generatePOInvoiceId(allPOInvoices);
  }
  
  // Extract base ID (remove any existing suffix)
  let cleanBaseId = baseId;
  const baseParts = baseId.split('-');
  if (baseParts.length > 2) {
    // Has a suffix, extract base (PI25-001 from PI25-001-1)
    cleanBaseId = baseParts.slice(0, 2).join('-');
  }
  
  // Find the highest suffix number for this base ID
  let maxSuffix = 0;
  existingPOInvoices.forEach(invoice => {
    const invoiceId = invoice.invoice_number || invoice.bill_id;
    if (invoiceId && invoiceId.startsWith(cleanBaseId)) {
      const parts = invoiceId.split('-');
      if (parts.length > 2) {
        const suffix = parseInt(parts[2]);
        if (!isNaN(suffix) && suffix > maxSuffix) {
          maxSuffix = suffix;
        }
      } else if (parts.length === 2) {
        // Base ID without suffix, treat as suffix 0
        maxSuffix = Math.max(maxSuffix, 0);
      }
    }
  });
  
  // Generate next incremental ID
  const nextSuffix = maxSuffix + 1;
  const finalId = `${cleanBaseId}-${nextSuffix}`;
  
  // Verify uniqueness across all PO invoices
  let counter = 1;
  let backupId = finalId;
  
  while (allPOInvoices.some(invoice => 
    (invoice.invoice_number === backupId || invoice.bill_id === backupId))) {
    backupId = `${cleanBaseId}-${nextSuffix + counter}`;
    counter++;
  }
  
  return backupId;
};

/**
 * Generate a new Category ID in format: CAT001, CAT002, etc.
 * @param {Array} existingCategories - Array of existing categories
 * @returns {string} - New unique Category ID
 */
export const generateCategoryId = (existingCategories = []) => {
  const prefix = 'CAT';
  let maxSequential = 0;
  
  existingCategories.forEach(category => {
    const categoryId = category.id || category.category_id;
    if (categoryId && categoryId.toString().startsWith(prefix)) {
      const sequentialPart = categoryId.substring(prefix.length);
      const sequential = parseInt(sequentialPart);
      if (!isNaN(sequential) && sequential > maxSequential) {
        maxSequential = sequential;
      }
    }
  });
  
  // Generate new sequential number
  const nextSequential = (maxSequential + 1).toString().padStart(3, '0');
  return `${prefix}${nextSequential}`;
};

/**
 * Validate if an ID follows the expected format
 * @param {string} id - ID to validate
 * @param {string} type - Type of ID ('PO', 'INV', 'CAT')
 * @returns {boolean} - Whether ID is valid
 */
export const validateIdFormat = (id, type) => {
  const patterns = {
    PO: /^PO\d{2}-\d{1,2}-\d{3}(-\d+)?$/,     // PO24-9-001 or PO24-9-001-1
    INV: /^INV\d{2}-\d{1,2}-\d{3}(-\d+)?$/,   // INV24-9-001 or INV24-9-001-1
    PI: /^PI\d{2}-\d{3}(-\d+)?$/,             // PI25-001 or PI25-001-1
    CAT: /^CAT\d{3}$/                          // CAT001
  };
  
  return patterns[type] ? patterns[type].test(id) : false;
};

/**
 * Parse ID to extract components
 * @param {string} id - ID to parse
 * @param {string} type - Type of ID ('PO', 'INV', 'CAT')
 * @returns {Object} - Parsed components
 */
export const parseId = (id, type) => {
  if (!validateIdFormat(id, type)) {
    return null;
  }
  
  if (type === 'CAT') {
    return {
      prefix: id.substring(0, 3),
      sequential: parseInt(id.substring(3))
    };
  }
  
  if (type === 'PI') {
    // For PI format: PI25-001
    const parts = id.split('-');
    const prefixYear = parts[0]; // e.g., "PI25"
    const sequential = parseInt(parts[1]);
    
    return {
      prefix: prefixYear.substring(0, 2), // "PI"
      year: parseInt('20' + prefixYear.substring(2)), // Convert "25" to 2025
      sequential,
      hasCounter: parts.length > 2 ? parseInt(parts[2]) : null
    };
  }
  
  // For PO and INV
  const parts = id.split('-');
  const prefixYear = parts[0]; // e.g., "PO24" or "INV24"
  const month = parseInt(parts[1]);
  const sequential = parseInt(parts[2]);
  
  return {
    prefix: prefixYear.substring(0, type.length), // "PO" or "INV"
    year: parseInt('20' + prefixYear.substring(type.length)), // Convert "24" to 2024
    month,
    sequential,
    hasCounter: parts.length > 3 ? parseInt(parts[3]) : null
  };
};