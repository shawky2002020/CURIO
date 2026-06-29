import { IOrder } from '../modules/cart/order.model.js';

/**
 * Generates the HTML content for a luxury-themed order confirmation email.
 */
export const getOrderConfirmationTemplate = (order: IOrder, clientUrl: string): string => {
  const itemsHtml = order.items
    .map(
      (item) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      <td style="padding: 12px 0; font-family: 'Outfit', 'Inter', sans-serif; font-size: 14px; color: #1f2937;">
        ${item.name} <span style="color: #6b7280; font-size: 12px;">x${item.quantity}</span>
      </td>
      <td style="padding: 12px 0; text-align: right; font-family: 'Outfit', 'Inter', sans-serif; font-size: 14px; color: #1f2937; font-weight: 600;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CURIO // Order Confirmation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafaf9; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafaf9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 2px solid #e7e5e4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <!-- Header -->
              <tr>
                <td style="background-color: #1c1917; padding: 40px; text-align: center;">
                  <span style="font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 700; color: #f59e0b; letter-spacing: 0.2em; text-transform: uppercase; display: block; margin-bottom: 8px;">ATELIER REGISTRY</span>
                  <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; color: #ffffff; margin: 0; font-style: italic;">Your curation is confirmed.</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="font-family: 'Outfit', sans-serif; font-size: 16px; line-height: 1.6; color: #44403c; margin: 0 0 24px 0;">
                    Hello ${order.shippingAddress.fullName},
                  </p>
                  <p style="font-family: 'Outfit', sans-serif; font-size: 15px; line-height: 1.6; color: #57534e; margin: 0 0 32px 0;">
                    Thank you for your order with CURIO. Your acquisitions have been recorded on our registry. We are preparing the package for dispatch.
                  </p>

                  <!-- Order Summary -->
                  <h3 style="font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; color: #1c1917; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e7e5e4; padding-bottom: 8px; margin: 0 0 16px 0;">Order Summary</h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                    ${itemsHtml}
                    <!-- Financials -->
                    <tr>
                      <td style="padding: 16px 0 8px 0; font-family: 'Outfit', sans-serif; font-size: 14px; color: #57534e;">Subtotal</td>
                      <td style="padding: 16px 0 8px 0; text-align: right; font-family: 'Outfit', sans-serif; font-size: 14px; color: #1c1917; font-weight: 600;">$${order.totals.subtotal.toFixed(2)}</td>
                    </tr>
                    ${
                      order.totals.discount > 0
                        ? `
                    <tr>
                      <td style="padding: 8px 0; font-family: 'Outfit', sans-serif; font-size: 14px; color: #10b981;">Atelier Discount (${order.promoCode})</td>
                      <td style="padding: 8px 0; text-align: right; font-family: 'Outfit', sans-serif; font-size: 14px; color: #10b981; font-weight: 600;">-$${order.totals.discount.toFixed(2)}</td>
                    </tr>
                    `
                        : ''
                    }
                    <tr>
                      <td style="padding: 8px 0; font-family: 'Outfit', sans-serif; font-size: 14px; color: #57534e;">Shipping</td>
                      <td style="padding: 8px 0; text-align: right; font-family: 'Outfit', sans-serif; font-size: 14px; color: #1c1917; font-weight: 600;">${
                        order.totals.shipping === 0 ? 'Free' : `$${order.totals.shipping.toFixed(2)}`
                      }</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; font-family: 'Outfit', sans-serif; font-size: 14px; color: #57534e;">Tax (10%)</td>
                      <td style="padding: 8px 0; text-align: right; font-family: 'Outfit', sans-serif; font-size: 14px; color: #1c1917; font-weight: 600;">$${order.totals.tax.toFixed(2)}</td>
                    </tr>
                    <tr style="border-top: 2px dashed #e7e5e4;">
                      <td style="padding: 16px 0 0 0; font-family: 'Outfit', sans-serif; font-size: 16px; font-weight: 700; color: #1c1917;">Grand Total</td>
                      <td style="padding: 16px 0 0 0; text-align: right; font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: #f59e0b;">$${order.totals.total.toFixed(2)}</td>
                    </tr>
                  </table>

                  <!-- Shipping details -->
                  <h3 style="font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; color: #1c1917; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 2px solid #e7e5e4; padding-bottom: 8px; margin: 0 0 16px 0;">Shipping Destination</h3>
                  <p style="font-family: 'Outfit', sans-serif; font-size: 14px; line-height: 1.5; color: #57534e; margin: 0 0 32px 0;">
                    <strong>${order.shippingAddress.fullName}</strong><br>
                    ${order.shippingAddress.address}<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}<br>
                    ${order.shippingAddress.country}
                  </p>

                  <!-- Call to Action -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px;">
                    <tr>
                      <td align="center">
                        <a href="${clientUrl}/orders/${order._id}" style="background-color: #1c1917; color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px; display: inline-block; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">Track Your Order Status</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafaf9; border-top: 1px solid #e7e5e4; padding: 30px; text-align: center;">
                  <p style="font-family: 'Outfit', sans-serif; font-size: 12px; color: #a8a29e; margin: 0;">
                    CURIO Inc. // Curated Marketplace & Design Atelier<br>
                    This is an automated notification. Please do not reply directly.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

/**
 * Generates the HTML content for an order status update email.
 */
export const getOrderStatusUpdateTemplate = (order: IOrder, clientUrl: string): string => {
  const statusColors = {
    pending: '#6b7280',
    processing: '#3b82f6',
    shipped: '#f59e0b',
    delivered: '#10b981',
    cancelled: '#ef4444',
  };

  const currentStatusColor = statusColors[order.status] || '#1c1917';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CURIO // Status Update</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=Playfair+Display:ital,wght@0,600;1,400&display=swap');
      </style>
    </head>
    <body style="margin: 0; padding: 0; background-color: #fafaf9; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fafaf9; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 2px solid #e7e5e4; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <!-- Header -->
              <tr>
                <td style="background-color: #1c1917; padding: 40px; text-align: center;">
                  <span style="font-family: 'Outfit', sans-serif; font-size: 12px; font-weight: 700; color: #f59e0b; letter-spacing: 0.2em; text-transform: uppercase; display: block; margin-bottom: 8px;">REGISTRY TRANSITION</span>
                  <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 600; color: #ffffff; margin: 0; font-style: italic;">Your order status has changed.</h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 40px;">
                  <p style="font-family: 'Outfit', sans-serif; font-size: 16px; line-height: 1.6; color: #44403c; margin: 0 0 24px 0;">
                    Hello ${order.shippingAddress.fullName},
                  </p>
                  <p style="font-family: 'Outfit', sans-serif; font-size: 15px; line-height: 1.6; color: #57534e; margin: 0 0 32px 0;">
                    We are writing to update you on the progress of your curations. Your order status has been advanced:
                  </p>

                  <!-- Status display -->
                  <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 24px; text-align: center; margin-bottom: 32px;">
                    <span style="font-family: 'Outfit', sans-serif; font-size: 12px; color: #78716c; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 6px;">ORDER REFERENCE // ${order._id.toString().toUpperCase()}</span>
                    <span style="font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; color: ${currentStatusColor}; text-transform: uppercase; letter-spacing: 0.05em;">
                      ${order.status}
                    </span>
                  </div>

                  <p style="font-family: 'Outfit', sans-serif; font-size: 14px; line-height: 1.6; color: #78716c; margin: 0 0 32px 0;">
                    ${
                      order.status === 'shipped'
                        ? 'Your items have departed from our atelier and are currently in transit. Use the link below to track delivery progress.'
                        : order.status === 'delivered'
                        ? 'Our logs show that your curations have been successfully delivered to the shipping destination.'
                        : order.status === 'cancelled'
                        ? 'This order has been cancelled and any reserved items have been restored to catalog inventory.'
                        : 'Your order is currently being processed and prepared by our atelier artisans.'
                    }
                  </p>

                  <!-- Call to Action -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0;">
                    <tr>
                      <td align="center">
                        <a href="${clientUrl}/orders/${order._id}" style="background-color: #1c1917; color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700; text-decoration: none; padding: 16px 32px; border-radius: 8px; display: inline-block; letter-spacing: 0.05em; text-transform: uppercase; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">Track Registry Details</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #fafaf9; border-top: 1px solid #e7e5e4; padding: 30px; text-align: center;">
                  <p style="font-family: 'Outfit', sans-serif; font-size: 12px; color: #a8a29e; margin: 0;">
                    CURIO Inc. // Curated Marketplace & Design Atelier<br>
                    This is an automated notification. Please do not reply directly.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
