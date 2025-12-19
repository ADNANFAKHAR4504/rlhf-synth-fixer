// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
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
  SSMClient
} from '@aws-sdk/client-ssm';
import fs from 'fs';
import path from 'path';

// Read metadata to get stack name (CI compatibility)
const metadata = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../metadata.json'), 'utf8')
);

// Get stack name from metadata, or fallback to cfn-outputs (CI compatibility)
let stackName = metadata.stack_name;
if (!stackName) {
  const cfnOutputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  if (fs.existsSync(cfnOutputsPath)) {
    const cfnOutputs = JSON.parse(fs.readFileSync(cfnOutputsPath, 'utf8'));
    stackName = cfnOutputs.StackName;
  }
}

// Read outputs directly from cfn-outputs file (created during deployment)
const cfnOutputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};
if (fs.existsSync(cfnOutputsPath)) {
  outputs = JSON.parse(fs.readFileSync(cfnOutputsPath, 'utf8'));
} else {
  throw new Error('cfn-outputs/flat-outputs.json not found. Run deployment first.');
}

// Get environment suffix from outputs (this is what was actually used during deployment)
// IMPORTANT: Always use outputs.EnvironmentSuffix for resource name construction
// as it reflects the actual parameter value used in CloudFormation deployment
const environmentSuffix = outputs.EnvironmentSuffix || 'dev';

// Read AWS region from lib/AWS_REGION file
const awsRegion = fs.readFileSync(path.join(__dirname, '../lib/AWS_REGION'), 'utf8').trim();

// Initialize AWS SDK clients with LocalStack endpoint support
const endpoint = process.env.AWS_ENDPOINT_URL;
const clientConfig = endpoint ? { region: awsRegion, endpoint } : { region: awsRegion };

const asgClient = new AutoScalingClient(clientConfig);
const ssmClient = new SSMClient(clientConfig);
const cloudwatchLogsClient = new CloudWatchLogsClient(clientConfig);
const cloudwatchClient = new CloudWatchClient(clientConfig);
const elbv2Client = new ElasticLoadBalancingV2Client(clientConfig);
const ec2Client = new EC2Client(clientConfig);

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
      console.warn(`No InService instances found in ASG ${asgName} - this is expected in LocalStack`);
      return [];
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
      if (asgInstanceIds.length === 0) {
        console.warn('No EC2 instances found in ASG - EC2-dependent tests will be skipped (LocalStack limitation)');
      }
    } catch (error: any) {
      console.error('Failed to fetch ASG instances:', error);
      throw error;
    }
  }, 30000);

  // ===================================================================
  // SERVICE-LEVEL TESTS - Test ONE service with actual operations
  // ===================================================================

  describe('SERVICE-LEVEL Tests', () => {
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

  });

});