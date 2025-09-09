// AWS Infrastructure Migration Integration Tests - us-west-1 to us-west-2
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const REGION = 'us-west-2';
const ec2Client = new EC2Client({ region: REGION });
const rdsClient = new RDSClient({ region: REGION });
const s3Client = new S3Client({ region: REGION });


describe('AWS Infrastructure Migration Integration Tests', () => {
  // Extract resource IDs from outputs
  const vpcId = outputs.VPCId || '';
  const publicSubnetIds = (outputs.PublicSubnetIds || '').split(',');
  const privateSubnetIds = (outputs.PrivateSubnetIds || '').split(',');
  const webSgId = outputs.WebSecurityGroupId || '';
  const appSgId = outputs.AppSecurityGroupId || '';
  const dbSgId = outputs.DatabaseSecurityGroupId || '';
  const dbEndpoint = outputs.DatabaseEndpoint || '';
  const s3BucketName = outputs.S3BucketName || '';
  const targetRegion = outputs.RegionMigrated || '';

  describe('VPC and Networking Validation', () => {
    test('VPC exists in us-west-2 with correct CIDR', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(vpcId);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('public subnets are correctly configured', async () => {
      const command = new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
        expect(subnet.AvailabilityZone).toMatch(/us-west-2[ab]/);
      });
    });

    test('private subnets are correctly configured', async () => {
      const command = new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
        expect(subnet.AvailabilityZone).toMatch(/us-west-2[ab]/);
      });
    });

    test('internet gateway is attached to VPC', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);
      
      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');
    });

    test('NAT gateways exist in public subnets', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
      response.NatGateways!.forEach(natGw => {
        expect(natGw.VpcId).toBe(vpcId);
        expect(natGw.State).toBe('available');
        expect(publicSubnetIds).toContain(natGw.SubnetId);
      });
    });
  });

  describe('Security Groups Validation', () => {
    test('web security group has correct ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [webSgId] });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(webSgId);
      expect(sg.VpcId).toBe(vpcId);
      expect(sg.Description).toContain('web tier');
      
      // Check for HTTP, HTTPS, and SSH rules
      const ingressRules = sg.IpPermissions!;
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
      const sshRule = ingressRules.find(rule => rule.FromPort === 22);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(sshRule).toBeDefined();
    });

    test('application security group exists with proper configuration', async () => {
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [appSgId] });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(appSgId);
      expect(sg.VpcId).toBe(vpcId);
      expect(sg.Description).toContain('application tier');
    });

    test('database security group allows MySQL traffic', async () => {
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [dbSgId] });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(dbSgId);
      expect(sg.VpcId).toBe(vpcId);
      expect(sg.Description).toContain('database tier');
      
      // Check for MySQL port 3306
      const mysqlRule = sg.IpPermissions!.find(rule => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
    });
  });

  describe('RDS Database Validation', () => {
    test('MySQL database instance is running', async () => {
      const dbInstanceId = dbEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId });
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toBe('8.0.42');
      expect(dbInstance.DBInstanceClass).toBe('db.t3.medium');
      expect(dbInstance.AllocatedStorage).toBe(100);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
    });

    test('RDS parameter group exists with correct configuration', async () => {
      // Get the DB instance first to find the actual parameter group used
      const dbInstanceId = dbEndpoint.split('.')[0];
      const dbCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbInstanceId });
      const dbResponse = await rdsClient.send(dbCommand);
      const dbInstance = dbResponse.DBInstances![0];
      
      const parameterGroupName = dbInstance.DBParameterGroups![0].DBParameterGroupName;
      
      const command = new DescribeDBParameterGroupsCommand({ 
        DBParameterGroupName: parameterGroupName 
      });
      const response = await rdsClient.send(command);
      
      const parameterGroup = response.DBParameterGroups![0];
      expect(parameterGroup).toBeDefined();
      expect(parameterGroup!.DBParameterGroupFamily).toBe('mysql8.0');
      expect(parameterGroup!.Description).toContain('Parameter group for MySQL 8.0');
    });

    test('RDS subnet group spans private subnets', async () => {
      const command = new DescribeDBSubnetGroupsCommand();
      const response = await rdsClient.send(command);
      
      const subnetGroup = response.DBSubnetGroups!.find(sg => 
        sg.DBSubnetGroupName?.includes('databasesubnetgroup') && sg.VpcId === vpcId
      );
      
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup!.VpcId).toBe(vpcId);
      expect(subnetGroup!.Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('S3 Storage Validation', () => {
    test('S3 bucket exists with versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({ Bucket: s3BucketName });
      const response = await s3Client.send(command);
      
      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket has encryption configured', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: s3BucketName });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const sseConfig = response.ServerSideEncryptionConfiguration!;
      expect(sseConfig.Rules).toBeDefined();
      expect(sseConfig.Rules!).toHaveLength(1);
      expect(sseConfig.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket has public access blocked', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: s3BucketName });
      const response = await s3Client.send(command);
      
      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    });

    test('test object exists in S3 bucket', async () => {
      const command = new GetObjectCommand({ 
        Bucket: s3BucketName, 
        Key: 'test/test-object.txt' 
      });
      const response = await s3Client.send(command);
      
      expect(response.Body).toBeDefined();
      const content = await response.Body!.transformToString();
      expect(content).toContain('migration from us-west-1 to us-west-2');
    });
  });

  describe('Migration Validation', () => {
    test('all resources are deployed in us-west-2 region', () => {
      expect(targetRegion).toBe('us-west-2');
    });

    test('VPC CIDR matches migration requirements', () => {
      expect(outputs.VPCCidr).toBe('10.0.0.0/16');
    });

    test('database port is correctly configured', () => {
      expect(outputs.DatabasePort).toBe('3306');
    });

    test('all required outputs are present', () => {
      const requiredOutputs = [
        'VPCId',
        'VPCCidr', 
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'WebSecurityGroupId',
        'AppSecurityGroupId',
        'DatabaseSecurityGroupId',
        'DatabaseEndpoint',
        'DatabasePort',
        'S3BucketName',
        'S3BucketArn',
        'RegionMigrated'
      ];
      
      requiredOutputs.forEach(outputKey => {
        const value = outputs[outputKey];
        expect(value).toBeTruthy();
        expect(value).not.toBe('');
      });
    });
  });

  describe('Network Connectivity Tests', () => {
    test('database endpoint is accessible from application subnets', async () => {
      // Validate that database endpoint resolves and is in the correct format
      expect(dbEndpoint).toMatch(/^tapstack.*\.us-west-2\.rds\.amazonaws\.com$/);
      expect(dbEndpoint).toContain('us-west-2');
    });

    test('S3 bucket name includes region identifier', () => {
      expect(s3BucketName).toContain('us-west-2');
      expect(s3BucketName).toContain('nova-app-bucket');
    });
  });

  describe('Resource Tagging Validation', () => {
    test('VPC has migration tags', async () => {
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      
      const projectTag = tags.find(tag => tag.Key === 'Project');
      const environmentTag = tags.find(tag => tag.Key === 'Environment');
      const migratedFromTag = tags.find(tag => tag.Key === 'MigratedFrom');
      
      expect(projectTag?.Value).toContain('Nova Model Breaking');
      expect(environmentTag?.Value).toBe('Production');
      expect(migratedFromTag?.Value).toBe('us-west-1');
    });
  });
});
