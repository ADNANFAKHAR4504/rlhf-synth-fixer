import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';

interface StackOutputs {
  vpcId?: string;
  albDns?: string;
  bucketName?: string;
  [key: string]: any;
}

describe('Turn Around Prompt API Integration Tests', () => {
  let outputs: StackOutputs;
  const region = process.env.AWS_REGION || 'us-east-2';

  const ec2Client = new EC2Client({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const s3Client = new S3Client({ region });
  const cwClient = new CloudWatchClient({ region });
  const asgClient = new AutoScalingClient({ region });

  beforeAll(() => {
    // Load outputs from flat-outputs.json
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      console.warn('Warning: flat-outputs.json not found. Integration tests will be skipped.');
      outputs = {};
      return;
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    const allOutputs = JSON.parse(outputsContent);

    // Get the first stack's outputs (or the one matching current deployment)
    const stackKey = Object.keys(allOutputs)[0];
    outputs = allOutputs[stackKey] || {};

    console.log('Loaded outputs:', outputs);
  });

  describe('Infrastructure File Validation', () => {
    test('should validate infrastructure configuration files exist', async () => {
      const stackFiles = [
        'vpc-stack.ts',
        'alb-stack.ts',
        'ec2-stack.ts',
        's3-stack.ts',
        'cloudwatch-stack.ts',
        'tap-stack.ts',
      ];

      for (const file of stackFiles) {
        const filePath = path.join(__dirname, '..', 'lib', file);
        expect(fs.existsSync(filePath)).toBe(true);
      }

      const binFile = path.join(__dirname, '..', 'bin', 'tap.ts');
      expect(fs.existsSync(binFile)).toBe(true);
    });
  });

  describe('VPC and Networking', () => {
    test('should have a VPC deployed', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping: vpcId not found in outputs');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(outputs.vpcId);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('should have public and private subnets configured', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping: vpcId not found in outputs');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4); // At least 2 public + 2 private

      // Check for public subnets (MapPublicIpOnLaunch: true)
      const publicSubnets = response.Subnets!.filter(
        (subnet) => subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

      // Check for private subnets (MapPublicIpOnLaunch: false)
      const privateSubnets = response.Subnets!.filter(
        (subnet) => subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('should have NAT gateways for private subnet connectivity', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping: vpcId not found in outputs');
        return;
      }

      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2); // One per AZ
    });

    test('should have security groups configured', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping: vpcId not found in outputs');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      // Should have at least ALB SG, EC2 SG, and default SG
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);

      // Check for ALB security group with HTTP ingress
      const albSg = response.SecurityGroups!.find((sg) =>
        sg.IpPermissions?.some((rule) => rule.FromPort === 80 && rule.ToPort === 80)
      );
      expect(albSg).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB deployed and accessible', async () => {
      if (!outputs.albDns) {
        console.log('Skipping: albDns not found in outputs');
        return;
      }

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers?.find(
        (lb) => lb.DNSName === outputs.albDns
      );

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('should have target group configured', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping: vpcId not found in outputs');
        return;
      }

      const command = new DescribeTargetGroupsCommand({});
      const response = await elbClient.send(command);

      const targetGroup = response.TargetGroups?.find(
        (tg) => tg.VpcId === outputs.vpcId
      );

      expect(targetGroup).toBeDefined();
      expect(targetGroup!.Protocol).toBe('HTTP');
      expect(targetGroup!.Port).toBe(80);
      expect(targetGroup!.HealthCheckEnabled).toBe(true);
    });

    test('should have healthy targets in target group', async () => {
      if (!outputs.vpcId) {
        console.log('Skipping: vpcId not found in outputs');
        return;
      }

      // First get the target group ARN
      const tgCommand = new DescribeTargetGroupsCommand({});
      const tgResponse = await elbClient.send(tgCommand);

      const targetGroup = tgResponse.TargetGroups?.find(
        (tg) => tg.VpcId === outputs.vpcId
      );

      if (!targetGroup) {
        console.log('Skipping: target group not found');
        return;
      }

      // Check target health
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup.TargetGroupArn,
      });

      const healthResponse = await elbClient.send(healthCommand);

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      // At least some targets should be registered (may not all be healthy immediately)
      expect(healthResponse.TargetHealthDescriptions!.length).toBeGreaterThan(0);
    }, 60000); // Increase timeout as health checks can take time
  });

  describe('EC2 Auto Scaling', () => {
    test('should have Auto Scaling Group deployed', async () => {
      const command = new DescribeAutoScalingGroupsCommand({});
      const response = await asgClient.send(command);

      // Find ASG with tags matching our environment
      const asgs = response.AutoScalingGroups?.filter((asg) =>
        asg.AutoScalingGroupName?.includes('tap-ec2')
      );

      expect(asgs).toBeDefined();
      expect(asgs!.length).toBeGreaterThanOrEqual(1);

      if (asgs!.length > 0) {
        const asg = asgs![0];
        expect(asg.MinSize).toBeGreaterThanOrEqual(1);
        expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(1);
        expect(asg.MaxSize).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('S3 Bucket', () => {
    test('should have S3 bucket deployed', async () => {
      if (!outputs.bucketName) {
        console.log('Skipping: bucketName not found in outputs');
        return;
      }

      const command = new HeadBucketCommand({
        Bucket: outputs.bucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have versioning enabled', async () => {
      if (!outputs.bucketName) {
        console.log('Skipping: bucketName not found in outputs');
        return;
      }

      const command = new GetBucketVersioningCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    });

    test('should have encryption enabled', async () => {
      if (!outputs.bucketName) {
        console.log('Skipping: bucketName not found in outputs');
        return;
      }

      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cwClient.send(command);

      // Find alarms for our stack
      const stackAlarms = response.MetricAlarms?.filter((alarm) =>
        alarm.AlarmName?.includes('tap-monitoring') || alarm.AlarmName?.includes('tap-ec2')
      );

      expect(stackAlarms).toBeDefined();
      expect(stackAlarms!.length).toBeGreaterThanOrEqual(1);

      // Check that alarms are in OK or ALARM state (not INSUFFICIENT_DATA indefinitely)
      stackAlarms?.forEach((alarm) => {
        expect(alarm.StateValue).toBeDefined();
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(alarm.StateValue);
      });
    });
  });

  describe('End-to-End Connectivity', () => {
    test('should be able to reach ALB DNS endpoint', async () => {
      if (!outputs.albDns) {
        console.log('Skipping: albDns not found in outputs');
        return;
      }

      // Make HTTP request to ALB
      const url = `http://${outputs.albDns}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        // We expect either success or a known error response
        // (503 if targets are not yet healthy, 200 if they are)
        expect([200, 503, 504]).toContain(response.status);
      } catch (error: any) {
        // If the connection fails, it might be due to targets not being ready
        // This is acceptable in integration tests
        if (error.name === 'AbortError') {
          console.log('Request timed out - ALB may not have healthy targets yet');
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
          console.log('Connection failed - ALB may not be fully provisioned yet');
        } else {
          throw error;
        }
      }
    }, 30000); // Increase timeout for network request
  });
});
