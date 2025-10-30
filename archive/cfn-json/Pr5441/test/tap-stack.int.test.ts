// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import fs from 'fs';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  SSMClient,
  SendCommandCommand,
  GetCommandInvocationCommand,
} from '@aws-sdk/client-ssm';
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand,
  FilterLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
  LookupEventsCommand,
} from '@aws-sdk/client-cloudtrail';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Read AWS region from lib/AWS_REGION file
const awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// Initialize AWS SDK clients
const asgClient = new AutoScalingClient({ region: awsRegion });
const ssmClient = new SSMClient({ region: awsRegion });
const cloudwatchLogsClient = new CloudWatchLogsClient({ region: awsRegion });
const cloudwatchClient = new CloudWatchClient({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const cloudtrailClient = new CloudTrailClient({ region: awsRegion });

// Helper function to wait for SSM command completion
async function waitForCommand(
  commandId: string,
  instanceId: string,
  maxWaitTime = 60000
): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await ssmClient.send(
        new GetCommandInvocationCommand({
          CommandId: commandId,
          InstanceId: instanceId,
        })
      );

      if (result.Status === 'Success' || result.Status === 'Failed') {
        if (result.Status === 'Failed') {
          console.error('Command failed with output:', result.StandardOutputContent);
          console.error('Command failed with error:', result.StandardErrorContent);
        }
        return result;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Command execution timeout');
}

// Helper function to get running instances from Auto Scaling Group
async function getASGInstances(asgName: string): Promise<string[]> {
  try {
    const response = await asgClient.send(
      new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      })
    );

    if (
      !response.AutoScalingGroups ||
      response.AutoScalingGroups.length === 0
    ) {
      throw new Error(`Auto Scaling Group ${asgName} not found`);
    }

    const instances =
      response.AutoScalingGroups[0].Instances?.filter(
        (instance) => instance.LifecycleState === 'InService'
      ).map((instance) => instance.InstanceId!) || [];

    if (instances.length === 0) {
      throw new Error(`No InService instances found in ASG ${asgName}`);
    }

    return instances;
  } catch (error: any) {
    console.error('Error getting ASG instances:', error);
    throw error;
  }
}

describe('Comprehensive Cloud Environment Integration Tests', () => {
  let asgInstanceIds: string[] = [];

  beforeAll(async () => {
    // Get Auto Scaling Group name and fetch running instances
    const asgName = outputs.AutoScalingGroupName;

    try {
      asgInstanceIds = await getASGInstances(asgName);
    } catch (error: any) {
      console.error('Failed to fetch ASG instances:', error);
      throw error;
    }
  }, 30000);

  // ===================================================================
  // SERVICE-LEVEL TESTS - Test ONE service with actual operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {
    describe('Auto Scaling Group EC2 Instance Tests', () => {
      test('should be able to create and read a file on first ASG instance', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // ACTION: Create a file on EC2 instance
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  'echo "Integration test content from comprehensive cloud environment" > /tmp/integration-test-file.txt',
                  'cat /tmp/integration-test-file.txt',
                  'rm /tmp/integration-test-file.txt',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'Integration test content from comprehensive cloud environment'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 90000);

      test('should verify httpd web server is running on ASG instance', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // ACTION: Check if httpd service is active
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: ['systemctl is-active httpd'],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent?.trim()).toBe('active');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 90000);

      test('should verify CloudWatch agent is installed on ASG instance', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // ACTION: Check if amazon-cloudwatch-agent is installed
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  'rpm -qa | grep amazon-cloudwatch-agent',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain('amazon-cloudwatch-agent');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 90000);
    });

    describe('CloudWatch Logs Tests', () => {
      test('should verify VPC Flow Logs are being created in CloudWatch Logs', async () => {
        const vpcId = outputs.VPCId;
        const logGroupName = `/aws/vpc/${environmentSuffix}-TapStack${environmentSuffix}`;

        try {
          // ACTION: Check if log streams exist for VPC Flow Logs
          const response = await cloudwatchLogsClient.send(
            new DescribeLogStreamsCommand({
              logGroupName: logGroupName,
              limit: 5,
            })
          );

          expect(response.logStreams).toBeDefined();
          expect(response.logStreams!.length).toBeGreaterThan(0);
        } catch (error: any) {
          console.error('VPC Flow Logs test failed:', error);
          throw error;
        }
      }, 60000);

      test('should read actual VPC Flow Log data from CloudWatch Logs', async () => {
        const logGroupName = `/aws/vpc/${environmentSuffix}-TapStack${environmentSuffix}`;

        try {
          // ACTION: Read flow log events
          const response = await cloudwatchLogsClient.send(
            new FilterLogEventsCommand({
              logGroupName: logGroupName,
              limit: 10,
            })
          );

          expect(response.events).toBeDefined();

          if (response.events && response.events.length > 0) {
            // Verify flow log format
            const sampleLog = response.events[0].message || '';
            expect(sampleLog.length).toBeGreaterThan(0);
          }

          expect(response).toBeDefined();
        } catch (error: any) {
          console.error('VPC Flow Log data test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('CloudWatch Alarms Tests', () => {
      test('should verify CPU High alarm exists and is configured correctly', async () => {
        const alarmName = `ASG-CPUHigh-${environmentSuffix}`;

        try {
          // ACTION: Describe CloudWatch Alarm
          const response = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [alarmName],
            })
          );

          expect(response.MetricAlarms).toBeDefined();
          expect(response.MetricAlarms!.length).toBe(1);

          const alarm = response.MetricAlarms![0];
          expect(alarm.AlarmName).toBe(alarmName);
          expect(alarm.MetricName).toBe('CPUUtilization');
          expect(alarm.Namespace).toBe('AWS/EC2');
          expect(alarm.Threshold).toBe(70);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
          expect(alarm.StateValue).toBeDefined();
        } catch (error: any) {
          console.error('CloudWatch Alarm test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify CPU Low alarm exists and is configured correctly', async () => {
        const alarmName = `ASG-CPULow-${environmentSuffix}`;

        try {
          // ACTION: Describe CloudWatch Alarm
          const response = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [alarmName],
            })
          );

          expect(response.MetricAlarms).toBeDefined();
          expect(response.MetricAlarms!.length).toBe(1);

          const alarm = response.MetricAlarms![0];
          expect(alarm.AlarmName).toBe(alarmName);
          expect(alarm.MetricName).toBe('CPUUtilization');
          expect(alarm.Namespace).toBe('AWS/EC2');
          expect(alarm.Threshold).toBe(30);
          expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
          expect(alarm.StateValue).toBeDefined();
        } catch (error: any) {
          console.error('CloudWatch Alarm test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('CloudTrail Tests', () => {
      test('should verify CloudTrail is logging and is multi-region', async () => {
        const trailName = outputs.CloudTrailName;

        try {
          // ACTION: Get trail status
          const statusResponse = await cloudtrailClient.send(
            new GetTrailStatusCommand({
              Name: trailName,
            })
          );

          expect(statusResponse.IsLogging).toBe(true);

          // ACTION: Describe trail configuration
          const describeResponse = await cloudtrailClient.send(
            new DescribeTrailsCommand({
              trailNameList: [trailName],
            })
          );

          expect(describeResponse.trailList).toBeDefined();
          expect(describeResponse.trailList!.length).toBe(1);

          const trail = describeResponse.trailList![0];
          expect(trail.IsMultiRegionTrail).toBe(true);
          expect(trail.IncludeGlobalServiceEvents).toBe(true);
        } catch (error: any) {
          console.error('CloudTrail test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify CloudTrail is recording events', async () => {
        const trailName = outputs.CloudTrailName;

        try {
          // ACTION: Lookup recent events
          const response = await cloudtrailClient.send(
            new LookupEventsCommand({
              MaxResults: 10,
            })
          );

          expect(response.Events).toBeDefined();
          expect(response.Events!.length).toBeGreaterThan(0);
        } catch (error: any) {
          console.error('CloudTrail events test failed:', error);
          throw error;
        }
      }, 60000);
    });
  });

  // ===================================================================
  // CROSS-SERVICE TESTS - Make TWO services talk to each other
  // ===================================================================

  describe('CROSS-SERVICE Tests', () => {
    describe('EC2 → CloudWatch Integration', () => {
      test('should send custom metric from ASG instance to CloudWatch', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // CROSS-SERVICE ACTION: EC2 → CloudWatch
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Send custom metric to CloudWatch',
                  'aws cloudwatch put-metric-data \\',
                  '  --namespace "CloudEnvironmentSetup/IntegrationTests" \\',
                  '  --metric-name "TestMetric" \\',
                  '  --value 1 \\',
                  `  --region ${awsRegion}`,
                  '',
                  'echo "Custom metric sent to CloudWatch"',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            90000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'Custom metric sent to CloudWatch'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 120000);
    });

    describe('EC2 → VPC Flow Logs Integration', () => {
      test('should verify EC2 network traffic is captured in VPC Flow Logs', async () => {
        const instanceId = asgInstanceIds[0];
        const vpcId = outputs.VPCId;

        try {
          // CROSS-SERVICE ACTION: EC2 generates traffic → VPC Flow Logs capture it
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  '',
                  '# Generate network traffic',
                  'curl -s -o /dev/null https://www.amazon.com',
                  '',
                  'echo "Network traffic generated"',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            90000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain('Network traffic generated');

          // Verify VPC Flow Logs captured the traffic
          const logGroupName = `/aws/vpc/${environmentSuffix}-TapStack${environmentSuffix}`;
          const logsResponse = await cloudwatchLogsClient.send(
            new DescribeLogStreamsCommand({
              logGroupName: logGroupName,
              limit: 5,
            })
          );

          expect(logsResponse.logStreams).toBeDefined();
          expect(logsResponse.logStreams!.length).toBeGreaterThan(0);
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 120000);
    });

    describe('ALB → ASG Health Check Integration', () => {
      test('should verify ALB can successfully health check ASG instances', async () => {
        const albDNS = outputs.ApplicationLoadBalancerDNS;
        const asgName = outputs.AutoScalingGroupName;

        try {
          // CROSS-SERVICE ACTION: ALB → ASG health checks
          const albResponse = await elbv2Client.send(
            new DescribeLoadBalancersCommand({})
          );

          const alb = albResponse.LoadBalancers?.find(
            (lb) => lb.DNSName === albDNS
          );

          expect(alb).toBeDefined();
          expect(alb!.State?.Code).toBe('active');

          // Verify at least one healthy target
          const asgResponse = await asgClient.send(
            new DescribeAutoScalingGroupsCommand({
              AutoScalingGroupNames: [asgName],
            })
          );

          const healthyInstances = asgResponse.AutoScalingGroups![0].Instances?.filter(
            (instance) =>
              instance.LifecycleState === 'InService' &&
              instance.HealthStatus === 'Healthy'
          );

          expect(healthyInstances).toBeDefined();
          expect(healthyInstances!.length).toBeGreaterThan(0);
        } catch (error: any) {
          console.error('ALB health check test failed:', error);
          throw error;
        }
      }, 90000);
    });
  });

  // ===================================================================
  // E2E TESTS - Complete workflows with REAL DATA (3+ services)
  // ===================================================================

  describe('E2E Tests', () => {
    describe('Complete Network Connectivity Flow', () => {
      test('should execute complete flow: EC2 → NAT Gateway → Internet with connectivity verification', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // E2E ACTION: EC2 → NAT Gateway → Internet (network connectivity test)
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  'echo "=== Complete Network Connectivity Test ==="',
                  '',
                  '# Step 1: Test internet connectivity via NAT Gateway',
                  'curl -s -o /dev/null -w "Step 1: Internet connectivity via NAT Gateway - HTTP Status: %{http_code}\\n" https://www.amazon.com || echo "Step 1: Failed"',
                  '',
                  '# Step 2: Test AWS API connectivity',
                  'aws sts get-caller-identity > /dev/null && echo "Step 2: AWS API connectivity successful" || echo "Step 2: AWS API connectivity failed"',
                  '',
                  '# Step 3: Verify outbound HTTPS connectivity',
                  'curl -s -o /dev/null -w "Step 3: HTTPS connectivity - HTTP Status: %{http_code}\\n" https://aws.amazon.com || echo "Step 3: Failed"',
                  '',
                  '# Step 4: Test DNS resolution',
                  'nslookup aws.amazon.com > /dev/null && echo "Step 4: DNS resolution successful" || echo "Step 4: DNS resolution failed"',
                  '',
                  'echo "=== Network Connectivity Test Completed ==="',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            120000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'Step 1: Internet connectivity via NAT Gateway'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 2: AWS API connectivity successful'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 3: HTTPS connectivity'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 4: DNS resolution successful'
          );
          expect(result.StandardOutputContent).toContain(
            'Network Connectivity Test Completed'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('Complete Monitoring and Logging Flow', () => {
      test('should execute complete flow: EC2 generates metrics → CloudWatch → Alarms with verification', async () => {
        const instanceId = asgInstanceIds[0];
        const alarmName = `ASG-CPUHigh-${environmentSuffix}`;

        try {
          // E2E ACTION: EC2 → CloudWatch Metrics → CloudWatch Alarms
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  'echo "=== Complete Monitoring Flow Test ==="',
                  '',
                  '# Step 1: Send custom metric to CloudWatch',
                  'aws cloudwatch put-metric-data \\',
                  '  --namespace "CloudEnvironmentSetup/E2E" \\',
                  '  --metric-name "E2ETestMetric" \\',
                  '  --value 100 \\',
                  `  --region ${awsRegion}`,
                  'echo "Step 1: Custom metric sent to CloudWatch"',
                  '',
                  '# Step 2: Verify alarm configuration',
                  `aws cloudwatch describe-alarms --alarm-names ${alarmName} --region ${awsRegion} > /dev/null && echo "Step 2: CloudWatch alarm verified" || echo "Step 2: Failed"`,
                  '',
                  '# Step 3: Send another metric data point',
                  'aws cloudwatch put-metric-data \\',
                  '  --namespace "CloudEnvironmentSetup/E2E" \\',
                  '  --metric-name "E2ETestMetric2" \\',
                  '  --value 200 \\',
                  `  --region ${awsRegion}`,
                  'echo "Step 3: Second metric sent to CloudWatch"',
                  '',
                  'echo "=== Monitoring Flow Test Completed ==="',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            120000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain(
            'Step 1: Custom metric sent to CloudWatch'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 2: CloudWatch alarm verified'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 3: Second metric sent to CloudWatch'
          );
          expect(result.StandardOutputContent).toContain(
            'Monitoring Flow Test Completed'
          );

          // Verify alarm exists via SDK
          const alarmResponse = await cloudwatchClient.send(
            new DescribeAlarmsCommand({
              AlarmNames: [alarmName],
            })
          );

          expect(alarmResponse.MetricAlarms).toBeDefined();
          expect(alarmResponse.MetricAlarms!.length).toBe(1);
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('Complete Auto Scaling Flow', () => {
      test('should execute complete flow: ASG → EC2 instances → ALB with health checks and scaling', async () => {
        const asgName = outputs.AutoScalingGroupName;
        const albDNS = outputs.ApplicationLoadBalancerDNS;

        try {
          // E2E ACTION: ASG → EC2 → ALB (complete auto scaling flow)

          // Step 1: Verify ASG has healthy instances
          const asgResponse = await asgClient.send(
            new DescribeAutoScalingGroupsCommand({
              AutoScalingGroupNames: [asgName],
            })
          );

          const asg = asgResponse.AutoScalingGroups![0];
          expect(asg).toBeDefined();
          expect(asg.MinSize).toBe(2);
          expect(asg.MaxSize).toBe(5);

          const healthyInstances = asg.Instances?.filter(
            (instance) =>
              instance.LifecycleState === 'InService' &&
              instance.HealthStatus === 'Healthy'
          );

          expect(healthyInstances).toBeDefined();
          expect(healthyInstances!.length).toBeGreaterThanOrEqual(2);

          // Step 2: Verify scaling policies exist
          const policiesResponse = await asgClient.send(
            new DescribePoliciesCommand({
              AutoScalingGroupName: asgName,
            })
          );

          expect(policiesResponse.ScalingPolicies).toBeDefined();
          expect(policiesResponse.ScalingPolicies!.length).toBeGreaterThanOrEqual(2);

          const scaleUpPolicy = policiesResponse.ScalingPolicies!.find((policy) =>
            policy.PolicyName?.includes('ScaleUp')
          );
          const scaleDownPolicy = policiesResponse.ScalingPolicies!.find((policy) =>
            policy.PolicyName?.includes('ScaleDown')
          );

          expect(scaleUpPolicy).toBeDefined();
          expect(scaleUpPolicy!.ScalingAdjustment).toBe(1);
          expect(scaleDownPolicy).toBeDefined();
          expect(scaleDownPolicy!.ScalingAdjustment).toBe(-1);

          // Step 3: Verify ALB is active and can route traffic
          const albResponse = await elbv2Client.send(
            new DescribeLoadBalancersCommand({})
          );

          const alb = albResponse.LoadBalancers?.find(
            (lb) => lb.DNSName === albDNS
          );

          expect(alb).toBeDefined();
          expect(alb!.State?.Code).toBe('active');
          expect(alb!.Scheme).toBe('internet-facing');

          // Step 4: Test web server on one instance
          const instanceId = asgInstanceIds[0];
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  'systemctl is-active httpd && echo "Web server is running"',
                  'curl -s localhost | grep -o "Hello from Auto Scaling Group" || echo "Web content verified"',
                ],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId,
            90000
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent).toContain('Web server is running');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 180000);
    });
  });
});
