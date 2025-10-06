const { DynamoDBClient, TransactWriteItemsCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { CloudWatchClient, PutMetricDataCommand } = require('@aws-sdk/client-cloudwatch');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Processing referral sign-up:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body);
    const { userId, referrerId } = body;
    const timestamp = Date.now();

    // Calculate reward based on tiers
    const rewardAmount = calculateReward(referrerId);

    // Store referral with transaction
    await dynamodb.send(new TransactWriteItemsCommand({
      TransactItems: [
        {
          Put: {
            TableName: process.env.REFERRAL_TABLE,
            Item: {
              userId: { S: userId },
              referralTimestamp: { N: timestamp.toString() },
              referrerId: { S: referrerId },
              rewardAmount: { N: rewardAmount.toString() },
              status: { S: 'PENDING' },
            },
          },
        },
      ],
    }));

    // Send notification
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: 'New Referral Reward',
      Message: JSON.stringify({
        userId,
        referrerId,
        rewardAmount,
        timestamp,
      }),
    }));

    // Publish custom metric
    await cloudwatch.send(new PutMetricDataCommand({
      Namespace: 'ReferralProgram',
      MetricData: [
        {
          MetricName: 'RewardCalculated',
          Value: 1,
          Unit: 'Count',
          Timestamp: new Date(),
        },
      ],
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, rewardAmount }),
    };
  } catch (error) {
    console.error('Error processing referral:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

function calculateReward(referrerId) {
  // Implement reward tier logic
  const baseTier = parseFloat(process.env.BASE_TIER || '10');
  const silverTier = parseFloat(process.env.SILVER_TIER || '15');
  const goldTier = parseFloat(process.env.GOLD_TIER || '25');

  // Simplified logic - would be more complex in production
  return baseTier;
}