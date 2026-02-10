import React from 'react';
import Footer from '../components/Footer';
import CategoryTable from '../components/CategoryTable';

const Category = () => {
  return (
    <div className="p-4 sm:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1">
            Manage expense categories to organize your financial data
          </p>
        </div>
    </div>

      <CategoryTable />
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Category;