export const notifySiakadWebhook = async () => {
  try {
    const siakadUrl = process.env.NEXT_PUBLIC_SIAKAD_URL || 'https://siakad.markazarabiyah.site';
    const webhookUrl = `${siakadUrl}/api/webhook/revalidate-santri`;
    
    // Fire and forget, so we don't return the promise chain
    fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer markaz-arabiyah-revalidate-2026-!@#$'
      }
    }).catch(err => {
      console.error("Failed to notify Siakad Webhook:", err);
    });
  } catch (error) {
    console.error("Error setting up Siakad Webhook request:", error);
  }
};
