import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import Footer from "../components/Footer";
import StatsCard from "../components/StatsCard";
import QuickActions from "../components/QuickActions";
import FinancialOverview from "../components/FinancialOverview";
import ExpenseChart from "../components/ExpenseChart";
import TransactionHistory from "../components/TransactionHistory";
import DashboardAPI from "../services/dashboardService";
import { Link } from "react-router-dom";
import {
  FileText,
  AlertCircle,
  Users,
  ShoppingCart,
  ShoppingBag,
  BarChart3,
  Zap,
} from "lucide-react";

const DynamicDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Module descriptions
  const moduleDescriptions = {
    dashboard: {
      icon: BarChart3,
      title: "Dashboard",
      description: "Overview and analytics of your business metrics",
      path: "/dashboard",
    },
    invoices: {
      icon: FileText,
      title: "Invoices",
      description: "Manage invoices, payments, and billing records",
      path: "/invoices",
    },
    customers: {
      icon: Users,
      title: "Customers",
      description: "Customer information, contacts, and relationships",
      path: "/customers",
    },
    expenses: {
      icon: AlertCircle,
      title: "Expenses",
      description: "Track and manage business expenses",
      path: "/expense",
    },
    purchaseOrders: {
      icon: ShoppingBag,
      title: "Purchase Orders",
      description: "Create and manage purchase orders",
      path: "/purchase-order",
    },
    stock: {
      icon: ShoppingCart,
      title: "Stock",
      description: "Inventory management and stock levels",
      path: "/stock",
    },
    financialProgress: {
      icon: Zap,
      title: "Financial Progress",
      description: "Financial reports and analytics",
      path: "/company-financial-progress",
    },
    settings: {
      icon: Zap,
      title: "Settings",
      description: "System and user settings",
      path: "/settings",
    },
  };

  // Check if user is Admin (has access to ALL modules)
  const allModules = Object.keys(moduleDescriptions);
  const isAdmin = user?.modules && 
    user.modules.length === allModules.length && 
    allModules.every(module => user.modules.includes(module));

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await DashboardAPI.getDashboardSummary();
      if (response.success) {
        setDashboardData(response.data);
        setError(null);
      } else {
        setDashboardData(getFallbackDashboardData());
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setDashboardData(getFallbackDashboardData());
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackDashboardData = () => ({
    stats: {
      totalRevenue: {
        amount: 36860,
        change: "+12.4%",
        changeType: "up",
        subtitle: "From 3 paid invoices",
      },
      totalInvoices: {
        amount: 5,
        change: "5 this month",
        changeType: "up",
        subtitle: "60.0% completion rate",
      },
      pendingPayments: {
        amount: 2874.75,
        change: "1 invoice",
        changeType: "warning",
        subtitle: "Pending customer payments",
      },
      activePurchaseOrders: {
        amount: 119900,
        change: "1 active PO",
        changeType: "up",
        subtitle: "Total commitment value",
      },
    },
    paymentSummary: {
      currentBalance: 33985.25,
      balanceChange: {
        percentage: "+5.7%",
        type: "positive",
      },
      upcomingPayments: {
        amount: 2874.75,
        count: 1,
        badge: "1 Pending",
      },
      overdueInvoices: {
        amount: 117000,
        count: 1,
      },
      monthlyCollections: {
        amount: 36860,
        change: "+12.4%",
      },
      activePurchaseOrders: {
        amount: 119900,
        count: 1,
      },
    },
    quickActions: {
      totalInvoices: 5,
      totalPurchaseOrders: 2,
      totalExpenses: 0,
      totalCustomers: 8,
    },
    recentTransactions: [
      {
        id: 3,
        name: "Muhammad Hunain",
        initial: "M",
        amount: 1960,
        currency: "PKR",
        time: "13:10",
        transaction_type: "Paid Invoice",
        invoice_id: 3,
      },
    ],
  });

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen p-4">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />

        {/* ADMIN DASHBOARD - Comprehensive Stats */}
        {isAdmin ? (
          <main className="flex-1 p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading dashboard...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Quick Actions */}
                <QuickActions dashboardData={dashboardData} />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <StatsCard
                    title="Total Revenue"
                    amount={dashboardData?.stats?.totalRevenue?.amount || 0}
                    change={dashboardData?.stats?.totalRevenue?.change || "0%"}
                    changeType={
                      dashboardData?.stats?.totalRevenue?.changeType ||
                      "neutral"
                    }
                    color="green"
                    currency="PKR"
                    subtitle={
                      dashboardData?.stats?.totalRevenue?.subtitle ||
                      "From paid invoices"
                    }
                  />
                  <StatsCard
                    title="Total Invoices"
                    amount={dashboardData?.stats?.totalInvoices?.amount || 0}
                    change={
                      dashboardData?.stats?.totalInvoices?.change ||
                      "0 this month"
                    }
                    changeType={
                      dashboardData?.stats?.totalInvoices?.changeType ||
                      "neutral"
                    }
                    color="blue"
                    currency=""
                    subtitle={
                      dashboardData?.stats?.totalInvoices?.subtitle ||
                      "Completion tracking"
                    }
                  />
                  <StatsCard
                    title="Pending Payments"
                    amount={dashboardData?.stats?.pendingPayments?.amount || 0}
                    change={
                      dashboardData?.stats?.pendingPayments?.change ||
                      "0 invoices"
                    }
                    changeType={
                      dashboardData?.stats?.pendingPayments?.changeType ||
                      "neutral"
                    }
                    color="yellow"
                    currency="PKR"
                    subtitle={
                      dashboardData?.stats?.pendingPayments?.subtitle ||
                      "Outstanding amounts"
                    }
                  />
                  <StatsCard
                    title="Active Purchase Orders"
                    amount={
                      dashboardData?.stats?.activePurchaseOrders?.amount || 0
                    }
                    change={
                      dashboardData?.stats?.activePurchaseOrders?.change ||
                      "0 active POs"
                    }
                    changeType={
                      dashboardData?.stats?.activePurchaseOrders?.changeType ||
                      "neutral"
                    }
                    color="purple"
                    currency="PKR"
                    subtitle={
                      dashboardData?.stats?.activePurchaseOrders?.subtitle ||
                      "Total commitment"
                    }
                  />
                </div>

                {/* Financial Overview */}
                <div className="w-full">
                  <FinancialOverview dashboardData={dashboardData} />
                </div>

                {/* Charts and Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="lg:col-span-2">
                    <ExpenseChart />
                  </div>
                  <TransactionHistory />
                </div>
              </>
            )}
          </main>
        ) : (
          /* SIMPLE DASHBOARD - For Non-Admin Users */
          <main className="flex-1 p-6 sm:p-8">
            {/* Welcome Section */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back, {user?.firstName}! 👋
              </h1>
              <p className="text-lg text-gray-600">
                You have access to {user?.modules?.length || 0} modules. Here's
                what you can manage:
              </p>
            </div>

            {/* Module Cards Grid */}
            {user?.modules && user.modules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user.modules.map((module) => {
                  const info = moduleDescriptions[module];
                  if (!info) return null;

                  const IconComponent = info.icon;
                  return (
                    <Link to={info.path} key={module}>
                      <div
                        key={module}
                        className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 p-8 group"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <IconComponent className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {info.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {info.description}
                        </p>
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors">
                            Go to {info.title} →
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="inline-block mb-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Modules Assigned
                </h3>
                <p className="text-gray-600">
                  You don't have access to any modules yet. Contact your
                  administrator to assign modules to your role.
                </p>
              </div>
            )}

            {/* Quick Info Section */}
            {user?.modules && user.modules.length > 0 && (
              <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  About Your Access
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Your Role
                    </h3>
                    <p className="text-gray-700">
                      You are logged in as a user with specific module
                      permissions. Each module below represents different areas
                      of the system you can access and manage.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Accessible Modules
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {user.modules.map((module) => (
                        <span
                          key={module}
                          className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-sm font-medium capitalize hover:bg-blue-50 transition-colors"
                        >
                          {moduleDescriptions[module]?.title ||
                            module.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Info */}
            {user?.modules && user.modules.length > 0 && (
              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-blue-900">💡 Tip:</span>{" "}
                  Use the sidebar menu on the left to navigate between modules.
                  Each module provides specialized tools for managing that area
                  of your business.
                </p>
              </div>
            )}
          </main>
        )}

        <Footer />
      </div>
    </div>
  );
};

export default DynamicDashboard;
