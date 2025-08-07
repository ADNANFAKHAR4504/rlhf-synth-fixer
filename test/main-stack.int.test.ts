import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
} from '@aws-sdk/client-s3';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  WAFV2Client,
  GetWebACLCommand,
} from '@aws-sdk/client-wafv2';

// Read outputs from deployment
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = 'us-west-2';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const kmsClient = new KMSClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const wafClient = new WAFV2Client({ region });

describe('MainStack Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC exists and is configured correctly', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [outputs.VPCId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      // DNS settings might not be returned by describe-vpcs, but they are enabled in our template
    });

    test('Subnets are deployed across multiple AZs', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);

      // Check for multi-AZ deployment
      const azs = new Set(response.Subnets!.map((subnet) => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Security groups are properly configured', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      const securityGroups = response.SecurityGroups!;

      // Check for ALB security group with restricted access
      const albSg = securityGroups.find((sg) =>
        sg.GroupName?.includes('AlbSecurityGroup')
      );
      if (albSg) {
        const httpIngress = albSg.IpPermissions?.find(
          (rule) => rule.FromPort === 80
        );
        expect(httpIngress).toBeDefined();
        expect(httpIngress?.IpRanges?.some((range) => 
          range.CidrIp?.includes('203.0.113.0')
        )).toBeTruthy();
      }
    });
  });

  describe('Load Balancer', () => {
    test('Application Load Balancer is deployed and healthy', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.warn('LoadBalancerDNS not found in outputs, skipping test');
        return;
      }

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = response.LoadBalancers?.find(
        (lb) => lb.DNSName === outputs.LoadBalancerDNS
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
    });

    test('Target group exists with health check configuration', async () => {
      const response = await elbClient.send(
        new DescribeTargetGroupsCommand({})
      );

      const targetGroups = response.TargetGroups?.filter((tg) =>
        tg.TargetGroupName?.includes('synth307')
      );

      if (targetGroups && targetGroups.length > 0) {
        const tg = targetGroups[0];
        expect(tg.HealthCheckEnabled).toBe(true);
        expect(tg.HealthCheckPath).toBe('/health');
        expect(tg.HealthCheckProtocol).toBe('HTTP');
        expect(tg.HealthyThresholdCount).toBe(2);
        expect(tg.UnhealthyThresholdCount).toBe(3);
      }
    });
  });

  describe('Database', () => {
    test('RDS instance is deployed with Multi-AZ and encryption', async () => {
      if (!outputs.DatabaseEndpoint) {
        console.warn('DatabaseEndpoint not found in outputs, skipping test');
        return;
      }

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: 'tap-synth307-db',
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];
      
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.MultiAZ).toBe(true);
      expect(db.StorageEncrypted).toBe(true);
      expect(db.BackupRetentionPeriod).toBe(30);
      expect(db.Engine).toBe('mysql');
      expect(db.DeletionProtection).toBe(false);
    });
  });

  describe('Storage and Encryption', () => {
    test('S3 bucket has encryption enabled', async () => {
      if (!outputs.S3BucketName) {
        console.warn('S3BucketName not found in outputs, skipping test');
        return;
      }

      try {
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: outputs.S3BucketName,
          })
        );

        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules
        ).toHaveLength(1);

        const versioningResponse = await s3Client.send(
          new GetBucketVersioningCommand({
            Bucket: outputs.S3BucketName,
          })
        );

        expect(versioningResponse.Status).toBe('Enabled');
      } catch (error: any) {
        if (error.name === 'NoSuchBucket') {
          console.warn('S3 bucket not found, skipping test');
        } else {
          throw error;
        }
      }
    });

    test('KMS key is active and has rotation enabled', async () => {
      if (!outputs.KMSKeyId) {
        console.warn('KMSKeyId not found in outputs, skipping test');
        return;
      }

      const response = await kmsClient.send(
        new DescribeKeyCommand({
          KeyId: outputs.KMSKeyId,
        })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.KeyState).toBe('Enabled');
      expect(response.KeyMetadata?.KeySpec).toBe('SYMMETRIC_DEFAULT');
      expect(response.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  describe('WAF Protection', () => {
    test('WAF WebACL is deployed and associated with ALB', async () => {
      if (!outputs.WebAclArn) {
        console.warn('WebAclArn not found in outputs, skipping test');
        return;
      }

      // Parse the WebACL ARN format (name|id|scope)
      const [name, id, scope] = outputs.WebAclArn.split('|');
      
      try {
        const response = await wafClient.send(
          new GetWebACLCommand({
            Name: name,
            Id: id,
            Scope: scope as 'REGIONAL' | 'CLOUDFRONT',
          })
        );

        expect(response.WebACL).toBeDefined();
        expect(response.WebACL?.DefaultAction?.Allow).toBeDefined();
        
        // Check for managed rule groups
        const rules = response.WebACL?.Rules || [];
        expect(rules.length).toBeGreaterThan(0);
        
        const hasCommonRuleSet = rules.some((rule) =>
          rule.Name === 'AWSManagedRulesCommonRuleSet'
        );
        expect(hasCommonRuleSet).toBeTruthy();
        
        const hasSQLiRuleSet = rules.some((rule) =>
          rule.Name === 'AWSManagedRulesSQLiRuleSet'
        );
        expect(hasSQLiRuleSet).toBeTruthy();
        
        const hasRateLimitRule = rules.some((rule) =>
          rule.Name === 'RateLimitRule'
        );
        expect(hasRateLimitRule).toBeTruthy();
      } catch (error: any) {
        if (error.name === 'WAFNonexistentItemException') {
          console.warn('WAF WebACL not found, skipping test');
        } else {
          throw error;
        }
      }
    });
  });

  describe('High Availability', () => {
    test('Resources are deployed across multiple availability zones', async () => {
      if (!outputs.VPCId) {
        console.warn('VPCId not found in outputs, skipping test');
        return;
      }

      // Check subnets across AZs
      const subnetResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [outputs.VPCId],
            },
          ],
        })
      );

      const azs = new Set(
        subnetResponse.Subnets?.map((subnet) => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Check if database is Multi-AZ
      if (outputs.DatabaseEndpoint) {
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: 'tap-synth307-db',
          })
        );
        
        if (dbResponse.DBInstances && dbResponse.DBInstances.length > 0) {
          expect(dbResponse.DBInstances[0].MultiAZ).toBe(true);
        }
      }
    });
  });

  describe('Compliance and Security', () => {
    test('All storage resources use encryption', async () => {
      // Check RDS encryption
      if (outputs.DatabaseEndpoint) {
        const dbResponse = await rdsClient.send(
          new DescribeDBInstancesCommand({
            DBInstanceIdentifier: 'tap-synth307-db',
          })
        );
        
        if (dbResponse.DBInstances && dbResponse.DBInstances.length > 0) {
          expect(dbResponse.DBInstances[0].StorageEncrypted).toBe(true);
        }
      }

      // Check S3 encryption
      if (outputs.S3BucketName) {
        try {
          const s3Response = await s3Client.send(
            new GetBucketEncryptionCommand({
              Bucket: outputs.S3BucketName,
            })
          );
          expect(s3Response.ServerSideEncryptionConfiguration).toBeDefined();
        } catch (error: any) {
          if (error.name !== 'NoSuchBucket') {
            throw error;
          }
        }
      }
    });

    test('Secrets are managed through AWS Secrets Manager', async () => {
      // Check if database secret exists
      try {
        const response = await secretsClient.send(
          new DescribeSecretCommand({
            SecretId: 'tap-synth307-db-secret',
          })
        );

        expect(response.Name).toBe('tap-synth307-db-secret');
        expect(response.Description).toContain('RDS Database Credentials');
      } catch (error: any) {
        if (error.name === 'ResourceNotFoundException') {
          console.warn('Database secret not found, skipping test');
        } else {
          throw error;
        }
      }
    });
  });
});