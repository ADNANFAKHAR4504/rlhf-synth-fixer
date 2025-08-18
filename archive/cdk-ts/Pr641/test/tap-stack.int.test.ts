import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeDBClustersCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  ListBucketsCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  ListSecretsCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const projectName = 'secure-vpc-project';

// Initialize AWS clients
const ec2Client = new EC2Client({});
const secretsClient = new SecretsManagerClient({});
const rdsClient = new RDSClient({});
const s3Client = new S3Client({});
const logsClient = new CloudWatchLogsClient({});

describe('Infrastructure Integration Tests', () => {
  describe('Basic Infrastructure Tests', () => {
    test('Environment is properly configured', () => {
      expect(environmentSuffix).toBeDefined();
      expect(typeof environmentSuffix).toBe('string');
      expect(environmentSuffix.length).toBeGreaterThan(0);
    });

    test('AWS credentials are available', () => {
      expect(process.env.AWS_ACCESS_KEY_ID).toBeDefined();
      expect(process.env.AWS_SECRET_ACCESS_KEY).toBeDefined();
      expect(process.env.AWS_REGION).toBeDefined();
    });
  });

  describe('Networking Stack Tests', () => {
    test('VPC exists and is properly tagged', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [environmentSuffix]
          },
          {
            Name: 'tag:ProjectName',
            Values: [projectName]
          }
        ]
      }));
      expect(response.Vpcs?.length).toBe(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
    });

    test('Subnets are properly configured', async () => {
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [environmentSuffix]
          },
          {
            Name: 'tag:ProjectName',
            Values: [projectName]
          }
        ]
      }));
      // We expect public, private, and isolated subnets
      expect(response.Subnets?.length).toBeGreaterThanOrEqual(6); // At least 2 of each type
      
      // Verify we have both public and private subnets
      const publicSubnets = response.Subnets?.filter(s => s.MapPublicIpOnLaunch);
      const privateSubnets = response.Subnets?.filter(s => !s.MapPublicIpOnLaunch);
      expect(publicSubnets?.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Security Stack Tests', () => {
    test('Security groups exist and are properly configured', async () => {
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:Environment',
            Values: [environmentSuffix]
          },
          {
            Name: 'tag:ProjectName',
            Values: [projectName]
          }
        ]
      }));
      expect(response.SecurityGroups?.length).toBeGreaterThanOrEqual(3); // web, app, and db security groups

      // Verify web security group allows HTTPS
      const webSg = response.SecurityGroups?.find(sg => sg.GroupName?.includes('web'));
      expect(webSg).toBeDefined();
      expect(webSg?.IpPermissions?.some(p => p.FromPort === 443)).toBe(true);
    });
  });

  describe('Secrets Stack Tests', () => {
    test('Required secrets exist', async () => {
      const response = await secretsClient.send(new ListSecretsCommand({
        Filters: [
          {
            Key: 'tag-key',
            Values: ['Environment']
          },
          {
            Key: 'tag-value',
            Values: [environmentSuffix]
          }
        ]
      }));
      expect(response.SecretList?.length).toBeGreaterThanOrEqual(2); // db credentials and api key
      
      // Verify secret names
      const secretNames = response.SecretList?.map(s => s.Name);
      expect(secretNames?.some(n => n?.includes('database'))).toBe(true);
      expect(secretNames?.some(n => n?.includes('api/key') || n?.includes('api-key'))).toBe(true);
    });
  });

  describe('Database Stack Tests', () => {
    test('Aurora cluster exists and is available', async () => {
      const response = await rdsClient.send(new DescribeDBClustersCommand({
        Filters: [
          {
            Name: 'engine',
            Values: ['aurora-postgresql']
          }
        ]
      }));
      const cluster = response.DBClusters?.find(c => 
        c.TagList?.some(t => t.Key === 'Environment' && t.Value === environmentSuffix)
      );
      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe('available');
      expect(cluster?.Engine).toBe('aurora-postgresql');
    });
  });

  describe('Storage Stack Tests', () => {
    test('S3 buckets exist and are properly configured', async () => {
      const response = await s3Client.send(new ListBucketsCommand({}));
      const buckets = response.Buckets?.filter(b => 
        b.Name?.includes(projectName) && b.Name?.includes(environmentSuffix)
      );
      expect(buckets?.length).toBeGreaterThanOrEqual(2); // application and backup buckets

      // Verify encryption
      for (const bucket of buckets || []) {
        const encryption = await s3Client.send(new GetBucketEncryptionCommand({
          Bucket: bucket.Name
        }));
        expect(encryption.ServerSideEncryptionConfiguration?.Rules?.length).toBeGreaterThan(0);
        expect(encryption.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm)
          .toBe('aws:kms');
      }
    });
  });

  describe('Monitoring Stack Tests', () => {
    test('CloudWatch log groups exist', async () => {
      const response = await logsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/${projectName}/${environmentSuffix}`
      }));
      expect(response.logGroups?.length).toBeGreaterThanOrEqual(2); // application and vpc flow logs
      
      // Verify log group names
      const logGroupNames = response.logGroups?.map(lg => lg.logGroupName);
      expect(logGroupNames?.some(n => n?.includes('application'))).toBe(true);
      expect(logGroupNames?.some(n => n?.includes('vpc-flow-logs'))).toBe(true);
    });
  });
});
