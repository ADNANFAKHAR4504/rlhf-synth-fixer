/**
 * payment-notifier Lambda function
 *
 * Sends payment notifications via SNS for successful or failed transactions.
 */
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const snsClient = new SNSClient({ region: 'ap-southeast-1' });
const snsTopicArn = process.env.SNS_TOPIC_ARN;

/**
 * Send notification via SNS
 */
async function sendNotification(notification) {
  const message = {
    default: JSON.stringify(notification, null, 2),
    email: formatEmailMessage(notification),
  };

  const publishCommand = new PublishCommand({
    TopicArn: snsTopicArn,
    Subject: `Payment Notification: ${notification.status}`,
    Message: JSON.stringify(message),
    MessageStructure: 'json',
  });

  const result = await snsClient.send(publishCommand);
  return result.MessageId;
}

/**
 * Format email message
 */
function formatEmailMessage(notification) {
  let message = `Payment Notification\n\n`;
  message += `Transaction ID: ${notification.transactionId}\n`;
  message += `Status: ${notification.status}\n`;
  message += `Amount: ${notification.amount} ${notification.currency}\n`;
  message += `Customer Email: ${notification.customerEmail}\n`;
  message += `Timestamp: ${notification.timestamp}\n\n`;

  if (notification.status === 'SUCCESS') {
    message += `The payment has been processed successfully.\n`;
  } else if (notification.status === 'FAILED') {
    message += `The payment processing has failed.\n`;
    message += `Reason: ${notification.failureReason || 'Unknown'}\n`;
  }

  return message;
}

/**
 * Lambda handler
 */
exports.handler = async (event) => {
  console.log('Received payment notification request:', JSON.stringify(event, null, 2));

  try {
    // Parse notification data
    const notification = typeof event === 'string' ? JSON.parse(event) : event;

    // Validate required fields
    if (!notification.transactionId || !notification.status) {
      throw new Error('Missing required fields: transactionId or status');
    }

    // Send notification
    const messageId = await sendNotification(notification);

    console.log('Notification sent successfully:', messageId);

    return {
      success: true,
      message: 'Notification sent successfully',
      messageId,
      transactionId: notification.transactionId,
    };

  } catch (error) {
    console.error('Error sending notification:', error);

    return {
      success: false,
      message: 'Failed to send notification',
      error: error.message,
    };
  }
};
