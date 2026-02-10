import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ExpenseTable from '../components/ExpenseTable';
import CategoryTable from '../components/CategoryTable';
import { API_ENDPOINTS } from '../config/api';

const Expense = () => {
  const [activeView, setActiveView] = useState('expenses'); // 'expenses' or 'categories'
  const [expensesData, setExpensesData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch expenses data from API
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.EXPENSES.LIST);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setExpensesData(data);
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setExpensesData([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalExpenditure = expensesData.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const paidExpenses = expensesData.filter(expense => expense.status === 'Paid');
  const pendingExpenses = expensesData.filter(expense => expense.status === 'Pending');
  const totalPaid = paidExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);
  const totalPending = pendingExpenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0);

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen p-4">
      {/* Sidebar */}
      <div className="hidden md:block fixed h-screen w-64 z-20">
        <Sidebar />
      </div>
      {/* Main Content */}
      <main className="flex-1 p-6 bg-[#F5F5F5] md:ml-64">
        <Header/>

        {/* Toggle Buttons */}
        <div className="mb-6">
          <div className="flex bg-white rounded-lg p-1 w-fit shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveView('expenses')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeView === 'expenses'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Expenses
            </button>
            <button
              onClick={() => setActiveView('categories')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeView === 'categories'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Categories
            </button>
          </div>
        </div>

        {/* Statistics Cards - Only show for Expenses view */}
        {activeView === 'expenses' && !loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Total Expenditure Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Total Expenditure</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-900">
                    PKR {totalExpenditure.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">{expensesData.length} expenses</p>
                </div>
                <div className="bg-blue-500 rounded-full p-3">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Paid Expenses Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-green-600 font-medium mb-1">Paid Expenses</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-900">
                    PKR {totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-green-600 mt-1">{paidExpenses.length} paid</p>
                </div>
                <div className="bg-green-500 rounded-full p-3">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            {/* Pending Expenses Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-yellow-600 font-medium mb-1">Pending Expenses</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-900">
                    PKR {totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">{pendingExpenses.length} pending</p>
                </div>
                <div className="bg-yellow-500 rounded-full p-3">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Based on Active View */}
        {activeView === 'expenses' ? (
          <ExpenseTable 
            expensesData={expensesData} 
            onExpensesChange={fetchExpenses}
          />
        ) : (
          <CategoryTable />
        )}
        
        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
};

export default Expense;
