const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client();

exports.handler = async (event) => {
    console.log('Generating receipt:', JSON.stringify(event));

    try {
        const { subscription_id, customer_id, transaction_id, amount, timestamp } = event.body || event;

        if (!subscription_id || !customer_id || !transaction_id) {
            throw new Error('Missing required fields');
        }

        // Generate PDF receipt (simplified version)
        const receiptContent = generateReceiptPDF({
            subscription_id,
            customer_id,
            transaction_id,
            amount,
            timestamp: timestamp || new Date().toISOString()
        });

        // Store receipt in S3
        const receiptKey = `receipts/${customer_id}/${subscription_id}/${transaction_id}.pdf`;

        const putParams = {
            Bucket: process.env.S3_BUCKET,
            Key: receiptKey,
            Body: receiptContent,
            ContentType: 'application/pdf',
            ServerSideEncryption: 'AES256',
            Metadata: {
                subscription_id: subscription_id,
                customer_id: customer_id,
                transaction_id: transaction_id
            }
        };

        await s3.send(new PutObjectCommand(putParams));

        return {
            statusCode: 200,
            body: {
                subscription_id,
                customer_id,
                transaction_id,
                receipt_key: receiptKey,
                receipt_url: `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${receiptKey}`,
                status: 'receipt_generated'
            }
        };

    } catch (error) {
        console.error('Receipt generation error:', error);
        throw error;
    }
};

function generateReceiptPDF(data) {
    // Simplified PDF generation
    // In production, use a PDF library like PDFKit
    const receiptText = `
PAYMENT RECEIPT
=====================================
Subscription ID: ${data.subscription_id}
Customer ID: ${data.customer_id}
Transaction ID: ${data.transaction_id}
Amount: $${data.amount}
Date: ${data.timestamp}
Status: PAID
=====================================
Thank you for your payment!
    `;

    return Buffer.from(receiptText, 'utf-8');
}
