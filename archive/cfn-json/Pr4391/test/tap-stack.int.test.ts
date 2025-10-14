import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeNatGatewaysCommand,
  DescribeAddressesCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLoggingCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
  ListAttachedRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

describe('TapStack Integration Tests - Deployed Resources', () => {
  // Load CloudFormation outputs
  const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
  let outputs: any = {};
  let hasDeployment = false;

  // AWS Configuration
  const awsRegion = process.env.AWS_REGION || 'us-east-1';
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  // Initialize AWS SDK clients
  const ec2Client = new EC2Client({ region: awsRegion });
  const s3Client = new S3Client({ region: awsRegion });
  const iamClient = new IAMClient({ region: awsRegion });
  const cloudWatchClient = new CloudWatchClient({ region: awsRegion });

  beforeAll(() => {
    if (fs.existsSync(outputsPath)) {
      const content = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(content);
      hasDeployment = Object.keys(outputs).length > 0;
      console.log('Loaded deployment outputs:', Object.keys(outputs));
    } else {
      console.warn('No deployment outputs found. Integration tests will be skipped.');
    }
  });

  // Helper to skip tests if no deployment
  const skipIfNoDeployment = () => {
    if (!hasDeployment) {
      console.log('Skipping test - no deployment found');
      return true;
    }
    return false;
  };

  // ==================== VPC and Networking Tests ====================
  describe('VPC and Network Infrastructure', () => {
    test('should have 6 subnets in correct availability zones', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(6);

      // Verify subnets are in different AZs
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    }, 30000);

    test('should have 3 public subnets with correct CIDR blocks', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const publicSubnets = response.Subnets!.filter(s =>
        s.MapPublicIpOnLaunch === true
      );

      expect(publicSubnets).toHaveLength(3);

      const cidrBlocks = publicSubnets.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');
      expect(cidrBlocks).toContain('10.0.3.0/24');
    }, 30000);

    test('should have 3 private subnets with correct CIDR blocks', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const privateSubnets = response.Subnets!.filter(s =>
        s.MapPublicIpOnLaunch !== true
      );

      expect(privateSubnets).toHaveLength(3);

      const cidrBlocks = privateSubnets.map(s => s.CidrBlock).sort();
      expect(cidrBlocks).toContain('10.0.11.0/24');
      expect(cidrBlocks).toContain('10.0.12.0/24');
      expect(cidrBlocks).toContain('10.0.13.0/24');
    }, 30000);

    test('should have Internet Gateway attached to VPC', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
      expect(igw.Attachments![0].State).toBe('available');

      // Check tags
      const tags = igw.Tags || [];
      expect(tags.some(t => t.Key === 'Name' && t.Value === 'HA-Web-IGW')).toBe(true);
    }, 30000);

    test('should have 3 NAT Gateways in public subnets', async () => {
      if (skipIfNoDeployment()) return;

      const natGateway1Id = outputs.NATGateway1Id;
      const natGateway2Id = outputs.NATGateway2Id;
      const natGateway3Id = outputs.NATGateway3Id;

      expect(natGateway1Id).toBeDefined();
      expect(natGateway2Id).toBeDefined();
      expect(natGateway3Id).toBeDefined();

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGateway1Id, natGateway2Id, natGateway3Id],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toHaveLength(3);

      response.NatGateways!.forEach(nat => {
        expect(nat.State).toMatch(/available|pending/);
        expect(nat.NatGatewayAddresses).toHaveLength(1);
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
      });
    }, 30000);

    test('should have 3 Elastic IPs for NAT Gateways', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeAddressesCommand({
        Filters: [
          {
            Name: 'domain',
            Values: ['vpc'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Filter EIPs that are associated with NAT gateways
      const natEips = response.Addresses!.filter(addr =>
        addr.AssociationId?.startsWith('eipassoc-') && addr.NetworkInterfaceId
      );

      expect(natEips.length).toBeGreaterThanOrEqual(3);
    }, 30000);

    test('should have route table with internet gateway route', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThan(0);

      // Find route table with internet gateway route
      const publicRouteTable = response.RouteTables!.find(rt =>
        rt.Routes?.some(r => r.GatewayId?.startsWith('igw-') && r.DestinationCidrBlock === '0.0.0.0/0')
      );

      expect(publicRouteTable).toBeDefined();
      expect(publicRouteTable!.Associations!.length).toBeGreaterThanOrEqual(3);

      // Check tags
      const tags = publicRouteTable!.Tags || [];
      expect(tags.some(t => t.Key === 'Name' && t.Value === 'Public-Route-Table')).toBe(true);
    }, 30000);

    test('should have 3 private route tables with NAT gateway routes', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Find route tables with NAT gateway routes
      const privateRouteTables = response.RouteTables!.filter(rt =>
        rt.Routes?.some(r => r.NatGatewayId?.startsWith('nat-') && r.DestinationCidrBlock === '0.0.0.0/0')
      );

      expect(privateRouteTables.length).toBe(3);

      // Verify each private route table has exactly 1 subnet association
      privateRouteTables.forEach(rt => {
        const explicitAssociations = rt.Associations!.filter(a => a.SubnetId);
        expect(explicitAssociations).toHaveLength(1);
      });
    }, 30000);

    test('public subnets should be associated with public route table', async () => {
      if (skipIfNoDeployment()) return;

      const publicSubnet1Id = outputs.PublicSubnet1Id;
      const publicSubnet2Id = outputs.PublicSubnet2Id;
      const publicSubnet3Id = outputs.PublicSubnet3Id;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [publicSubnet1Id, publicSubnet2Id, publicSubnet3Id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(1);

      // All should have route to IGW
      response.RouteTables!.forEach(rt => {
        const igwRoute = rt.Routes?.find(r => r.GatewayId?.startsWith('igw-'));
        expect(igwRoute).toBeDefined();
      });
    }, 30000);

    test('private subnets should be associated with private route tables', async () => {
      if (skipIfNoDeployment()) return;

      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      const privateSubnet3Id = outputs.PrivateSubnet3Id;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [privateSubnet1Id, privateSubnet2Id, privateSubnet3Id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBe(3);

      // All should have route to NAT Gateway
      response.RouteTables!.forEach(rt => {
        const natRoute = rt.Routes?.find(r => r.NatGatewayId?.startsWith('nat-'));
        expect(natRoute).toBeDefined();
      });
    }, 30000);
  });

  // ==================== Security Groups Tests ====================
  describe('Security Groups', () => {
    test('security group should allow HTTP traffic', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const httpRule = sg.IpPermissions!.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(httpRule).toBeDefined();
      expect(httpRule!.IpProtocol).toBe('tcp');
      expect(httpRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
    }, 30000);

    test('security group should allow HTTPS traffic', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const httpsRule = sg.IpPermissions!.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );

      expect(httpsRule).toBeDefined();
      expect(httpsRule!.IpProtocol).toBe('tcp');
      expect(httpsRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
    }, 30000);

    test('security group should allow all outbound traffic', async () => {
      if (skipIfNoDeployment()) return;

      const securityGroupId = outputs.SecurityGroupId;
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [securityGroupId],
      });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const egressRule = sg.IpPermissionsEgress!.find(
        rule => rule.IpProtocol === '-1'
      );

      expect(egressRule).toBeDefined();
      expect(egressRule!.IpRanges).toContainEqual({ CidrIp: '0.0.0.0/0' });
    }, 30000);
  });

  // ==================== EC2 Instances Tests ====================
  describe('EC2 Instances', () => {
    test('should have 3 EC2 instances deployed and running', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      expect(instance1Id).toBeDefined();
      expect(instance2Id).toBeDefined();
      expect(instance3Id).toBeDefined();

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toHaveLength(3);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.State!.Name).toMatch(/running|pending/);
        expect(instance.InstanceType).toBe('t3.micro');
      });
    }, 30000);

    test('EC2 instances should be in private subnets', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(privateSubnetIds).toContain(instance.SubnetId);
      });
    }, 30000);

    test('EC2 instances should not have public IP addresses', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.PublicIpAddress).toBeUndefined();
      });
    }, 30000);

    test('EC2 instances should have web security group attached', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const securityGroupId = outputs.SecurityGroupId;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.SecurityGroups).toHaveLength(1);
      expect(instance.SecurityGroups![0].GroupId).toBe(securityGroupId);
    }, 30000);

    test('EC2 instances should have IAM instance profile', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.IamInstanceProfile).toBeDefined();
      expect(instance.IamInstanceProfile!.Arn).toContain('EC2InstanceProfile');
    }, 30000);

    test('EC2 instances should have monitoring enabled', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.Monitoring!.State).toMatch(/enabled|pending/);
      });
    }, 30000);

    test('EC2 instances should be distributed across 3 AZs', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      const azs = response.Reservations!.map(r => r.Instances![0].Placement!.AvailabilityZone);
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(3);
    }, 30000);

    test('EC2 instances should have correct tags', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];
      const tags = instance.Tags || [];

      expect(tags.some(t => t.Key === 'Name' && t.Value === 'Web-Server-AZ1')).toBe(true);
    }, 30000);
  });

  // ==================== S3 Buckets Tests ====================
  describe('S3 Storage', () => {
    test('should have application S3 bucket deployed', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.ApplicationS3BucketName;
      expect(bucketName).toBeDefined();

      // Check bucket exists
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();
    }, 30000);

    test('application bucket should have AES256 encryption', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.ApplicationS3BucketName;
      const command = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    }, 30000);

    test('application bucket should block public access', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.ApplicationS3BucketName;
      const command = new GetPublicAccessBlockCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      const config = response.PublicAccessBlockConfiguration!;
      expect(config.BlockPublicAcls).toBe(true);
      expect(config.BlockPublicPolicy).toBe(true);
      expect(config.IgnorePublicAcls).toBe(true);
      expect(config.RestrictPublicBuckets).toBe(true);
    }, 30000);

    test('application bucket should have versioning enabled', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.ApplicationS3BucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('application bucket should have logging configured', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.ApplicationS3BucketName;
      const command = new GetBucketLoggingCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled!.TargetPrefix).toBe('application-logs/');
    }, 30000);

    test('logging bucket should have lifecycle policy', async () => {
      if (skipIfNoDeployment()) return;

      // Derive logging bucket name from application bucket name
      const appBucketName = outputs.ApplicationS3BucketName;
      const loggingBucketName = appBucketName.replace('app-bucket', 'logging-bucket');

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: loggingBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);
      expect(response.Rules![0].Status).toBe('Enabled');
      expect(response.Rules![0].Expiration!.Days).toBe(90);
    }, 30000);

    test('logging bucket should have encryption enabled', async () => {
      if (skipIfNoDeployment()) return;

      const appBucketName = outputs.ApplicationS3BucketName;
      const loggingBucketName = appBucketName.replace('app-bucket', 'logging-bucket');

      const command = new GetBucketEncryptionCommand({ Bucket: loggingBucketName });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
    }, 30000);
  });

  // ==================== IAM Resources Tests ====================
  describe('IAM Roles and Policies', () => {
    test('should have EC2 role created', async () => {
      if (skipIfNoDeployment()) return;

      // Get instance profile from EC2 instance
      const instance1Id = outputs.EC2Instance1Id;
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const ec2Response = await ec2Client.send(ec2Command);
      const instance = ec2Response.Reservations![0].Instances![0];
      const profileArn = instance.IamInstanceProfile?.Arn;
      expect(profileArn).toBeDefined();

      const profileName = profileArn!.split('/').pop()!;
      const profileCommand = new GetInstanceProfileCommand({ InstanceProfileName: profileName });
      const profileResponse = await iamClient.send(profileCommand);

      expect(profileResponse.InstanceProfile).toBeDefined();
      expect(profileResponse.InstanceProfile!.Roles).toHaveLength(1);

      const roleName = profileResponse.InstanceProfile!.Roles![0].RoleName;
      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(roleCommand);

      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role!.RoleName).toContain('EC2');
    }, 30000);

    test('EC2 role should have CloudWatch managed policy', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const ec2Response = await ec2Client.send(ec2Command);
      const instance = ec2Response.Reservations![0].Instances![0];
      const profileArn = instance.IamInstanceProfile?.Arn;
      const profileName = profileArn!.split('/').pop()!;

      const profileCommand = new GetInstanceProfileCommand({ InstanceProfileName: profileName });
      const profileResponse = await iamClient.send(profileCommand);
      const roleName = profileResponse.InstanceProfile!.Roles![0].RoleName;

      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.AttachedPolicies).toBeDefined();
      const policyArns = response.AttachedPolicies!.map(p => p.PolicyArn);
      expect(policyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    }, 30000);

    test('EC2 role should have SSM managed policy', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const ec2Response = await ec2Client.send(ec2Command);
      const instance = ec2Response.Reservations![0].Instances![0];
      const profileArn = instance.IamInstanceProfile?.Arn;
      const profileName = profileArn!.split('/').pop()!;

      const profileCommand = new GetInstanceProfileCommand({ InstanceProfileName: profileName });
      const profileResponse = await iamClient.send(profileCommand);
      const roleName = profileResponse.InstanceProfile!.Roles![0].RoleName;

      const command = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.AttachedPolicies).toBeDefined();
      const policyArns = response.AttachedPolicies!.map(p => p.PolicyArn);
      expect(policyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    }, 30000);

    test('EC2 role should have S3 access policy', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const ec2Response = await ec2Client.send(ec2Command);
      const instance = ec2Response.Reservations![0].Instances![0];
      const profileArn = instance.IamInstanceProfile?.Arn;
      const profileName = profileArn!.split('/').pop()!;

      const profileCommand = new GetInstanceProfileCommand({ InstanceProfileName: profileName });
      const profileResponse = await iamClient.send(profileCommand);
      const roleName = profileResponse.InstanceProfile!.Roles![0].RoleName;

      const command = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3AccessPolicy',
      });
      const response = await iamClient.send(command);

      expect(response.PolicyDocument).toBeDefined();
      const policy = JSON.parse(decodeURIComponent(response.PolicyDocument!));
      expect(policy.Statement).toBeDefined();

      // Check for S3 operations
      const s3Statement = policy.Statement.find((s: any) =>
        s.Action.includes('s3:GetObject') || s.Action.includes('s3:PutObject')
      );
      expect(s3Statement).toBeDefined();
    }, 30000);
  });

  // ==================== CloudWatch Monitoring Tests ====================
  describe('CloudWatch Monitoring', () => {
    test('CPU alarms should have correct threshold', async () => {
      if (skipIfNoDeployment()) return;

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'CPUAlarm',
      });
      const response = await cloudWatchClient.send(command);

      response.MetricAlarms!.forEach(alarm => {
        expect(alarm.MetricName).toBe('CPUUtilization');
        expect(alarm.Namespace).toBe('AWS/EC2');
        expect(alarm.Statistic).toBe('Average');
        expect(alarm.Threshold).toBe(80);
        expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
        expect(alarm.EvaluationPeriods).toBe(2);
      });
    }, 30000);

  });

  // ==================== Cross-Service Integration Tests ====================
  describe('Cross-Service Integration Scenarios', () => {
    test('End-to-End: NAT Gateways should be in public subnets', async () => {
      if (skipIfNoDeployment()) return;

      const natGateway1Id = outputs.NATGateway1Id;
      const publicSubnet1Id = outputs.PublicSubnet1Id;
      const publicSubnet2Id = outputs.PublicSubnet2Id;
      const publicSubnet3Id = outputs.PublicSubnet3Id;

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGateway1Id],
      });
      const response = await ec2Client.send(command);

      const nat = response.NatGateways![0];
      expect([publicSubnet1Id, publicSubnet2Id, publicSubnet3Id]).toContain(nat.SubnetId);
    }, 30000);

    test('End-to-End: EC2 instances should be in private subnets without public IPs', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      const privateSubnet3Id = outputs.PrivateSubnet3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const response = await ec2Client.send(command);

      const instance = response.Reservations![0].Instances![0];

      // Verify instance is in a private subnet
      expect([privateSubnet1Id, privateSubnet2Id, privateSubnet3Id]).toContain(instance.SubnetId);

      // Verify instance does not have public IP
      expect(instance.PublicIpAddress).toBeUndefined();
    }, 30000);

    test('End-to-End: Private subnets should route through NAT gateways', async () => {
      if (skipIfNoDeployment()) return;

      const privateSubnet1Id = outputs.PrivateSubnet1Id;

      // Get route table for private subnet
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [privateSubnet1Id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(1);
      const routeTable = response.RouteTables![0];

      // Verify route to NAT gateway exists
      const natRoute = routeTable.Routes!.find(
        r => r.NatGatewayId?.startsWith('nat-') && r.DestinationCidrBlock === '0.0.0.0/0'
      );

      expect(natRoute).toBeDefined();
    }, 30000);

    test('End-to-End: Application bucket should log to logging bucket', async () => {
      if (skipIfNoDeployment()) return;

      const appBucketName = outputs.ApplicationS3BucketName;
      const loggingBucketName = appBucketName.replace('app-bucket', 'logging-bucket');

      const command = new GetBucketLoggingCommand({ Bucket: appBucketName });
      const response = await s3Client.send(command);

      expect(response.LoggingEnabled).toBeDefined();
      expect(response.LoggingEnabled!.TargetBucket).toBe(loggingBucketName);
    }, 30000);

    test('End-to-End: EC2 instances can access S3 via IAM role', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;

      // Get IAM role from instance profile
      const ec2Command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id],
      });
      const ec2Response = await ec2Client.send(ec2Command);
      const instance = ec2Response.Reservations![0].Instances![0];
      const profileArn = instance.IamInstanceProfile?.Arn;
      const profileName = profileArn!.split('/').pop()!;

      const profileCommand = new GetInstanceProfileCommand({ InstanceProfileName: profileName });
      const profileResponse = await iamClient.send(profileCommand);
      const roleName = profileResponse.InstanceProfile!.Roles![0].RoleName;

      // Check S3 access policy
      const policyCommand = new GetRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'S3AccessPolicy',
      });
      const policyResponse = await iamClient.send(policyCommand);

      const policy = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument!));
      const s3Statement = policy.Statement.find((s: any) =>
        JSON.stringify(s.Action).includes('s3:')
      );

      expect(s3Statement).toBeDefined();
      expect(s3Statement.Effect).toBe('Allow');
    }, 30000);

    test('End-to-End: Public route table directs traffic to Internet Gateway', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const publicRouteTable = response.RouteTables!.find(rt =>
        rt.Routes?.some(r => r.GatewayId?.startsWith('igw-'))
      );

      expect(publicRouteTable).toBeDefined();

      const igwRoute = publicRouteTable!.Routes!.find(
        r => r.GatewayId?.startsWith('igw-') && r.DestinationCidrBlock === '0.0.0.0/0'
      );

      expect(igwRoute).toBeDefined();
    }, 30000);

    test('End-to-End: Each AZ has both public and private subnet', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      // Group subnets by AZ
      const subnetsByAz = response.Subnets!.reduce((acc: any, subnet) => {
        const az = subnet.AvailabilityZone!;
        if (!acc[az]) acc[az] = [];
        acc[az].push(subnet);
        return acc;
      }, {});

      // Each AZ should have 2 subnets (1 public, 1 private)
      Object.values(subnetsByAz).forEach((subnets: any) => {
        expect(subnets.length).toBe(2);

        const hasPublic = subnets.some((s: any) => s.MapPublicIpOnLaunch === true);
        const hasPrivate = subnets.some((s: any) => s.MapPublicIpOnLaunch !== true);

        expect(hasPublic).toBe(true);
        expect(hasPrivate).toBe(true);
      });
    }, 30000);
  });

  // ==================== High Availability Tests ====================
  describe('High Availability Validation', () => {
    test('resources should be distributed across 3 availability zones', async () => {
      if (skipIfNoDeployment()) return;

      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(3);
    }, 30000);

    test('each AZ should have a NAT gateway for redundancy', async () => {
      if (skipIfNoDeployment()) return;

      const natGateway1Id = outputs.NATGateway1Id;
      const natGateway2Id = outputs.NATGateway2Id;
      const natGateway3Id = outputs.NATGateway3Id;

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGateway1Id, natGateway2Id, natGateway3Id],
      });
      const response = await ec2Client.send(command);

      const natAzs = response.NatGateways!.map(nat => {
        // Get AZ from subnet
        return nat.SubnetId;
      });

      // Verify NAT gateways are in different subnets (which are in different AZs)
      const uniqueSubnets = new Set(natAzs);
      expect(uniqueSubnets.size).toBe(3);
    }, 30000);

    test('EC2 instances should be spread across multiple AZs', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      const instanceAzs = response.Reservations!.map(r => r.Instances![0].Placement!.AvailabilityZone);
      const uniqueAzs = new Set(instanceAzs);

      expect(uniqueAzs.size).toBe(3);
    }, 30000);

    test('each private subnet should have its own route table with NAT gateway', async () => {
      if (skipIfNoDeployment()) return;

      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      const privateSubnet3Id = outputs.PrivateSubnet3Id;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'association.subnet-id',
            Values: [privateSubnet1Id, privateSubnet2Id, privateSubnet3Id],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toHaveLength(3);

      // Each route table should have a different NAT gateway
      const natGatewayIds = response.RouteTables!.map(rt => {
        const natRoute = rt.Routes!.find(r => r.NatGatewayId?.startsWith('nat-'));
        return natRoute?.NatGatewayId;
      });

      const uniqueNatGateways = new Set(natGatewayIds);
      expect(uniqueNatGateways.size).toBe(3);
    }, 30000);
  });

  // ==================== Security Compliance Tests ====================
  describe('Security Compliance Validation', () => {
    test('all S3 buckets should have encryption enabled', async () => {
      if (skipIfNoDeployment()) return;

      const appBucketName = outputs.ApplicationS3BucketName;
      const loggingBucketName = appBucketName.replace('app-bucket', 'logging-bucket');

      const buckets = [appBucketName, loggingBucketName];

      for (const bucket of buckets) {
        const command = new GetBucketEncryptionCommand({ Bucket: bucket });
        const response = await s3Client.send(command);

        expect(response.ServerSideEncryptionConfiguration).toBeDefined();
        const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
        expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      }
    }, 30000);

    test('all S3 buckets should block public access', async () => {
      if (skipIfNoDeployment()) return;

      const appBucketName = outputs.ApplicationS3BucketName;
      const loggingBucketName = appBucketName.replace('app-bucket', 'logging-bucket');

      const buckets = [appBucketName, loggingBucketName];

      for (const bucket of buckets) {
        const command = new GetPublicAccessBlockCommand({ Bucket: bucket });
        const response = await s3Client.send(command);

        const config = response.PublicAccessBlockConfiguration!;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      }
    }, 30000);

    test('no EC2 instances should have public IP addresses', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.PublicIpAddress).toBeUndefined();
      });
    }, 30000);

    test('EC2 instances should have IAM roles (not access keys)', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.IamInstanceProfile).toBeDefined();
      });
    }, 30000);

    test('application bucket should have versioning enabled', async () => {
      if (skipIfNoDeployment()) return;

      const bucketName = outputs.ApplicationS3BucketName;
      const command = new GetBucketVersioningCommand({ Bucket: bucketName });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    }, 30000);

    test('logging bucket should have lifecycle policy to delete old logs', async () => {
      if (skipIfNoDeployment()) return;

      const appBucketName = outputs.ApplicationS3BucketName;
      const loggingBucketName = appBucketName.replace('app-bucket', 'logging-bucket');

      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: loggingBucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThan(0);

      const expirationRule = response.Rules!.find(r => r.Expiration?.Days);
      expect(expirationRule).toBeDefined();
      expect(expirationRule!.Expiration!.Days).toBe(90);
    }, 30000);

    test('EC2 instances should have monitoring enabled', async () => {
      if (skipIfNoDeployment()) return;

      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      const instance3Id = outputs.EC2Instance3Id;

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id, instance3Id],
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.Monitoring!.State).toMatch(/enabled|pending/);
      });
    }, 30000);
  });
});
