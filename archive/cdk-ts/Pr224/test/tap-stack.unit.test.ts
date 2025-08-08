// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  DescribeRouteTablesCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { mockClient } from 'aws-sdk-client-mock';
import { TapStack } from '../lib/tap-stack'; // Adjust import path
import { findVpcByCidr } from '../lib/vpc-utils';
import { WebServerStack } from '../lib/web-server';

// Create mock
const ec2Mock = mockClient(EC2Client);

describe('findVpcByCidr', () => {
  beforeEach(() => {
    ec2Mock.reset();
  });

  it('should return the VPC ID when CIDR matches', async () => {
    ec2Mock.on(DescribeVpcsCommand).resolves({
      Vpcs: [
        { VpcId: 'vpc-12345678', CidrBlock: '10.0.0.0/16' },
        { VpcId: 'vpc-87654321', CidrBlock: '192.168.0.0/16' },
      ],
    });

    // Mock subnet data for vpc-12345678
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

  it('should return undefined when no CIDR matches', async () => {
    ec2Mock.on(DescribeVpcsCommand).resolves({
      Vpcs: [{ VpcId: 'vpc-99999999', CidrBlock: '172.31.0.0/16' }],
    });

    // Mock empty subnet data since no matching VPC will be found
    ec2Mock.on(DescribeSubnetsCommand).resolves({
      Subnets: [],
    });

    // Mock empty route table data
    ec2Mock.on(DescribeRouteTablesCommand).resolves({
      RouteTables: [],
    });

    const vpcId = await findVpcByCidr('10.0.0.0/16');
    expect(vpcId).toBeUndefined();
  });

  it('should return undefined when Vpcs is undefined', async () => {
    ec2Mock.on(DescribeVpcsCommand).resolves({});

    // Mock empty subnet data since no VPCs will be found
    ec2Mock.on(DescribeSubnetsCommand).resolves({
      Subnets: [],
    });

    // Mock empty route table data
    ec2Mock.on(DescribeRouteTablesCommand).resolves({
      RouteTables: [],
    });

    const vpcId = await findVpcByCidr('10.0.0.0/16');
    expect(vpcId).toBeUndefined();
  });
});

describe('TapStack', () => {
  const env = {
    account: '111111111111',
    region: 'us-east-1',
  };

  beforeAll(() => {
    jest.spyOn(ec2.Vpc, 'fromLookup').mockImplementation(() => {
      return {
        vpcId: 'vpc-123456',
        selectSubnets: (selection?: ec2.SubnetSelection) => {
          if (selection?.subnetType === ec2.SubnetType.PRIVATE_ISOLATED) {
            return {
              subnetIds: ['subnet-priv-1', 'subnet-priv-2'],
              subnets: [
                { subnetId: 'subnet-priv-1' } as ec2.ISubnet,
                { subnetId: 'subnet-priv-2' } as ec2.ISubnet,
              ],
            };
          }

          return {
            subnetIds: ['subnet-pub-1'],
            subnets: [{ subnetId: 'subnet-pub-1' } as ec2.ISubnet],
          };
        },
        availabilityZones: ['us-east-1a', 'us-east-1b'],
      } as unknown as ec2.IVpc;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  test('should instantiate WebServerStack with given VPC ID and default environmentSuffix', () => {
    const app = new cdk.App();

    const stack = new cdk.Stack(app, 'TestRootStack');

    const tapStack = new TapStack(stack, 'TestTapStack', {
      vpcId: 'vpc-12345678',
      env,
      environmentSuffix: 'dev',
    });

    // Load the synthesized template of the TapStack
    const template = Template.fromStack(tapStack);

    console.log(JSON.stringify(template.toJSON(), null, 2));
    // Ensure WebServerStack is defined
    const webServer = tapStack.node.tryFindChild(
      'WebServerStack'
    ) as WebServerStack;
    expect(webServer).toBeDefined();

    // Check WebServerStack props
    expect(webServer.stackName).toContain('WebServerStack');
    expect(webServer.node.tryGetContext('environmentSuffix') ?? 'dev').toBe(
      'dev'
    );
  });

  test('should use environmentSuffix from props if provided', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestRootStack');

    const tapStack = new TapStack(stack, 'TestTapStack', {
      vpcId: 'vpc-abc12345',
      environmentSuffix: 'prod',
      env,
    });

    const webServer = tapStack.node.tryFindChild(
      'WebServerStack'
    ) as WebServerStack;
    expect(webServer).toBeDefined();
    expect(webServer.stackName).toContain('WebServerStack');
    expect(tapStack.node.tryGetContext('environmentSuffix') ?? 'prod').toBe(
      'prod'
    );
  });

  test('should fallback to context environmentSuffix if not provided in props', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'staging',
      },
    });

    const rootStack = new cdk.Stack(app, 'TestRootStack');
    const tapStack = new TapStack(rootStack, 'TestTapStack', {
      vpcId: 'vpc-xyz456',
      env,
    });

    const webServer = tapStack.node.tryFindChild(
      'WebServerStack'
    ) as WebServerStack;
    expect(webServer).toBeDefined();
    expect(webServer.node.tryGetContext('environmentSuffix') ?? 'staging').toBe(
      'staging'
    );
  });

  test('should fallback to default environmentSuffix when neither props nor context is provided', () => {
    const app = new cdk.App();

    const rootStack = new cdk.Stack(app, 'TestRootStack');
    const tapStack = new TapStack(rootStack, 'TestTapStack', {
      vpcId: 'vpc-xyz456',
      env,
    });

    const webServer = tapStack.node.tryFindChild(
      'WebServerStack'
    ) as WebServerStack;
    expect(webServer).toBeDefined();
    expect(webServer.node.tryGetContext('environmentSuffix') ?? 'dev').toBe(
      'dev'
    );
  });

  test('should inject account and region into WebServerStack', () => {
    const app = new cdk.App();
    const rootStack = new cdk.Stack(app, 'TestRootStack');

    const tapStack = new TapStack(rootStack, 'TestTapStack', {
      vpcId: 'vpc-789',
      environmentSuffix: 'dev',
      env,
    });

    const webServer = tapStack.node.tryFindChild(
      'WebServerStack'
    ) as WebServerStack;
    expect(webServer).toBeDefined();
    expect(webServer.region).toBe(env.region);
  });
});
