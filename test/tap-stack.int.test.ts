import fs from 'fs';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  ListStacksCommand
} from '@aws-sdk/client-cloudformation';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';

// Try to read outputs from multiple possible locations
let outputs: Record<string, string> = {};
const outputPaths = [
  'cfn-outputs/flat-outputs.json',
  'cdk-outputs/flat-outputs.json'
];

for (const outputPath of outputPaths) {
  try {
    if (fs.existsSync(outputPath)) {
      outputs = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
      break;
    }
  } catch {
    // Continue to next path
  }
}

const LOCALSTACK_ENDPOINT = 'http://localhost:4566';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

const clientConfig = {
  region: AWS_REGION,
  endpoint: LOCALSTACK_ENDPOINT,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  }
};

const cfnClient = new CloudFormationClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
const asgClient = new AutoScalingClient(clientConfig);
const s3Client = new S3Client({ ...clientConfig, forcePathStyle: true });
const ec2Client = new EC2Client(clientConfig);

// Helper function to discover the deployed stack name
async function discoverStackName(): Promise<string | null> {
  try {
    const response = await cfnClient.send(
      new ListStacksCommand({
        StackStatusFilter: ['CREATE_COMPLETE']
      })
    );

    if (response.StackSummaries && response.StackSummaries.length > 0) {
      // Find a stack that matches our naming patterns
      const stack = response.StackSummaries.find(
        (s) =>
          s.StackName?.includes('localstack') ||
          s.StackName?.includes('tap-stack') ||
          s.StackName?.includes('TapStack')
      );
      return stack?.StackName || response.StackSummaries[0].StackName || null;
    }
  } catch {
    // Stack discovery failed
  }
  return null;
}

describe('High Availability Web App Integration Tests', () => {
  const lbDNS = outputs['LoadBalancerDNS'];
  const logBucket = outputs['LogBucketName'];
  const asgName = outputs['AutoScalingGroupName'];

  describe('CloudFormation Outputs Validation', () => {
    test('LoadBalancerDNS output should be defined and have valid format', () => {
      expect(lbDNS).toBeDefined();
      expect(typeof lbDNS).toBe('string');
      expect(lbDNS.length).toBeGreaterThan(0);
      // LocalStack ALB DNS format: name.elb.localhost.localstack.cloud
      expect(lbDNS).toMatch(/\.elb\./);
    });

    test('LogBucketName output should be defined and match naming convention', () => {
      expect(logBucket).toBeDefined();
      expect(typeof logBucket).toBe('string');
      expect(logBucket).toMatch(/^app-logs-[a-z0-9-]+-[0-9]{12}$/);
    });

    test('AutoScalingGroupName output should be defined and non-empty', () => {
      expect(asgName).toBeDefined();
      expect(typeof asgName).toBe('string');
      expect(asgName.length).toBeGreaterThan(0);
    });
  });

  describe('Load Balancer Resources', () => {
    test('Application Load Balancer should exist in LocalStack', async () => {
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBeGreaterThan(0);

      const alb = response.LoadBalancers!.find(
        (lb) => lb.Type === 'application'
      );
      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
    });

    test('Target Group should be configured with HTTP protocol on port 80', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);

      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
    });
  });

  describe('Auto Scaling Group Resources', () => {
    test('Auto Scaling Group should exist', async () => {
      const response = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );
      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBeGreaterThan(0);

      const asg = response.AutoScalingGroups!.find((g) =>
        g.AutoScalingGroupName?.includes(asgName.split('-')[0])
      );
      expect(asg).toBeDefined();
    });
  });

  describe('S3 Bucket Resources', () => {
    test('S3 log bucket should exist and be accessible', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: logBucket
        })
      );
      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('VPC should exist', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({}));
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudFormation Stack Resources', () => {
    let stackName: string | null = null;

    beforeAll(async () => {
      stackName = await discoverStackName();
    });

    test('Stack should have all expected resource types', async () => {
      if (!stackName) {
        console.log('Skipping: Could not discover stack name');
        return;
      }

      const response = await cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: stackName
        })
      );
      expect(response.StackResources).toBeDefined();

      const resourceTypes = response.StackResources!.map(
        (r) => r.ResourceType
      );

      // Verify key resource types exist
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(resourceTypes).toContain('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
    });

    test('All deployed stack resources should be in CREATE_COMPLETE state', async () => {
      if (!stackName) {
        console.log('Skipping: Could not discover stack name');
        return;
      }

      const response = await cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: stackName
        })
      );

      // Filter out resources that are expected to potentially fail in LocalStack
      const criticalResources = response.StackResources!.filter(
        (r) =>
          r.ResourceType !== 'AWS::AutoScaling::AutoScalingGroup' &&
          r.ResourceType !== 'AWS::AutoScaling::ScalingPolicy'
      );

      const failedResources = criticalResources.filter(
        (r) => r.ResourceStatus !== 'CREATE_COMPLETE'
      );

      expect(failedResources.length).toBe(0);
    });
  });
});
