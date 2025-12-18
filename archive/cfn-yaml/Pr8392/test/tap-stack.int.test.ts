import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Get environment configuration
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Stack name pattern
const stackName = `TapStack${environmentSuffix}`;

// Load deployment outputs
const FLAT_OUTPUTS_PATH = path.join(
  __dirname,
  '..',
  'cfn-outputs',
  'flat-outputs.json'
);

interface StackOutputs {
  [key: string]: string;
}

function loadOutputs(): StackOutputs {
  if (fs.existsSync(FLAT_OUTPUTS_PATH)) {
    try {
      const content = fs.readFileSync(FLAT_OUTPUTS_PATH, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn(`Warning: Could not parse outputs file: ${error}`);
      return {};
    }
  }
  return {};
}

// Helper function to run AWS CLI commands
function awsCommand(command: string): any {
  try {
    const result = execSync(
      `aws ${command} --region ${awsRegion} --output json`,
      { encoding: 'utf-8' }
    );
    return JSON.parse(result);
  } catch (error: any) {
    console.error(`AWS CLI command failed: ${command}`, error.message);
    throw error;
  }
}

describe('VPC Migration Infrastructure Integration Tests', () => {
  let outputs: StackOutputs;

  beforeAll(async () => {
    // Load outputs from deployment
    outputs = loadOutputs();
  });

  describe('Stack Discovery', () => {
    test('should have deployment outputs', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC created', async () => {
      expect(outputs.VPCId).toBeDefined();

      const result = awsCommand(
        `ec2 describe-vpcs --vpc-ids ${outputs.VPCId}`
      );

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs?.length).toBe(1);
      expect(result.Vpcs?.[0].VpcId).toBe(outputs.VPCId);
      expect(result.Vpcs?.[0].State).toBe('available');
    });

    test('should have correct VPC CIDR block', () => {
      expect(outputs.VPCCidr).toBe('10.1.0.0/16');
    });
  });

  describe('Subnet Resources', () => {
    test('should have 3 public subnets', async () => {
      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      expect(publicSubnetIds.every((id) => id)).toBe(true);

      const result = awsCommand(
        `ec2 describe-subnets --subnet-ids ${publicSubnetIds.join(' ')}`
      );

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets?.length).toBe(3);

      // Verify all subnets are in the correct VPC
      result.Subnets?.forEach((subnet: any) => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('should have 3 private subnets', async () => {
      const privateSubnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      expect(privateSubnetIds.every((id) => id)).toBe(true);

      const result = awsCommand(
        `ec2 describe-subnets --subnet-ids ${privateSubnetIds.join(' ')}`
      );

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets?.length).toBe(3);

      // Verify all subnets are in the correct VPC
      result.Subnets?.forEach((subnet: any) => {
        expect(subnet.VpcId).toBe(outputs.VPCId);
        expect(subnet.State).toBe('available');
      });
    });

    test('should have subnets across different availability zones', async () => {
      const allSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PrivateSubnet3Id,
      ];

      const result = awsCommand(
        `ec2 describe-subnets --subnet-ids ${allSubnetIds.join(' ')}`
      );

      const availabilityZones = new Set(
        result.Subnets?.map((s: any) => s.AvailabilityZone)
      );
      expect(availabilityZones.size).toBe(3);
    });
  });

  describe('NAT Gateway Resources', () => {
    test('should have 3 NAT gateways', async () => {
      const natGatewayIds = [
        outputs.NATGateway1Id,
        outputs.NATGateway2Id,
        outputs.NATGateway3Id,
      ];

      expect(natGatewayIds.every((id) => id)).toBe(true);

      const result = awsCommand(
        `ec2 describe-nat-gateways --nat-gateway-ids ${natGatewayIds.join(' ')}`
      );

      expect(result.NatGateways).toBeDefined();
      expect(result.NatGateways?.length).toBe(3);

      // Verify all NAT gateways are available
      result.NatGateways?.forEach((nat: any) => {
        expect(nat.State).toBe('available');
        expect(nat.VpcId).toBe(outputs.VPCId);
      });
    });

    test('should have NAT gateways in public subnets', async () => {
      const natGatewayIds = [
        outputs.NATGateway1Id,
        outputs.NATGateway2Id,
        outputs.NATGateway3Id,
      ];

      const publicSubnetIds = [
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id,
        outputs.PublicSubnet3Id,
      ];

      const result = awsCommand(
        `ec2 describe-nat-gateways --nat-gateway-ids ${natGatewayIds.join(' ')}`
      );

      result.NatGateways?.forEach((nat: any) => {
        expect(publicSubnetIds).toContain(nat.SubnetId);
      });
    });
  });

  describe('Security Group Resources', () => {
    test('should have web security group', async () => {
      expect(outputs.WebSecurityGroupId).toBeDefined();

      const result = awsCommand(
        `ec2 describe-security-groups --group-ids ${outputs.WebSecurityGroupId}`
      );

      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups?.length).toBe(1);
      expect(result.SecurityGroups?.[0].GroupId).toBe(
        outputs.WebSecurityGroupId
      );
      expect(result.SecurityGroups?.[0].VpcId).toBe(outputs.VPCId);
    });

    test('should have database security group', async () => {
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();

      const result = awsCommand(
        `ec2 describe-security-groups --group-ids ${outputs.DatabaseSecurityGroupId}`
      );

      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups?.length).toBe(1);
      expect(result.SecurityGroups?.[0].GroupId).toBe(
        outputs.DatabaseSecurityGroupId
      );
      expect(result.SecurityGroups?.[0].VpcId).toBe(outputs.VPCId);
    });
  });

  describe('VPC Endpoint Resources', () => {
    test('should have S3 VPC endpoint', async () => {
      expect(outputs.S3EndpointId).toBeDefined();

      const result = awsCommand(
        `ec2 describe-vpc-endpoints --vpc-endpoint-ids ${outputs.S3EndpointId}`
      );

      expect(result.VpcEndpoints).toBeDefined();
      expect(result.VpcEndpoints?.length).toBe(1);
      expect(result.VpcEndpoints?.[0].VpcEndpointId).toBe(
        outputs.S3EndpointId
      );
      expect(result.VpcEndpoints?.[0].VpcId).toBe(outputs.VPCId);
      expect(result.VpcEndpoints?.[0].State).toBe('available');
      expect(result.VpcEndpoints?.[0].ServiceName).toContain('s3');
    });

    test('should have DynamoDB VPC endpoint', async () => {
      expect(outputs.DynamoDBEndpointId).toBeDefined();

      const result = awsCommand(
        `ec2 describe-vpc-endpoints --vpc-endpoint-ids ${outputs.DynamoDBEndpointId}`
      );

      expect(result.VpcEndpoints).toBeDefined();
      expect(result.VpcEndpoints?.length).toBe(1);
      expect(result.VpcEndpoints?.[0].VpcEndpointId).toBe(
        outputs.DynamoDBEndpointId
      );
      expect(result.VpcEndpoints?.[0].VpcId).toBe(outputs.VPCId);
      expect(result.VpcEndpoints?.[0].State).toBe('available');
      expect(result.VpcEndpoints?.[0].ServiceName).toContain('dynamodb');
    });
  });

  describe('S3 Bucket for VPC Flow Logs', () => {
    test('should have flow logs bucket created', async () => {
      expect(outputs.FlowLogsBucketName).toBeDefined();

      try {
        awsCommand(`s3api head-bucket --bucket ${outputs.FlowLogsBucketName}`);
        expect(true).toBe(true); // Bucket exists
      } catch (error) {
        fail('Bucket does not exist or is not accessible');
      }
    });

    test('should have flow logs bucket ARN', () => {
      expect(outputs.FlowLogsBucketArn).toBeDefined();
      expect(outputs.FlowLogsBucketArn).toContain(
        outputs.FlowLogsBucketName
      );
    });
  });
});
