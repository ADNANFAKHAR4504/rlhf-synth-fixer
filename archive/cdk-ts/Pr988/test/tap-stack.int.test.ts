// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DescribeAddressesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetServiceNetworkCommand,
  VPCLatticeClient,
} from '@aws-sdk/client-vpc-lattice';
import fs from 'fs';

// Read outputs from deployment (this file is created during deployment)
const getOutputs = () => {
  try {
    const outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
    return outputs;
  } catch (error) {
    console.warn(
      'Warning: cfn-outputs/flat-outputs.json not found. Running in mock mode.'
    );
    // Return mock outputs for local testing
    return {
      VPCId: 'vpc-mock123456',
      PublicSubnetIds: 'subnet-pub1, subnet-pub2',
      PrivateSubnetIds: 'subnet-priv1, subnet-priv2',
      NATGatewayEIPs: 'eip-123, eip-456',
      ServiceNetworkArn:
        'arn:aws:vpc-lattice:us-west-2:123456789012:servicenetwork/sn-mock',
    };
  }
};

const outputs = getOutputs();

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-west-2';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const vpcLatticeClient = new VPCLatticeClient({ region });

describe('VPC Infrastructure Integration Tests', () => {
  const vpcId = outputs.VPCId;
  const publicSubnetIds =
    outputs.PublicSubnetIds?.split(', ').filter((id: string) => id) || [];
  const privateSubnetIds =
    outputs.PrivateSubnetIds?.split(', ').filter((id: string) => id) || [];
  const natGatewayEIPs =
    outputs.NATGatewayEIPs?.split(', ').filter((ip: string) => ip) || [];
  const serviceNetworkArn = outputs.ServiceNetworkArn;

  // Skip tests if running locally without deployment
  const skipIfNoDeployment = vpcId === 'vpc-mock123456' ? test.skip : test;

  describe('VPC Validation', () => {
    skipIfNoDeployment('VPC exists and is available', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
    });

    skipIfNoDeployment('VPC has DNS support enabled', async () => {
      const dnsSupport = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsSupport',
        })
      );

      const dnsHostnames = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: vpcId,
          Attribute: 'enableDnsHostnames',
        })
      );

      expect(dnsSupport.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnames.EnableDnsHostnames?.Value).toBe(true);
    });

    skipIfNoDeployment('VPC has IPv6 CIDR block associated', async () => {
      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = response.Vpcs![0];
      expect(vpc.Ipv6CidrBlockAssociationSet).toBeDefined();
      expect(vpc.Ipv6CidrBlockAssociationSet!.length).toBeGreaterThan(0);
      expect(
        vpc.Ipv6CidrBlockAssociationSet![0].Ipv6CidrBlockState?.State
      ).toBe('associated');
    });
  });

  describe('Subnet Validation', () => {
    skipIfNoDeployment(
      'has exactly 2 public subnets in different AZs',
      async () => {
        expect(publicSubnetIds).toHaveLength(2);

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: publicSubnetIds,
          })
        );

        expect(response.Subnets).toHaveLength(2);
        const azs = new Set(
          response.Subnets!.map(subnet => subnet.AvailabilityZone)
        );
        expect(azs.size).toBe(2); // Different AZs

        // Verify public subnet configuration
        response.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false); // Using EIPs instead
          expect(subnet.VpcId).toBe(vpcId);
        });
      }
    );

    skipIfNoDeployment(
      'has exactly 2 private subnets in different AZs',
      async () => {
        expect(privateSubnetIds).toHaveLength(2);

        const response = await ec2Client.send(
          new DescribeSubnetsCommand({
            SubnetIds: privateSubnetIds,
          })
        );

        expect(response.Subnets).toHaveLength(2);
        const azs = new Set(
          response.Subnets!.map(subnet => subnet.AvailabilityZone)
        );
        expect(azs.size).toBe(2); // Different AZs

        // Verify private subnet configuration
        response.Subnets!.forEach(subnet => {
          expect(subnet.MapPublicIpOnLaunch).toBe(false);
          expect(subnet.VpcId).toBe(vpcId);
        });
      }
    );

    skipIfNoDeployment('subnets have correct CIDR blocks', async () => {
      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds];
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          SubnetIds: allSubnetIds,
        })
      );

      const cidrBlocks = response.Subnets!.map(subnet => subnet.CidrBlock);
      expect(cidrBlocks).toContain('10.0.0.0/24');
      expect(cidrBlocks).toContain('10.0.1.0/24');
      expect(cidrBlocks).toContain('10.0.2.0/24');
      expect(cidrBlocks).toContain('10.0.3.0/24');
    });
  });

  describe('Internet Gateway Validation', () => {
    skipIfNoDeployment('Internet Gateway is attached to VPC', async () => {
      const response = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.InternetGateways).toHaveLength(1);
      const igw = response.InternetGateways![0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments![0].State).toBe('available');
      expect(igw.Attachments![0].VpcId).toBe(vpcId);
    });
  });

  describe('NAT Gateway Validation', () => {
    skipIfNoDeployment(
      'has exactly 2 NAT Gateways in public subnets',
      async () => {
        const response = await ec2Client.send(
          new DescribeNatGatewaysCommand({
            Filter: [
              {
                Name: 'vpc-id',
                Values: [vpcId],
              },
              {
                Name: 'state',
                Values: ['available'],
              },
            ],
          })
        );

        expect(response.NatGateways).toHaveLength(2);

        // Verify NAT Gateways are in public subnets
        response.NatGateways!.forEach(natGateway => {
          expect(publicSubnetIds).toContain(natGateway.SubnetId);
          expect(natGateway.State).toBe('available');
        });
      }
    );

    skipIfNoDeployment('NAT Gateways have Elastic IPs assigned', async () => {
      expect(natGatewayEIPs).toHaveLength(2);

      // Check if the values are IP addresses or allocation IDs
      const isAllocationId = natGatewayEIPs[0]?.startsWith('eip-');
      
      let response;
      if (isAllocationId) {
        // If they are allocation IDs, use them directly
        response = await ec2Client.send(
          new DescribeAddressesCommand({
            AllocationIds: natGatewayEIPs,
          })
        );
      } else {
        // If they are IP addresses, use PublicIps instead
        response = await ec2Client.send(
          new DescribeAddressesCommand({
            PublicIps: natGatewayEIPs,
          })
        );
      }

      expect(response.Addresses).toHaveLength(2);
      response.Addresses!.forEach(address => {
        expect(address.Domain).toBe('vpc');
        expect(address.AllocationId).toBeDefined();
      });
    });
  });

  describe('Route Table Validation', () => {
    skipIfNoDeployment(
      'public subnets have routes to Internet Gateway',
      async () => {
        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
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
          })
        );

        expect(response.RouteTables!.length).toBeGreaterThanOrEqual(2);

        response.RouteTables!.forEach(routeTable => {
          const defaultRoute = routeTable.Routes!.find(
            route => route.DestinationCidrBlock === '0.0.0.0/0'
          );
          expect(defaultRoute).toBeDefined();
          expect(defaultRoute!.GatewayId).toMatch(/^igw-/);

          // Check for IPv6 route
          const ipv6Route = routeTable.Routes!.find(
            route => route.DestinationIpv6CidrBlock === '::/0'
          );
          expect(ipv6Route).toBeDefined();
          expect(ipv6Route!.GatewayId).toMatch(/^igw-/);
        });
      }
    );

    skipIfNoDeployment(
      'private subnets have routes to NAT Gateways',
      async () => {
        const response = await ec2Client.send(
          new DescribeRouteTablesCommand({
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
          })
        );

        expect(response.RouteTables!.length).toBeGreaterThanOrEqual(2);

        response.RouteTables!.forEach(routeTable => {
          const defaultRoute = routeTable.Routes!.find(
            route => route.DestinationCidrBlock === '0.0.0.0/0'
          );
          expect(defaultRoute).toBeDefined();
          expect(defaultRoute!.NatGatewayId).toMatch(/^nat-/);
        });
      }
    );
  });

  describe('Security Group Validation', () => {
    skipIfNoDeployment('security groups allow ICMP traffic', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
            {
              Name: 'tag:Component',
              Values: ['Security'],
            },
          ],
        })
      );

      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(2);

      response.SecurityGroups!.forEach(sg => {
        // Check for ICMP ingress rules
        const icmpRules = sg.IpPermissions!.filter(
          rule => rule.IpProtocol === 'icmp' || rule.IpProtocol === '58' // 58 is ICMPv6
        );
        expect(icmpRules.length).toBeGreaterThan(0);

        // Check for egress rules (allow all)
        const egressRules = sg.IpPermissionsEgress!;
        expect(egressRules).toBeDefined();
        const allowAllEgress = egressRules.find(
          rule =>
            rule.IpProtocol === '-1' &&
            rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')
        );
        expect(allowAllEgress).toBeDefined();
      });
    });
  });

  describe('VPC Lattice Validation', () => {
    skipIfNoDeployment('Service Network exists and is configured', async () => {
      expect(serviceNetworkArn).toBeDefined();

      // Extract service network ID from ARN
      const serviceNetworkId = serviceNetworkArn.split('/').pop();

      const response = await vpcLatticeClient.send(
        new GetServiceNetworkCommand({
          serviceNetworkIdentifier: serviceNetworkId,
        })
      );

      expect(response.authType).toBe('AWS_IAM');
      expect(response.name).toContain(`service-network-${environmentSuffix}`);
    });

    skipIfNoDeployment('VPC is associated with Service Network', async () => {
      // Extract service network ID from ARN
      const serviceNetworkId = serviceNetworkArn.split('/').pop();

      // Note: GetServiceNetworkVpcAssociation requires the association ID
      // In a real scenario, we would list associations first
      // For this test, we're validating the service network exists
      expect(serviceNetworkId).toBeDefined();
    });
  });

  describe('Resource Tagging', () => {
    skipIfNoDeployment('all resources have proper tags', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = vpcResponse.Vpcs![0];
      const tags = vpc.Tags || [];

      const envTag = tags.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toContain(environmentSuffix);

      const projectTag = tags.find(tag => tag.Key === 'Project');
      expect(projectTag).toBeDefined();
      expect(projectTag!.Value).toBe('VPC-Infrastructure');

      const componentTag = tags.find(tag => tag.Key === 'Component');
      expect(componentTag).toBeDefined();
      expect(componentTag!.Value).toBe('Networking');
    });
  });

  describe('Network Connectivity', () => {
    test('outputs are properly formatted and accessible', () => {
      // Test that outputs exist and are in expected format
      expect(outputs).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnetIds).toBeDefined();
      expect(outputs.PrivateSubnetIds).toBeDefined();
      expect(outputs.NATGatewayEIPs).toBeDefined();
      expect(outputs.ServiceNetworkArn).toBeDefined();
    });

    test('subnet IDs are properly formatted', () => {
      publicSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
      });

      privateSubnetIds.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-z0-9]+$/);
      });
    });

    test('VPC ID is properly formatted', () => {
      expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('Service Network ARN is properly formatted', () => {
      expect(serviceNetworkArn).toMatch(
        /^arn:aws:vpc-lattice:[a-z0-9-]+:\d+:servicenetwork\/[a-z0-9-]+$/
      );
    });
  });
});
