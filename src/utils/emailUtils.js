import emailjs from 'emailjs-com';

export const sendOrderConfirmationEmail = async (orderData) => {
  const templateParams = {
    to_email: orderData.email,
    order_id: orderData.orderId,
    user_name: orderData.address.name,
    order_summary: JSON.stringify(orderData.items.map(item => item.name).join(', ')),
    total_amount: orderData.total,
  };

  await emailjs.send('your_service_id', 'your_template_id', templateParams, 'your_user_id');
};
