import {
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import { mockClient } from 'aws-sdk-client-mock';
import {
  findTargetVpc,
  findVpcByCidr,
  findVpcById,
  getPrivateSubnets,
  getPublicSubnets,
  getSubnetConfiguration,
  getVpcSubnets,
  validateVpcSubnetConfiguration,
} from '../lib/vpc-utils';

// Create mock
const ec2Mock = mockClient(EC2Client);

describe('vpc-utils', () => {
  beforeEach(() => {
    ec2Mock.reset();
  });

  describe('findVpcByCidr', () => {
    it('should return the VPC ID when CIDR matches and validation passes', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [{ VpcId: 'vpc-12345678', CidrBlock: '10.0.0.0/16' }],
      });

      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-private-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      // Mock route table data for subnet-specific queries
      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-2',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-456' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      const vpcId = await findVpcByCidr('10.0.0.0/16');
      expect(vpcId).toBe('vpc-12345678');
    });

    it('should return undefined when CIDR matches but validation fails', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [{ VpcId: 'vpc-12345678', CidrBlock: '10.0.0.0/16' }],
      });

      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      const vpcId = await findVpcByCidr('10.0.0.0/16');
      expect(vpcId).toBeUndefined();
    });
  });

  describe('findVpcById', () => {
    it('should return the VPC ID when VPC exists and validation passes', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [{ VpcId: 'vpc-12345678', CidrBlock: '10.0.0.0/16' }],
      });

      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-private-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-2',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-456' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      const vpcId = await findVpcById('vpc-12345678');
      expect(vpcId).toBe('vpc-12345678');
    });

    it('should return undefined when VPC does not exist', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [],
      });

      const vpcId = await findVpcById('vpc-nonexistent');
      expect(vpcId).toBeUndefined();
    });
  });

  describe('findTargetVpc', () => {
    it('should call findVpcById with the target VPC ID', async () => {
      ec2Mock.on(DescribeVpcsCommand).resolves({
        Vpcs: [{ VpcId: 'vpc-0ea3cebfe865ee72f', CidrBlock: '10.0.0.0/16' }],
      });

      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-0ea3cebfe865ee72f',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-private-2',
            VpcId: 'vpc-0ea3cebfe865ee72f',
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-0ea3cebfe865ee72f',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-0ea3cebfe865ee72f',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-2',
              VpcId: 'vpc-0ea3cebfe865ee72f',
              Associations: [{ SubnetId: 'subnet-private-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-456' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-0ea3cebfe865ee72f',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      const vpcId = await findTargetVpc();
      expect(vpcId).toBe('vpc-0ea3cebfe865ee72f');
    });
  });

  describe('getVpcSubnets', () => {
    it('should return subnets for valid VPC ID', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      const subnets = await getVpcSubnets('vpc-12345678');
      expect(subnets).toHaveLength(2);
      expect(subnets[0]).toEqual({
        subnetId: 'subnet-1',
        cidrBlock: '10.0.1.0/24',
        availabilityZone: 'us-east-1a',
        isPublic: false,
      });
      expect(subnets[1]).toEqual({
        subnetId: 'subnet-2',
        cidrBlock: '10.0.2.0/24',
        availabilityZone: 'us-east-1b',
        isPublic: true,
      });
    });

    it('should return empty array when no subnets found', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [],
      });

      const subnets = await getVpcSubnets('vpc-12345678');
      expect(subnets).toEqual([]);
    });

    it('should return empty array when Subnets is undefined', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({});

      const subnets = await getVpcSubnets('vpc-12345678');
      expect(subnets).toEqual([]);
    });

    it('should throw error for invalid VPC ID', async () => {
      await expect(getVpcSubnets('invalid-vpc-id')).rejects.toThrow(
        'Invalid VPC ID: invalid-vpc-id'
      );
    });

    it('should throw error for empty VPC ID', async () => {
      await expect(getVpcSubnets('')).rejects.toThrow('Invalid VPC ID: ');
    });
  });

  describe('hasInternetGatewayRoute', () => {
    it('should return true when subnet has IGW route via explicit route table', async () => {
      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      // We need to test the private function indirectly through getPublicSubnets
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      const publicSubnets = await getPublicSubnets('vpc-12345678');
      expect(publicSubnets).toHaveLength(1);
      expect(publicSubnets[0].subnetId).toBe('subnet-public-1');
    });

    it('should return true when subnet has IGW route via main route table', async () => {
      // No explicit route table association
      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [],
        });

      // Main route table has IGW route
      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'vpc-id', Values: ['vpc-12345678'] },
            { Name: 'association.main', Values: ['true'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-main',
              VpcId: 'vpc-12345678',
              Associations: [{ Main: true }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      const publicSubnets = await getPublicSubnets('vpc-12345678');
      expect(publicSubnets).toHaveLength(1);
      expect(publicSubnets[0].subnetId).toBe('subnet-public-1');
    });

    it('should return false when subnet has no IGW route', async () => {
      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
        ],
      });

      const privateSubnets = await getPrivateSubnets('vpc-12345678');
      expect(privateSubnets).toHaveLength(1);
      expect(privateSubnets[0].subnetId).toBe('subnet-private-1');
    });

    it('should handle error gracefully and return false', async () => {
      ec2Mock
        .on(DescribeRouteTablesCommand)
        .rejects(new Error('AWS API Error'));

      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
        ],
      });

      const privateSubnets = await getPrivateSubnets('vpc-12345678');
      expect(privateSubnets).toHaveLength(1);
      expect(privateSubnets[0].subnetId).toBe('subnet-1');
    });

    it('should throw error for invalid VPC ID', async () => {
      await expect(getPrivateSubnets('invalid-vpc-id')).rejects.toThrow(
        'Invalid VPC ID: invalid-vpc-id'
      );
    });

    it('should throw error for invalid subnet ID', async () => {
      // This will be tested indirectly through the error handling in hasInternetGatewayRoute
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'invalid-subnet-id',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand)
        .rejects(new Error('Invalid Subnet ID: invalid-subnet-id'));

      await expect(getPrivateSubnets('vpc-12345678')).rejects.toThrow(
        'Invalid Subnet ID: invalid-subnet-id'
      );
    });

    it('should throw error for empty subnet ID', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: '',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
        ],
      });

      await expect(getPrivateSubnets('vpc-12345678')).rejects.toThrow(
        'Invalid Subnet ID: '
      );
    });

    it('should throw error for null subnet ID', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: null as any,
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
        ],
      });

      await expect(getPrivateSubnets('vpc-12345678')).rejects.toThrow(
        'Invalid Subnet ID: null'
      );
    });

    it('should throw error for undefined subnet ID', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: undefined as any,
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
        ],
      });

      await expect(getPrivateSubnets('vpc-12345678')).rejects.toThrow(
        'Invalid Subnet ID: undefined'
      );
    });

    it('should throw error for subnet ID that does not start with subnet-', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'wrong-prefix-123',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
        ],
      });

      await expect(getPrivateSubnets('vpc-12345678')).rejects.toThrow(
        'Invalid Subnet ID: wrong-prefix-123'
      );
    });
  });

  describe('getPrivateSubnets', () => {
    it('should return subnets without IGW routes', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-private-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-2',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-456' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      const privateSubnets = await getPrivateSubnets('vpc-12345678');
      expect(privateSubnets).toHaveLength(2);
      expect(privateSubnets[0].subnetId).toBe('subnet-private-1');
      expect(privateSubnets[1].subnetId).toBe('subnet-private-2');
    });
  });

  describe('getPublicSubnets', () => {
    it('should return subnets with IGW routes', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
          {
            SubnetId: 'subnet-public-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.4.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-2',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-456' },
              ],
            },
          ],
        });

      const publicSubnets = await getPublicSubnets('vpc-12345678');
      expect(publicSubnets).toHaveLength(2);
      expect(publicSubnets[0].subnetId).toBe('subnet-public-1');
      expect(publicSubnets[1].subnetId).toBe('subnet-public-2');
    });
  });

  describe('getSubnetConfiguration', () => {
    it('should return limited subnet configuration', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-private-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-private-3',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.5.0/24',
            AvailabilityZone: 'us-east-1c',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
          {
            SubnetId: 'subnet-public-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.4.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-2',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-456' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-3'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-3',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-3' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-789' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-2',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-456' },
              ],
            },
          ],
        });

      const config = await getSubnetConfiguration('vpc-12345678');
      expect(config.privateSubnets).toHaveLength(2);
      expect(config.publicSubnets).toHaveLength(1);
      expect(config.privateSubnets[0].subnetId).toBe('subnet-private-1');
      expect(config.privateSubnets[1].subnetId).toBe('subnet-private-2');
      expect(config.publicSubnets[0].subnetId).toBe('subnet-public-1');
    });
  });

  describe('validateVpcSubnetConfiguration', () => {
    it('should return true when VPC has valid subnet configuration', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-private-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-2',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-456' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      const isValid = await validateVpcSubnetConfiguration('vpc-12345678');
      expect(isValid).toBe(true);
    });

    it('should return false when VPC has insufficient private subnets', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-public-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.3.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: true,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-public-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-public-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-public-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', GatewayId: 'igw-123' },
              ],
            },
          ],
        });

      const isValid = await validateVpcSubnetConfiguration('vpc-12345678');
      expect(isValid).toBe(false);
    });

    it('should return false when VPC has no public subnets', async () => {
      ec2Mock.on(DescribeSubnetsCommand).resolves({
        Subnets: [
          {
            SubnetId: 'subnet-private-1',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.1.0/24',
            AvailabilityZone: 'us-east-1a',
            MapPublicIpOnLaunch: false,
          },
          {
            SubnetId: 'subnet-private-2',
            VpcId: 'vpc-12345678',
            CidrBlock: '10.0.2.0/24',
            AvailabilityZone: 'us-east-1b',
            MapPublicIpOnLaunch: false,
          },
        ],
      });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-1'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-1',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-1' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-123' },
              ],
            },
          ],
        });

      ec2Mock
        .on(DescribeRouteTablesCommand, {
          Filters: [
            { Name: 'association.subnet-id', Values: ['subnet-private-2'] },
          ],
        })
        .resolves({
          RouteTables: [
            {
              RouteTableId: 'rtb-private-2',
              VpcId: 'vpc-12345678',
              Associations: [{ SubnetId: 'subnet-private-2' }],
              Routes: [
                { DestinationCidrBlock: '0.0.0.0/0', NatGatewayId: 'nat-456' },
              ],
            },
          ],
        });

      const isValid = await validateVpcSubnetConfiguration('vpc-12345678');
      expect(isValid).toBe(false);
    });
  });
});
