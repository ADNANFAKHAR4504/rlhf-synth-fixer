const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);
const snsClient = new SNSClient({});

const LOYALTY_TABLE = process.env.LOYALTY_TABLE_NAME;
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;

// Tier thresholds
const TIERS = {
  BRONZE: { minPoints: 0, name: 'BRONZE' },
  SILVER: { minPoints: 1000, name: 'SILVER' },
  GOLD: { minPoints: 5000, name: 'GOLD' },
  PLATINUM: { minPoints: 10000, name: 'PLATINUM' },
};

function calculateTier(totalPoints) {
  if (totalPoints >= TIERS.PLATINUM.minPoints) return 'PLATINUM';
  if (totalPoints >= TIERS.GOLD.minPoints) return 'GOLD';
  if (totalPoints >= TIERS.SILVER.minPoints) return 'SILVER';
  return 'BRONZE';
}

exports.handler = async (event) => {
  console.log('Processing DynamoDB Stream event:', JSON.stringify(event));

  try {
    for (const record of event.Records) {
      if (record.eventName === 'MODIFY' || record.eventName === 'INSERT') {
        const newImage = unmarshall(record.dynamodb.NewImage);
        const oldImage = record.dynamodb.OldImage
          ? unmarshall(record.dynamodb.OldImage)
          : {};

        // Only process member records (not transaction records)
        if (newImage.memberId && !newImage.memberId.includes('#TRANSACTION#')) {
          const currentPoints = newImage.totalPoints || 0;
          const currentTier = newImage.tier || 'BRONZE';
          const newTier = calculateTier(currentPoints);

          // Check for tier upgrade
          if (newTier !== currentTier) {
            console.log(
              `Tier upgrade detected for ${newImage.memberId}: ${currentTier} -> ${newTier}`
            );

            // Update member tier
            await docClient.send(
              new UpdateCommand({
                TableName: LOYALTY_TABLE,
                Key: { memberId: newImage.memberId },
                UpdateExpression: 'SET tier = :newTier, tierUpgradeDate = :timestamp',
                ExpressionAttributeValues: {
                  ':newTier': newTier,
                  ':timestamp': Date.now(),
                },
              })
            );

            // Send tier upgrade notification
            const message = `Congratulations! You've been upgraded to ${newTier} tier with ${currentPoints} points!`;
            await snsClient.send(
              new PublishCommand({
                TopicArn: SNS_TOPIC_ARN,
                Subject: `Loyalty Tier Upgrade to ${newTier}`,
                Message: message,
              })
            );

            console.log(`Tier upgrade notification sent for ${newImage.memberId}`);
          }
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Stream processing completed' }),
    };
  } catch (error) {
    console.error('Error processing stream:', error);
    throw error;
  }
};
