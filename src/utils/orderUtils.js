export const generateOrderId = () => {
  const timestamp = Date.now();
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `YULAA-${timestamp}-${randomNum}`;
};
