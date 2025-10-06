const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, TransactWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const LOYALTY_TABLE = process.env.LOYALTY_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Tier thresholds
const TIERS = {
  BRONZE: { minPoints: 0, multiplier: 1.0 },
  SILVER: { minPoints: 1000, multiplier: 1.25 },
  GOLD: { minPoints: 5000, multiplier: 1.5 },
  PLATINUM: { minPoints: 10000, multiplier: 2.0 },
};

function calculateTier(totalPoints) {
  if (totalPoints >= TIERS.PLATINUM.minPoints) return 'PLATINUM';
  if (totalPoints >= TIERS.GOLD.minPoints) return 'GOLD';
  if (totalPoints >= TIERS.SILVER.minPoints) return 'SILVER';
  return 'BRONZE';
}

exports.handler = async (event) => {
  console.log('Processing point calculation:', JSON.stringify(event));

  try {
    const body = JSON.parse(event.body || '{}');
    const { memberId, transactionAmount, transactionType } = body;

    if (!memberId || !transactionAmount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Calculate base points (1 point per dollar)
    const basePoints = Math.floor(transactionAmount);

    // Get current member data
    const timestamp = Date.now();
    const currentTier = 'BRONZE'; // Default for new members
    const tierMultiplier = TIERS[currentTier].multiplier;
    const pointsEarned = Math.floor(basePoints * tierMultiplier);

    // Use transaction to atomically update points
    const transactParams = {
      TransactItems: [
        {
          Update: {
            TableName: LOYALTY_TABLE,
            Key: { memberId },
            UpdateExpression:
              'SET totalPoints = if_not_exists(totalPoints, :zero) + :points, ' +
              'lastTransactionDate = :timestamp, ' +
              'tier = :tier',
            ExpressionAttributeValues: {
              ':zero': 0,
              ':points': pointsEarned,
              ':timestamp': timestamp,
              ':tier': currentTier,
            },
          },
        },
        {
          Put: {
            TableName: LOYALTY_TABLE,
            Item: {
              memberId: `${memberId}#TRANSACTION#${timestamp}`,
              transactionType,
              pointsEarned,
              transactionAmount,
              timestamp,
            },
          },
        },
      ],
    };

    await docClient.send(new TransactWriteCommand(transactParams));

    // Send notification
    const message = `Points earned: ${pointsEarned}. Transaction: $${transactionAmount}`;
    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: 'Loyalty Points Earned',
        Message: message,
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        pointsEarned,
        tier: currentTier,
        message,
      }),
    };
  } catch (error) {
    console.error('Error processing transaction:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
