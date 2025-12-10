async function sendSlackNotification(monitor, statusChange) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return; // Silently fail if not configured

  const emoji = statusChange === 'DOWN' ? '🔴' : '🟢';
  const color = statusChange === 'DOWN' ? '#ff0000' : '#00ff00';
  const statusText = statusChange === 'DOWN' ? 'is DOWN' : 'is back UP';

  const message = {
    text: `${emoji} Monitor Alert: ${monitor.name} ${statusText}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${monitor.name}* ${statusText}`
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*URL:*\n${monitor.url}`
          },
          {
            type: 'mrkdwn',
            text: `*Status Code:*\n${monitor.statusCode || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Latency:*\n${monitor.latency || 0}ms`
          },
          {
            type: 'mrkdwn',
            text: `*Time:*\n${new Date().toLocaleString()}`
          }
        ]
      }
    ],
    attachments: [
      {
        color: color,
        footer: 'Weble Uptime Monitor'
      }
    ]
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  } catch (error) {
    console.error('Failed to send Slack notification:', error.message);
  }
}

module.exports = { sendSlackNotification };

