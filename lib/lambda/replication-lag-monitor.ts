import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const cloudwatch = new CloudWatchClient({});
const rds = new RDSClient({});
const sns = new SNSClient({});

const REPLICATION_LAG_THRESHOLD = 300; // 5 minutes in seconds
const PRIMARY_DB_IDENTIFIER = process.env.PRIMARY_DB_IDENTIFIER || '';
const REPLICA_DB_IDENTIFIER = process.env.REPLICA_DB_IDENTIFIER || '';
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN || '';
const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';

interface Event {
  source?: string;
  detail?: {
    eventName?: string;
  };
}

export const handler = async (event: Event): Promise<void> => {
  console.log(
    'Replication Lag Monitor started',
    JSON.stringify(event, null, 2)
  );

  try {
    // Get database instance details for replica
    const replicaResponse = await rds.send(
      new DescribeDBInstancesCommand({
        DBInstanceIdentifier: REPLICA_DB_IDENTIFIER,
      })
    );

    const replicaInstance = replicaResponse.DBInstances?.[0];
    if (!replicaInstance) {
      throw new Error(`Replica instance ${REPLICA_DB_IDENTIFIER} not found`);
    }

    // Get replication lag from read replica status
    // Note: RDS provides ReplicaLag metric in CloudWatch, but we can also check StatusInfos
    const statusInfos = replicaInstance.StatusInfos || [];
    let replicationLagSeconds = 0;

    // Check for replication lag in status
    const replicationStatus = statusInfos.find(
      info => info.StatusType === 'read replication'
    );

    if (replicationStatus && replicationStatus.Message) {
      // Parse replication lag from message if available
      const lagMatch = replicationStatus.Message.match(/(\d+)\s*seconds/);
      if (lagMatch) {
        replicationLagSeconds = parseInt(lagMatch[1], 10);
      }
    }

    console.log(`Current replication lag: ${replicationLagSeconds} seconds`);

    // Publish custom metric to CloudWatch
    await cloudwatch.send(
      new PutMetricDataCommand({
        Namespace: 'PostgreSQL/DR',
        MetricData: [
          {
            MetricName: 'ReplicationLag',
            Value: replicationLagSeconds,
            Unit: 'Seconds',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'DBInstanceIdentifier',
                Value: REPLICA_DB_IDENTIFIER,
              },
              {
                Name: 'EnvironmentSuffix',
                Value: ENVIRONMENT_SUFFIX,
              },
            ],
          },
        ],
      })
    );

    // Check if replication lag exceeds threshold
    if (replicationLagSeconds > REPLICATION_LAG_THRESHOLD) {
      const message = `ALERT: Replication lag for ${REPLICA_DB_IDENTIFIER} has exceeded threshold!

Current Lag: ${replicationLagSeconds} seconds
Threshold: ${REPLICATION_LAG_THRESHOLD} seconds
Primary: ${PRIMARY_DB_IDENTIFIER}
Replica: ${REPLICA_DB_IDENTIFIER}
Environment: ${ENVIRONMENT_SUFFIX}
Time: ${new Date().toISOString()}

Action Required: Investigate replication issues and consider failover if necessary.`;

      // Send SNS notification
      await sns.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: `[${ENVIRONMENT_SUFFIX}] PostgreSQL Replication Lag Alert`,
          Message: message,
        })
      );

      console.log('Alert sent to SNS topic');
    }

    // Additional health checks
    const dbStatus = replicaInstance.DBInstanceStatus;
    console.log(`Database status: ${dbStatus}`);

    if (dbStatus !== 'available') {
      const statusMessage = `WARNING: Replica database ${REPLICA_DB_IDENTIFIER} is in ${dbStatus} state`;

      await sns.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: `[${ENVIRONMENT_SUFFIX}] PostgreSQL Replica Status Warning`,
          Message: statusMessage,
        })
      );
    }

    console.log('Replication lag monitoring completed successfully');
  } catch (error) {
    console.error('Error monitoring replication lag:', error);

    // Send error notification
    try {
      await sns.send(
        new PublishCommand({
          TopicArn: SNS_TOPIC_ARN,
          Subject: `[${ENVIRONMENT_SUFFIX}] PostgreSQL Monitoring Error`,
          Message: `Error monitoring replication lag: ${error instanceof Error ? error.message : String(error)}`,
        })
      );
    } catch (snsError) {
      console.error('Failed to send error notification:', snsError);
    }

    throw error;
  }
};
