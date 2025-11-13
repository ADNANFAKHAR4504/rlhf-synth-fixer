import {
  RDSClient,
  FailoverGlobalClusterCommand,
  DescribeGlobalClustersCommand,
} from '@aws-sdk/client-rds';
import {
  Route53Client,
  ChangeResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const rds = new RDSClient({});
const route53 = new Route53Client({});
const sns = new SNSClient({});

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const PRIMARY_REGION = process.env.PRIMARY_REGION || 'us-east-1';
const SECONDARY_REGION = process.env.SECONDARY_REGION || 'us-east-2';

interface FailoverEvent {
  action: 'promote-rds' | 'update-route53' | 'notify';
  region?: string;
}

export const handler = async (
  event: FailoverEvent
): Promise<Record<string, unknown>> => {
  console.log(`Failover action: ${event.action}`, event);

  switch (event.action) {
    case 'promote-rds':
      return await promoteRDS(event.region || SECONDARY_REGION);
    case 'update-route53':
      return await updateRoute53(event.region || SECONDARY_REGION);
    case 'notify':
      return await sendNotification();
    default:
      throw new Error(`Unknown action: ${event.action}`);
  }
};

async function promoteRDS(
  targetRegion: string
): Promise<Record<string, unknown>> {
  console.log(`Promoting RDS in ${targetRegion}`);

  try {
    // Describe global cluster to get identifier
    const describeCommand = new DescribeGlobalClustersCommand({});
    const clusters = await rds.send(describeCommand);

    const globalCluster = clusters.GlobalClusters?.find(c =>
      c.GlobalClusterIdentifier?.includes(ENVIRONMENT_SUFFIX)
    );

    if (!globalCluster) {
      throw new Error('Global cluster not found');
    }

    // Initiate failover
    const failoverCommand = new FailoverGlobalClusterCommand({
      GlobalClusterIdentifier: globalCluster.GlobalClusterIdentifier,
      TargetDbClusterIdentifier: `aurora-cluster-${ENVIRONMENT_SUFFIX}-${targetRegion}`,
    });

    await rds.send(failoverCommand);

    console.log(`RDS promotion initiated for ${targetRegion}`);

    return {
      success: true,
      cluster: globalCluster.GlobalClusterIdentifier,
      targetRegion,
    };
  } catch (error) {
    console.error('RDS promotion failed:', error);
    throw error;
  }
}

async function updateRoute53(
  targetRegion: string
): Promise<Record<string, unknown>> {
  console.log(`Updating Route 53 to point to ${targetRegion}`);

  try {
    // This is a simplified example - in production, you would get the hosted zone ID
    // from environment variables or SSM Parameter Store
    const hostedZoneId = process.env.HOSTED_ZONE_ID || 'Z1234567890ABC';
    const domainName = `api.trading-platform-${ENVIRONMENT_SUFFIX}.example.com`;

    const changeCommand = new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Comment: `Failover to ${targetRegion}`,
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: domainName,
              Type: 'A',
              SetIdentifier: targetRegion,
              Failover:
                targetRegion === PRIMARY_REGION ? 'PRIMARY' : 'SECONDARY',
              AliasTarget: {
                HostedZoneId: 'Z1234567890ABC', // API Gateway hosted zone
                DNSName: `api-${targetRegion}.execute-api.${targetRegion}.amazonaws.com`,
                EvaluateTargetHealth: true,
              },
            },
          },
        ],
      },
    });

    await route53.send(changeCommand);

    console.log(`Route 53 updated to ${targetRegion}`);

    return {
      success: true,
      targetRegion,
      domainName,
    };
  } catch (error) {
    console.error('Route 53 update failed:', error);
    throw error;
  }
}

async function sendNotification(): Promise<Record<string, unknown>> {
  console.log('Sending failover notification');

  try {
    const topicArn = process.env.ALERT_TOPIC_ARN || '';

    const publishCommand = new PublishCommand({
      TopicArn: topicArn,
      Subject: `Trading Platform Failover Completed - ${ENVIRONMENT_SUFFIX}`,
      Message: JSON.stringify({
        event: 'FAILOVER_COMPLETED',
        environment: ENVIRONMENT_SUFFIX,
        timestamp: new Date().toISOString(),
        primaryRegion: PRIMARY_REGION,
        secondaryRegion: SECONDARY_REGION,
      }),
    });

    await sns.send(publishCommand);

    console.log('Notification sent');

    return {
      success: true,
      notified: true,
    };
  } catch (error) {
    console.error('Notification failed:', error);
    throw error;
  }
}
