import type { CartItem } from '@/types/cart';
import { Linking } from 'react-native';
const ADMIN_PHONE = '918527361011';
export const openWhatsAppChat = async (message?: string) => {
  try {
    const encodedMessage = message ? encodeURIComponent(message) : '';
    const url = message
      ? `https://wa.me/${ADMIN_PHONE}?text=${encodedMessage}`
      : `https://wa.me/${ADMIN_PHONE}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error('WhatsApp not supported');
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error('Failed to open WhatsApp:', error);
    throw error;
  }
};
export const formatBookingMessage = (data: {
  jobId: string;
  name: string;
  phone: string;
  deviceType: string;
  model?: string;
  issue: string;
  service: string;
}) => {
  return `🔧 *New Repair Booking*
📋 Job ID: ${data.jobId}
👤 Name: ${data.name}
📱 Phone: ${data.phone}
📲 Device: ${data.deviceType}${data.model ? ` (${data.model})` : ''}
🔧 Service: ${data.service}
⚠️ Issue: ${data.issue}
Please confirm receipt.`;
};
export const sendCartToWhatsApp = async (cart: CartItem[], total: number) => {
  try {
    if (!cart.length) return;
    const itemsText = cart
      .map(
        (item) =>
          `• ${item.product.name} × ${item.quantity} = ₹${
            item.product.price * item.quantity
          }`
      )
      .join('\n');
    const message = `
🛒 *New Product Order – TechPhono*
${itemsText}
💰 *Total:* ₹${total}
📞 Please contact me regarding this order.
`;
    const url = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(
      message
    )}`;
    
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      throw new Error('WhatsApp not supported');
    }
    await Linking.openURL(url);
  } catch (error) {
    console.error('Failed to send cart to WhatsApp:', error);
    throw error;
  }
};