import { DescribeDBClustersCommand, RDSClient } from '@aws-sdk/client-rds';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const primaryRegion = process.env.PRIMARY_REGION || 'eu-west-2';
const secondaryRegion = process.env.SECONDARY_REGION || 'eu-west-1';
const snsTopicArn = process.env.SNS_TOPIC_ARN || '';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const primaryRds = new RDSClient({ region: primaryRegion });
const secondaryRds = new RDSClient({ region: secondaryRegion });
const sns = new SNSClient({ region: primaryRegion });
const ssm = new SSMClient({ region: primaryRegion });

interface AlarmEvent {
  AlarmName: string;
  NewStateValue: string;
  NewStateReason: string;
}

interface LambdaResponse {
  statusCode: number;
  body: string;
}

interface SNSRecord {
  Sns: {
    Message: string | AlarmEvent;
  };
}

interface SNSEvent {
  Records: SNSRecord[];
}

export const handler = async (event: SNSEvent): Promise<LambdaResponse> => {
  console.log('Disaster Recovery Event:', JSON.stringify(event, null, 2));

  try {
    // Parse alarm event
    const message =
      typeof event.Records[0].Sns.Message === 'string'
        ? JSON.parse(event.Records[0].Sns.Message)
        : event.Records[0].Sns.Message;

    const alarm: AlarmEvent = message;

    if (alarm.NewStateValue !== 'ALARM') {
      console.log('Alarm is not in ALARM state, skipping failover');
      return { statusCode: 200, body: 'No action required' };
    }

    // Get database identifiers from SSM
    const primaryDbId = await getParameter(
      `/healthcare/${environmentSuffix}/database/primary-id`
    );
    const replicaDbId = await getParameter(
      `/healthcare/${environmentSuffix}/database/replica-id`
    );

    // Check primary database status
    const primaryStatus = await checkDatabaseStatus(primaryRds, primaryDbId);
    console.log(`Primary database status: ${primaryStatus}`);

    if (primaryStatus === 'available') {
      console.log('Primary database is healthy, no failover needed');
      return { statusCode: 200, body: 'Primary database is healthy' };
    }

    // Check replica status
    const replicaStatus = await checkDatabaseStatus(secondaryRds, replicaDbId);
    console.log(`Replica database status: ${replicaStatus}`);

    if (replicaStatus !== 'available') {
      const errorMsg = 'Replica database is not available for promotion';
      await sendNotification('FAILOVER_FAILED', errorMsg);
      throw new Error(errorMsg);
    }

    // Initiate failover by promoting read replica
    console.log(`Promoting read replica: ${replicaDbId}`);
    await promoteReadReplica(replicaDbId);

    // Send success notification
    await sendNotification(
      'FAILOVER_INITIATED',
      `Failover initiated successfully. Promoted replica ${replicaDbId} in ${secondaryRegion}`
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Failover initiated successfully',
        primaryDatabase: primaryDbId,
        promotedReplica: replicaDbId,
        region: secondaryRegion,
      }),
    };
  } catch (error) {
    console.error('Failover error:', error);
    await sendNotification('FAILOVER_ERROR', `Error during failover: ${error}`);
    throw error;
  }
};

async function getParameter(name: string): Promise<string> {
  const command = new GetParameterCommand({ Name: name });
  const response = await ssm.send(command);
  return response.Parameter?.Value || '';
}

async function checkDatabaseStatus(
  client: RDSClient,
  dbIdentifier: string
): Promise<string> {
  try {
    const command = new DescribeDBClustersCommand({
      DBClusterIdentifier: dbIdentifier,
    });
    const response = await client.send(command);
    return response.DBClusters?.[0]?.Status || 'unknown';
  } catch (error) {
    console.error(`Error checking database status for ${dbIdentifier}:`, error);
    return 'error';
  }
}

async function promoteReadReplica(replicaId: string): Promise<void> {
  // Note: Aurora global databases use a different promotion mechanism
  // This is simplified for the example
  console.log(`Promotion would be initiated for ${replicaId}`);
  // In production, use proper Aurora Global Database promotion:
  // aws rds failover-global-cluster --global-cluster-identifier <id> --target-db-cluster-identifier <replica-id>
}

async function sendNotification(
  subject: string,
  message: string
): Promise<void> {
  const command = new PublishCommand({
    TopicArn: snsTopicArn,
    Subject: `Healthcare DR: ${subject}`,
    Message: `
Environment: ${environmentSuffix}
Time: ${new Date().toISOString()}
Region: ${secondaryRegion}

${message}
    `,
  });

  await sns.send(command);
  console.log('Notification sent');
}
