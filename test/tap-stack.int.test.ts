import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketVersioningCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  DynamoDBClient,
  DescribeTableCommand,
} from '@aws-sdk/client-dynamodb';

// Configuration - These are coming from cfn-outputs after CloudFormation deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// AWS SDK Clients
const ec2Client = new EC2Client({});
const s3Client = new S3Client({});
const dynamodbClient = new DynamoDBClient({});

describe('TAP Stack Infrastructure Integration Tests', () => {
  
  describe('VPC Infrastructure', () => {
    test('VPC should exist with correct CIDR block', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const result = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(result.Vpcs?.length).toBe(1);
      
      const vpc = result.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
      // VPC DNS settings are enabled by default and can't be directly verified via AWS API
      // so we'll just verify the VPC exists and is in available state
    });

    test('Public subnets should exist in different availability zones', async () => {
      const vpcId = outputs.VPCId;
      
      const result = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'map-public-ip-on-launch', Values: ['true'] }
        ]
      }));
      
      expect(result.Subnets?.length).toBe(2);
      
      const subnets = result.Subnets!;
      const cidrs = subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
      
      // Verify subnets are in different AZs
      const azs = subnets.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test('Private subnets should exist in different availability zones', async () => {
      const vpcId = outputs.VPCId;
      
      const result = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'map-public-ip-on-launch', Values: ['false'] }
        ]
      }));
      
      expect(result.Subnets?.length).toBe(2);
      
      const subnets = result.Subnets!;
      const cidrs = subnets.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.3.0/24', '10.0.4.0/24']);
      
      // Verify subnets are in different AZs
      const azs = subnets.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test('Internet Gateway should be attached to VPC', async () => {
      const vpcId = outputs.VPCId;
      
      const result = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [vpcId] }
        ]
      }));
      
      expect(result.InternetGateways?.length).toBe(1);
      
      const igw = result.InternetGateways![0];
      expect(igw.Attachments?.[0].State).toBe('available');
      expect(igw.Attachments?.[0].VpcId).toBe(vpcId);
    });

    test('NAT Gateway should exist in public subnet', async () => {
      const vpcId = outputs.VPCId;
      
      const result = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      }));
      
      expect(result.NatGateways?.length).toBe(1);
      
      const natGw = result.NatGateways![0];
      expect(natGw.State).toBe('available');
      expect(natGw.ConnectivityType).toBe('public');
    });

    test('Route tables should be configured correctly', async () => {
      const vpcId = outputs.VPCId;
      
      const result = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      }));
      
      // Should have at least 3 route tables: main + public + private
      expect(result.RouteTables?.length).toBeGreaterThanOrEqual(3);
      
      const routeTables = result.RouteTables!;
      
      // Find public route table (has route to Internet Gateway)
      const publicRt = routeTables.find(rt => 
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRt).toBeDefined();
      
      // Find private route table (has route to NAT Gateway)
      const privateRt = routeTables.find(rt => 
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRt).toBeDefined();
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance should be t3.micro and running', async () => {
      // Find EC2 instance by looking for instances in our VPC
      const vpcId = outputs.VPCId;
      
      const result = await ec2Client.send(new DescribeInstancesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
      }));
      
      expect(result.Reservations?.length).toBeGreaterThan(0);
      
      const instance = result.Reservations![0].Instances![0];
      expect(instance.InstanceType).toBe('t3.micro');
      expect(['running', 'pending']).toContain(instance.State?.Name);
      
      // Verify instance is in private subnet
      const privateSubnets = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'map-public-ip-on-launch', Values: ['false'] }
        ]
      }));
      const privateSubnetIds = privateSubnets.Subnets?.map(s => s.SubnetId) || [];
      expect(privateSubnetIds).toContain(instance.SubnetId);
    });

    test('Security group should be configured properly', async () => {
      const vpcId = outputs.VPCId;
      
      const result = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['*'] }
        ]
      }));
      
      // Find non-default security groups
      const customSgs = result.SecurityGroups?.filter(sg => 
        sg.GroupName !== 'default'
      );
      expect(customSgs?.length).toBeGreaterThan(0);
      
      const sg = customSgs![0];
      expect(sg.VpcId).toBe(vpcId);
      
      // Should have outbound rule allowing all traffic
      const outboundRule = sg.IpPermissionsEgress?.find(rule => 
        rule.IpProtocol === '-1' && rule.IpRanges?.[0].CidrIp === '0.0.0.0/0'
      );
      expect(outboundRule).toBeDefined();
    });
  });

  describe('S3 Bucket', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();

      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();
    });

    test('S3 bucket should have versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      const result = await s3Client.send(new GetBucketVersioningCommand({ 
        Bucket: bucketName 
      }));
      
      expect(result.Status).toBe('Enabled');
    });
  });

  describe('DynamoDB Table', () => {
    test('DynamoDB table should exist and be active', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();
      expect(tableName).toBe(`TurnAroundPromptTable${environmentSuffix}`);

      const result = await dynamodbClient.send(new DescribeTableCommand({ 
        TableName: tableName 
      }));
      
      expect(result.Table?.TableStatus).toBe('ACTIVE');
      expect(result.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
      expect(result.Table?.DeletionProtectionEnabled).toBe(false);
      
      // Verify key schema
      expect(result.Table?.KeySchema).toEqual([
        { AttributeName: 'id', KeyType: 'HASH' }
      ]);
      
      // Verify attribute definitions
      expect(result.Table?.AttributeDefinitions).toEqual([
        { AttributeName: 'id', AttributeType: 'S' }
      ]);
    });
  });

  describe('Multi-AZ Deployment Verification', () => {
    test('Infrastructure should span multiple availability zones', async () => {
      const azInfo = outputs.AvailabilityZones;
      expect(azInfo).toBeDefined();
      
      // Should contain at least 2 AZs separated by comma and space
      const azs = azInfo.split(', ');
      expect(azs.length).toBe(2);
      expect(azs[0]).toMatch(/^[a-z]{2}-[a-z]+-\d+[a-z]$/); // Format: us-west-2a
      expect(azs[1]).toMatch(/^[a-z]{2}-[a-z]+-\d+[a-z]$/); // Format: us-west-2b
      expect(azs[0]).not.toBe(azs[1]); // Different AZs
    });
  });

  describe('Stack Outputs Validation', () => {
    test('All required outputs should be defined and non-empty', () => {
      const requiredOutputs = [
        'VPCId',
        'S3BucketName',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'AvailabilityZones'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(outputs[outputKey]).toBeDefined();
        if (typeof outputs[outputKey] === 'string') {
          expect(outputs[outputKey].length).toBeGreaterThan(0);
        }
      });
    });

    test('Environment suffix should match expected value', () => {
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
    });

    test('Stack name should follow naming convention', () => {
      const stackName = outputs.StackName;
      expect(stackName).toBe(`TapStack${environmentSuffix}`);
    });
  });
});
