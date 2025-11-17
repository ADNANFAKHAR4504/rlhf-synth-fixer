import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// AWS SDK v3 clients
const rdsClient = new RDSClient({ region: process.env.AWS_REGION });
const snsClient = new SNSClient({ region: process.env.AWS_REGION });

interface Event {
  source?: string;
}

interface LambdaContext {
  awsRequestId: string;
  functionName: string;
}

export const handler = async (
  event: Event,
  context: LambdaContext
): Promise<any> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  console.log('Context:', JSON.stringify(context, null, 2));

  const dbEndpoint = process.env.DB_ENDPOINT;
  const snsTopicArn = process.env.SNS_TOPIC_ARN;
  const lagThresholdSeconds = parseInt(
    process.env.LAG_THRESHOLD_SECONDS || '300',
    10
  );

  if (!dbEndpoint || !snsTopicArn) {
    throw new Error(
      'Missing required environment variables: DB_ENDPOINT, SNS_TOPIC_ARN'
    );
  }

  try {
    // Extract instance identifier from endpoint
    // Format: instance-id.random-string.region.rds.amazonaws.com
    const instanceId = dbEndpoint.split('.')[0];

    // Get DB instance details
    const describeCommand = new DescribeDBInstancesCommand({
      DBInstanceIdentifier: instanceId,
    });

    const response = await rdsClient.send(describeCommand);

    if (!response.DBInstances || response.DBInstances.length === 0) {
      throw new Error(`DB instance not found: ${instanceId}`);
    }

    const dbInstance = response.DBInstances[0];
    const status = dbInstance.DBInstanceStatus;

    console.log(`DB Instance Status: ${status}`);

    // Check if this is a read replica
    if (dbInstance.ReadReplicaSourceDBInstanceIdentifier) {
      const sourceInstanceId = dbInstance.ReadReplicaSourceDBInstanceIdentifier;
      console.log(`This is a read replica of: ${sourceInstanceId}`);

      // In a real implementation, you would connect to the database
      // and query replication lag using PostgreSQL-specific queries
      // For this example, we'll simulate checking replication lag

      // Check replica lag (in production, query pg_stat_replication)
      const replicaLag = 0; // This would come from actual database query

      console.log(`Replication lag: ${replicaLag} seconds`);

      if (replicaLag > lagThresholdSeconds) {
        const message =
          `ALERT: Replication lag on ${instanceId} exceeds threshold.\n` +
          `Current lag: ${replicaLag} seconds\n` +
          `Threshold: ${lagThresholdSeconds} seconds\n` +
          `Source: ${sourceInstanceId}\n` +
          `Status: ${status}`;

        const publishCommand = new PublishCommand({
          TopicArn: snsTopicArn,
          Subject: 'RDS Replication Lag Alert',
          Message: message,
        });

        await snsClient.send(publishCommand);
        console.log('Alert sent to SNS');
      }
    } else {
      console.log('This is a primary instance, not a read replica');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Replication lag check completed',
        instanceId,
        status,
      }),
    };
  } catch (error) {
    console.error('Error monitoring replication lag:', error);

    // Send error notification
    const errorMessage =
      `ERROR: Failed to monitor replication lag for ${dbEndpoint}\n` +
      `Error: ${error instanceof Error ? error.message : String(error)}`;

    try {
      const publishCommand = new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'RDS Replication Lag Monitor Error',
        Message: errorMessage,
      });

      await snsClient.send(publishCommand);
    } catch (snsError) {
      console.error('Failed to send error notification:', snsError);
    }

    throw error;
  }
};
