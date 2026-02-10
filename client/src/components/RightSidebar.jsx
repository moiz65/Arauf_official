import React from 'react';
import { ChevronRight } from 'lucide-react';

const RecentCard = ({ letter, name, value, percent, textColor = "text-green-500" }) => (
  <div className="bg-blue-50 rounded-lg p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-${letter === 'H' ? 'blue' : letter === 'S' ? 'cyan' : letter === 'N' ? 'green' : 'red'}-500 flex items-center justify-center text-white font-medium`}>
          {letter}
        </div>
        <div>
          <div>{name}</div>
          <div className="text-gray-600">{value}</div>
        </div>
      </div>
      <div>
        <div className={`${textColor}`}>{percent}</div>
        <div className="text-xs text-gray-500">Per month</div>
      </div>
    </div>
  </div>
);

const RightSidebar = () => {
  return (
    <div className="w-72 bg-white shadow-md p-4 hidden lg:block">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Recent</h3>
        <button className="text-gray-400">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <RecentCard letter="H" name="Zain" value="7,242" percent="+7.34%" />
        <RecentCard letter="S" name="Samsen" value="4,394" percent="-3.85%" textColor="text-red-500" />
        <RecentCard letter="N" name="Nikom" value="0.539" percent="-1.48%" textColor="text-red-500" />
        <RecentCard letter="P" name="Pasion" value="0.539" percent="-2.48%" textColor="text-red-500" />
      </div>
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Total Balance</h3>
          <button className="text-gray-400">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="text-3xl font-bold">Rs9,385</div>
        </div>
        
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
          </button>
          <button className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">-8%</span>
            <span className="text-sm text-gray-500">Today's Expenses</span>
          </div>
          <div className="text-2xl font-semibold">PKR 25,938.86</div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">New</span>
            <span className="text-sm text-gray-500">Upcoming Payments</span>
          </div>
          <div className="text-2xl font-semibold">PKR 6,947.00</div>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;