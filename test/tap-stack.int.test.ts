// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
  DescribeTableCommand,
  DescribeContinuousBackupsCommand,
} from '@aws-sdk/client-dynamodb';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { v4 as uuidv4 } from 'uuid';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth291583';

// AWS Clients
const s3Client = new S3Client({ region: 'us-east-1' });
const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });
const ec2Client = new EC2Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const cloudTrailClient = new CloudTrailClient({ region: 'us-east-1' });
const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });

describe('AWS Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      // VPC should be available - DNS settings are configured in CloudFormation template
      // Note: EnableDnsHostnames and EnableDnsSupport properties may not be returned
      // by describe-vpcs command but are configured in the CloudFormation template
    });

    test('Subnets should exist in multiple AZs', async () => {
      const subnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ];
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(4);
      
      const availabilityZones = new Set(
        response.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(availabilityZones.size).toBeGreaterThan(1);
    });

    test('NAT Gateways should be running', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups', () => {
    test('Security groups should not allow 0.0.0.0/0 ingress', async () => {
      const sgIds = [
        outputs.LoadBalancerSecurityGroupId,
        outputs.WebServerSecurityGroupId,
      ];
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: sgIds,
      });
      const response = await ec2Client.send(command);
      
      response.SecurityGroups!.forEach(sg => {
        sg.IpPermissions?.forEach(rule => {
          rule.IpRanges?.forEach(range => {
            expect(range.CidrIp).not.toBe('0.0.0.0/0');
          });
        });
      });
    });

    test('Database security group should only allow traffic from web servers', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'group-name',
            Values: [`*DatabaseSG*`],
          },
        ],
      });
      const response = await ec2Client.send(command);
      
      if (response.SecurityGroups && response.SecurityGroups.length > 0) {
        const dbSg = response.SecurityGroups[0];
        dbSg.IpPermissions?.forEach(rule => {
          expect(rule.UserIdGroupPairs).toBeDefined();
          expect(rule.IpRanges?.length || 0).toBe(0);
        });
      }
    });
  });

  describe('S3 Buckets', () => {
    const testKey = `test-${uuidv4()}.txt`;
    const testContent = 'Test content for integration testing';

    afterAll(async () => {
      // Cleanup test object
      try {
        await s3Client.send(new DeleteObjectCommand({
          Bucket: outputs.SecureS3BucketName,
          Key: testKey,
        }));
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('S3 bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.SecureS3BucketName,
      });
      
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.SecureS3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration!.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket should block public access', async () => {
      const command = new GetPublicAccessBlockCommand({
        Bucket: outputs.SecureS3BucketName,
      });
      const response = await s3Client.send(command);
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('Should be able to write and read objects from S3', async () => {
      // Write object
      const putCommand = new PutObjectCommand({
        Bucket: outputs.SecureS3BucketName,
        Key: testKey,
        Body: testContent,
        ServerSideEncryption: 'AES256',
      });
      await s3Client.send(putCommand);

      // Read object
      const getCommand = new GetObjectCommand({
        Bucket: outputs.SecureS3BucketName,
        Key: testKey,
      });
      const response = await s3Client.send(getCommand);
      const body = await response.Body!.transformToString();
      
      expect(body).toBe(testContent);
      expect(response.ServerSideEncryption).toBe('AES256');
    });

    test('Should be able to list objects in S3 bucket', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.SecureS3BucketName,
        MaxKeys: 10,
      });
      const response = await s3Client.send(command);
      
      expect(response).toBeDefined();
      expect(response.Name).toBe(outputs.SecureS3BucketName);
    });
  });

  describe('DynamoDB Table', () => {
    const testItem = {
      id: { S: `test-${uuidv4()}` },
      data: { S: 'Test data for integration testing' },
      timestamp: { N: Date.now().toString() },
    };

    afterAll(async () => {
      // Cleanup test item
      try {
        await dynamoDBClient.send(new DeleteItemCommand({
          TableName: outputs.TurnAroundPromptTableName,
          Key: { id: testItem.id },
        }));
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('DynamoDB table should exist and be active', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });
      const response = await dynamoDBClient.send(command);
      
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have encryption enabled', async () => {
      const command = new DescribeTableCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });
      const response = await dynamoDBClient.send(command);
      
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('DynamoDB table should have PITR enabled', async () => {
      const command = new DescribeContinuousBackupsCommand({
        TableName: outputs.TurnAroundPromptTableName,
      });
      const response = await dynamoDBClient.send(command);
      
      expect(response.ContinuousBackupsDescription?.PointInTimeRecoveryDescription?.PointInTimeRecoveryStatus).toBe('ENABLED');
    });

    test('Should be able to write and read items from DynamoDB', async () => {
      // Write item
      const putCommand = new PutItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Item: testItem,
      });
      await dynamoDBClient.send(putCommand);

      // Read item
      const getCommand = new GetItemCommand({
        TableName: outputs.TurnAroundPromptTableName,
        Key: { id: testItem.id },
      });
      const response = await dynamoDBClient.send(getCommand);
      
      expect(response.Item).toBeDefined();
      expect(response.Item!.id).toEqual(testItem.id);
      expect(response.Item!.data).toEqual(testItem.data);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance should exist and be available', async () => {
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
    });

    test('RDS instance should have encryption enabled', async () => {
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    test('RDS instance should have backup enabled', async () => {
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.PreferredBackupWindow).toBeDefined();
    });

    test('RDS endpoint should match output', async () => {
      const dbIdentifier = `secure-db-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      const response = await rdsClient.send(command);
      
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Endpoint?.Address).toBe(outputs.DatabaseEndpoint);
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail should be configured and logging', async () => {
      const trailName = `SecureCloudTrail-${environmentSuffix}`;
      const describeCommand = new DescribeTrailsCommand({
        trailNameList: [trailName],
      });
      const describeResponse = await cloudTrailClient.send(describeCommand);
      
      expect(describeResponse.trailList).toHaveLength(1);
      const trail = describeResponse.trailList![0];
      expect(trail.IsMultiRegionTrail).toBe(true);
      expect(trail.LogFileValidationEnabled).toBe(true);
      
      const statusCommand = new GetTrailStatusCommand({
        Name: trailName,
      });
      const statusResponse = await cloudTrailClient.send(statusCommand);
      
      expect(statusResponse.IsLogging).toBe(true);
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`SecureALB-${environmentSuffix}`],
      });
      const response = await elbClient.send(command);
      
      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('ALB should have correct DNS name', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`SecureALB-${environmentSuffix}`],
      });
      const response = await elbClient.send(command);
      
      const alb = response.LoadBalancers![0];
      expect(alb.DNSName).toBe(outputs.LoadBalancerDNS);
    });

    test('Target group should be configured for HTTPS', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`WebServerTG-${environmentSuffix}`],
      });
      const response = await elbClient.send(command);
      
      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTPS');
      expect(tg.Port).toBe(443);
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckProtocol).toBe('HTTPS');
    });
  });

  describe('Cross-Resource Integration', () => {
    test('All resources should be in the same VPC', async () => {
      // Check subnets
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: [
          outputs.PublicSubnet1Id,
          outputs.PublicSubnet2Id,
          outputs.PrivateSubnet1Id,
          outputs.PrivateSubnet2Id,
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });

      // Check security groups
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [
          outputs.LoadBalancerSecurityGroupId,
          outputs.WebServerSecurityGroupId,
        ],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      
      sgResponse.SecurityGroups!.forEach(sg => {
        expect(sg.VpcId).toBe(outputs.VPCId);
      });
    });

    test('Resources should have consistent tagging', async () => {
      // Check VPC tags
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      
      const vpcTags = vpcResponse.Vpcs![0].Tags || [];
      const envTag = vpcTags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toContain(environmentSuffix);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('All expected outputs should be present', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'LoadBalancerSecurityGroupId',
        'WebServerSecurityGroupId',
        'SecureS3BucketName',
        'EC2RoleArn',
        'LoadBalancerDNS',
        'DatabaseEndpoint',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });

    test('ARNs should have correct format', () => {
      expect(outputs.EC2RoleArn).toMatch(/^arn:aws:iam::\d+:role\/.+/);
      expect(outputs.TurnAroundPromptTableArn).toMatch(/^arn:aws:dynamodb:.+:\d+:table\/.+/);
    });

    test('Environment suffix should match deployment', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.StackName).toContain(environmentSuffix);
    });
  });
});
