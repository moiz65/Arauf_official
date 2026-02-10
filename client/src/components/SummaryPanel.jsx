import { CheckCircle } from "lucide-react";

const paymentHistory = [
  {
    id: "2020-04-0006",
    type: "Deposit",
    date: "Oct 24, 2019",
    amount: 300,
    status: "paid"
  },
  {
    id: "partial-1",
    type: "Partial Payment",
    date: "Oct 26, 2019", 
    amount: 400,
    status: "paid"
  },
  {
    id: "partial-2",
    type: "Partial Payment",
    date: "Oct 27, 2019",
    amount: 2230,
    status: "paid"
  }
];

const SummaryPanel = () => {
  return (
    <div className="w-80 bg-white border-l border-gray-300 p-6">
      {/* Paid Status */}
      <div className="mb-6">
        <div className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-center font-medium">
          <CheckCircle className="h-4 w-4 inline mr-2" />
          Paid
        </div>
      </div>

      {/* Summary */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Total</span>
          <span className="font-bold text-gray-900">3,030 Incl. VAT</span>
        </div>
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        {paymentHistory.map((payment) => (
          <div key={payment.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{payment.type}</p>
                  <p className="text-xs text-gray-600 mt-1">No. {payment.id}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Date</span>
                <span className="text-gray-900">{payment.date}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount</span>
                <span className="text-gray-900 font-medium">{payment.amount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Remaining Amount */}
      <div className="border border-gray-200 rounded-lg p-4 mt-6 bg-gray-100 shadow-sm">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Remaining Amount</span>
          <span className="font-bold text-gray-900">100 Incl. VAT</span>
        </div>
      </div>
    </div>
  );
};
export default SummaryPanel;