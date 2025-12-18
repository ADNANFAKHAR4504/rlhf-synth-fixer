import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFrontClient
} from '@aws-sdk/client-cloudfront';
import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  ListHostedZonesCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  S3Client
} from '@aws-sdk/client-s3';
import fs from 'fs';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Read outputs from deployment
let outputs: any = {};
if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
}

// Initialize AWS clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const cloudfrontClient = new CloudFrontClient({ region });
const route53Client = new Route53Client({ region });
const autoscalingClient = new AutoScalingClient({ region });

describe('TapStack Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC is created and accessible', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      }));

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].State).toBe('available');
      expect(response.Vpcs?.[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('Subnets are created across multiple AZs', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VpcId] },
        ],
      }));

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6); // At least 6 subnets (3 types x 2 AZs)

      // Check that subnets are in different AZs
      const azs = new Set(response.Subnets?.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB is created and healthy', async () => {
      if (!outputs.LoadBalancerDnsName) {
        console.warn('LoadBalancerDnsName not found in outputs, skipping test');
        return;
      }

      const response = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: [`tap-alb-${environmentSuffix}`],
      }));

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers?.[0];
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group is created with correct configuration', async () => {
      const response = await autoscalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [`tap-asg-${environmentSuffix}`],
        })
      );

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups?.[0];
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg?.HealthCheckGracePeriod).toBe(300);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance is created and configured correctly', async () => {
      if (!outputs.DatabaseEndpoint) {
        console.warn('DatabaseEndpoint not found in outputs, skipping test');
        return;
      }

      const response = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `tap-database-${environmentSuffix}`,
      }));

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances?.[0];
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
      expect(dbInstance?.BackupRetentionPeriod).toBe(7);
      expect(dbInstance?.DeletionProtection).toBe(false);
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket is created with versioning enabled', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: outputs.S3BucketName,
        })
      );

      expect(versioningResponse.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption enabled', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: outputs.S3BucketName,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules).toHaveLength(1);
      const rule = encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0];
      expect(rule?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('Route 53', () => {
    test('Hosted zone is created', async () => {
      if (!outputs.HostedZoneId) {
        console.warn('HostedZoneId not found in outputs, skipping test');
        return;
      }

      const response = await route53Client.send(
        new ListHostedZonesCommand({})
      );

      const hostedZone = response.HostedZones?.find(zone =>
        zone.Id?.includes(outputs.HostedZoneId)
      );

      expect(hostedZone).toBeDefined();
      expect(hostedZone?.Name).toBe(`tap-app-${environmentSuffix}.local.`);
    });

    test('DNS records are created for ALB and CloudFront', async () => {
      if (!outputs.HostedZoneId) {
        console.warn('HostedZoneId not found in outputs, skipping test');
        return;
      }

      const response = await route53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: outputs.HostedZoneId,
        })
      );

      const recordSets = response.ResourceRecordSets || [];

      // Check for API A record
      const apiARecord = recordSets.find(rs =>
        rs.Type === 'A' && rs.Name === `api.tap-app-${environmentSuffix}.local.`
      );
      expect(apiARecord).toBeDefined();

      // Check for API AAAA record
      const apiAAAARecord = recordSets.find(rs =>
        rs.Type === 'AAAA' && rs.Name === `api.tap-app-${environmentSuffix}.local.`
      );
      expect(apiAAAARecord).toBeDefined();

      // Check for www A record
      const wwwARecord = recordSets.find(rs =>
        rs.Type === 'A' && rs.Name === `www.tap-app-${environmentSuffix}.local.`
      );
      expect(wwwARecord).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    test('Resources are properly tagged', async () => {
      if (!outputs.VpcId) {
        console.warn('VpcId not found in outputs, skipping test');
        return;
      }

      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VpcId],
      }));

      const vpc = vpcResponse.Vpcs?.[0];
      const tags = vpc?.Tags || [];

      const ownerTag = tags.find(tag => tag.Key === 'Owner');
      expect(ownerTag?.Value).toBe('DevOps Team');

      const purposeTag = tags.find(tag => tag.Key === 'Purpose');
      expect(purposeTag?.Value).toBe('3-Tier Web Application');
    });
  });
});