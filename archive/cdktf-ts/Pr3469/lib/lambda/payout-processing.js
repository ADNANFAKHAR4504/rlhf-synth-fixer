const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

const processedPayouts = new Set();

exports.handler = async (event) => {
  console.log('Processing monthly payouts:', JSON.stringify(event));

  const executionId = event.executionId || Date.now().toString();

  // Idempotency check
  if (processedPayouts.has(executionId)) {
    console.log('Payout already processed for execution:', executionId);
    return { statusCode: 200, message: 'Already processed' };
  }

  try {
    // Scan for pending rewards
    const scanResult = await dynamodb.send(new ScanCommand({
      TableName: process.env.REFERRAL_TABLE,
      FilterExpression: '#status = :pending',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':pending': { S: 'PENDING' } },
    }));

    const payoutReport = [];
    let totalPayout = 0;

    // Process each pending reward
    for (const item of scanResult.Items || []) {
      const userId = item.userId.S;
      const rewardAmount = parseFloat(item.rewardAmount.N);

      // Update status to PROCESSED
      await dynamodb.send(new UpdateItemCommand({
        TableName: process.env.REFERRAL_TABLE,
        Key: {
          userId: item.userId,
          referralTimestamp: item.referralTimestamp,
        },
        UpdateExpression: 'SET #status = :processed, processedAt = :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':processed': { S: 'PROCESSED' },
          ':now': { N: Date.now().toString() },
        },
      }));

      payoutReport.push({
        userId,
        rewardAmount,
        processedAt: new Date().toISOString(),
      });

      totalPayout += rewardAmount;
    }

    // Generate and upload report to S3
    const reportKey = `payouts/${new Date().getFullYear()}/${new Date().getMonth() + 1}/report-${executionId}.json`;
    await s3.send(new PutObjectCommand({
      Bucket: process.env.REPORTS_BUCKET,
      Key: reportKey,
      Body: JSON.stringify({
        executionId,
        processedAt: new Date().toISOString(),
        totalPayout,
        payouts: payoutReport,
      }),
      ContentType: 'application/json',
    }));

    // Send notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'Monthly Payout Processed',
      Message: JSON.stringify({
        executionId,
        totalPayout,
        payoutCount: payoutReport.length,
        reportLocation: reportKey,
      }),
    }));

    // Publish metrics
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'ReferralProgram',
      MetricData: [
        {
          MetricName: 'PayoutsProcessed',
          Value: payoutReport.length,
          Unit: 'Count',
          Timestamp: new Date(),
        },
        {
          MetricName: 'TotalPayoutAmount',
          Value: totalPayout,
          Unit: 'None',
          Timestamp: new Date(),
        },
      ],
    }));

    processedPayouts.add(executionId);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        executionId,
        payoutCount: payoutReport.length,
        totalPayout,
      }),
    };
  } catch (error) {
    console.error('Error processing payouts:', error);

    // Publish error metric
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'ReferralProgram',
      MetricData: [
        {
          MetricName: 'PayoutErrors',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    }));

    throw error;
  }
};