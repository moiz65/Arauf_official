import React from 'react';

const SummaryCard = ({ title, amount, currency, indicator }) => {
  const getIndicatorClasses = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-500';
      case 'red':
        return 'bg-red-100 text-red-500';
      case 'green':
        return 'bg-green-100 text-green-500';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-500';
      default:
        return 'bg-blue-100 text-blue-500';
    }
  };

  return (
    <div className="bg-white rounded-xl sm:rounded-[30px] shadow-sm p-3 sm:p-4 border border-gray-100 w-full">
      <div className="flex justify-between items-start mb-1 sm:mb-2">
        <div className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">
          {title}
        </div>
        {indicator && (
          <div className={`text-[10px] sm:text-xs px-2 py-1 rounded-md ${getIndicatorClasses(indicator.color)} whitespace-nowrap`}>
            {indicator.text}
          </div>
        )} 
      </div>
      <div className="flex items-end gap-1">
        <span className="text-base sm:text-lg font-semibold">{currency}</span>
        <span className="text-xl sm:text-2xl font-bold">
          {typeof amount === 'number' ? amount.toLocaleString() : amount}
        </span>
      </div>
    </div>
  );
};

export default SummaryCard;