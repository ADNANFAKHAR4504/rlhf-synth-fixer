/* eslint-disable import/no-extraneous-dependencies */
// AWS SDK is provided by Lambda runtime
import {
  CloudWatchClient,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';

const sfnClient = new SFNClient({});
const snsClient = new SNSClient({});
const cloudWatchClient = new CloudWatchClient({});

export const handler = async (): Promise<void> => {
  const stateMachineArn = process.env.STATE_MACHINE_ARN!;
  const snsTopicArn = process.env.SNS_TOPIC_ARN!;
  const testStartTime = Date.now();

  try {
    console.log('Starting automated DR test...');

    // Send notification about test start
    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Test Started',
        Message: `Automated DR test initiated at ${new Date().toISOString()}`,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'dr_test_start',
          },
          severity: {
            DataType: 'String',
            StringValue: 'info',
          },
        },
      })
    );

    // Execute failover state machine
    const executionResponse = await sfnClient.send(
      new StartExecutionCommand({
        stateMachineArn,
        name: `dr-test-${Date.now()}`,
        input: JSON.stringify({
          testMode: true,
          initiatedBy: 'automated_test',
          timestamp: new Date().toISOString(),
        }),
      })
    );

    console.log('DR test execution started:', executionResponse.executionArn);

    // Record metrics
    const testDuration = (Date.now() - testStartTime) / 1000;
    await cloudWatchClient.send(
      new PutMetricDataCommand({
        Namespace: 'Aurora/DR',
        MetricData: [
          {
            MetricName: 'DRTestDuration',
            Value: testDuration,
            Unit: 'Seconds',
            Timestamp: new Date(),
          },
          {
            MetricName: 'DRTestCount',
            Value: 1,
            Unit: 'Count',
            Timestamp: new Date(),
          },
        ],
      })
    );

    // Send completion notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Test Completed',
        Message:
          'DR test completed successfully\n' +
          'Duration: ' +
          testDuration +
          ' seconds\n' +
          'Execution ARN: ' +
          executionResponse.executionArn,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'dr_test_completed',
          },
          severity: {
            DataType: 'String',
            StringValue: 'info',
          },
        },
      })
    );
  } catch (error) {
    console.error('DR test failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    await snsClient.send(
      new PublishCommand({
        TopicArn: snsTopicArn,
        Subject: 'Aurora DR Test Failed',
        Message: `DR test failed: ${errorMessage}`,
        MessageAttributes: {
          event_type: {
            DataType: 'String',
            StringValue: 'dr_test_failed',
          },
          severity: {
            DataType: 'String',
            StringValue: 'warning',
          },
        },
      })
    );

    throw error;
  }
};
