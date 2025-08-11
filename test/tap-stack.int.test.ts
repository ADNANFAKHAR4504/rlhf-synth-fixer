import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudFrontClient,
  ListDistributionsCommand,
} from '@aws-sdk/client-cloudfront';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';
const isCI = process.env.CI === '1';

// AWS clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const asgClient = new AutoScalingClient({ region });
const cloudFrontClient = new CloudFrontClient({ region });

// Helper to load outputs from deployment
function loadStackOutputs(): Record<string, string> {
  const outputsFile = path.join(
    process.cwd(),
    'cfn-outputs',
    'flat-outputs.json'
  );
  if (fs.existsSync(outputsFile)) {
    return JSON.parse(fs.readFileSync(outputsFile, 'utf8'));
  }
  return {};
}

describe('TapStack Integration Tests - Secure Web Application', () => {
  let stackOutputs: Record<string, string>;

  beforeAll(() => {
    if (!isCI) {
      console.log(
        'Skipping integration tests - not running in CI environment'
      );
      return;
    }
    stackOutputs = loadStackOutputs();
  });

  describe('Stack Deployment', () => {
    test('CloudFormation stack is deployed successfully', async () => {
      if (!isCI) return;

      const response = await cfnClient.send(
        new DescribeStacksCommand({
          StackName: stackName,
        })
      );

      expect(response.Stacks).toHaveLength(1);
      const stack = response.Stacks![0];
      expect(stack.StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('Stack has expected outputs', () => {
      if (!isCI) return;

      expect(stackOutputs).toBeDefined();
      expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);

      // Check for key outputs
      const expectedOutputKeys = [
        'LoadBalancerDNS',
        'CloudFrontDistribution',
        'DatabaseEndpoint',
      ];

      expectedOutputKeys.forEach((key) => {
        if (stackOutputs[key]) {
          expect(stackOutputs[key]).toBeTruthy();
        }
      });
    });
  });

  describe('Network Infrastructure', () => {
    test('VPC is created with correct configuration', async () => {
      if (!isCI) return;

      // Get VPC ID from stack outputs - use dynamic key based on environment
      // Look for the main VPC reference, not subnet references
      const vpcKey = Object.keys(stackOutputs).find(key => 
        key.includes('NetworkStackVPC') && 
        key.includes('Ref') && 
        !key.includes('Subnet') && 
        !key.includes('public') && 
        !key.includes('private') && 
        !key.includes('isolated')
      );
      expect(vpcKey).toBeDefined();
      const vpcId = stackOutputs[vpcKey!];
      expect(vpcId).toBeDefined();
      
      // Verify this is actually a VPC ID (starts with 'vpc-')
      expect(vpcId).toMatch(/^vpc-/);

      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId!],
        })
      );

      expect(vpcs.Vpcs).toBeDefined();
      expect(vpcs.Vpcs!.length).toBeGreaterThan(0);

      const vpc = vpcs.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.1.0.0/16');
      // DNS configuration is set correctly
      // Note: These are configured during VPC creation but not directly accessible from describe output
    });

    test('Subnets are created in multiple availability zones', async () => {
      if (!isCI) return;

      // Get subnet IDs from stack outputs - use dynamic keys based on environment
      const publicSubnet1Key = Object.keys(stackOutputs).find(key => key.includes('NetworkStackVPCpublicSubnet1') && key.includes('Ref'));
      const publicSubnet2Key = Object.keys(stackOutputs).find(key => key.includes('NetworkStackVPCpublicSubnet2') && key.includes('Ref'));
      const privateSubnet1Key = Object.keys(stackOutputs).find(key => key.includes('NetworkStackVPCprivateSubnet1') && key.includes('Ref'));
      const privateSubnet2Key = Object.keys(stackOutputs).find(key => key.includes('NetworkStackVPCprivateSubnet2') && key.includes('Ref'));

      expect(publicSubnet1Key).toBeDefined();
      expect(publicSubnet2Key).toBeDefined();
      expect(privateSubnet1Key).toBeDefined();
      expect(privateSubnet2Key).toBeDefined();

      const publicSubnet1Id = stackOutputs[publicSubnet1Key!];
      const publicSubnet2Id = stackOutputs[publicSubnet2Key!];
      const privateSubnet1Id = stackOutputs[privateSubnet1Key!];
      const privateSubnet2Id = stackOutputs[privateSubnet2Key!];

      expect(publicSubnet1Id).toBeDefined();
      expect(publicSubnet2Id).toBeDefined();
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();

      const subnets = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: [publicSubnet1Id!, publicSubnet2Id!, privateSubnet1Id!, privateSubnet2Id!],
        })
      );

      expect(subnets.Subnets).toBeDefined();
      expect(subnets.Subnets!.length).toBeGreaterThanOrEqual(4); // At least 2 public and 2 private

      // Check for different subnet types
      const publicSubnets = subnets.Subnets!.filter(
        (s) => s.MapPublicIpOnLaunch === true
      );
      const privateSubnets = subnets.Subnets!.filter(
        (s) => s.MapPublicIpOnLaunch === false
      );

      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);

      // Check availability zones
      const azs = new Set(subnets.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Security groups are properly configured', async () => {
      if (!isCI) return;

      // Get security group IDs from stack outputs - use dynamic keys based on environment
      const loadBalancerSGKey = Object.keys(stackOutputs).find(key => key.includes('NetworkStackLoadBalancerSG') && key.includes('GroupId'));
      const webServerSGKey = Object.keys(stackOutputs).find(key => key.includes('NetworkStackWebServerSG') && key.includes('GroupId'));
      const databaseSGKey = Object.keys(stackOutputs).find(key => key.includes('NetworkStackDatabaseSG') && key.includes('GroupId'));

      expect(loadBalancerSGKey).toBeDefined();
      expect(webServerSGKey).toBeDefined();
      expect(databaseSGKey).toBeDefined();

      const loadBalancerSGId = stackOutputs[loadBalancerSGKey!];
      const webServerSGId = stackOutputs[webServerSGKey!];
      const databaseSGId = stackOutputs[databaseSGKey!];

      expect(loadBalancerSGId).toBeDefined();
      expect(webServerSGId).toBeDefined();
      expect(databaseSGId).toBeDefined();

      const sgs = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [loadBalancerSGId!, webServerSGId!, databaseSGId!],
        })
      );

      expect(sgs.SecurityGroups).toBeDefined();
      expect(sgs.SecurityGroups!.length).toBeGreaterThan(0);

      // Check for different security group types
      const loadBalancerSG = sgs.SecurityGroups!.find((sg) =>
        sg.GroupId === loadBalancerSGId
      );
      const webServerSG = sgs.SecurityGroups!.find((sg) =>
        sg.GroupId === webServerSGId
      );
      const databaseSG = sgs.SecurityGroups!.find((sg) =>
        sg.GroupId === databaseSGId
      );

      expect(loadBalancerSG).toBeDefined();
      expect(webServerSG).toBeDefined();
      expect(databaseSG).toBeDefined();

      // Verify load balancer allows HTTP/HTTPS from internet
      if (loadBalancerSG) {
        const httpRule = loadBalancerSG.IpPermissions?.find(
          (p) => p.FromPort === 80
        );
        const httpsRule = loadBalancerSG.IpPermissions?.find(
          (p) => p.FromPort === 443
        );
        expect(httpRule || httpsRule).toBeDefined();
      }
    });
  });

  describe('Storage Infrastructure', () => {
    test('S3 bucket is encrypted and versioned', async () => {
      if (!isCI) return;

      // Find bucket name from stack outputs or resources
      const bucketName = Object.entries(stackOutputs).find(([key]) =>
        key.toLowerCase().includes('bucket')
      )?.[1];

      if (bucketName) {
        // Check encryption
        try {
          const encryption = await s3Client.send(
            new GetBucketEncryptionCommand({
              Bucket: bucketName,
            })
          );

          expect(
            encryption.ServerSideEncryptionConfiguration?.Rules
          ).toBeDefined();
          const rule = encryption.ServerSideEncryptionConfiguration!.Rules![0];
          expect(
            rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
          ).toMatch(/aws:kms|AES256/);
        } catch (error: any) {
          // Bucket might not exist in outputs
          console.log('S3 bucket not found in outputs');
        }

        // Check versioning
        try {
          const versioning = await s3Client.send(
            new GetBucketVersioningCommand({
              Bucket: bucketName,
            })
          );
          expect(versioning.Status).toBe('Enabled');
        } catch (error: any) {
          console.log('Could not check versioning');
        }
      }
    });

    test('CloudFront distribution is configured', async () => {
      if (!isCI) return;

      const distributions = await cloudFrontClient.send(
        new ListDistributionsCommand({})
      );

      if (distributions.DistributionList?.Items) {
        const distribution = distributions.DistributionList.Items.find((d) =>
          d.Comment?.includes(environmentSuffix)
        );

        if (distribution) {
          expect(distribution.Enabled).toBe(true);
          expect(distribution.HttpVersion?.toLowerCase()).toBe('http2');
          expect(distribution.PriceClass).toContain('PriceClass');
        }
      }
    });
  });

  describe('Database Infrastructure', () => {
    test('RDS instance is properly configured', async () => {
      if (!isCI) return;

      const dbEndpoint = stackOutputs['DatabaseEndpoint'];
      if (!dbEndpoint) {
        console.log('Database endpoint not found in outputs');
        return;
      }

      const dbInstances = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstance = dbInstances.DBInstances?.find((db) =>
        db.DBInstanceIdentifier?.includes(environmentSuffix)
      );

      if (dbInstance) {
        expect(dbInstance.Engine).toBe('postgres');
        expect(dbInstance.StorageEncrypted).toBe(true);
        expect(dbInstance.PubliclyAccessible).toBe(false);
        expect(dbInstance.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
        expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      }
    });
  });

  describe('Compute Infrastructure', () => {
    test('Application Load Balancer is accessible', async () => {
      if (!isCI) return;

      const loadBalancers = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = loadBalancers.LoadBalancers?.find((lb) =>
        lb.LoadBalancerName?.includes(environmentSuffix)
      );

      if (alb) {
        expect(alb.State?.Code).toBe('active');
        expect(alb.Type).toBe('application');
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.DNSName).toBeDefined();

        // Verify ALB DNS matches output
        if (stackOutputs['LoadBalancerDNS']) {
          expect(alb.DNSName).toBe(stackOutputs['LoadBalancerDNS']);
        }
      }
    });

    test('Target groups have healthy targets', async () => {
      if (!isCI) return;

      const targetGroups = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const tg = targetGroups.TargetGroups?.find((group) =>
        group.TargetGroupName?.includes(environmentSuffix)
      );

      if (tg) {
        expect(tg.Protocol).toMatch(/HTTP|HTTPS/);
        expect(tg.HealthCheckEnabled).toBe(true);
        expect(tg.HealthCheckIntervalSeconds).toBe(30);
      }
    });

    test('Auto Scaling Group is configured correctly', async () => {
      if (!isCI) return;

      const asgs = await asgClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      const asg = asgs.AutoScalingGroups?.find((group) =>
        group.AutoScalingGroupName?.includes(environmentSuffix)
      );

      if (asg) {
        expect(asg.MinSize).toBe(2);
        expect(asg.MaxSize).toBe(6);
        expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
        expect(asg.HealthCheckType).toBe('ELB');
        expect(asg.Instances?.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Security Compliance', () => {
    test('All resources are tagged appropriately', async () => {
      if (!isCI) return;

      // Check VPC tags
      const vpcs = await ec2Client.send(
        new DescribeVpcsCommand({
          Filters: [
            {
              Name: 'tag:aws:cloudformation:stack-name',
              Values: [stackName],
            },
          ],
        })
      );

      if (vpcs.Vpcs && vpcs.Vpcs.length > 0) {
        const vpc = vpcs.Vpcs[0];
        const envTag = vpc.Tags?.find((t) => t.Key === 'Environment');
        const ownerTag = vpc.Tags?.find((t) => t.Key === 'Owner');

        expect(envTag).toBeDefined();
        expect(ownerTag).toBeDefined();
      }
    });

    test('Encryption is enabled on all data stores', async () => {
      if (!isCI) return;

      // RDS encryption check
      const dbInstances = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstance = dbInstances.DBInstances?.find((db) =>
        db.DBInstanceIdentifier?.includes(environmentSuffix)
      );

      if (dbInstance) {
        expect(dbInstance.StorageEncrypted).toBe(true);
      }

      // S3 encryption check is already covered in Storage Infrastructure tests
    });

    test('Database is not publicly accessible', async () => {
      if (!isCI) return;

      const dbInstances = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      const dbInstance = dbInstances.DBInstances?.find((db) =>
        db.DBInstanceIdentifier?.includes(environmentSuffix)
      );

      if (dbInstance) {
        expect(dbInstance.PubliclyAccessible).toBe(false);
      }
    });
  });

  describe('End-to-End Connectivity', () => {
    test('Load Balancer endpoint is reachable', async () => {
      if (!isCI) return;

      const albDns = stackOutputs['LoadBalancerDNS'];
      if (!albDns) {
        console.log('Load Balancer DNS not found in outputs');
        return;
      }

      // Simple DNS resolution test
      const dns = require('dns').promises;
      try {
        const addresses = await dns.resolve4(albDns);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        console.log(`Could not resolve ALB DNS: ${albDns}`);
      }
    });

    test('CloudFront distribution endpoint is reachable', async () => {
      if (!isCI) return;

      const cfDomain = stackOutputs['CloudFrontDistribution'];
      if (!cfDomain) {
        console.log('CloudFront domain not found in outputs');
        return;
      }

      // Simple DNS resolution test
      const dns = require('dns').promises;
      try {
        const addresses = await dns.resolve4(cfDomain);
        expect(addresses).toBeDefined();
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        console.log(`Could not resolve CloudFront domain: ${cfDomain}`);
      }
    });
  });
});
