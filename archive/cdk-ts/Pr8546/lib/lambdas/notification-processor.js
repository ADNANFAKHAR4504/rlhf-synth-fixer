const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient();

exports.handler = async (event) => {
  console.log('Processing notifications:', JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    const message = JSON.parse(record.body);

    // Process different types of notifications
    switch (message.type) {
      case 'appointment_reminder':
        await sns.send(new PublishCommand({
          TopicArn: process.env.NOTIFICATIONS_TOPIC,
          Message: JSON.stringify({
            type: 'reminder',
            patientId: message.patientId,
            appointmentDate: message.appointmentDate,
            message: 'Appointment reminder'
          }),
          Subject: 'Appointment Reminder'
        }));
        break;

      case 'test_results':
        await sns.send(new PublishCommand({
          TopicArn: process.env.NOTIFICATIONS_TOPIC,
          Message: JSON.stringify({
            type: 'results',
            patientId: message.patientId,
            results: message.results,
            message: 'Test results available'
          }),
          Subject: 'Test Results Available'
        }));
        break;

      default:
        console.log('Unknown notification type:', message.type);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Notifications processed successfully' })
  };
};
