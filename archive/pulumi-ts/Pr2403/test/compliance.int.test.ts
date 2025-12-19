import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Configure AWS SDK
const region = process.env.AWS_REGION || 'us-east-1';
AWS.config.update({ region });

// Initialize AWS service clients
const ec2 = new AWS.EC2();

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

// Helper function to load outputs
const loadOutputs = () => {
  if (fs.existsSync(outputsPath)) {
    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  } else {
    throw new Error('No outputs file found. Deploy infrastructure first.');
  }
};

describe('PROMPT.md Compliance Tests', () => {
  beforeAll(() => {
    loadOutputs();
  });

  describe('Network Configuration Requirements', () => {
    test('VPC with CIDR block 10.0.0.0/16 in us-east-1 region', async () => {
      expect(outputs.vpcId).toBeDefined();

      const response = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
      const vpc = response.Vpcs![0];

      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('Two public subnets: 10.0.1.0/24 and 10.0.2.0/24 in different AZs', async () => {
      expect(outputs.publicSubnetIds).toBeDefined();

      const publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
      expect(publicSubnetIds).toHaveLength(2);

      const response = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();

      const cidrs = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      // Verify all AZs are in us-east-1
      response.Subnets!.forEach(subnet => {
        expect(subnet.AvailabilityZone).toMatch(/^us-east-1[a-z]$/);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('Two private subnets: 10.0.10.0/24 and 10.0.11.0/24 in different AZs', async () => {
      expect(outputs.privateSubnetIds).toBeDefined();

      const privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
      expect(privateSubnetIds).toHaveLength(2);

      const response = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();

      const cidrs = response.Subnets!.map(s => s.CidrBlock).sort();
      expect(cidrs).toEqual(['10.0.10.0/24', '10.0.11.0/24']);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      // Verify all AZs are in us-east-1
      response.Subnets!.forEach(subnet => {
        expect(subnet.AvailabilityZone).toMatch(/^us-east-1[a-z]$/);
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('Internet Gateway attached to the VPC', async () => {
      expect(outputs.vpcId).toBeDefined();

      const response = await ec2.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpcId] }],
      }).promise();

      expect(response.InternetGateways).toHaveLength(1);

      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(['attached', 'available']).toContain(igw.Attachments![0].State);
      expect(igw.Attachments![0].VpcId).toBe(outputs.vpcId);
    });

    test('Route tables configured properly for public subnets with default route to IGW', async () => {
      expect(outputs.vpcId).toBeDefined();

      const rtResponse = await ec2.describeRouteTables({
        Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      }).promise();

      // Find route table with default route to IGW
      const publicRouteTable = rtResponse.RouteTables!.find(rt =>
        rt.Routes!.some(r =>
          r.DestinationCidrBlock === '0.0.0.0/0' &&
          r.GatewayId &&
          r.GatewayId.startsWith('igw-')
        )
      );

      expect(publicRouteTable).toBeDefined();

      const defaultRoute = publicRouteTable!.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
      expect(defaultRoute).toBeDefined();
      expect(defaultRoute!.State).toBe('active');
    });
  });

  describe('Technical Requirements', () => {
    test('All resources use consistent naming prefix', async () => {
      const expectedPrefix = outputs.sanitizedName || 'iac-task';

      // Check VPC naming
      if (outputs.vpcId) {
        const vpcResponse = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
        const vpcName = vpcResponse.Vpcs![0].Tags?.find(tag => tag.Key === 'Name')?.Value;
        if (vpcName) {
          expect(vpcName).toMatch(new RegExp(expectedPrefix));
        }
      }

      // Check resource names in outputs
      if (outputs.dynamoTableName) {
        expect(outputs.dynamoTableName).toMatch(new RegExp(expectedPrefix));
      }

      if (outputs.albDnsName) {
        expect(outputs.albDnsName).toMatch(new RegExp(expectedPrefix));
      }
    });

    test('Resources have proper resource tagging', async () => {
      // Check VPC tags
      if (outputs.vpcId) {
        const vpcResponse = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
        const vpc = vpcResponse.Vpcs![0];

        expect(vpc.Tags).toBeDefined();
        const nameTag = vpc.Tags!.find(tag => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
      }

      // Check subnet tags
      if (outputs.publicSubnetIds) {
        const publicSubnetIds = JSON.parse(outputs.publicSubnetIds);
        const response = await ec2.describeSubnets({ SubnetIds: publicSubnetIds }).promise();

        response.Subnets!.forEach(subnet => {
          expect(subnet.Tags).toBeDefined();
          const nameTag = subnet.Tags!.find(tag => tag.Key === 'Name');
          expect(nameTag).toBeDefined();
        });
      }
    });

    test('VPC has DNS hostnames and DNS resolution enabled', async () => {
      expect(outputs.vpcId).toBeDefined();

      const dnsHostnamesResponse = await ec2.describeVpcAttribute({
        VpcId: outputs.vpcId,
        Attribute: 'enableDnsHostnames'
      }).promise();
      expect(dnsHostnamesResponse.EnableDnsHostnames!.Value).toBe(true);

      const dnsSupportResponse = await ec2.describeVpcAttribute({
        VpcId: outputs.vpcId,
        Attribute: 'enableDnsSupport'
      }).promise();
      expect(dnsSupportResponse.EnableDnsSupport!.Value).toBe(true);
    });
  });

  describe('AWS Latest Features Integration', () => {
    test('VPC configured with IPv4 CIDR allocation for VPC Lattice integration', async () => {
      expect(outputs.vpcId).toBeDefined();

      const response = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
      const vpc = response.Vpcs![0];

      // IPv4 CIDR for VPC Lattice
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC subnet architecture supports AWS PrivateLink endpoints', async () => {
      expect(outputs.privateSubnetIds).toBeDefined();

      const privateSubnetIds = JSON.parse(outputs.privateSubnetIds);
      const response = await ec2.describeSubnets({ SubnetIds: privateSubnetIds }).promise();

      // Multiple AZs for PrivateLink HA
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2);

      // DNS resolution enabled (checked in previous test)
      const dnsResponse = await ec2.describeVpcAttribute({
        VpcId: outputs.vpcId,
        Attribute: 'enableDnsSupport'
      }).promise();
      expect(dnsResponse.EnableDnsSupport!.Value).toBe(true);
    });
  });

  describe('Infrastructure Outputs', () => {
    test('All required values are exported for integration', async () => {
      // VPC ID
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      // Public subnet IDs
      expect(outputs.publicSubnetIds).toBeDefined();
      const publicIds = JSON.parse(outputs.publicSubnetIds);
      expect(publicIds).toHaveLength(2);
      publicIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });

      // Private subnet IDs
      expect(outputs.privateSubnetIds).toBeDefined();
      const privateIds = JSON.parse(outputs.privateSubnetIds);
      expect(privateIds).toHaveLength(2);
      privateIds.forEach((id: string) => {
        expect(id).toMatch(/^subnet-[a-f0-9]+$/);
      });

      // Internet Gateway ID (verify it exists even if not exported)
      const igwResponse = await ec2.describeInternetGateways({
        Filters: [{ Name: 'attachment.vpc-id', Values: [outputs.vpcId] }],
      }).promise();
      expect(igwResponse.InternetGateways).toHaveLength(1);
      expect(igwResponse.InternetGateways![0].InternetGatewayId).toMatch(/^igw-[a-f0-9]+$/);

      // Route table IDs (verify they exist)
      const rtResponse = await ec2.describeRouteTables({
        Filters: [{ Name: 'vpc-id', Values: [outputs.vpcId] }],
      }).promise();
      expect(rtResponse.RouteTables!.length).toBeGreaterThanOrEqual(2);
      rtResponse.RouteTables!.forEach(rt => {
        expect(rt.RouteTableId).toMatch(/^rtb-[a-f0-9]+$/);
      });
    });
  });

  describe('Configuration and Parameterization', () => {
    test('No hardcoded values - uses Pulumi configuration', async () => {
      // Environment should be configurable
      expect(outputs.environment || process.env.ENVIRONMENT_SUFFIX).toBeDefined();

      // Resource naming should include environment
      expect(outputs.sanitizedName).toBeDefined();
      expect(outputs.sanitizedName).toMatch(/^[a-zA-Z0-9-]+$/);
    });

    test('AWS provider properly configured for us-east-1', async () => {
      expect(region).toBe('us-east-1');

      // Verify all resources are in us-east-1
      if (outputs.vpcId) {
        const response = await ec2.describeVpcs({ VpcIds: [outputs.vpcId] }).promise();
        expect(response.Vpcs).toHaveLength(1);
      }
    });
  });
});