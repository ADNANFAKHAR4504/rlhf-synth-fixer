import { execSync } from 'child_process';
import fs from 'fs';

// Load stack outputs
const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const region = process.env.AWS_REGION || 'us-east-1';

function awsCli(command: string): any {
  try {
    const result = execSync(`aws ${command} --region ${region} --output json`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return JSON.parse(result);
  } catch (error: any) {
    console.error(`AWS CLI error: ${error.message}`);
    throw error;
  }
}

describe('VPC Migration Infrastructure Integration Tests (CLI)', () => {
  describe('VPC Configuration', () => {
    test('VPC should exist and be available', () => {
      const result = awsCli(`ec2 describe-vpcs --vpc-ids ${outputs.VPCId}`);

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs.length).toBe(1);
      expect(result.Vpcs[0].State).toBe('available');
      expect(result.Vpcs[0].VpcId).toBe(outputs.VPCId);
    });

    test('VPC should have appropriate CIDR block', () => {
      const result = awsCli(`ec2 describe-vpcs --vpc-ids ${outputs.VPCId}`);

      const cidrBlock = result.Vpcs[0].CidrBlock;
      expect(cidrBlock).toBeDefined();
      expect(cidrBlock).toMatch(/^\d+\.\d+\.\d+\.\d+\/\d+$/);
    });
  });

  describe('Subnet Configuration', () => {
    const publicSubnetIds = [
      outputs.PublicSubnetAId,
      outputs.PublicSubnetBId,
      outputs.PublicSubnetCId
    ];

    const privateSubnetIds = [
      outputs.PrivateSubnetAId,
      outputs.PrivateSubnetBId,
      outputs.PrivateSubnetCId
    ];

    test('all 6 subnets should exist and be available', () => {
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds].join(' ');
      const result = awsCli(`ec2 describe-subnets --subnet-ids ${allSubnetIds}`);

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets.length).toBe(6);
      result.Subnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      const subnetIds = publicSubnetIds.join(' ');
      const result = awsCli(`ec2 describe-subnets --subnet-ids ${subnetIds}`);

      result.Subnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('private subnets should not have MapPublicIpOnLaunch enabled', () => {
      const subnetIds = privateSubnetIds.join(' ');
      const result = awsCli(`ec2 describe-subnets --subnet-ids ${subnetIds}`);

      result.Subnets.forEach((subnet: any) => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('subnets should be distributed across 3 availability zones', () => {
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds].join(' ');
      const result = awsCli(`ec2 describe-subnets --subnet-ids ${allSubnetIds}`);

      const azSet = new Set(result.Subnets.map((s: any) => s.AvailabilityZone));
      expect(azSet.size).toBe(3);
    });
  });

  describe('Internet Gateway', () => {
    test('internet gateway should be attached to VPC', () => {
      const result = awsCli(`ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=${outputs.VPCId}"`);

      expect(result.InternetGateways).toBeDefined();
      expect(result.InternetGateways.length).toBeGreaterThanOrEqual(1);
      expect(result.InternetGateways[0].Attachments[0].State).toBe('available');
      expect(result.InternetGateways[0].Attachments[0].VpcId).toBe(outputs.VPCId);
    });
  });

  describe('NAT Gateways', () => {
    test('should have 3 NAT gateways in available state', () => {
      const result = awsCli(`ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${outputs.VPCId}" "Name=state,Values=available"`);

      expect(result.NatGateways).toBeDefined();
      expect(result.NatGateways.length).toBe(3);
    });

    test('NAT gateways should be in public subnets', () => {
      const result = awsCli(`ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${outputs.VPCId}"`);

      const publicSubnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId
      ];

      result.NatGateways.forEach((natGw: any) => {
        expect(publicSubnetIds).toContain(natGw.SubnetId);
      });
    });

    test('each NAT gateway should have an Elastic IP', () => {
      const result = awsCli(`ec2 describe-nat-gateways --filter "Name=vpc-id,Values=${outputs.VPCId}"`);

      result.NatGateways.forEach((natGw: any) => {
        expect(natGw.NatGatewayAddresses).toBeDefined();
        expect(natGw.NatGatewayAddresses.length).toBeGreaterThan(0);
        expect(natGw.NatGatewayAddresses[0].PublicIp).toBeDefined();
      });
    });
  });

  describe('Security Groups', () => {
    test('web tier security group should exist', () => {
      const result = awsCli(`ec2 describe-security-groups --group-ids ${outputs.WebTierSecurityGroupId}`);

      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups.length).toBe(1);
      expect(result.SecurityGroups[0].VpcId).toBe(outputs.VPCId);
    });

    test('database tier security group should exist', () => {
      const result = awsCli(`ec2 describe-security-groups --group-ids ${outputs.DatabaseTierSecurityGroupId}`);

      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups.length).toBe(1);
      expect(result.SecurityGroups[0].VpcId).toBe(outputs.VPCId);
    });
  });

  describe('S3 Bucket', () => {
    test('migration logs bucket should have versioning enabled', () => {
      const result = awsCli(`s3api get-bucket-versioning --bucket ${outputs.MigrationLogsBucketName}`);

      expect(result.Status).toBe('Enabled');
    });

    test('bucket should have encryption enabled', () => {
      const result = awsCli(`s3api get-bucket-encryption --bucket ${outputs.MigrationLogsBucketName}`);

      expect(result.ServerSideEncryptionConfiguration).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration.Rules).toBeDefined();
      expect(result.ServerSideEncryptionConfiguration.Rules.length).toBeGreaterThan(0);

      const rule = result.ServerSideEncryptionConfiguration.Rules[0];
      expect(rule.ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('VPC Endpoint', () => {
    test('S3 VPC endpoint should exist and be available', () => {
      const result = awsCli(`ec2 describe-vpc-endpoints --vpc-endpoint-ids ${outputs.S3VPCEndpointId}`);

      expect(result.VpcEndpoints).toBeDefined();
      expect(result.VpcEndpoints.length).toBe(1);
      expect(result.VpcEndpoints[0].State).toBe('available');
      expect(result.VpcEndpoints[0].VpcId).toBe(outputs.VPCId);
    });

    test('VPC endpoint should be gateway type for S3', () => {
      const result = awsCli(`ec2 describe-vpc-endpoints --vpc-endpoint-ids ${outputs.S3VPCEndpointId}`);

      expect(result.VpcEndpoints[0].VpcEndpointType).toBe('Gateway');
      expect(result.VpcEndpoints[0].ServiceName).toContain('s3');
    });

    test('VPC endpoint should be associated with 3 private route tables', () => {
      const result = awsCli(`ec2 describe-vpc-endpoints --vpc-endpoint-ids ${outputs.S3VPCEndpointId}`);

      const routeTableIds = result.VpcEndpoints[0].RouteTableIds;
      expect(routeTableIds).toBeDefined();
      expect(routeTableIds.length).toBe(3);
    });
  });

  describe('Resource Tags', () => {
    test('VPC should have required tags', () => {
      const result = awsCli(`ec2 describe-vpcs --vpc-ids ${outputs.VPCId}`);

      const tags = result.Vpcs[0].Tags || [];
      const tagKeys = tags.map((t: any) => t.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Project');
      expect(tagKeys).toContain('Owner');
    });
  });

  describe('Multi-AZ High Availability', () => {
    test('infrastructure should span 3 availability zones', () => {
      const allSubnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId,
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId,
        outputs.PrivateSubnetCId
      ].join(' ');

      const result = awsCli(`ec2 describe-subnets --subnet-ids ${allSubnetIds}`);

      const azSet = new Set(result.Subnets.map((s: any) => s.AvailabilityZone));
      expect(azSet.size).toBe(3);
    });

    test('each AZ should have both public and private subnet', () => {
      const allSubnetIds = [
        outputs.PublicSubnetAId,
        outputs.PublicSubnetBId,
        outputs.PublicSubnetCId,
        outputs.PrivateSubnetAId,
        outputs.PrivateSubnetBId,
        outputs.PrivateSubnetCId
      ].join(' ');

      const result = awsCli(`ec2 describe-subnets --subnet-ids ${allSubnetIds}`);

      // Group by AZ
      const azGroups = new Map<string, any[]>();
      result.Subnets.forEach((subnet: any) => {
        const az = subnet.AvailabilityZone;
        if (!azGroups.has(az)) {
          azGroups.set(az, []);
        }
        azGroups.get(az)?.push(subnet);
      });

      // Each AZ should have exactly 2 subnets (1 public, 1 private)
      azGroups.forEach((subnets, az) => {
        expect(subnets.length).toBe(2);
      });
    });
  });
});
