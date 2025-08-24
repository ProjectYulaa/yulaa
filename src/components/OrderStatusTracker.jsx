const OrderStatusTracker = ({ status }) => {
  const steps = ['Order Placed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Order Status</h3>
      <div className="flex space-x-4 overflow-x-auto">
        {steps.map((step, index) => (
          <div key={index} className={`text-center min-w-[100px] ${step === status ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
            <div className={`w-3 h-3 mx-auto rounded-full mb-1 ${step === status ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
            <p>{step}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default OrderStatusTracker;
