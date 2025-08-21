import { DescribeTableCommand, DynamoDBClient, ListTagsOfResourceCommand } from '@aws-sdk/client-dynamodb';
import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { GetBucketEncryptionCommand, GetBucketVersioningCommand, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after CloudFormation deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and AWS region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-2';

describe('TAP Stack Integration Tests - Deployed AWS Resources', () => {
  
  describe('VPC and Networking', () => {
    test('VPC exists and is available', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toMatch(/^vpc-/);
      
      const ec2 = new EC2Client({ region });
      const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      
      expect(vpcResp.Vpcs?.[0]?.State).toBe('available');
      expect(vpcResp.Vpcs?.[0]?.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Subnets exist and are in different AZs', async () => {
      const ec2 = new EC2Client({ region });
      const subnetIds = [
        outputs.PublicSubnet1Id, 
        outputs.PublicSubnet2Id, 
        outputs.PrivateSubnet1Id, 
        outputs.PrivateSubnet2Id
      ];
      
      expect(subnetIds.length).toBe(4);
      
      const subnetsResp = await ec2.send(new DescribeSubnetsCommand({ SubnetIds: subnetIds }));
      const azs = subnetsResp.Subnets?.map(subnet => subnet.AvailabilityZone);
      
      // Should have at least 2 different AZs
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);
      
      // Verify public subnets have MapPublicIpOnLaunch enabled
      const publicSubnets = subnetsResp.Subnets?.filter(subnet => 
        subnet.SubnetId === outputs.PublicSubnet1Id || subnet.SubnetId === outputs.PublicSubnet2Id
      );
      publicSubnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Security groups exist with correct rules', async () => {
      const ec2 = new EC2Client({ region });
      const sgResp = await ec2.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'group-name', Values: [`${environmentSuffix}-alb-sg`, `${environmentSuffix}-web-sg`, `${environmentSuffix}-db-sg`] }
        ]
      }));
      
      expect(sgResp.SecurityGroups?.length).toBeGreaterThanOrEqual(3);
      
      // Check ALB security group allows HTTP from anywhere
      const albSg = sgResp.SecurityGroups?.find(sg => sg.GroupName === `${environmentSuffix}-alb-sg`);
      expect(albSg).toBeDefined();
      expect(albSg?.IpPermissions?.some(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && 
        rule.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
      )).toBe(true);
    });
  });

  describe('Load Balancer', () => {
    test('Application Load Balancer exists and is active', async () => {
      const lbDNS = outputs.LoadBalancerDNS;
      expect(lbDNS).toMatch(/\.elb\.amazonaws\.com$/);
      
      const elbv2 = new ElasticLoadBalancingV2Client({ region });
      const lbResp = await elbv2.send(new DescribeLoadBalancersCommand({
        Names: [`${environmentSuffix}-alb`]
      }));
      
      expect(lbResp.LoadBalancers?.[0]?.State?.Code).toBe('active');
      expect(lbResp.LoadBalancers?.[0]?.Scheme).toBe('internet-facing');
      expect(lbResp.LoadBalancers?.[0]?.Type).toBe('application');
    });

    test('Target group exists with correct health check settings', async () => {
      const elbv2 = new ElasticLoadBalancingV2Client({ region });
      const tgResp = await elbv2.send(new DescribeTargetGroupsCommand({
        Names: [`${environmentSuffix}-web-tg`]
      }));
      
      const targetGroup = tgResp.TargetGroups?.[0];
      expect(targetGroup).toBeDefined();
      expect(targetGroup?.Port).toBe(80);
      expect(targetGroup?.Protocol).toBe('HTTP');
      expect(targetGroup?.HealthCheckPath).toBe('/health');
      expect(targetGroup?.HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('S3 Storage', () => {
    test('S3 bucket exists and is accessible', async () => {
      const bucketName = outputs.ApplicationDataBucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toMatch(/^tapstack/);
      
      const s3 = new S3Client({ region });
      await expect(s3.send(new HeadBucketCommand({ Bucket: bucketName }))).resolves.not.toThrow();
    });

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.ApplicationDataBucketName;
      const s3 = new S3Client({ region });
      
      const encResp = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      const rules = encResp.ServerSideEncryptionConfiguration?.Rules || [];
      const hasAES256 = rules.some(
        rule => rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'AES256'
      );
      expect(hasAES256).toBe(true);
    });

    test('S3 bucket has versioning enabled', async () => {
      const bucketName = outputs.ApplicationDataBucketName;
      const s3 = new S3Client({ region });
      
      const versionResp = await s3.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(versionResp.Status).toBe('Enabled');
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists and is available', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
      
      const rds = new RDSClient({ region });
      const dbResp = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `${environmentSuffix}-mysql-db`
      }));
      
      const dbInstance = dbResp.DBInstances?.[0];
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.EngineVersion).toBe('8.0.37');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
    });

    test('RDS instance endpoint matches output', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      const rds = new RDSClient({ region });
      
      const dbResp = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: `${environmentSuffix}-mysql-db`
      }));
      
      expect(dbResp.DBInstances?.[0]?.Endpoint?.Address).toBe(dbEndpoint);
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table exists and is active', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const tableArn = outputs.TurnAroundPromptTableArn;
      
      expect(tableName).toBeDefined();
      expect(tableArn).toBeDefined();
      expect(tableName).toMatch(/^TurnAroundPromptTable/);
      
      const dynamodb = new DynamoDBClient({ region });
      const tableResp = await dynamodb.send(new DescribeTableCommand({ TableName: tableName }));
      
      expect(tableResp.Table?.TableStatus).toBe('ACTIVE');
      expect(tableResp.Table?.TableArn).toBe(tableArn);
      expect(tableResp.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      
      // Verify key schema
      expect(tableResp.Table?.KeySchema?.[0]?.AttributeName).toBe('id');
      expect(tableResp.Table?.KeySchema?.[0]?.KeyType).toBe('HASH');
    });
  });

  describe('Monitoring and Alerts', () => {
    test('SNS topic exists for alerts', async () => {
      const sns = new SNSClient({ region });
      
      // We need to construct the topic ARN since it's not in outputs
      const accountId = outputs.TurnAroundPromptTableArn.split(':')[4];
      const topicArn = `arn:aws:sns:${region}:${accountId}:${environmentSuffix}-alerts`;
      
      const topicResp = await sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      expect(topicResp.Attributes?.TopicArn).toBe(topicArn);
      expect(topicResp.Attributes?.DisplayName).toBe(`${environmentSuffix} Infrastructure Alerts`);
    });
  });

  describe('Stack Outputs Validation', () => {
    test('All required outputs are present', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'LoadBalancerDNS',
        'DatabaseEndpoint',
        'ApplicationDataBucketName',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        expect(outputs[outputKey]).not.toBe('');
      });
    });

    test('Environment suffix matches expected value', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('Stack name follows naming convention', () => {
      expect(outputs.StackName).toMatch(/^TapStack/);
      expect(outputs.StackName).toContain(environmentSuffix);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC has correct tags', async () => {
      const ec2 = new EC2Client({ region });
      const vpcResp = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.VPCId] }));
      
      const tags = vpcResp.Vpcs?.[0]?.Tags || [];
      const nameTag = tags.find(tag => tag.Key === 'Name');
      const envTag = tags.find(tag => tag.Key === 'Environment');
      
      expect(nameTag?.Value).toBe(`${environmentSuffix}-main-vpc`);
      expect(envTag?.Value).toBe(environmentSuffix);
    });

    test('DynamoDB table has correct tags', async () => {
      const dynamodb = new DynamoDBClient({ region });
      const tableArn = outputs.TurnAroundPromptTableArn;
      
      // Use ListTagsOfResourceCommand to get DynamoDB table tags
      const tagsResp = await dynamodb.send(new ListTagsOfResourceCommand({ 
        ResourceArn: tableArn 
      }));
      
      const tags = tagsResp.Tags || [];
      const envTag = tags.find(tag => tag.Key === 'Environment');
      
      expect(envTag?.Value).toBe(environmentSuffix);
    });
  });
});
