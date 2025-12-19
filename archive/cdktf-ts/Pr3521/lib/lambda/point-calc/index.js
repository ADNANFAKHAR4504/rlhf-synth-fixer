const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, TransactWriteCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const LOYALTY_TABLE = process.env.LOYALTY_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Tier thresholds and multipliers
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

    // Get current member data (using MEMBER_PROFILE as the transactionId for profile records)
    const getMemberCommand = new GetCommand({
      TableName: LOYALTY_TABLE,
      Key: {
        memberId,
        transactionId: 'MEMBER_PROFILE'
      },
    });

    const memberData = await docClient.send(getMemberCommand);
    const currentPoints = memberData.Item?.totalPoints || 0;
    const currentTier = calculateTier(currentPoints);

    // Calculate base points (0.1 points per dollar for 10% earning rate)
    const basePoints = Math.floor(transactionAmount * 0.1);

    // Apply tier multiplier
    const tierMultiplier = TIERS[currentTier].multiplier;
    const pointsEarned = Math.floor(basePoints * tierMultiplier);
    const newTotalPoints = currentPoints + pointsEarned;
    const newTier = calculateTier(newTotalPoints);

    // Generate unique transaction ID
    const timestamp = Date.now();
    const transactionId = `TXN-${memberId}-${timestamp}`;

    // Use transaction to atomically update points
    const transactParams = {
      TransactItems: [
        {
          Update: {
            TableName: LOYALTY_TABLE,
            Key: {
              memberId,
              transactionId: 'MEMBER_PROFILE'
            },
            UpdateExpression:
              'SET totalPoints = :newPoints, ' +
              'tier = :newTier, ' +
              'lastTransactionDate = :timestamp',
            ExpressionAttributeValues: {
              ':newPoints': newTotalPoints,
              ':newTier': newTier,
              ':timestamp': timestamp,
            },
          },
        },
        {
          Put: {
            TableName: LOYALTY_TABLE,
            Item: {
              memberId,
              transactionId,
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
    const message = `Points earned: ${pointsEarned}. New total: ${newTotalPoints}`;
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
        totalPoints: newTotalPoints,
        tier: newTier,
        transactionId,
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
