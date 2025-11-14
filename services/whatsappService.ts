// services/whatsappService.ts

// This is a simulated service. In a real application, this would
// interact with a backend service connected to the WhatsApp Business API.

import { WhatsappConnectionState } from "../types.ts";

/**
 * Sends a notification message.
 * @param connectionState The current connection state from the context.
 * @param message The message to send.
 */
export const sendWhatsappNotification = async (
  connectionState: WhatsappConnectionState,
  message: string
): Promise<void> => {
  if (connectionState !== 'connected') {
    console.warn('WhatsApp not connected. Notification not sent.');
    return;
  }

  // Simulate sending the message
  console.log(`--- SIMULATING WHATSAPP NOTIFICATION ---`);
  console.log(`TO: Linked Device`);
  console.log(`MESSAGE: ${message}`);
  console.log(`----------------------------------------`);

  // In a real app, you would have an API call here.
  // await fetch('/api/send-whatsapp', { method: 'POST', body: JSON.stringify({ message }) });
  
  return Promise.resolve();
};