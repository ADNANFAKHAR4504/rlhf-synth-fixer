import { EC2Client, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
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
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import {
  Route53Client,
  ListResourceRecordSetsCommand,
} from '@aws-sdk/client-route-53';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import https from 'https';
import fs from 'fs';
import path from 'path';

// --- Configuration ---
// Create this file by running `aws cloudformation describe-stacks --stack-name YourStackName --query "Stacks[0].Outputs"`
// and formatting the output as a simple key-value JSON object.
const outputs: { [key: string]: string } = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs.json'), 'utf8')
);

/*
 * =================================================================
 * REQUIRED `cfn-outputs.json` KEYS
 * =================================================================
 * - ALBDNSName
 * - ApplicationS3BucketName
 * - NotificationSNSTopicArn
 * - Route53DomainName
 *
 * The following values must be retrieved from your stack's resources/parameters
 * and added manually to the cfn-outputs.json file for the tests to run:
 * - HostedZoneId (from your parameters)
 * - EC2InstanceRoleName (e.g., "novamodel-prod-ec2role")
 * - AutoScalingGroupName (e.g., "novamodel-prod-asg")
 * - TargetGroupArn (e.g., "arn:aws:elasticloadbalancing:...")
 * - ApplicationLoadBalancerArn (e.g., "arn:aws:elasticloadbalancing:...")
 * =================================================================
 */

// Initialize AWS SDK Clients - Replace 'us-west-2' with your deployment region if needed.
const region = { region: process.env.AWS_REGION || 'us-west-2' };
const ec2Client = new EC2Client(region);
const elbv2Client = new ElasticLoadBalancingV2Client(region);
const asgClient = new AutoScalingClient(region);
const s3Client = new S3Client(region);
const iamClient = new IAMClient(region);
const route53Client = new Route53Client(region);
const snsClient = new SNSClient(region);

// Increase Jest timeout for AWS async operations
jest.setTimeout(90000); // 90 seconds

describe('AWS Nova Model Infrastructure Integration Tests', () => {
  // --- Security Validation ---
  describe('Security: IAM Role and S3 Bucket Policies', () => {
    test('EC2 Instance Role should exist and be assumable by EC2', async () => {
      const response = await iamClient.send(
        new GetRoleCommand({ RoleName: outputs.EC2InstanceRoleName })
      );
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role?.AssumeRolePolicyDocument ?? '{}')
      );
      expect(response.Role).toBeDefined();
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
    });

    test('S3 Bucket should block all public access', async () => {
      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: outputs.ApplicationS3BucketName,
        })
      );
      const config = response.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  // --- Storage Validation ---
  describe('Storage: S3 Bucket Encryption and Versioning', () => {
    test('S3 Bucket should be encrypted with AES256', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.ApplicationS3BucketName,
        })
      );
      const sseRule = response.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(sseRule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe(
        'AES256'
      );
    });

    test('S3 Bucket should have versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.ApplicationS3BucketName,
        })
      );
      expect(response.Status).toBe('Enabled');
    });
  });

  // --- Application Load Balancer Validation ---
  describe('Load Balancing: ALB, Listeners, and Target Group', () => {
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

    test('ALB should have an HTTPS listener and an HTTP redirect listener', async () => {
      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({
          LoadBalancerArn: outputs.ApplicationLoadBalancerArn,
        })
      );
      const httpsListener = Listeners?.find(l => l.Port === 443);
      const httpListener = Listeners?.find(l => l.Port === 80);

      expect(httpsListener?.Protocol).toBe('HTTPS');
      expect(httpsListener?.DefaultActions?.[0]?.Type).toBe('forward');

      expect(httpListener?.Protocol).toBe('HTTP');
      expect(httpListener?.DefaultActions?.[0]?.Type).toBe('redirect');
    });

    test('Target Group should have healthy targets', async () => {
      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.TargetGroupArn,
        })
      );
      // This is a critical check to ensure the ASG provisioned instances and they passed health checks
      expect(TargetHealthDescriptions?.length).toBeGreaterThanOrEqual(1); // Should be at least MinSize
      (TargetHealthDescriptions ?? []).forEach(target => {
        expect(target.TargetHealth?.State).toBe('healthy');
      });
    });
  });

  // --- Compute and Application Accessibility ---
  describe('Compute: Auto Scaling Group and Web App', () => {
    test('Auto Scaling Group should have correct capacity settings', async () => {
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

    test('Application should be accessible via custom domain and return HTTP 200', () => {
      const url = `https://${outputs.Route53DomainName}`;
      return new Promise<void>((resolve, reject) => {
        const request = https.get(
          url,
          // In a real scenario with a trusted cert, you wouldn't need this.
          // For self-signed or test certs, this is necessary.
          { rejectUnauthorized: false },
          response => {
            if (response.statusCode !== 200) {
              return reject(
                new Error(`Request failed: ${response.statusCode} at ${url}`)
              );
            }
            // If the connection is successful, the test passes.
            // We don't check for specific body content as we haven't deployed an app.
            resolve();
          }
        );
        request.on('error', reject);
      });
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
      const appRecord = ResourceRecordSets?.find(
        r => r.Name === `${outputs.Route53DomainName}.`
      );
      expect(appRecord).toBeDefined();
      expect(appRecord?.Type).toBe('A');
      expect(appRecord?.AliasTarget).toBeDefined();

      // Normalize both strings for a robust comparison (lowercase, remove trailing dot)
      const aliasTargetDns = (appRecord?.AliasTarget?.DNSName ?? '')
        .toLowerCase()
        .replace(/\.$/, '');
      const albDns = outputs.ALBDNSName.toLowerCase();
      expect(aliasTargetDns).toBe(albDns);
    });

    test('SNS Topic for notifications should exist', async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: outputs.NotificationSNSTopicArn,
        })
      );
      expect(Attributes).toBeDefined();
      expect(Attributes?.TopicArn).toBe(outputs.NotificationSNSTopicArn);
    });
  });
});
