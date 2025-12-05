import {
  EC2Client,
  DescribeInstancesCommand,
  StopInstancesCommand,
} from '@aws-sdk/client-ec2';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const ec2Client = new EC2Client({
  region: process.env.AWS_REGION || 'us-east-1',
});
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface LambdaEvent {
  action: string;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  console.log('Stop Instances Lambda triggered', JSON.stringify(event));

  const stateTableName = process.env.STATE_TABLE_NAME;
  if (!stateTableName) {
    throw new Error('STATE_TABLE_NAME environment variable not set');
  }

  try {
    // Find all instances tagged with Environment=development or Environment=staging
    const describeCommand = new DescribeInstancesCommand({
      Filters: [
        {
          Name: 'tag:Environment',
          Values: ['development', 'staging'],
        },
        {
          Name: 'instance-state-name',
          Values: ['running'],
        },
      ],
    });

    const describeResult = await ec2Client.send(describeCommand);
    const instanceIds: string[] = [];

    if (describeResult.Reservations) {
      for (const reservation of describeResult.Reservations) {
        if (reservation.Instances) {
          for (const instance of reservation.Instances) {
            if (instance.InstanceId) {
              instanceIds.push(instance.InstanceId);
            }
          }
        }
      }
    }

    console.log(`Found ${instanceIds.length} instances to stop:`, instanceIds);

    if (instanceIds.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: 'No running instances found to stop',
          instancesStopped: 0,
        }),
      };
    }

    // Stop instances
    const stopCommand = new StopInstancesCommand({
      InstanceIds: instanceIds,
    });

    await ec2Client.send(stopCommand);
    console.log(`Successfully stopped ${instanceIds.length} instances`);

    // Record state change in DynamoDB
    const timestamp = Date.now();
    for (const instanceId of instanceIds) {
      const putCommand = new PutItemCommand({
        TableName: stateTableName,
        Item: {
          instanceId: { S: instanceId },
          timestamp: { N: timestamp.toString() },
          action: { S: 'stop' },
          status: { S: 'success' },
          expiresAt: {
            N: Math.floor(
              (timestamp + 30 * 24 * 60 * 60 * 1000) / 1000
            ).toString(),
          },
        },
      });

      await dynamoClient.send(putCommand);
    }

    console.log('State changes recorded in DynamoDB');

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Instances stopped successfully',
        instancesStopped: instanceIds.length,
        instanceIds: instanceIds,
      }),
    };
  } catch (error) {
    console.error('Error stopping instances:', error);
    throw error;
  }
};
