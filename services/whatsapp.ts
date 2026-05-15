import type { CartItem } from '@/types/cart';
import { SecurityConfig } from '@/config/security';
import { Linking } from 'react-native';

const getAdminPhone = (): string => SecurityConfig.whatsappNumber.replace(/\D/g, '');

const buildWhatsAppUrls = (phone: string, message?: string) => {
  const encodedMessage = message ? encodeURIComponent(message) : '';
  const appUrl = message
    ? `whatsapp://send?phone=${phone}&text=${encodedMessage}`
    : `whatsapp://send?phone=${phone}`;
  const webUrl = message
    ? `https://wa.me/${phone}?text=${encodedMessage}`
    : `https://wa.me/${phone}`;

  return { appUrl, webUrl };
};

const openWhatsAppUrl = async (phone: string, message?: string) => {
  const { appUrl, webUrl } = buildWhatsAppUrls(phone, message);

  try {
    await Linking.openURL(appUrl);
  } catch {
    await Linking.openURL(webUrl);
  }
};

export const openWhatsAppChat = async (message?: string) => {
  try {
    const adminPhone = getAdminPhone();
    if (!adminPhone) {
      throw new Error('WhatsApp contact number is not configured');
    }

    await openWhatsAppUrl(adminPhone, message);
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
    const adminPhone = getAdminPhone();
    if (!adminPhone) {
      throw new Error('WhatsApp contact number is not configured');
    }

    await openWhatsAppUrl(adminPhone, message);
  } catch (error) {
    console.error('Failed to send cart to WhatsApp:', error);
    throw error;
  }
};