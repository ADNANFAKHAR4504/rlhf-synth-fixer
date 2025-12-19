const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const ses = new SESClient();

exports.handler = async (event) => {
    console.log('Sending email:', JSON.stringify(event));

    try {
        const { subscription_id, customer_id, transaction_id, receipt_key, receipt_url } = event.body || event;

        if (!customer_id || !transaction_id) {
            throw new Error('Missing required fields');
        }

        // In production, retrieve customer email from DynamoDB
        const customerEmail = `customer-${customer_id}@example.com`;

        const emailParams = {
            Source: process.env.SENDER_EMAIL,
            Destination: {
                ToAddresses: [customerEmail]
            },
            Message: {
                Subject: {
                    Data: 'Payment Receipt - Subscription Renewal',
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: generateEmailHTML({
                            subscription_id,
                            customer_id,
                            transaction_id,
                            receipt_url
                        }),
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: generateEmailText({
                            subscription_id,
                            customer_id,
                            transaction_id,
                            receipt_url
                        }),
                        Charset: 'UTF-8'
                    }
                }
            },
            ConfigurationSetName: process.env.SES_CONFIGURATION_SET
        };

        const result = await ses.send(new SendEmailCommand(emailParams));

        return {
            statusCode: 200,
            body: {
                subscription_id,
                customer_id,
                transaction_id,
                email_sent: true,
                message_id: result.MessageId,
                status: 'email_sent'
            }
        };

    } catch (error) {
        console.error('Email sending error:', error);
        throw error;
    }
};

function generateEmailHTML(data) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .button { display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Payment Confirmation</h1>
        </div>
        <div class="content">
            <h2>Thank you for your payment!</h2>
            <p>Your subscription has been successfully renewed.</p>
            <p><strong>Transaction Details:</strong></p>
            <ul>
                <li>Subscription ID: ${data.subscription_id}</li>
                <li>Transaction ID: ${data.transaction_id}</li>
                <li>Customer ID: ${data.customer_id}</li>
            </ul>
            <p>You can download your receipt using the link below:</p>
            <p><a href="${data.receipt_url}" class="button">Download Receipt</a></p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
    `;
}

function generateEmailText(data) {
    return `
Payment Confirmation

Thank you for your payment! Your subscription has been successfully renewed.

Transaction Details:
- Subscription ID: ${data.subscription_id}
- Transaction ID: ${data.transaction_id}
- Customer ID: ${data.customer_id}

You can download your receipt here: ${data.receipt_url}

This is an automated message. Please do not reply to this email.
    `;
}
