import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import RegisteredStockPage from '../components/RegisteredStockPage';
import AddStockSidebar from '../components/AddStockSidebar';

const Stock = () => {
  const [activeTab, setActiveTab] = useState('registered');
  const [showAddSidebar, setShowAddSidebar] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const openAddSidebar = (stock = null) => {
    setEditingStock(stock || null);
    setShowAddSidebar(true);
  };

  const handleStockAdded = () => {
    setRefreshKey(k => k + 1);
    setShowAddSidebar(false);
    setEditingStock(null);
  };

  return (
    <div className="flex bg-[#F5F5F5] min-h-screen p-4">
      {/* Sidebar */}
      <div className="hidden md:block fixed h-screen w-64 z-20">
        <Sidebar />
      </div>
      {/* Main Content */}
      <main className="flex-1 p-6 bg-[#F5F5F5] md:ml-64">
        <Header />

        {/* Content - Only Registered Stock */}
        <RegisteredStockPage openAddSidebar={openAddSidebar} openEditStock={(s) => openAddSidebar(s)} refreshKey={refreshKey} />
        
        {/* Footer */}
        <Footer />
      </main>

      {/* Centralized AddStock Sidebar for the Stock page */}
      <AddStockSidebar
        isOpen={showAddSidebar}
        initialData={editingStock}
        onClose={() => { setShowAddSidebar(false); setEditingStock(null); }}
        onSuccess={() => { handleStockAdded(); }}
      />
    </div>
  );
};

export default Stock;
