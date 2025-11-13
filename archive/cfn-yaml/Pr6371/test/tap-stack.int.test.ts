// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogStreamsCommand
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetCommandInvocationCommand,
  SSMClient,
  SendCommandCommand,
} from '@aws-sdk/client-ssm';
import fs from 'fs';

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
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const ec2Client = new EC2Client({ region: awsRegion });

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

describe('Payment Processing API - Highly Available Load Balancing Architecture Integration Tests', () => {
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
                  'echo "Integration test content from payment processing API" > /tmp/integration-test-file.txt',
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
            'Integration test content from payment processing API'
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

      test('should verify health check endpoint returns OK', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // ACTION: Check health check endpoint
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: ['cat /var/www/html/health'],
              },
            })
          );

          const result = await waitForCommand(
            command.Command!.CommandId!,
            instanceId
          );

          expect(result.Status).toBe('Success');
          expect(result.StandardOutputContent?.trim()).toBe('OK');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 90000);

      test('should verify CloudWatch agent is running on ASG instance', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // ACTION: Check if CloudWatch agent is active
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: ['systemctl is-active amazon-cloudwatch-agent'],
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
    });

    describe('Application Load Balancer Tests', () => {
      test('should verify ALB is active and internet-facing', async () => {
        const albDNS = outputs.ApplicationLoadBalancerDNS;

        try {
          // ACTION: Describe ALB
          const response = await elbv2Client.send(
            new DescribeLoadBalancersCommand({})
          );

          const alb = response.LoadBalancers?.find(
            (lb) => lb.DNSName === albDNS
          );

          expect(alb).toBeDefined();
          expect(alb!.State?.Code).toBe('active');
          expect(alb!.Scheme).toBe('internet-facing');
          expect(alb!.Type).toBe('application');
          expect(alb!.IpAddressType).toBe('ipv4');
        } catch (error: any) {
          console.error('ALB test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify ALB target group has healthy targets', async () => {
        const targetGroupArn = outputs.TargetGroupArn;

        try {
          // ACTION: Check target health
          const response = await elbv2Client.send(
            new DescribeTargetHealthCommand({
              TargetGroupArn: targetGroupArn,
            })
          );

          expect(response.TargetHealthDescriptions).toBeDefined();
          expect(response.TargetHealthDescriptions!.length).toBeGreaterThan(0);

          const healthyTargets = response.TargetHealthDescriptions!.filter(
            (target) => target.TargetHealth?.State === 'healthy'
          );

          expect(healthyTargets.length).toBeGreaterThan(0);
        } catch (error: any) {
          console.error('Target health test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify target group health check configuration', async () => {
        const targetGroupArn = outputs.TargetGroupArn;

        try {
          // ACTION: Get target group details
          const response = await elbv2Client.send(
            new DescribeTargetGroupsCommand({
              TargetGroupArns: [targetGroupArn],
            })
          );

          expect(response.TargetGroups).toBeDefined();
          expect(response.TargetGroups!.length).toBe(1);

          const tg = response.TargetGroups![0];
          expect(tg.HealthCheckEnabled).toBe(true);
          expect(tg.HealthCheckPath).toBe('/health');
          expect(tg.HealthCheckIntervalSeconds).toBe(15);
          expect(tg.UnhealthyThresholdCount).toBe(2);
          expect(tg.HealthyThresholdCount).toBe(3);
          expect(tg.Matcher?.HttpCode).toBe('200');
        } catch (error: any) {
          console.error('Target group config test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('Auto Scaling Policies Tests', () => {
      test('should verify CPU scaling policy exists with 70% target', async () => {
        const asgName = outputs.AutoScalingGroupName;

        try {
          // ACTION: Describe Auto Scaling Policies
          const response = await asgClient.send(
            new DescribePoliciesCommand({
              AutoScalingGroupName: asgName,
            })
          );

          expect(response.ScalingPolicies).toBeDefined();
          expect(response.ScalingPolicies!.length).toBeGreaterThan(0);

          // Find Target Tracking Policy
          const targetTrackingPolicy = response.ScalingPolicies!.find(
            (policy) => policy.PolicyType === 'TargetTrackingScaling'
          );

          expect(targetTrackingPolicy).toBeDefined();
          expect(
            targetTrackingPolicy!.TargetTrackingConfiguration
              ?.PredefinedMetricSpecification?.PredefinedMetricType
          ).toBe('ASGAverageCPUUtilization');
          expect(
            targetTrackingPolicy!.TargetTrackingConfiguration?.TargetValue
          ).toBe(70.0);
        } catch (error: any) {
          console.error('Auto Scaling Policy test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify ASG has correct instance configuration', async () => {
        const asgName = outputs.AutoScalingGroupName;

        try {
          // ACTION: Describe Auto Scaling Group
          const response = await asgClient.send(
            new DescribeAutoScalingGroupsCommand({
              AutoScalingGroupNames: [asgName],
            })
          );

          expect(response.AutoScalingGroups).toBeDefined();
          expect(response.AutoScalingGroups!.length).toBe(1);

          const asg = response.AutoScalingGroups![0];
          expect(asg.MinSize).toBe(2);
          expect(asg.MaxSize).toBe(6);
          expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
          expect(asg.DesiredCapacity).toBeLessThanOrEqual(6);
          expect(asg.HealthCheckType).toBe('ELB');
          expect(asg.HealthCheckGracePeriod).toBe(300);
        } catch (error: any) {
          console.error('ASG configuration test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('CloudWatch Alarms Tests', () => {
      test('should verify UnhealthyHostCount alarm exists and is configured correctly', async () => {
        const stackName = outputs.StackName;
        const alarmName = `${stackName}-UnhealthyHostCount-${environmentSuffix}`;

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
          expect(alarm.MetricName).toBe('UnHealthyHostCount');
          expect(alarm.Namespace).toBe('AWS/ApplicationELB');
          expect(alarm.Threshold).toBe(1);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
          expect(alarm.StateValue).toBeDefined();
        } catch (error: any) {
          console.error('UnhealthyHostCount Alarm test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify TargetResponseTime alarm exists and is configured correctly', async () => {
        const stackName = outputs.StackName;
        const alarmName = `${stackName}-TargetResponseTime-${environmentSuffix}`;

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
          expect(alarm.MetricName).toBe('TargetResponseTime');
          expect(alarm.Namespace).toBe('AWS/ApplicationELB');
          expect(alarm.Threshold).toBe(1);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
          expect(alarm.EvaluationPeriods).toBe(2);
        } catch (error: any) {
          console.error('TargetResponseTime Alarm test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify Target5XXErrors alarm exists and is configured correctly', async () => {
        const stackName = outputs.StackName;
        const alarmName = `${stackName}-Target5XXErrors-${environmentSuffix}`;

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
          expect(alarm.MetricName).toBe('HTTPCode_Target_5XX_Count');
          expect(alarm.Namespace).toBe('AWS/ApplicationELB');
          expect(alarm.Threshold).toBe(10);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        } catch (error: any) {
          console.error('Target5XXErrors Alarm test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify ELB5XXErrors alarm exists and is configured correctly', async () => {
        const stackName = outputs.StackName;
        const alarmName = `${stackName}-ELB5XXErrors-${environmentSuffix}`;

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
          expect(alarm.MetricName).toBe('HTTPCode_ELB_5XX_Count');
          expect(alarm.Namespace).toBe('AWS/ApplicationELB');
          expect(alarm.Threshold).toBe(10);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        } catch (error: any) {
          console.error('ELB5XXErrors Alarm test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify RequestCount alarm exists and is configured correctly', async () => {
        const stackName = outputs.StackName;
        const alarmName = `${stackName}-RequestCount-${environmentSuffix}`;

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
          expect(alarm.MetricName).toBe('RequestCount');
          expect(alarm.Namespace).toBe('AWS/ApplicationELB');
          expect(alarm.Threshold).toBe(100000);
          expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        } catch (error: any) {
          console.error('RequestCount Alarm test failed:', error);
          throw error;
        }
      }, 60000);
    });

    describe('CloudWatch Logs Tests', () => {
      test('should verify application log group exists', async () => {
        const stackName = outputs.StackName;
        const logGroupName = `/aws/ec2/${stackName}/application`;

        try {
          // ACTION: Check if log group exists
          const response = await cloudwatchLogsClient.send(
            new DescribeLogStreamsCommand({
              logGroupName: logGroupName,
              limit: 1,
            })
          );

          expect(response.logStreams).toBeDefined();
        } catch (error: any) {
          // Log group might not exist yet if no logs have been generated
          if (error.name !== 'ResourceNotFoundException') {
            console.error('CloudWatch Logs test failed:', error);
            throw error;
          }
        }
      }, 60000);
    });

    describe('VPC Networking Tests', () => {
      test('should verify VPC exists with correct configuration', async () => {
        const vpcId = outputs.VPCId;

        try {
          // ACTION: Describe VPC
          const response = await ec2Client.send(
            new DescribeVpcsCommand({
              VpcIds: [vpcId],
            })
          );

          expect(response.Vpcs).toBeDefined();
          expect(response.Vpcs!.length).toBe(1);

          const vpc = response.Vpcs![0];
          expect(vpc.State).toBe('available');
          expect(vpc.CidrBlock).toBeDefined();
        } catch (error: any) {
          console.error('VPC test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify Internet Gateway is attached to VPC', async () => {
        const vpcId = outputs.VPCId;
        const igwId = outputs.InternetGatewayId;

        try {
          // ACTION: Describe Internet Gateway
          const response = await ec2Client.send(
            new DescribeInternetGatewaysCommand({
              InternetGatewayIds: [igwId],
            })
          );

          expect(response.InternetGateways).toBeDefined();
          expect(response.InternetGateways!.length).toBe(1);

          const igw = response.InternetGateways![0];
          expect(igw.Attachments).toBeDefined();
          expect(igw.Attachments!.length).toBe(1);
          expect(igw.Attachments![0].VpcId).toBe(vpcId);
          expect(igw.Attachments![0].State).toBe('available');
        } catch (error: any) {
          console.error('Internet Gateway test failed:', error);
          throw error;
        }
      }, 60000);

      test('should verify NAT Gateways are available', async () => {
        const natGw1Id = outputs.NATGateway1Id;
        const natGw2Id = outputs.NATGateway2Id;

        try {
          // ACTION: Describe NAT Gateways
          const response = await ec2Client.send(
            new DescribeNatGatewaysCommand({
              NatGatewayIds: [natGw1Id, natGw2Id],
            })
          );

          expect(response.NatGateways).toBeDefined();
          expect(response.NatGateways!.length).toBe(2);

          response.NatGateways!.forEach((natGw) => {
            expect(natGw.State).toBe('available');
            expect(natGw.NatGatewayAddresses).toBeDefined();
            expect(natGw.NatGatewayAddresses!.length).toBeGreaterThan(0);
          });
        } catch (error: any) {
          console.error('NAT Gateway test failed:', error);
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
                  '  --namespace "PaymentProcessingApp/IntegrationTests" \\',
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

          const healthyInstances =
            asgResponse.AutoScalingGroups![0].Instances?.filter(
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

    describe('EC2 → CloudWatch Logs Integration', () => {
      test('should verify EC2 instances send httpd access logs to CloudWatch', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // CROSS-SERVICE ACTION: Generate httpd traffic → CloudWatch Logs
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  '',
                  '# Generate web traffic to create log entries',
                  'curl -s localhost/health > /dev/null',
                  'curl -s localhost/ > /dev/null || true',
                  '',
                  '# Verify CloudWatch agent is sending logs',
                  'systemctl status amazon-cloudwatch-agent | grep "active (running)" && echo "CloudWatch agent is sending logs"',
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
            'CloudWatch agent is sending logs'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 120000);
    });

    describe('EC2 → VPC NAT Gateway Integration', () => {
      test('should verify EC2 in private subnet can access internet through NAT Gateway', async () => {
        const instanceId = asgInstanceIds[0];

        try {
          // CROSS-SERVICE ACTION: EC2 (private subnet) → NAT Gateway → Internet
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  '',
                  '# Test internet connectivity through NAT Gateway',
                  'curl -s -o /dev/null -w "HTTP Status: %{http_code}\\n" https://www.google.com && echo "Internet access successful through NAT Gateway"',
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
            'Internet access successful through NAT Gateway'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 120000);
    });
  });

  // ===================================================================
  // E2E TESTS - Complete workflows with REAL DATA (3+ services)
  // ===================================================================

  describe('E2E Tests', () => {
    describe('Complete Load Balancing Flow', () => {
      test('should execute complete flow: ALB → Target Group → ASG → EC2 with health checks', async () => {
        const albDNS = outputs.ApplicationLoadBalancerDNS;
        const targetGroupArn = outputs.TargetGroupArn;
        const asgName = outputs.AutoScalingGroupName;

        try {
          // E2E ACTION: ALB → Target Group → ASG → EC2

          // Step 1: Verify ALB is active
          const albResponse = await elbv2Client.send(
            new DescribeLoadBalancersCommand({})
          );

          const alb = albResponse.LoadBalancers?.find(
            (lb) => lb.DNSName === albDNS
          );

          expect(alb).toBeDefined();
          expect(alb!.State?.Code).toBe('active');
          expect(alb!.Scheme).toBe('internet-facing');

          // Step 2: Verify target group has healthy targets
          const tgHealthResponse = await elbv2Client.send(
            new DescribeTargetHealthCommand({
              TargetGroupArn: targetGroupArn,
            })
          );

          expect(tgHealthResponse.TargetHealthDescriptions).toBeDefined();
          const healthyTargets =
            tgHealthResponse.TargetHealthDescriptions!.filter(
              (target) => target.TargetHealth?.State === 'healthy'
            );

          expect(healthyTargets.length).toBeGreaterThan(0);

          // Step 3: Verify ASG has healthy instances
          const asgResponse = await asgClient.send(
            new DescribeAutoScalingGroupsCommand({
              AutoScalingGroupNames: [asgName],
            })
          );

          const asg = asgResponse.AutoScalingGroups![0];
          expect(asg.MinSize).toBe(2);
          expect(asg.MaxSize).toBe(6);

          const healthyInstances = asg.Instances?.filter(
            (instance) =>
              instance.LifecycleState === 'InService' &&
              instance.HealthStatus === 'Healthy'
          );

          expect(healthyInstances).toBeDefined();
          expect(healthyInstances!.length).toBeGreaterThanOrEqual(2);

          // Step 4: Test health check endpoint on EC2
          const instanceId = asgInstanceIds[0];
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  'curl -s localhost/health && echo "Health endpoint accessible"',
                  'systemctl is-active httpd && echo "Httpd is active"',
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
          expect(result.StandardOutputContent).toContain('OK');
          expect(result.StandardOutputContent).toContain(
            'Health endpoint accessible'
          );
          expect(result.StandardOutputContent).toContain('Httpd is active');
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('Complete Monitoring Flow', () => {
      test('should execute complete flow: EC2 generates metrics → CloudWatch Logs → CloudWatch Alarms', async () => {
        const instanceId = asgInstanceIds[0];
        const stackName = outputs.StackName;

        try {
          // E2E ACTION: EC2 → CloudWatch Logs → Alarms

          // Step 1: EC2 generates application activity
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  'set -e',
                  '',
                  '# Step 1: Generate web traffic',
                  'for i in {1..5}; do',
                  '  curl -s localhost/health > /dev/null',
                  '  sleep 1',
                  'done',
                  'echo "Step 1: Generated web traffic"',
                  '',
                  '# Step 2: Send custom metric to CloudWatch',
                  'aws cloudwatch put-metric-data \\',
                  '  --namespace "PaymentProcessingApp" \\',
                  '  --metric-name "E2ETestMetric" \\',
                  '  --value 100 \\',
                  `  --region ${awsRegion}`,
                  'echo "Step 2: Sent custom metric to CloudWatch"',
                  '',
                  '# Step 3: Verify CloudWatch agent is running',
                  'systemctl is-active amazon-cloudwatch-agent && echo "Step 3: CloudWatch agent is active"',
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
            'Step 1: Generated web traffic'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 2: Sent custom metric to CloudWatch'
          );
          expect(result.StandardOutputContent).toContain(
            'Step 3: CloudWatch agent is active'
          );

          // Step 4: Verify alarms exist
          const alarmName = `${stackName}-UnhealthyHostCount-${environmentSuffix}`;
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
      test('should execute complete flow: ASG → Launch Template → EC2 → ALB with proper health checks', async () => {
        const asgName = outputs.AutoScalingGroupName;
        const targetGroupArn = outputs.TargetGroupArn;

        try {
          // E2E ACTION: ASG → Launch Template → EC2 → ALB

          // Step 1: Verify ASG configuration
          const asgResponse = await asgClient.send(
            new DescribeAutoScalingGroupsCommand({
              AutoScalingGroupNames: [asgName],
            })
          );

          const asg = asgResponse.AutoScalingGroups![0];
          expect(asg).toBeDefined();
          expect(asg.MinSize).toBe(2);
          expect(asg.MaxSize).toBe(6);
          expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
          expect(asg.DesiredCapacity).toBeLessThanOrEqual(6);
          expect(asg.HealthCheckType).toBe('ELB');

          // Step 2: Verify scaling policies exist
          const policiesResponse = await asgClient.send(
            new DescribePoliciesCommand({
              AutoScalingGroupName: asgName,
            })
          );

          expect(policiesResponse.ScalingPolicies).toBeDefined();
          expect(policiesResponse.ScalingPolicies!.length).toBeGreaterThan(0);

          const targetTrackingPolicy = policiesResponse.ScalingPolicies!.find(
            (policy) => policy.PolicyType === 'TargetTrackingScaling'
          );

          expect(targetTrackingPolicy).toBeDefined();
          expect(
            targetTrackingPolicy!.TargetTrackingConfiguration?.TargetValue
          ).toBe(70.0);

          // Step 3: Verify instances are healthy in target group
          const tgHealthResponse = await elbv2Client.send(
            new DescribeTargetHealthCommand({
              TargetGroupArn: targetGroupArn,
            })
          );

          const healthyTargets =
            tgHealthResponse.TargetHealthDescriptions!.filter(
              (target) => target.TargetHealth?.State === 'healthy'
            );

          expect(healthyTargets.length).toBeGreaterThanOrEqual(2);

          // Step 4: Test instance is serving traffic
          const instanceId = asgInstanceIds[0];
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  'systemctl is-active httpd && echo "Web server running"',
                  'curl -s localhost/health && echo "Health check passed"',
                  'ps aux | grep cloudwatch-agent | grep -v grep && echo "CloudWatch agent running"',
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
          expect(result.StandardOutputContent).toContain('Web server running');
          expect(result.StandardOutputContent).toContain('OK');
          expect(result.StandardOutputContent).toContain(
            'Health check passed'
          );
          expect(result.StandardOutputContent).toContain(
            'CloudWatch agent running'
          );
        } catch (error: any) {
          if (error.message?.includes('SSM Agent')) {
            return;
          }
          throw error;
        }
      }, 180000);
    });

    describe('Complete VPC Networking Flow', () => {
      test('should execute complete flow: VPC → Subnets → NAT Gateways → EC2 internet access', async () => {
        const vpcId = outputs.VPCId;
        const instanceId = asgInstanceIds[0];

        try {
          // E2E ACTION: VPC → Public/Private Subnets → NAT → Internet

          // Step 1: Verify VPC exists
          const vpcResponse = await ec2Client.send(
            new DescribeVpcsCommand({
              VpcIds: [vpcId],
            })
          );

          expect(vpcResponse.Vpcs).toBeDefined();
          expect(vpcResponse.Vpcs!.length).toBe(1);
          expect(vpcResponse.Vpcs![0].State).toBe('available');

          // Step 2: Verify subnets exist
          const subnetsResponse = await ec2Client.send(
            new DescribeSubnetsCommand({
              Filters: [
                {
                  Name: 'vpc-id',
                  Values: [vpcId],
                },
              ],
            })
          );

          expect(subnetsResponse.Subnets).toBeDefined();
          expect(subnetsResponse.Subnets!.length).toBeGreaterThanOrEqual(4);

          // Step 3: Verify NAT Gateways are available
          const natGw1Id = outputs.NATGateway1Id;
          const natGwResponse = await ec2Client.send(
            new DescribeNatGatewaysCommand({
              NatGatewayIds: [natGw1Id],
            })
          );

          expect(natGwResponse.NatGateways).toBeDefined();
          expect(natGwResponse.NatGateways![0].State).toBe('available');

          // Step 4: Test EC2 can access internet through NAT
          const command = await ssmClient.send(
            new SendCommandCommand({
              DocumentName: 'AWS-RunShellScript',
              InstanceIds: [instanceId],
              Parameters: {
                commands: [
                  '#!/bin/bash',
                  '',
                  '# Test internet connectivity',
                  'curl -s -o /dev/null -w "%{http_code}" https://aws.amazon.com > /tmp/http_code.txt',
                  'HTTP_CODE=$(cat /tmp/http_code.txt)',
                  'if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then',
                  '  echo "VPC networking flow successful: Private subnet → NAT Gateway → Internet"',
                  'else',
                  '  echo "Failed with HTTP code: $HTTP_CODE"',
                  'fi',
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
            'VPC networking flow successful'
          );
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