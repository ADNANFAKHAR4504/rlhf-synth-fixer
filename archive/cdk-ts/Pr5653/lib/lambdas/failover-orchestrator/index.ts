/* eslint-disable import/no-extraneous-dependencies */
// AWS SDK is provided by Lambda runtime
import {
  DescribeDBClustersCommand,
  DescribeGlobalClustersCommand,
  FailoverGlobalClusterCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  ChangeResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const rdsClient = new RDSClient({});
const route53Client = new Route53Client({});
const snsClient = new SNSClient({});

interface FailoverResult {
  success: boolean;
  newPrimaryRegion?: string;
  newPrimaryEndpoint?: string;
  message: string;
  duration?: number;
}

export const handler = async (): Promise<FailoverResult> => {
  const startTime = Date.now();
  const globalClusterId = process.env.GLOBAL_CLUSTER_ID!;
  const secondaryRegion = process.env.SECONDARY_REGION!;
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;
  const hostedZoneId = process.env.HOSTED_ZONE_ID!;

  try {
    console.log('Starting failover process...');

    // Step 1: Validate global cluster status
    const describeResponse = await rdsClient.send(
      new DescribeGlobalClustersCommand({
        GlobalClusterIdentifier: globalClusterId,
      })
    );

    const globalCluster = describeResponse.GlobalClusters![0];
    if (!globalCluster) {
      throw new Error('Global cluster not found');
    }

    // Step 2: Initiate failover to secondary region
    console.log('Initiating global cluster failover');
    const secondaryClusterId = globalCluster.GlobalClusterMembers?.find(m =>
      m.DBClusterArn?.includes(secondaryRegion)
    )?.DBClusterArn;
    await rdsClient.send(
      new FailoverGlobalClusterCommand({
        GlobalClusterIdentifier: globalClusterId,
        TargetDbClusterIdentifier: secondaryClusterId,
      })
    );

    // Step 3: Wait for failover to complete (poll status)
    let failoverComplete = false;
    let retries = 0;
    const maxRetries = 30; // 5 minutes with 10-second intervals

    while (!failoverComplete && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

      const statusResponse = await rdsClient.send(
        new DescribeGlobalClustersCommand({
          GlobalClusterIdentifier: globalClusterId,
        })
      );

      const status = statusResponse.GlobalClusters![0].Status;
      if (status === 'available') {
        failoverComplete = true;
      }
      retries++;
    }

    if (!failoverComplete) {
      throw new Error('Failover timeout - exceeded 5 minutes');
    }

    // Step 4: Get new primary endpoint
    const newPrimaryCluster = await rdsClient.send(
      new DescribeDBClustersCommand({
        DBClusterIdentifier: secondaryClusterId?.split(':').pop(),
      })
    );

    const newPrimaryEndpoint = newPrimaryCluster.DBClusters![0].Endpoint;

    // Step 5: Update Route53 DNS
    console.log('Updating Route53 DNS records...');
    await route53Client.send(
      new ChangeResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: 'aurora-writer.aurora-dr.internal',
                Type: 'CNAME',
                TTL: 60,
                ResourceRecords: [
                  {
                    Value: newPrimaryEndpoint,
                  },
                ],
              },
            },
          ],
        },
      })
    );

    // Step 6: Send notification
    const duration = Math.round((Date.now() - startTime) / 1000);
    const message =
      'Aurora failover completed successfully\n' +
      `New Primary Region: ${secondaryRegion}\n` +
      `New Primary Endpoint: ${newPrimaryEndpoint}\n` +
      `Duration: ${duration} seconds`;

    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Failover Completed',
        Message: message,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'failover_completed',
          },
          severity: {
            DataType: 'String',
            StringValue: 'critical',
          },
        },
      })
    );

    return {
      success: true,
      newPrimaryRegion: secondaryRegion,
      newPrimaryEndpoint,
      message,
      duration,
    };
  } catch (error) {
    console.error('Failover failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    // Send failure notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Failover Failed',
        Message: `Failover process failed: ${errorMessage}`,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'failover_failed',
          },
          severity: {
            DataType: 'String',
            StringValue: 'critical',
          },
        },
      })
    );

    throw error;
  }
};
