import React from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SettingsPage from '../components/SettingsPage';

const Settings = () => {
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
        <div>
          <SettingsPage />
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Settings;
