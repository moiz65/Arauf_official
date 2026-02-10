const InvoiceDetails = () => {
  const invoiceData = {
    items: [
      { id: 1, name: "Product Name", quantity: 6.246, weight: 894, rate: 147, vat: 911.547, salesTax: 164.078, additional: 0, final: 1075.625 },
      { id: 2, name: "Product Name", quantity: 6.246, weight: 894, rate: 147, vat: 911.547, salesTax: 164.078, additional: 0, final: 1075.625 },
      { id: 3, name: "Product Name", quantity: 6.246, weight: 894, rate: 147, vat: 911.547, salesTax: 164.078, additional: 0, final: 1075.625 },
      { id: 4, name: "Product Name", quantity: 6.246, weight: 894, rate: 147, vat: 911.547, salesTax: 164.078, additional: 0, final: 1075.625 },
      { id: 5, name: "Product Name", quantity: 6.246, weight: 894, rate: 147, vat: 911.547, salesTax: 164.078, additional: 0, final: 1075.625 },
    ]
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Company Info Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* From */}
        <div className="p-6 bg-orange-50 border border-orange-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">R</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">A Rauf Brother Textile</h3>
              <p className="text-sm text-gray-600 mt-1">
                Room No.206 Floor Saleha Chamber, Plot No. B-91C-1 Site, Karachi<br />
                contact@araufbrothe.com<br />
                S. T. Reg No: 3252255608541<br />
                Telephone No: 021-36404043<br />
                NTN No: 7755286214-8
              </p>
            </div>
          </div>
          <div className="mt-4 text-right">
            <p className="text-xs text-gray-500">#2025-02-03</p>
          </div>
        </div>

        {/* Bill Info */}
        <div className="space-y-4">
          <div className="p-4 bg-blue-600 text-white rounded-lg shadow-sm">
            <div className="space-y-2">
              <div>
                <p className="text-sm opacity-90">Bill Date</p>
                <p className="font-semibold">03/05/2020</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Delivery Date</p>
                <p className="font-semibold">03/05/2020</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Terms of Payment</p>
                <p className="font-semibold">Within 15 days</p>
              </div>
              <div>
                <p className="text-sm opacity-90">Payment Days / Due Date</p>
                <p className="font-semibold">30 days / 05/18/2020</p>
              </div>
            </div>
          </div>


        </div>
      </div>

      {/* Total Amount */}
      <div className="text-center py-4 bg-white rounded-lg shadow-sm">
        <p className="text-sm text-gray-600">Total Amount</p>
        <p className="text-3xl font-bold text-gray-900">PKR 1,075,625.46</p>
      </div>

      {/* Note */}
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
        <p className="text-sm font-medium text-gray-600 mb-2">Note</p>
        <p className="text-sm text-gray-900">
          This is a custom message that might be relevant to the customer. It can span up to three or four rows. It can span up to three or four rows.
        </p>
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">No.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Description of Goods</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Quantity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Net Weight in KG</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">V&ST</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Rate of Sales Tax IKA</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount of Additional Sales Tax</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Final Amount Including Sales Tax</th>
            </tr>
          </thead>
          <tbody>
            {invoiceData.items.map((item, index) => (
              <tr key={item.id} className="border-t border-gray-300">
                <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.quantity.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.weight}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.rate}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.vat.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.salesTax.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{item.additional}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.final.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="mt-4 flex justify-end">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total H.T</span>
              <span className="font-medium text-gray-900">5,000,523.46</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Rate</span>
              <span className="font-medium text-gray-900">147</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total VAT</span>
              <span className="font-medium text-gray-900">0</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-300 pt-2">
              <span className="text-gray-900">Total Price</span>
              <span className="text-gray-900">1,075,625.46</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="pt-6 border-t border-gray-300 bg-white p-4 rounded-lg shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-2">Terms & Conditions</h4>
  <p className="text-sm text-gray-600">Payment must be made within the specified Payment Days from invoice date.</p>
      </div>
    </div>
  );
};

export default InvoiceDetails;