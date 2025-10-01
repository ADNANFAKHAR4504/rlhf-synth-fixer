import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient
} from '@aws-sdk/client-rds';
import fs from 'fs';
import path from 'path';

const region = process.env.AWS_REGION || 'us-east-1';

// Read the actual Terraform outputs
let outputs: any = {};
const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');

try {
  if (!fs.existsSync(outputsPath)) {
    throw new Error(`Outputs file not found at: ${outputsPath}`);
  }
  
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  
  // Handle Terraform output format - outputs might be nested under 'value' key
  for (const [key, value] of Object.entries(rawOutputs)) {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      outputs[key] = (value as any).value;
    } else {
      outputs[key] = value;
    }
  }
  
  // Parse JSON strings if needed (for arrays)
  if (typeof outputs.public_subnet_ids === 'string') {
    try {
      outputs.public_subnet_ids = JSON.parse(outputs.public_subnet_ids);
    } catch {
      // If it's a comma-separated string
      outputs.public_subnet_ids = outputs.public_subnet_ids.split(',').map((s: string) => s.trim());
    }
  }
  
  if (typeof outputs.private_subnet_ids === 'string') {
    try {
      outputs.private_subnet_ids = JSON.parse(outputs.private_subnet_ids);
    } catch {
      // If it's a comma-separated string
      outputs.private_subnet_ids = outputs.private_subnet_ids.split(',').map((s: string) => s.trim());
    }
  }
  
  if (typeof outputs.nat_gateway_ids === 'string') {
    try {
      outputs.nat_gateway_ids = JSON.parse(outputs.nat_gateway_ids);
    } catch {
      // If it's a comma-separated string
      outputs.nat_gateway_ids = outputs.nat_gateway_ids.split(',').map((s: string) => s.trim());
    }
  }
  
  console.log('Loaded Terraform outputs:', JSON.stringify(outputs, null, 2));
} catch (error) {
  console.error('Failed to load Terraform outputs:', error);
  throw new Error('Cannot run integration tests without valid Terraform outputs. Please run "terraform apply" and ensure outputs are exported.');
}

const ec2 = new EC2Client({ region });
const rds = new RDSClient({ region });

describe('Terraform Infrastructure - AWS Resource Integration Tests', () => {

  beforeAll(() => {
    // Validate that we have essential outputs
    const essentialOutputs = ['vpc_id'];
    const missingOutputs = essentialOutputs.filter(key => !outputs[key]);
    
    if (missingOutputs.length > 0) {
      throw new Error(`Missing essential outputs: ${missingOutputs.join(', ')}`);
    }
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);

      const res = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId],
      }));

      const vpc = res.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe(outputs.vpc_cidr || '10.0.0.0/16');
    });

    test('VPC should be tagged correctly', async () => {
      const vpcId = outputs.vpc_id;
      const res = await ec2.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      const tags = res.Vpcs?.[0]?.Tags || [];

      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag?.Value).toContain('vpc');

      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('Terraform');
    });

    test('Internet Gateway should exist and be attached', async () => {
      const vpcId = outputs.vpc_id;

      const res = await ec2.send(new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [vpcId],
          },
        ],
      }));

      const igw = res.InternetGateways?.[0];
      expect(igw).toBeDefined();
      expect(igw?.Attachments?.[0]?.State).toBe('available');
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcId);
    });

    test('NAT Gateway should exist and be available', async () => {
      const res = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      }));

      expect(res.NatGateways?.length).toBeGreaterThanOrEqual(1);

      const natGateway = res.NatGateways?.[0];
      expect(natGateway).toBeDefined();
      expect(natGateway?.State).toBe('available');
      expect(natGateway?.NatGatewayAddresses?.[0]?.PublicIp).toBeDefined();
      expect(natGateway?.VpcId).toBe(outputs.vpc_id);
      
      // If we have nat_gateway_ids in outputs, verify them
      if (outputs.nat_gateway_ids && Array.isArray(outputs.nat_gateway_ids)) {
        const natGatewayIds = res.NatGateways?.map(ng => ng.NatGatewayId);
        outputs.nat_gateway_ids.forEach((id: string) => {
          expect(natGatewayIds).toContain(id);
        });
      }
    });

    test('NAT Gateway should be tagged correctly', async () => {
      const res = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
        ],
      }));

      const natGateway = res.NatGateways?.[0];
      const tags = natGateway?.Tags || [];

      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();

      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('Terraform');
    });
  });

  describe('Subnets', () => {
    test('All public and private subnets should exist', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;
      const privateSubnetIds = outputs.private_subnet_ids;

      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBe(2);
      expect(privateSubnetIds.length).toBe(2);

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      }));

      expect(res.Subnets?.length).toBe(4);
      res.Subnets?.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });

    test('Public subnets should have correct configuration', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      }));

      res.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.[12]\.0\/24$/);
      });

      const cidrs = res.Subnets?.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
    });

    test('Private subnets should have correct configuration', async () => {
      const privateSubnetIds = outputs.private_subnet_ids;

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      }));

      res.Subnets?.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.CidrBlock).toMatch(/^10\.0\.1[01]\.0\/24$/);
      });

      const cidrs = res.Subnets?.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.10.0/24', '10.0.11.0/24']);
    });

    test('Subnets should be in different availability zones', async () => {
      const allSubnetIds = [...outputs.public_subnet_ids, ...outputs.private_subnet_ids];

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      }));

      const azs = res.Subnets?.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });

    test('Subnets should be tagged correctly', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;
      const privateSubnetIds = outputs.private_subnet_ids;

      // Check public subnets
      const publicRes = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds,
      }));

      publicRes.Subnets?.forEach((subnet, index) => {
        const tags = subnet.Tags || [];
        const typeTag = tags.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Public');

        const nameTag = tags.find(tag => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag?.Value).toContain('public-subnet');
      });

      // Check private subnets
      const privateRes = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds,
      }));

      privateRes.Subnets?.forEach((subnet, index) => {
        const tags = subnet.Tags || [];
        const typeTag = tags.find(tag => tag.Key === 'Type');
        expect(typeTag?.Value).toBe('Private');

        const nameTag = tags.find(tag => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
        expect(nameTag?.Value).toContain('private-subnet');
      });
    });
  });

  describe('Route Tables', () => {
    test('Public route tables should route to Internet Gateway', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;

      const res = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'association.subnet-id',
            Values: publicSubnetIds,
          },
        ],
      }));

      expect(res.RouteTables?.length).toBeGreaterThanOrEqual(1);

      res.RouteTables?.forEach(routeTable => {
        const defaultRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute?.GatewayId).toMatch(/^igw-/);
        expect(defaultRoute?.State).toBe('active');
      });
    });

    test('Private route tables should route to NAT Gateway', async () => {
      const privateSubnetIds = outputs.private_subnet_ids;

      const res = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'association.subnet-id',
            Values: privateSubnetIds,
          },
        ],
      }));

      expect(res.RouteTables?.length).toBeGreaterThanOrEqual(1);

      res.RouteTables?.forEach(routeTable => {
        const defaultRoute = routeTable.Routes?.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(defaultRoute?.NatGatewayId).toMatch(/^nat-/);
        expect(defaultRoute?.State).toBe('active');
      });
    });

    test('Route tables should be tagged correctly', async () => {
      const res = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'tag:ManagedBy',
            Values: ['Terraform'],
          },
        ],
      }));

      expect(res.RouteTables?.length).toBeGreaterThan(0);
      
      res.RouteTables?.forEach(routeTable => {
        const tags = routeTable.Tags || [];
        const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
        expect(managedByTag?.Value).toBe('Terraform');
      });
    });
  });

  describe('Security Groups', () => {
    test('Application Security Group should exist with correct configuration', async () => {
      const sgId = outputs.app_security_group_id;
      expect(sgId).toBeDefined();
      expect(sgId).toMatch(/^sg-[a-z0-9]+$/);

      const res = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      }));

      const sg = res.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.vpc_id);

      // Should have outbound rule allowing all traffic
      const egressRules = sg?.IpPermissionsEgress;
      const allOutboundRule = egressRules?.find(r =>
        r.IpProtocol === '-1' &&
        r.IpRanges?.[0]?.CidrIp === '0.0.0.0/0'
      );
      expect(allOutboundRule).toBeDefined();
    });

    test('RDS Security Group should exist with correct rules', async () => {
      const sgId = outputs.rds_security_group_id;
      expect(sgId).toBeDefined();
      expect(sgId).toMatch(/^sg-[a-z0-9]+$/);

      const res = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [sgId],
      }));

      const sg = res.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.vpc_id);

      // Should have inbound rule for MySQL from app security group
      const ingressRules = sg?.IpPermissions;
      const mysqlRule = ingressRules?.find(r =>
        r.FromPort === 3306 &&
        r.ToPort === 3306 &&
        r.IpProtocol === 'tcp'
      );
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.app_security_group_id);
    });

    test('Security Groups should be tagged correctly', async () => {
      const sgIds = [outputs.app_security_group_id, outputs.rds_security_group_id];

      const res = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: sgIds,
      }));

      res.SecurityGroups?.forEach(sg => {
        const tags = sg.Tags || [];
        const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
        expect(managedByTag?.Value).toBe('Terraform');
      });
    });
  });

  describe('RDS Database', () => {
    test('RDS MySQL instance should exist and be available', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toMatch(/\.rds\.amazonaws\.com(:\d+)?$/);

      // Extract DB identifier from endpoint
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.PubliclyAccessible).toBe(false);
    });

    test('RDS instance should have correct network configuration', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance?.VpcSecurityGroups?.[0]?.VpcSecurityGroupId).toBe(outputs.rds_security_group_id);
      expect(dbInstance?.VpcSecurityGroups?.[0]?.Status).toBe('active');

      // Should be in private subnets
      const dbSubnetGroup = dbInstance?.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup?.VpcId).toBe(outputs.vpc_id);
    });

    test('RDS subnet group should exist with correct subnets', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const dbRes = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const subnetGroupName = dbRes.DBInstances?.[0]?.DBSubnetGroup?.DBSubnetGroupName;
      expect(subnetGroupName).toBeDefined();

      const subnetRes = await rds.send(new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupName,
      }));

      const subnetGroup = subnetRes.DBSubnetGroups?.[0];
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.VpcId).toBe(outputs.vpc_id);

      const subnetIds = subnetGroup?.Subnets?.map(s => s.SubnetIdentifier).sort();
      const expectedSubnetIds = outputs.private_subnet_ids.sort();
      expect(subnetIds).toEqual(expectedSubnetIds);
    });

    test('RDS instance should have correct backup configuration', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      expect(dbInstance?.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(dbInstance?.PreferredBackupWindow).toBeDefined();
      expect(dbInstance?.PreferredMaintenanceWindow).toBeDefined();
      expect(dbInstance?.CopyTagsToSnapshot).toBe(true);
    });

    test('RDS instance should have CloudWatch logs enabled', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      const enabledLogs = dbInstance?.EnabledCloudwatchLogsExports || [];
      expect(enabledLogs).toContain('error');
      expect(enabledLogs).toContain('general');
      expect(enabledLogs).toContain('slowquery');
    });

    test('RDS instance should be tagged correctly', async () => {
      const rdsEndpoint = outputs.rds_endpoint;
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const res = await rds.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      }));

      const dbInstance = res.DBInstances?.[0];
      const tags = dbInstance?.TagList || [];

      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();

      const managedByTag = tags.find(tag => tag.Key === 'ManagedBy');
      expect(managedByTag?.Value).toBe('Terraform');
    });
  });

  describe('Resource Tagging Consistency', () => {
    test('All major resources should have consistent tagging', async () => {
      // Check VPC
      const vpcRes = await ec2.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpc_id] }));
      const vpcTags = vpcRes.Vpcs?.[0]?.Tags || [];

      // Check Security Groups
      const sgRes = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.app_security_group_id, outputs.rds_security_group_id],
      }));

      // Check Subnets
      const subnetRes = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: [...outputs.public_subnet_ids, ...outputs.private_subnet_ids],
      }));

      // All resources should have ManagedBy = Terraform
      [vpcTags, ...sgRes.SecurityGroups?.map(sg => sg.Tags) || [], ...subnetRes.Subnets?.map(s => s.Tags) || []].forEach(tags => {
        const managedByTag = tags?.find(tag => tag.Key === 'ManagedBy');
        expect(managedByTag?.Value).toBe('Terraform');
      });
    });
  });

  describe('Output Validation', () => {
    test('All required outputs should be present and valid', () => {
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'app_security_group_id',
        'rds_security_group_id',
        'rds_endpoint',
        'rds_port',
      ];

      requiredOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
        if (!Array.isArray(outputs[key])) {
          expect(outputs[key]).not.toBe('');
        }
      });
    });

    test('Output values should have correct AWS resource ID format', () => {
      expect(outputs.vpc_id).toMatch(/^vpc-[a-z0-9]+$/);
      expect(outputs.app_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
      expect(outputs.rds_security_group_id).toMatch(/^sg-[a-z0-9]+$/);
      expect(outputs.rds_endpoint).toMatch(/\.rds\.amazonaws\.com(:\d+)?$/);

      // Check subnet IDs
      outputs.public_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-z0-9]+$/);
      });

      outputs.private_subnet_ids.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-z0-9]+$/);
      });
    });

    test('Subnet arrays should have expected counts', () => {
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBe(2);
      expect(outputs.private_subnet_ids.length).toBe(2);
    });
  });

  describe('Infrastructure Health and Connectivity', () => {
    test('All availability zones should be different for redundancy', async () => {
      const allSubnetIds = [...outputs.public_subnet_ids, ...outputs.private_subnet_ids];

      const res = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      }));

      const azs = res.Subnets?.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);

      // Should have at least 2 different AZs for redundancy
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateway should have Elastic IP assigned', async () => {
      const res = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id],
          },
          {
            Name: 'state',
            Values: ['available'],
          },
        ],
      }));

      const natGateway = res.NatGateways?.[0];
      expect(natGateway?.NatGatewayAddresses?.length).toBeGreaterThanOrEqual(1);

      const address = natGateway?.NatGatewayAddresses?.[0];
      expect(address?.PublicIp).toBeDefined();
      expect(address?.AllocationId).toMatch(/^eipalloc-/);
    });

    test('Database should be accessible from application security group', async () => {
      // This test verifies the security group rules allow connectivity
      const rdsRes = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.rds_security_group_id],
      }));

      const rdsSg = rdsRes.SecurityGroups?.[0];
      const mysqlRule = rdsSg?.IpPermissions?.find(r =>
        r.FromPort === 3306 && r.ToPort === 3306
      );

      expect(mysqlRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(outputs.app_security_group_id);

      // Verify the app security group exists
      const appRes = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.app_security_group_id],
      }));

      expect(appRes.SecurityGroups?.[0]).toBeDefined();
    });
  });
});