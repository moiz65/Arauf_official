import { useState } from "react";
import { FileText, Check } from "lucide-react";
import { Square, CheckSquare } from "lucide-react";
import reportsData from "../data/ReportData"; // Import your data

const DataTable = () => {
  const [selectedRows, setSelectedRows] = useState([]);

  const toggleRowSelection = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    setSelectedRows(
      selectedRows.length === reportsData.length
        ? []
        : reportsData.map((row) => row.id)
    );
  };

  const Checkbox = ({ checked, onCheckedChange }) => (
    <button
      type="button"
      onClick={onCheckedChange}
      className="focus:outline-none"
    >
      {checked ? <CheckSquare size={18} /> : <Square size={18} />}
    </button>
  );

  return (
    <div className="bg-white rounded-xl sm:rounded-[30px] shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold">Order Details</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            View and manage all order details in one place
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div className="relative min-w-full min-h-[350px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="text-center text-xs sm:text-sm font-normal text-black">
                <th className="pb-3 px-2 whitespace-nowrap">
                  <Checkbox
                    checked={selectedRows.length === reportsData.length}
                    onCheckedChange={toggleAllRows}
                  />
                </th>
                <th className="pb-3 px-2 whitespace-nowrap flex items-center gap-2 justify-center">
                  <FileText size={16} />
                  Order Id
                </th>
                <th className="pb-3 px-2 whitespace-nowrap">Date</th>
                <th className="pb-3 px-2 whitespace-nowrap">Particulars</th>
                <th className="pb-3 px-2 whitespace-nowrap">Rate</th>
                <th className="pb-3 px-2 whitespace-nowrap">Quantity</th>
                <th className="pb-3 px-2 whitespace-nowrap">MTR</th>
                <th className="pb-3 px-2 whitespace-nowrap">Credit</th>
                <th className="pb-3 px-2 whitespace-nowrap">Debit</th>
                <th className="pb-3 px-2 whitespace-nowrap">Balance</th>
                <th className="pb-3 px-2 whitespace-nowrap">Bills/CHQ</th>
                <th className="pb-3 px-2 whitespace-nowrap">Days</th>
                <th className="pb-3 px-2 whitespace-nowrap">Due Date</th>
              </tr>
            </thead>
            <tbody className="text-center divide-y divide-gray-100">
              {reportsData
                .filter((row) => row.orderId) // Only show rows with order details
                .map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Checkbox
                        checked={selectedRows.includes(row.id)}
                        onCheckedChange={() => toggleRowSelection(row.id)}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-900 whitespace-nowrap flex items-center gap-1 justify-center">
                      <Check size={14} className="text-green-500" />
                      {row.orderId}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.particulars || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.rate !== undefined && row.rate !== null ? Number(row.rate).toFixed(2) : "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.quantity || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.mtr || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.credit || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">{row.debit || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.balance || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.billsCHQ || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.days || "-"}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 whitespace-nowrap">{row.dueDate || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
