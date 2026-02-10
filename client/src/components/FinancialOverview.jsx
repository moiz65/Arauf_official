import React, { useState, useEffect } from 'react';
import { 
  MoreVertical, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard,
  Wallet,
  Target,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const FinancialOverview = ({ dashboardData }) => {
  const [activeChart, setActiveChart] = useState('overview');
  const [financialData, setFinancialData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Format currency function
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '0.00';
    return Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  };

  // Fetch comprehensive financial data
  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple endpoints
      const [invoicesResponse, expensesResponse, poResponse] = await Promise.all([
        fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/invoices?limit=1000`),
        fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/expenses?limit=1000`),
        fetch(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'}/purchase-orders?limit=1000`)
      ]);

      const [invoicesData, expensesData, poData] = await Promise.all([
        invoicesResponse.ok ? invoicesResponse.json() : { data: [] },
        expensesResponse.ok ? expensesResponse.json() : { value: [] },
        poResponse.ok ? poResponse.json() : { value: [] }
      ]);

  console.debug('Raw API responses:', { invoicesData, expensesData, poData });

      const invoices = invoicesData.data || [];
      const expenses = expensesData.value || expensesData.data || []; // Handle both formats
      const purchaseOrders = poData.value || [];

      // Calculate financial metrics
      const paidInvoices = invoices.filter(inv => inv.status === 'Paid');
      const pendingInvoices = invoices.filter(inv => inv.status === 'Pending' || inv.status === 'Sent' || inv.status === 'Draft');
      const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue');
      const paidExpenses = expenses.filter(exp => exp.status === 'Paid');
      const pendingExpenses = expenses.filter(exp => exp.status === 'Pending');
      const activePOs = purchaseOrders.filter(po => po.status === 'Pending' || po.status === 'Approved' || po.status === 'In Progress');
      
  console.debug('Debug Financial Data:', {
        totalExpenses: expenses.length,
        paidExpenses: paidExpenses.length,
        pendingExpenses: pendingExpenses.length,
        activePOs: activePOs.length,
        expenses: expenses.map(e => ({ id: e.id, status: e.status, amount: e.amount })),
        purchaseOrders: purchaseOrders.map(p => ({ id: p.id, status: p.status, amount: p.total_amount }))
      });

      // Calculate amounts
      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
      const pendingReceivables = pendingInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
      
  console.debug('Amount calculations:', {
        paidExpensesAmounts: paidExpenses.map(exp => parseFloat(exp.amount)),
        pendingExpensesAmounts: pendingExpenses.map(exp => parseFloat(exp.amount))
      });
      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) || 0), 0);
      const totalExpenses = paidExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
      const pendingExpenseAmount = pendingExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
      const totalCommitments = activePOs.reduce((sum, po) => sum + (parseFloat(po.total_amount) || 0), 0);

  console.debug('Final calculations:', {
        overdueAmount,
        totalExpenses,
        pendingExpenseAmount,
        totalCommitments,
        totalRevenue,
        pendingReceivables
      });

      // Assets = Cash + Receivables
      const currentAssets = totalRevenue + pendingReceivables;
      
      // Liabilities = Outstanding expenses + PO commitments
      const currentLiabilities = pendingExpenseAmount + totalCommitments;
      
      // Net Worth = Assets - Liabilities
      const netWorth = currentAssets - currentLiabilities;

      setFinancialData({
        overview: {
          assets: currentAssets,
          liabilities: currentLiabilities,
          income: totalRevenue,
          expenses: totalExpenses,
          netWorth: netWorth,
          receivables: pendingReceivables,
          commitments: totalCommitments
        },
        breakdown: {
          income: [
            { label: 'Paid Invoices', value: totalRevenue, count: paidInvoices.length },
            { label: 'Pending Collection', value: pendingReceivables, count: pendingInvoices.length },
            { label: 'Overdue Amount', value: overdueAmount, count: overdueInvoices.length }
          ],
          expenses: [
            { label: 'Paid Expenses', value: totalExpenses, count: paidExpenses.length },
            { label: 'Pending Payments', value: pendingExpenseAmount, count: pendingExpenses.length }
          ],
          assets: [
            { label: 'Revenue Collected', value: totalRevenue, percentage: currentAssets > 0 ? (totalRevenue / currentAssets * 100) : 0 },
            { label: 'Outstanding Receivables', value: pendingReceivables, percentage: currentAssets > 0 ? (pendingReceivables / currentAssets * 100) : 0 }
          ],
          liabilities: [
            { label: 'Expense Obligations', value: pendingExpenseAmount, percentage: currentLiabilities > 0 ? (pendingExpenseAmount / currentLiabilities * 100) : 0 },
            { label: 'PO Commitments', value: totalCommitments, percentage: currentLiabilities > 0 ? (totalCommitments / currentLiabilities * 100) : 0 }
          ]
        }
      });

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const chartTypes = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'income', label: 'Income', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'expenses', label: 'Expenses', icon: <TrendingDown className="w-4 h-4" /> },
    { id: 'balance', label: 'Balance Sheet', icon: <BarChart3 className="w-4 h-4" /> }
  ];

  const renderOverviewChart = () => {
    if (!financialData) return null;
    
    const { assets, liabilities, income, expenses, netWorth } = financialData.overview;
    
    return (
      <div className="space-y-4">
        {/* Main Balance */}
        <div className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Net Worth</p>
              <p className="text-2xl font-bold">Rs {formatCurrency(netWorth)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75">Assets - Liabilities</p>
              <p className={`text-sm ${netWorth >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                {netWorth >= 0 ? 'Positive' : 'Deficit'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-700">Assets</span>
            </div>
            <p className="text-lg font-bold text-green-800">Rs {formatCurrency(assets)}</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-red-700">Liabilities</span>
            </div>
            <p className="text-lg font-bold text-red-800">Rs {formatCurrency(liabilities)}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700">Income</span>
            </div>
            <p className="text-lg font-bold text-blue-800">Rs {formatCurrency(income)}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <span className="text-xs font-medium text-orange-700">Expenses</span>
            </div>
            <p className="text-lg font-bold text-orange-800">Rs {formatCurrency(expenses)}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderBarChart = (data, title, color) => {
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">{title}</h4>
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium">Rs {formatCurrency(item.value)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`${color} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
              ></div>
            </div>
            {item.count && (
              <p className="text-xs text-gray-500">{item.count} transactions</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPieChart = (data, title) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    
    return (
      <div className="space-y-3">
        <h4 className="font-medium text-gray-700">{title}</h4>
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' : index === 1 ? 'bg-green-500' : 'bg-orange-500'
                  }`}
                ></div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Rs {formatCurrency(item.value)}</p>
                <p className="text-xs text-gray-500">{Number(item.percentage || 0).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderActiveChart = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!financialData) return null;

    switch (activeChart) {
      case 'overview':
        return renderOverviewChart();
      case 'income':
        return renderBarChart(financialData.breakdown.income, 'Income Breakdown', 'bg-green-500');
      case 'expenses':
        return renderBarChart(financialData.breakdown.expenses, 'Expense Breakdown', 'bg-red-500');
      case 'balance':
        return (
          <div className="space-y-4">
            {renderPieChart(financialData.breakdown.assets, 'Assets Composition')}
            <div className="border-t pt-4">
              {renderPieChart(financialData.breakdown.liabilities, 'Liabilities Composition')}
            </div>
          </div>
        );
      default:
        return renderOverviewChart();
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50 hover:shadow-md transition-all w-full group relative">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          FINANCIAL OVERVIEW
        </h3>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Payment Summary</h2>
          <button 
            onClick={fetchFinancialData}
            className="p-2 hover:bg-gray-100/50 rounded-lg transition-colors text-gray-500 hover:text-gray-700"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Full Size Payment Summary */}
      <div className="w-full h-full">
        {dashboardData && dashboardData.paymentSummary ? (
          <div className="space-y-6">
            {/* Current Balance - Large Blue Card */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium mb-1">Current Balance</p>
                  <p className="text-3xl font-bold mb-2">
                    Rs {formatCurrency(dashboardData.paymentSummary.currentBalance)}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                      {dashboardData.paymentSummary.balanceChange?.percentage || '+5.7%'}
                    </span>
                    <TrendingUp className="w-4 h-4 text-blue-200" />
                  </div>
                </div>
                <Wallet className="w-12 h-12 text-blue-200" />
              </div>
            </div>

            {/* Payment Details Grid */}
            <div className="grid grid-cols-1 gap-4">
              {/* Awaiting Payments */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Pending Payments</p>
                    <p className="text-sm text-green-600 font-medium">
                      {dashboardData.paymentSummary.upcomingPayments?.count || 1} Pending
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    PKR {formatCurrency(dashboardData.paymentSummary.upcomingPayments?.amount || 2874.75)}
                  </p>
                  <p className="text-xs text-green-600">↑ Increased from last week</p>
                </div>
              </div>

              {/* Overdue Invoices */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Overdue Invoices</p>
                    <p className="text-sm text-red-600 font-medium">
                      {dashboardData.paymentSummary.overdueInvoices?.count || 1} Need Action
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    PKR {formatCurrency(dashboardData.paymentSummary.overdueInvoices?.amount || 117000)}
                  </p>
                </div>
              </div>

              {/* Monthly Collections */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Monthly Collections</p>
                    <p className="text-sm text-green-600 font-medium">+12.4%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    PKR {formatCurrency(dashboardData.paymentSummary.monthlyCollections?.amount || 36860)}
                  </p>
                  <p className="text-xs text-green-600">↑ Increased from last week</p>
                </div>
              </div>

              {/* Active Purchase Orders */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900">Active Purchase Orders</p>
                    <p className="text-sm text-green-600 font-medium">
                      {dashboardData.paymentSummary.activePurchaseOrders?.count || 1} Active
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    PKR {formatCurrency(dashboardData.paymentSummary.activePurchaseOrders?.amount || 119900)}
                  </p>
                  <p className="text-xs text-green-600">↑ Increased from last week</p>
                </div>
              </div>
            </div>

            {/* View Full Report Button */}
            <div className="pt-4 border-t">

            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

    </div>
  );
};

export default FinancialOverview;
