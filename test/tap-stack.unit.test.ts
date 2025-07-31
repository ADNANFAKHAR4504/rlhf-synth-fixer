// Configuration - These are coming from cfn-outputs after cdk deploy
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { mockClient } from 'aws-sdk-client-mock';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack'; // Adjust import path
import { WebServerStack } from '../lib/web-server';
import { findVpcByCidr } from '../bin/tap';

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

    const vpcId = await findVpcByCidr('10.0.0.0/16');
    expect(vpcId).toBe('vpc-12345678');
  });

  it('should return undefined when no CIDR matches', async () => {
    ec2Mock.on(DescribeVpcsCommand).resolves({
      Vpcs: [{ VpcId: 'vpc-99999999', CidrBlock: '172.31.0.0/16' }],
    });

    const vpcId = await findVpcByCidr('10.0.0.0/16');
    expect(vpcId).toBeUndefined();
  });

  it('should return undefined when Vpcs is undefined', async () => {
    ec2Mock.on(DescribeVpcsCommand).resolves({});

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
    });

    // Load the synthesized template of the TapStack
    const template = Template.fromStack(tapStack);

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
});
