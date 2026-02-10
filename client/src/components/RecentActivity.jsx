import React from 'react';

const RecentActivity = ({ customers }) => {
  return (
    <div className="bg-white rounded-xl sm:rounded-[30px] shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex justify-between items-center mb-4 sm:mb-5">
        <h2 className="text-base sm:text-lg font-semibold">Recent Activity</h2>
        <button 
          className="text-gray-500 hover:bg-gray-100 p-1 rounded"
          aria-label="Add new activity"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="18" 
            height="18" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="sm:w-5 sm:h-5"
          >
            <path d="M2 12h20M12 2v20" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-2 sm:space-y-3">
        {customers.map((customer) => (
          <div 
            key={customer.id} 
            className="p-3 rounded-lg sm:rounded-[16px] border border-gray-100 bg-[#1976D2] hover:bg-blue-600 transition-colors cursor-pointer"
          >
            <div className="flex items-center">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm ${customer.color}`}>
                {customer.initial}
              </div>
              <div className="ml-2 sm:ml-3 flex-grow min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-white text-sm sm:text-base truncate">
                    {customer.name}
                  </span>
                  <span className="text-white text-sm sm:text-base whitespace-nowrap ml-2">
                    {customer.percentage}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white text-xs sm:text-sm truncate">
                    {customer.value}
                  </span>
                  <span className="text-white text-xs sm:text-sm whitespace-nowrap ml-2">
                    Per month
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {customers.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          No recent activity
        </div>
      )}
    </div>
  );
};

export default RecentActivity;