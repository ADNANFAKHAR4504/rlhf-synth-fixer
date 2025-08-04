// Import AWS SDK v3 clients
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

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

/*
 * =================================================================
 * REQUIRED `cfn-outputs.json` KEYS
 * =================================================================
 * For this test suite to run successfully, your cfn-outputs.json
 * file MUST contain the following keys from your CloudFormation stack:
 *
 * - ALBDNSName (e.g., "IaC-AWS-Nova-Model-ALB-1234567890.us-west-2.elb.amazonaws.com")
 * - ALBArn (e.g., "arn:aws:elasticloadbalancing:us-west-2:...")
 * - ALBTargetGroupArn (e.g., "arn:aws:elasticloadbalancing:us-west-2:...")
 * - S3AssetBucketName (e.g., "iac-aws-nova-model-assets-123456789012-...")
 * - SNSTopicArn (e.g., "arn:aws:sns:us-west-2:...")
 * - ASGName (e.g., "IaC-AWS-Nova-Model-ASG")
 * - DomainName (e.g., "app.example.com")
 * - HostedZoneId (e.g., "Z2FDTNDATAQYW2")
 * - EC2InstanceRoleArn (e.g., "arn:aws:iam::123456789012:role/...")
 * - PublicSubnet1, PublicSubnet2, PublicSubnet3 (e.g., "subnet-...")
 * - PrivateSubnet1, PrivateSubnet2, PrivateSubnet3 (e.g., "subnet-...")
 * =================================================================
 */

// Initialize AWS SDK Clients
const region = { region: 'us-west-2' };
const ec2Client = new EC2Client(region);
const elbv2Client = new ElasticLoadBalancingV2Client(region);
const asgClient = new AutoScalingClient(region);
const s3Client = new S3Client(region);
const iamClient = new IAMClient(region);
const route53Client = new Route53Client(region);
const snsClient = new SNSClient(region);

// Increase Jest timeout for AWS async operations
jest.setTimeout(60000); // 60 seconds

describe('IaC-AWS-Nova-Model Infrastructure Integration Tests', () => {
  // --- Networking Validation ---
  describe('Networking: VPC, Subnets, and Routing', () => {
    test('VPC should exist and be available', async () => {
      // The VPC ID is inferred from the subnet outputs
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [outputs.PublicSubnet1],
        })
      );
      const vpcId = subnetResponse.Subnets[0].VpcId;
      expect(vpcId).toBeDefined();

      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );
      expect(vpcResponse.Vpcs.length).toBe(1);
      expect(vpcResponse.Vpcs[0].State).toBe('available');
    });

    test('Should have 3 public and 3 private subnets', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1,
        outputs.PublicSubnet2,
        outputs.PublicSubnet3,
      ];
      const privateSubnetIds = [
        outputs.PrivateSubnet1,
        outputs.PrivateSubnet2,
        outputs.PrivateSubnet3,
      ];

      const allSubnets = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [...publicSubnetIds, ...privateSubnetIds],
        })
      );

      const publicSubnets = allSubnets.Subnets.filter(
        s => s.MapPublicIpOnLaunch
      );
      const privateSubnets = allSubnets.Subnets.filter(
        s => !s.MapPublicIpOnLaunch
      );

      expect(publicSubnets.length).toBe(3);
      expect(privateSubnets.length).toBe(3);
    });

    test('Public subnets should have a route to the Internet Gateway', async () => {
      const routeTables = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            { Name: 'association.subnet-id', Values: [outputs.PublicSubnet1] },
          ],
        })
      );
      const hasIgwRoute = routeTables.RouteTables[0].Routes.some(
        r => r.GatewayId && r.GatewayId.startsWith('igw-')
      );
      expect(hasIgwRoute).toBe(true);
    });
  });

  // --- Application Load Balancer Validation ---
  describe('Load Balancing: ALB, Listeners, and Target Group', () => {
    test('ALB should exist and be active', async () => {
      const response = await elbv2Client.send(
        new DescribeLoadBalancersCommand({ LoadBalancerArns: [outputs.ALBArn] })
      );
      expect(response.LoadBalancers.length).toBe(1);
      expect(response.LoadBalancers[0].State.Code).toBe('active');
      expect(response.LoadBalancers[0].Scheme).toBe('internet-facing');
    });

    test('ALB should have HTTP->HTTPS redirect and HTTPS forward listeners', async () => {
      const { Listeners } = await elbv2Client.send(
        new DescribeListenersCommand({ LoadBalancerArn: outputs.ALBArn })
      );

      const httpListener = Listeners.find(l => l.Port === 80);
      const httpsListener = Listeners.find(l => l.Port === 443);

      expect(httpListener).toBeDefined();
      expect(httpListener.DefaultActions[0].Type).toBe('redirect');
      expect(httpListener.DefaultActions[0].RedirectConfig.Protocol).toBe(
        'HTTPS'
      );

      expect(httpsListener).toBeDefined();
      expect(httpsListener.DefaultActions[0].Type).toBe('forward');
      expect(httpsListener.Certificates.length).toBeGreaterThan(0);
    });

    test('Target Group should exist and targets should be healthy', async () => {
      const { TargetGroups } = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          TargetGroupArns: [outputs.ALBTargetGroupArn],
        })
      );
      expect(TargetGroups.length).toBe(1);

      const { TargetHealthDescriptions } = await elbv2Client.send(
        new DescribeTargetHealthCommand({
          TargetGroupArn: outputs.ALBTargetGroupArn,
        })
      );
      // This check is critical to ensure the ASG has provisioned instances.
      expect(TargetHealthDescriptions.length).toBeGreaterThan(0);

      // This validates that the EC2 instances, security groups, and UserData script are all working.
      TargetHealthDescriptions.forEach(target => {
        expect(target.TargetHealth.State).toBe('healthy');
      });
    });
  });

  // --- Compute and Application Accessibility ---
  describe('Compute: ASG and Web Application Accessibility', () => {
    test('Auto Scaling Group should be configured correctly', async () => {
      const { AutoScalingGroups } = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [outputs.ASGName],
        })
      );
      const asg = AutoScalingGroups[0];
      expect(asg).toBeDefined();
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
    });

    // CORRECTED: This test is now more robust.
    test('Application should be accessible via ALB DNS and return HTTP 200', () => {
      const url = `https://${outputs.ALBDNSName}`;

      // Return the promise to Jest to handle async operation correctly.
      return new Promise((resolve, reject) => {
        const req = https.get(url, { rejectUnauthorized: false }, res => {
          // Explicitly reject on non-200 status codes for clearer test failures.
          if (res.statusCode !== 200) {
            res.resume(); // Consume response data to free up memory.
            return reject(
              new Error(
                `Request failed with status code: ${res.statusCode} at ${url}`
              )
            );
          }

          let data = '';
          res.on('data', chunk => (data += chunk));

          // When the response ends, check the content.
          res.on('end', () => {
            try {
              expect(data).toContain(
                'Welcome to the IaC-AWS-Nova-Model Application'
              );
              resolve(); // Resolve the promise on successful assertion.
            } catch (error) {
              reject(error); // Reject if the assertion fails.
            }
          });
        });

        // Handle underlying network errors.
        req.on('error', err => {
          reject(new Error(`Failed to access application: ${err.message}`));
        });
      });
    });
  });

  // --- Storage Validation ---
  describe('Storage: S3 Bucket', () => {
    test('S3 Bucket should exist, be private, and have versioning enabled', async () => {
      const bucketName = outputs.S3AssetBucketName;

      const versioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioning.Status).toBe('Enabled');

      const accessBlock = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: bucketName })
      );
      expect(accessBlock.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(
        true
      );
      expect(
        accessBlock.PublicAccessBlockConfiguration.RestrictPublicBuckets
      ).toBe(true);
    });
  });

  // --- DNS and Notifications ---
  describe('DNS and Notifications: Route 53 and SNS', () => {
    // CORRECTED: This test now uses a more robust check for the DNS name.
    test('Route 53 Alias record should point to the ALB', async () => {
      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: outputs.HostedZoneId,
        })
      );

      // Route 53 FQDNs end with a period.
      const appRecord = ResourceRecordSets.find(
        r => r.Name === `${outputs.DomainName}.`
      );

      expect(appRecord).toBeDefined();
      expect(appRecord.Type).toBe('A');
      expect(appRecord.AliasTarget).toBeDefined();

      // The AliasTarget DNS name from the API may have a "dualstack." prefix and ends with a ".".
      // We normalize both strings for a robust comparison.
      const aliasTargetDns = appRecord.AliasTarget.DNSName.toLowerCase();
      const albDns = outputs.ALBDNSName.toLowerCase();

      // Check that the core ALB DNS name is present in the alias target.
      // This is more reliable than checking for an exact match.
      expect(aliasTargetDns).toContain(
        albDns.endsWith('.') ? albDns.slice(0, -1) : albDns
      );
    });

    test('SNS Topic for notifications should exist', async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.SNSTopicArn })
      );
      expect(Attributes).toBeDefined();
      expect(Attributes.TopicArn).toBe(outputs.SNSTopicArn);
    });
  });
});
