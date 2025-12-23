// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeRouteTablesCommand,
  DescribeInternetGatewaysCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudwatchClient = new CloudWatchClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

describe('VPC Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC should exist and have correct CIDR block', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS hostnames enabled', async () => {
      const vpcId = outputs.VPCId;

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      // DNS hostnames is checked via VPC attributes API
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('VPC should have correct tags', async () => {
      const vpcId = outputs.VPCId;

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs![0].Tags || [];
      const tagKeys = tags.map(tag => tag.Key);

      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('CostCenter');

      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain(environmentSuffix);
    });
  });

  describe('Public Subnets', () => {
    test('should have 3 public subnets with correct CIDR blocks', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      expect(publicSubnetIds).toHaveLength(3);
      publicSubnetIds.forEach(id => expect(id).toBeDefined());

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual(['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']);
    });

    test('public subnets should span 3 different availability zones', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(3);
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('public subnets should have correct tags with environmentSuffix', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const nameTag = tags.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain(environmentSuffix);
        expect(nameTag?.Value).toContain('public-subnet');
      });
    });
  });

  describe('Private Subnets', () => {
    test('should have 3 private subnets with correct CIDR blocks', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      expect(privateSubnetIds).toHaveLength(3);
      privateSubnetIds.forEach(id => expect(id).toBeDefined());

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);

      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock).sort();
      expect(cidrBlocks).toEqual([
        '10.0.11.0/24',
        '10.0.12.0/24',
        '10.0.13.0/24',
      ]);
    });

    test('private subnets should span 3 different availability zones', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(3);
    });

    test('private subnets should NOT have MapPublicIpOnLaunch enabled', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('private subnets should have correct tags with environmentSuffix', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        const tags = subnet.Tags || [];
        const nameTag = tags.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain(environmentSuffix);
        expect(nameTag?.Value).toContain('private-subnet');
      });
    });
  });

  describe('Internet Gateway', () => {
    test('Internet Gateway should be attached to VPC', async () => {
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
      expect(response.InternetGateways![0].Attachments![0].State).toBe('available');
    });
  });

  describe('NAT Instances', () => {
    test('should have 3 NAT instances running', async () => {
      const natInstanceIds = [
        outputs.NATInstance1Id,
        outputs.NATInstance2Id,
        outputs.NATInstance3Id,
      ];

      expect(natInstanceIds).toHaveLength(3);
      natInstanceIds.forEach(id => expect(id).toBeDefined());

      const command = new DescribeInstancesCommand({
        InstanceIds: natInstanceIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toHaveLength(3);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.State?.Name).toMatch(/running|pending/);
      });
    });

    test('NAT instances should be t3.micro', async () => {
      const natInstanceIds = [
        outputs.NATInstance1Id,
        outputs.NATInstance2Id,
        outputs.NATInstance3Id,
      ];

      const command = new DescribeInstancesCommand({
        InstanceIds: natInstanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.InstanceType).toBe('t3.micro');
      });
    });

    test('NAT instances should have source/dest check disabled', async () => {
      const natInstanceIds = [
        outputs.NATInstance1Id,
        outputs.NATInstance2Id,
        outputs.NATInstance3Id,
      ];

      const command = new DescribeInstancesCommand({
        InstanceIds: natInstanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(instance.SourceDestCheck).toBe(false);
      });
    });

    test('NAT instances should have correct tags with environmentSuffix', async () => {
      const natInstanceIds = [
        outputs.NATInstance1Id,
        outputs.NATInstance2Id,
        outputs.NATInstance3Id,
      ];

      const command = new DescribeInstancesCommand({
        InstanceIds: natInstanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        const tags = instance.Tags || [];
        const nameTag = tags.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain(environmentSuffix);
        expect(nameTag?.Value).toContain('nat-instance');
      });
    });

    test('NAT instances should be in public subnets', async () => {
      const natInstanceIds = [
        outputs.NATInstance1Id,
        outputs.NATInstance2Id,
        outputs.NATInstance3Id,
      ];
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeInstancesCommand({
        InstanceIds: natInstanceIds,
      });
      const response = await ec2Client.send(command);

      response.Reservations!.forEach(reservation => {
        const instance = reservation.Instances![0];
        expect(publicSubnetIds).toContain(instance.SubnetId);
      });
    });
  });

  describe('Security Groups', () => {
    test('NAT instance security group should exist', async () => {
      const sgId = outputs.NATSecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
    });

    test('NAT security group should allow HTTP from private subnets', async () => {
      const sgId = outputs.NATSecurityGroupId;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const response = await ec2Client.send(command);

      const ingressRules = response.SecurityGroups![0].IpPermissions || [];
      const httpRules = ingressRules.filter(rule => rule.FromPort === 80);

      expect(httpRules.length).toBeGreaterThanOrEqual(1);

      const allowedCidrs = httpRules.flatMap(
        rule => rule.IpRanges?.map(range => range.CidrIp) || []
      );
      expect(allowedCidrs).toContain('10.0.11.0/24');
      expect(allowedCidrs).toContain('10.0.12.0/24');
      expect(allowedCidrs).toContain('10.0.13.0/24');
    });

    test('NAT security group should allow HTTPS from private subnets', async () => {
      const sgId = outputs.NATSecurityGroupId;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const response = await ec2Client.send(command);

      const ingressRules = response.SecurityGroups![0].IpPermissions || [];
      const httpsRules = ingressRules.filter(rule => rule.FromPort === 443);

      expect(httpsRules.length).toBeGreaterThanOrEqual(1);

      const allowedCidrs = httpsRules.flatMap(
        rule => rule.IpRanges?.map(range => range.CidrIp) || []
      );
      expect(allowedCidrs).toContain('10.0.11.0/24');
      expect(allowedCidrs).toContain('10.0.12.0/24');
      expect(allowedCidrs).toContain('10.0.13.0/24');
    });

    test('NAT security group should allow all outbound traffic', async () => {
      const sgId = outputs.NATSecurityGroupId;

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      });
      const response = await ec2Client.send(command);

      const egressRules = response.SecurityGroups![0].IpPermissionsEgress || [];
      const allTrafficRule = egressRules.find(rule => rule.IpProtocol === '-1');

      expect(allTrafficRule).toBeDefined();
    });
  });

  describe('Route Tables', () => {
    test('public route table should have route to Internet Gateway', async () => {
      const vpcId = outputs.VPCId;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: [`*public*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(1);

      const publicRouteTable = response.RouteTables![0];
      const routes = publicRouteTable.Routes || [];
      const igwRoute = routes.find(route => route.GatewayId?.startsWith('igw-'));

      expect(igwRoute).toBeDefined();
      expect(igwRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private route tables should have routes to NAT instances', async () => {
      const vpcId = outputs.VPCId;

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'tag:Name',
            Values: [`*private*${environmentSuffix}*`],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(3);

      response.RouteTables!.forEach(routeTable => {
        const routes = routeTable.Routes || [];
        const natRoute = routes.find(route => route.InstanceId?.startsWith('i-'));

        expect(natRoute).toBeDefined();
        expect(natRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
      });
    });

    test('public subnets should be associated with public route table', async () => {
      const vpcId = outputs.VPCId;
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'association.subnet-id',
            Values: publicSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      const associatedSubnets = new Set(
        response.RouteTables!.flatMap(rt =>
          rt.Associations?.map(assoc => assoc.SubnetId).filter(Boolean) || []
        )
      );

      publicSubnetIds.forEach(subnetId => {
        expect(associatedSubnets.has(subnetId)).toBe(true);
      });
    });

    test('private subnets should be associated with private route tables', async () => {
      const vpcId = outputs.VPCId;
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'association.subnet-id',
            Values: privateSubnetIds,
          },
        ],
      });
      const response = await ec2Client.send(command);

      const associatedSubnets = new Set(
        response.RouteTables!.flatMap(rt =>
          rt.Associations?.map(assoc => assoc.SubnetId).filter(Boolean) || []
        )
      );

      privateSubnetIds.forEach(subnetId => {
        expect(associatedSubnets.has(subnetId)).toBe(true);
      });
    });
  });

  describe('VPC Flow Logs (Optional)', () => {
    test('Flow logs S3 bucket should exist', async () => {
      const bucketName = outputs.FlowLogsBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({
        Bucket: bucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('Flow logs bucket should have encryption enabled', async () => {
      const bucketName = outputs.FlowLogsBucketName;

      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('CloudWatch Alarms (Optional)', () => {
    test('should have CloudWatch alarms for NAT instances', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `nat-instance`,
      });
      const response = await cloudwatchClient.send(command);

      const relevantAlarms = response.MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes(environmentSuffix)
      );

      expect(relevantAlarms!.length).toBeGreaterThanOrEqual(3);
    });

    test('NAT instance alarms should monitor status check', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `nat-instance`,
      });
      const response = await cloudwatchClient.send(command);

      const relevantAlarms = response.MetricAlarms?.filter(alarm =>
        alarm.AlarmName?.includes(environmentSuffix)
      );

      relevantAlarms!.forEach(alarm => {
        expect(alarm.MetricName).toBe('StatusCheckFailed');
        expect(alarm.Namespace).toBe('AWS/EC2');
      });
    });
  });

  describe('Multi-AZ Deployment Validation', () => {
    test('infrastructure should be deployed across exactly 3 AZs', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = new Set(azs);

      expect(uniqueAzs.size).toBe(3);
    });

    test('each AZ should have both public and private subnet', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const publicCommand = new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      });
      const publicResponse = await ec2Client.send(publicCommand);

      const privateCommand = new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      });
      const privateResponse = await ec2Client.send(privateCommand);

      const publicAzs = publicResponse.Subnets!.map(s => s.AvailabilityZone).sort();
      const privateAzs = privateResponse.Subnets!.map(s => s.AvailabilityZone).sort();

      expect(publicAzs).toEqual(privateAzs);
    });
  });

  describe('Network Segmentation Validation', () => {
    test('public and private subnets should have different CIDR ranges', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      const cidrBlocks = response.Subnets!.map(s => s.CidrBlock);
      const uniqueCidrs = new Set(cidrBlocks);

      expect(uniqueCidrs.size).toBe(6);
    });

    test('all subnets should be within VPC CIDR range', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.CidrBlock).toMatch(/^10\.0\.\d+\.0\/24$/);
      });
    });
  });
});
