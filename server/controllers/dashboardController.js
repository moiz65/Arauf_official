const db = require('../src/config/db');

class DashboardController {
  // Get dashboard summary with all key metrics
  static async getDashboardSummary(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

      const queries = {
        // Total Revenue (from paid invoices - both regular and PO invoices)
        totalRevenue: `
          SELECT COALESCE(
            (SELECT SUM(total_amount) FROM invoice WHERE status = 'Paid') +
            (SELECT SUM(total_amount) FROM po_invoices WHERE status = 'Paid'), 0
          ) as total
        `,
        
        // Last Month Revenue for comparison (both regular and PO invoices)
        lastMonthRevenue: `
          SELECT COALESCE(
            (SELECT SUM(total_amount) FROM invoice WHERE status = 'Paid' AND DATE_FORMAT(created_at, '%Y-%m') = ?) +
            (SELECT SUM(total_amount) FROM po_invoices WHERE status = 'Paid' AND DATE_FORMAT(created_at, '%Y-%m') = ?), 0
          ) as total
        `,

        // Current Month Revenue for comparison (both regular and PO invoices)
        currentMonthRevenue: `
          SELECT COALESCE(
            (SELECT SUM(total_amount) FROM invoice WHERE status = 'Paid' AND DATE_FORMAT(created_at, '%Y-%m') = ?) +
            (SELECT SUM(total_amount) FROM po_invoices WHERE status = 'Paid' AND DATE_FORMAT(created_at, '%Y-%m') = ?), 0
          ) as total
        `,

        // Total Expenses
        totalExpenses: `
          SELECT COALESCE(SUM(amount), 0) as total
          FROM expenses 
          WHERE status = 'Paid'
        `,

        // Last Month Expenses
        lastMonthExpenses: `
          SELECT COALESCE(SUM(amount), 0) as total
          FROM expenses 
          WHERE status = 'Paid' AND DATE_FORMAT(date, '%Y-%m') = ?
        `,

        // Current Month Expenses
        currentMonthExpenses: `
          SELECT COALESCE(SUM(amount), 0) as total
          FROM expenses 
          WHERE status = 'Paid' AND DATE_FORMAT(date, '%Y-%m') = ?
        `,

        // Today's Revenue (both regular and PO invoices)
        todayRevenue: `
          SELECT COALESCE(
            (SELECT SUM(total_amount) FROM invoice WHERE status = 'Paid' AND DATE(created_at) = ?) +
            (SELECT SUM(total_amount) FROM po_invoices WHERE status = 'Paid' AND DATE(created_at) = ?), 0
          ) as total
        `,

        // Today's Expenses
        todayExpenses: `
          SELECT COALESCE(SUM(amount), 0) as total
          FROM expenses 
          WHERE status = 'Paid' AND DATE(date) = ?
        `,

        // Current Balance (cash available - represents all paid invoices minus expenses)
        currentBalance: `
          SELECT 
            COALESCE(
              (SELECT SUM(total_amount) FROM invoice WHERE status = 'Paid') +
              (SELECT SUM(total_amount) FROM po_invoices WHERE status = 'Paid'), 0
            ) as revenue,
            COALESCE((SELECT SUM(amount) FROM expenses WHERE status = 'Paid'), 0) as expenses,
            (COALESCE(
              (SELECT SUM(total_amount) FROM invoice WHERE status = 'Paid') +
              (SELECT SUM(total_amount) FROM po_invoices WHERE status = 'Paid'), 0
            ) - COALESCE((SELECT SUM(amount) FROM expenses WHERE status = 'Paid'), 0)) as balance
        `,
        
        // Last month balance for percentage calculation  
        lastMonthBalance: `
          SELECT 
            COALESCE(
              (SELECT SUM(total_amount) FROM invoice WHERE status = 'Paid' AND DATE_FORMAT(created_at, '%Y-%m') = ?) - 
              (SELECT SUM(amount) FROM expenses WHERE status = 'Paid' AND DATE_FORMAT(date, '%Y-%m') = ?), 0
            ) as balance
        `,

        // Upcoming Payments (invoices that are not paid yet: Draft, Not Sent, Sent, Pending - both regular and PO)
        upcomingPayments: `
          SELECT 
            (COALESCE((SELECT SUM(total_amount) FROM invoice WHERE status IN ('Not Sent', 'Draft', 'Sent', 'Pending')), 0) +
             COALESCE((SELECT SUM(total_amount) FROM po_invoices WHERE status IN ('Not Sent', 'Draft', 'Sent', 'Pending')), 0)) as total,
            (COALESCE((SELECT COUNT(*) FROM invoice WHERE status IN ('Not Sent', 'Draft', 'Sent', 'Pending')), 0) +
             COALESCE((SELECT COUNT(*) FROM po_invoices WHERE status IN ('Not Sent', 'Draft', 'Sent', 'Pending')), 0)) as count
        `,

        // Overdue Invoices (both regular and PO)
        overdueInvoices: `
          SELECT 
            (COALESCE((SELECT SUM(total_amount) FROM invoice WHERE status = 'Overdue'), 0) +
             COALESCE((SELECT SUM(total_amount) FROM po_invoices WHERE status = 'Overdue'), 0)) as total,
            (COALESCE((SELECT COUNT(*) FROM invoice WHERE status = 'Overdue'), 0) +
             COALESCE((SELECT COUNT(*) FROM po_invoices WHERE status = 'Overdue'), 0)) as count
        `,

        // Total Customers
        totalCustomers: `
          SELECT COUNT(*) as count FROM customertable
        `,

        // Total Purchase Orders
        totalPurchaseOrders: `
          SELECT COUNT(*) as count FROM purchase_orders
        `,

        // Recent invoices for transaction history (both regular and PO invoices)
        recentInvoices: `
          SELECT 
            id,
            invoice_number,
            customer_name,
            total_amount,
            currency,
            status,
            created_at,
            updated_at,
            'regular' as invoice_type
          FROM invoice 
          WHERE status = 'Paid'
          UNION ALL
          SELECT 
            id,
            invoice_number,
            customer_name,
            total_amount,
            currency,
            status,
            created_at,
            updated_at,
            'po' as invoice_type
          FROM po_invoices 
          WHERE status = 'Paid'
          ORDER BY updated_at DESC 
          LIMIT 5
        `
      };

      const results = {};

      // Execute all queries (use promise API of mysql2)
      for (const [key, query] of Object.entries(queries)) {
        let params = [];

        // Add parameters based on query type
        if (key === 'lastMonthRevenue') {
          params = [lastMonth, lastMonth]; // Two parameters for regular and PO invoices
        } else if (key === 'currentMonthRevenue') {
          params = [currentMonth, currentMonth]; // Two parameters for regular and PO invoices
        } else if (key === 'todayRevenue') {
          params = [today, today]; // Two parameters for regular and PO invoices
        } else if (key === 'lastMonthExpenses' || key === 'currentMonthExpenses') {
          params = [key.includes('last') ? lastMonth : currentMonth];
        } else if (key === 'todayExpenses') {
          params = [today];
        } else if (key === 'lastMonthBalance') {
          params = [lastMonth, lastMonth]; // Two parameters for the same month
        }

        // mysql2 promise pool returns [rows, fields]
        const [rows] = await db.query(query, params);
        results[key] = rows;
      }

      // Calculate percentages and format data
      const totalRevenue = results.totalRevenue[0]?.total || 0;
      const currentMonthRev = results.currentMonthRevenue[0]?.total || 0;
      const lastMonthRev = results.lastMonthRevenue[0]?.total || 0;
      
      const totalExpenses = results.totalExpenses[0]?.total || 0;
      const currentMonthExp = results.currentMonthExpenses[0]?.total || 0;
      const lastMonthExp = results.lastMonthExpenses[0]?.total || 0;

      // Get detailed balance information
      const balanceData = results.currentBalance[0] || {};
      const paidRevenue = balanceData.revenue || 0;
      const paidExpenses = balanceData.expenses || 0;
      const currentBalance = balanceData.balance || 0;
      
      // Debug logging to understand the balance calculation
      console.debug('Balance Debug Info:', {
        paidRevenue,
        paidExpenses, 
        currentBalance,
        totalRevenue,
        totalExpenses
      });

      const netProfit = totalRevenue - totalExpenses;
      const currentMonthProfit = currentMonthRev - currentMonthExp;
      const lastMonthProfit = lastMonthRev - lastMonthExp;

      // Calculate percentage changes (handle division by zero)
      const revenueChange = lastMonthRev > 0 ? ((currentMonthRev - lastMonthRev) / lastMonthRev * 100) : (currentMonthRev > 0 ? 100 : 0);
      const expenseChange = lastMonthExp > 0 ? ((currentMonthExp - lastMonthExp) / lastMonthExp * 100) : (currentMonthExp > 0 ? 100 : 0);
      const profitChange = lastMonthProfit !== 0 ? ((currentMonthProfit - lastMonthProfit) / Math.abs(lastMonthProfit) * 100) : 0;

      // Get additional business metrics
      const additionalQueries = {
        // Total invoices (both regular and PO invoices)
        totalInvoices: `
          SELECT 
            (SELECT COUNT(*) FROM invoice) + (SELECT COUNT(*) FROM po_invoices) as count
        `,
        
        // Pending invoices awaiting payment (both regular and PO invoices - excludes Paid and Overdue)
        pendingInvoices: `
          SELECT 
            (COALESCE((SELECT COUNT(*) FROM invoice WHERE status IN ('Not Sent', 'Draft', 'Sent', 'Pending')), 0) +
             COALESCE((SELECT COUNT(*) FROM po_invoices WHERE status IN ('Not Sent', 'Draft', 'Sent', 'Pending')), 0)) as count,
            (COALESCE((SELECT SUM(total_amount) FROM invoice WHERE status IN ('Not Sent', 'Draft', 'Sent', 'Pending')), 0) +
             COALESCE((SELECT SUM(total_amount) FROM po_invoices WHERE status IN ('Not Sent', 'Draft', 'Sent', 'Pending')), 0)) as total
        `,
        
        // This month's new invoices (both regular and PO invoices)
        thisMonthInvoices: `
          SELECT 
            COALESCE(
              (SELECT COUNT(*) FROM invoice WHERE DATE_FORMAT(created_at, '%Y-%m') = ?) +
              (SELECT COUNT(*) FROM po_invoices WHERE DATE_FORMAT(created_at, '%Y-%m') = ?), 0
            ) as count
        `,
        
        // Active purchase orders
        activePurchaseOrders: `
          SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total
          FROM purchase_orders 
          WHERE status IN ('Pending', 'Approved', 'In Progress')
        `,
        
        // Invoice completion rate (paid vs total - both regular and PO invoices)
        paidInvoicesCount: `
          SELECT 
            COALESCE(
              (SELECT COUNT(*) FROM invoice WHERE status = 'Paid') +
              (SELECT COUNT(*) FROM po_invoices WHERE status = 'Paid'), 0
            ) as count
        `
      };

      // Execute additional queries (promise style)
      for (const [key, query] of Object.entries(additionalQueries)) {
        let params = [];
        if (key === 'thisMonthInvoices') {
          params = [currentMonth, currentMonth];
        }

        const [rows] = await db.query(query, params);
        results[key] = rows;
      }

      // Calculate enhanced metrics
      const totalInvoicesCount = results.totalInvoices[0]?.count || 0;
      const paidInvoicesCount = results.paidInvoicesCount[0]?.count || 0;
      const pendingInvoicesCount = results.pendingInvoices[0]?.count || 0;
      const pendingInvoicesAmount = results.pendingInvoices[0]?.total || 0;
      const thisMonthInvoicesCount = results.thisMonthInvoices[0]?.count || 0;
      const activePOCount = results.activePurchaseOrders[0]?.count || 0;
      const activePOAmount = results.activePurchaseOrders[0]?.total || 0;
      
      // Calculate completion rate
      const completionRate = totalInvoicesCount > 0 ? ((paidInvoicesCount / totalInvoicesCount) * 100) : 0;

      // Format response with enhanced business metrics
      const dashboardData = {
        stats: {
          totalRevenue: {
            amount: totalRevenue,
            change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
            changeType: revenueChange >= 0 ? 'up' : 'down',
            subtitle: `From ${paidInvoicesCount} paid invoices`
          },
          totalInvoices: {
            amount: totalInvoicesCount,
            change: `${thisMonthInvoicesCount} this month`,
            changeType: thisMonthInvoicesCount > 0 ? 'up' : 'neutral',
            subtitle: `${completionRate.toFixed(1)}% completion rate`
          },
          pendingPayments: {
            amount: pendingInvoicesAmount,
            change: `${pendingInvoicesCount} invoices`,
            changeType: pendingInvoicesCount > 0 ? 'warning' : 'good',
            subtitle: 'Not yet paid (Draft/Sent/Pending)'
          },
          activePurchaseOrders: {
            amount: activePOAmount,
            change: `${activePOCount} active POs`,
            changeType: activePOCount > 0 ? 'up' : 'neutral',
            subtitle: 'Total commitment value'
          }
        },
        paymentSummary: {
          currentBalance: currentBalance,
          balanceChange: {
            percentage: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
            type: revenueChange >= 0 ? 'positive' : 'negative'
          },
          upcomingPayments: {
            amount: pendingInvoicesAmount,
            count: pendingInvoicesCount,
            badge: `${pendingInvoicesCount} Pending`
          },
          overdueInvoices: {
            amount: results.overdueInvoices[0]?.total || 0,
            count: results.overdueInvoices[0]?.count || 0
          },
          monthlyCollections: {
            amount: currentMonthRev,
            change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`
          },
          activePurchaseOrders: {
            amount: activePOAmount,
            count: activePOCount
          }
        },
        quickActions: {
          totalInvoices: totalInvoicesCount || 0,
          totalPurchaseOrders: results.totalPurchaseOrders[0]?.count || 0,
          totalExpenses: (results.totalExpenses[0]?.total > 0 ? 1 : 0),
          totalCustomers: results.totalCustomers[0]?.count || 0
        },
        recentTransactions: (results.recentInvoices || []).map(invoice => ({
          id: invoice.id,
          name: invoice.customer_name || 'Unknown Customer',
          initial: invoice.customer_name ? invoice.customer_name.charAt(0).toUpperCase() : 'U',
          amount: invoice.total_amount || 0,
          currency: invoice.currency || 'PKR',
          time: invoice.updated_at ? new Date(invoice.updated_at).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }) : '00:00',
          transaction_type: 'Paid Invoice',
          invoice_id: invoice.id
        }))
      };

      res.json({
        success: true,
        data: dashboardData,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }

  // Get monthly expense data for chart
  static async getMonthlyExpenses(req, res) {
    try {
      const query = `
        SELECT 
          DATE_FORMAT(date, '%Y-%m') as month,
          MONTHNAME(date) as month_name,
          SUM(amount) as total_amount
        FROM expenses 
        WHERE date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(date, '%Y-%m'), MONTHNAME(date)
        ORDER BY month ASC
      `;

      const [rows] = await db.query(query);

      // Handle empty results - provide default chart structure
      let chartData = [];
      if (!rows || rows.length === 0) {
        // Create default 12-month data with zeros
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        chartData = months.map(month => ({
          month: month,
          amount: 0
        }));
      } else {
        chartData = rows.map(row => ({
          month: row.month_name || 'Unknown',
          amount: row.total_amount || 0
        }));
      }

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      console.error('Error fetching monthly expenses:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch monthly expenses',
        error: error.message
      });
    }
  }

  // Get transaction history for dashboard
  static async getTransactionHistory(req, res) {
    try {
      const { page = 1, limit = 5 } = req.query;
      const offset = (page - 1) * limit;

      // Count total paid invoices
      const countQuery = `
        SELECT COUNT(*) as total
        FROM invoice 
        WHERE status = 'Paid'
      `;

      // Get paginated paid invoices
      const dataQuery = `
        SELECT 
          id,
          invoice_number,
          customer_name,
          total_amount,
          currency,
          status,
          created_at,
          updated_at
        FROM invoice 
        WHERE status = 'Paid'
        ORDER BY updated_at DESC 
        LIMIT ? OFFSET ?
      `;

      // Get count first (promise style)
      const [countRows] = await db.query(countQuery);
      const countResult = countRows[0] ? countRows[0].total : 0;

      // Get data
      const [dataRows] = await db.query(dataQuery, [parseInt(limit), parseInt(offset)]);

      const totalRecords = countResult;
      const totalPages = Math.ceil(totalRecords / limit);
      const currentPage = parseInt(page);

      const transactions = (dataRows || []).map(invoice => ({
        id: invoice.id,
        name: invoice.customer_name || 'Unknown Customer',
        initial: invoice.customer_name ? invoice.customer_name.charAt(0).toUpperCase() : 'U',
        amount: invoice.total_amount || 0,
        currency: invoice.currency || 'PKR',
        time: invoice.updated_at ? new Date(invoice.updated_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }) : '00:00',
        transaction_type: 'Paid Invoice',
        invoice_id: invoice.id
      }));

      res.json({
        success: true,
        data: transactions,
        pagination: {
          currentPage,
          totalPages,
          totalRecords,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      });

    } catch (error) {
      console.error('Error fetching transaction history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction history',
        error: error.message
      });
    }
  }
}

module.exports = DashboardController;