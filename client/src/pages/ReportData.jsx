// import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
// import ReportsTable from '../components/ReportsTable';
// import SummaryCard from '../components/SummaryCard';
// import RecentActivity from '../components/RecentActivity';
import DataTable from '../components/DataTable';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ReportData = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const report = location.state?.report;

  if (!report) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-gray-600 mb-4">No report data found.</p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen p-4">
      {/* Sidebar */}
      <div className="hidden md:block fixed h-screen w-64 z-20">
        <Sidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 p-6 bg-[#F5F5F5] md:ml-64 overflow-auto">
        {/* Header */}
        <Header />
        {/* Reports Table */}
        <section className="grid grid-cols-1 lg:grid-cols-1 gap-5">
          <div className="lg:col-span-3">
            <DataTable/>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReportData;