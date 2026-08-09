export const notifySiakadWebhook = async () => {
  try {
    const siakadUrl = process.env.NEXT_PUBLIC_SIAKAD_URL || 'https://siakad.markazarabiyah.site';
    const webhookUrl = `${siakadUrl}/api/webhooks/ppdb`;
    
    // Await the fetch so that serverless process doesn't exit prematurely
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.PPDB_WEBHOOK_SECRET || 'rahasia-webhook-siakad',
        'Authorization': 'Bearer markaz-arabiyah-revalidate-2026-!@#$' // Untuk backward compatibility jika perlu
      },
      body: JSON.stringify({ action: 'sync_all' })
    }).catch(err => {
      console.error("Failed to notify Siakad Webhook:", err);
    });
  } catch (error) {
    console.error("Error setting up Siakad Webhook request:", error);
  }
};
