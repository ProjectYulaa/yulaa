import React from 'react';

const OrderSummaryCard = ({ data }) => {
  return (
    <div className="border p-4 rounded-lg shadow-sm bg-gray-50">
      <h3 className="text-xl font-semibold mb-2">Order Summary</h3>
      
      <p><strong>Customer:</strong> {data?.user?.name || 'N/A'}</p>
      <p><strong>Email:</strong> {data?.user?.email || 'N/A'}</p>
      <p><strong>Payment Method:</strong> {data?.paymentMethod || 'N/A'}</p>

      <h4 className="mt-4 font-medium">Items:</h4>
      <ul className="list-disc ml-6">
        {data?.cartItems?.length > 0 ? (
          data.cartItems.map((item, idx) => (
            <li key={idx}>
              {item?.name || 'Unnamed Product'} – ₹{item?.price || 0} × {item?.quantity || 1}
            </li>
          ))
        ) : (
          <li>No items</li>
        )}
      </ul>

      <p className="mt-4 font-bold">Total: ₹{data?.total || 0}</p>
    </div>
  );
};

export default OrderSummaryCard;
