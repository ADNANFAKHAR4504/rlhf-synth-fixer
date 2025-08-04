import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeListenersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  Route53Client,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import https from 'https';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
// Assumes a JSON file with CloudFormation outputs is at the root of the project.
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs.json'), 'utf8')
);

/*
 * =================================================================
 * REQUIRED `cfn-outputs.json` KEYS
 * =================================================================
 * - WebAppURL (e.g., "https://nova.yourdomain.com")
 * - ApplicationLoadBalancerDNS (e.g., "Nova-ALB-...")
 * - ApplicationLoadBalancerArn (e.g., "arn:aws:elasticloadbalancing:...")
 * - TargetGroupArn (e.g., "arn:aws:elasticloadbalancing:...")
 * - AutoScalingGroupName (e.g., "Nova-ASG-...")
 * - EC2InstanceRoleArn (e.g., "arn:aws:iam::...")
 * - S3BucketName (e.g., "nova-app-data-...")
 * - NotificationTopicARN (e.g., "arn:aws:sns:...")
 * - VpcId (e.g., "vpc-...")
 * - PublicSubnetAId, PublicSubnetBId, PublicSubnetCId
 * - PrivateSubnetAId, PrivateSubnetBId, PrivateSubnetCId
 * - DnsName (parameter value from your deployment)
 * - HostedZoneId (parameter value from your deployment)
 * =================================================================
 */

// Initialize AWS SDK Clients - Replace 'us-east-1' with your deployment region if needed.
const region = { region: process.env.AWS_REGION || 'us-east-1' };
const ec2Client = new EC2Client(region);
const elbv2Client = new ElasticLoadBalancingV2Client(region);
const asgClient = new AutoScalingClient(region);
const s3Client = new S3Client(region);
const iamClient = new IAMClient(region);
const route53Client = new Route53Client(region);
const snsClient = new SNSClient(region);

// Increase Jest timeout for AWS async operations
jest.setTimeout(90000); // 90 seconds

describe('Nova Web App Infrastructure Integration Tests', () => {
  // --- Networking Validation ---
  describe('Networking: VPC, Subnets, and Routing', () => {
    test('VPC should exist and be available', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [outputs.VpcId] })
      );
      expect(vpcResponse.Vpcs?.length).toBe(1);
      expect(vpcResponse.Vpcs?.[0]?.State).toBe('available');
    });

    test('Should have 3 public and 3 private subnets across different AZs', async () => {
      const subnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId,
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId,
        outputs.PrivateSubnetCId,
      ];
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: subnetIds })
      );
      const allSubnets = subnetsResponse.Subnets ?? [];
      expect(allSubnets.length).toBe(6);

      const publicSubnets = allSubnets.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = allSubnets.filter(s => !s.MapPublicIpOnLaunch);
      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);

      // Verify they are in different Availability Zones
      const azSet = new Set(allSubnets.map(s => s.AvailabilityZone));
      expect(azSet.size).toBe(3);
    });

    test('Public subnets should have a route to an Internet Gateway', async () => {
      const routeTablesResponse = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [outputs.PublicSubnetAId],
            },
          ],
        })
      );
      const routes = routeTablesResponse.RouteTables?.[0]?.Routes ?? [];
      const hasIgwRoute = routes.some(
        r =>
          r.DestinationCidrBlock === '0.0.0.0/0' &&
          r.GatewayId?.startsWith('igw-')
      );
      expect(hasIgwRoute).toBe(true);
    });

    test('Private subnets should have a route to a NAT Gateway', async () => {
      const routeTablesResponse = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'association.subnet-id',
              Values: [outputs.PrivateSubnetAId],
            },
          ],
        })
      );
      const routes = routeTablesResponse.RouteTables?.[0]?.Routes ?? [];
      const hasNatRoute = routes.some(
        r =>
          r.DestinationCidrBlock === '0.0.0.0/0' &&
          r.NatGatewayId?.startsWith('nat-')
      );
      expect(hasNatRoute).toBe(true);
    });
  });

  // --- Security Validation ---
  describe('Security: IAM Roles and Encryption', () => {
    test('EC2 Instance Role should have required policies', async () => {
      const roleName = outputs.EC2InstanceRoleArn.split('/').pop();
      const response = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );
      const policyNames = (response.AttachedPolicies ?? []).map(
        p => p.PolicyName
      );
      expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
      expect(policyNames).toContain('CloudWatchAgentServerPolicy');
    });

    test('S3 Bucket should be encrypted with AES256', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: outputs.S3BucketName })
      );
      const sseRule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(sseRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });
  });

  // --- Application Load Balancer Validation ---
  describe('Load Balancing: ALB, Listener, and Target Group', () => {
    test('ALB should exist, be active, and internet-facing', async () => {
      const response = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          LoadBalancerArns: [outputs.ApplicationLoadBalancerArn],
        })
      );
      const alb = response.LoadBalancers?.[0];
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
    });

    test('ALB should have an HTTPS listener on port 443', async () => {
      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({
          LoadBalancerArn: outputs.ApplicationLoadBalancerArn,
        })
      );
      const httpsListener = (Listeners ?? []).find(l => l.Port === 443);
      expect(httpsListener).toBeDefined();
      expect(httpsListener?.Protocol).toBe('HTTPS');
      expect(httpsListener?.Certificates?.length ?? 0).toBeGreaterThan(0);
      expect(httpsListener?.DefaultActions?.[0]?.Type).toBe('forward');
    });

    test('Target Group should have healthy targets', async () => {
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.TargetGroupArn,
        })
      );
      // This is a critical check to ensure the ASG provisioned instances and they passed health checks
      expect(TargetHealthDescriptions?.length).toBeGreaterThanOrEqual(2); // Should match DesiredCapacity
      (TargetHealthDescriptions ?? []).forEach(target => {
        expect(target.TargetHealth?.State).toBe('healthy');
      });
    });
  });

  // --- Compute and Application Accessibility ---
  describe('Compute: Auto Scaling Group and Web App', () => {
    test('Auto Scaling Group should be configured correctly', async () => {
      const { AutoScalingGroups } = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.AutoScalingGroupName],
        })
      );
      const asg = AutoScalingGroups?.[0];
      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBe(2);
    });

    test('Application should be accessible via ALB DNS and return HTTP 200 with correct content', () => {
      const url = `https://${outputs.ApplicationLoadBalancerDNS}`;
      return new Promise<void>((resolve, reject) => {
        const request = https.get(
          url,
          { rejectUnauthorized: false },
          response => {
            if (response.statusCode !== 200) {
              return reject(
                new Error(`Request failed: ${response.statusCode} at ${url}`)
              );
            }
            let data = '';
            response.on('data', chunk => (data += chunk));
            response.on('end', () => {
              try {
                expect(data).toContain('Hello from Nova Web Server');
                resolve();
              } catch (error) {
                reject(error);
              }
            });
          }
        );
        request.on('error', reject);
      });
    });
  });

  // --- Storage Validation ---
  describe('Storage: S3 Bucket', () => {
    test('S3 Bucket should be private and have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioning.Status).toBe('Enabled');

      const accessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      const config = accessBlock.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  // --- DNS and Notifications ---
  describe('DNS and Notifications: Route 53 and SNS', () => {
    test('Route 53 Alias record should point to the ALB', async () => {
      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: outputs.HostedZoneId,
        })
      );
      // Route 53 FQDNs end with a period.
      const appRecord = (ResourceRecordSets ?? []).find(
        r => r.Name === `${outputs.DnsName}.`
      );
      expect(appRecord).toBeDefined();
      expect(appRecord?.Type).toBe('A');
      expect(appRecord?.AliasTarget).toBeDefined();
      // Normalize both strings for a robust comparison (lowercase, remove trailing dot)
      const aliasTargetDns = (appRecord?.AliasTarget?.DNSName ?? '')
        .toLowerCase()
        .replace(/\.$/, '');
      const albDns = outputs.ApplicationLoadBalancerDNS.toLowerCase();
      expect(aliasTargetDns).toContain(albDns);
    });

    test('SNS Topic for notifications should exist', async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.NotificationTopicARN,
        })
      );
      expect(Attributes).toBeDefined();
      expect(Attributes?.TopicArn).toBe(outputs.NotificationTopicARN);
    });
  });
});
