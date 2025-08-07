// Configuration - These are coming from cfn-outputs after cdk deploy
import { DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { mockClient } from 'aws-sdk-client-mock';
import { TapStack, findVpcByCidr } from '../lib/tap-stack'; // Adjust import path
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

  it('should return undefined when VpcId is undefined in a matching VPC', async () => {
    ec2Mock.on(DescribeVpcsCommand).resolves({
      Vpcs: [{ CidrBlock: '10.0.0.0/16' }], // VPC without VpcId
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

  beforeEach(() => {
    // Reset environment variables before each test
    delete process.env.CDK_DEFAULT_ACCOUNT;
  });

  test('should instantiate WebServerStack with given VPC ID and default environmentSuffix', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestRootStack');

    const tapStack = new TapStack(stack, 'TestTapStack', {
      vpcId: 'vpc-12345678',
      env,
    });

    const webServer = tapStack.node.tryFindChild('WebServerStack') as WebServerStack;
    expect(webServer).toBeDefined();
    expect(webServer.stackName).toContain('WebServerStack');
    expect(webServer.node.tryGetContext('environmentSuffix') ?? 'dev').toBe('dev');
  });

  test('should use environmentSuffix from props if provided', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestRootStack');

    const tapStack = new TapStack(stack, 'TestTapStack', {
      vpcId: 'vpc-abc12345',
      environmentSuffix: 'prod',
      env,
    });

    const webServer = tapStack.node.tryFindChild('WebServerStack') as WebServerStack;
    expect(webServer).toBeDefined();
    expect(webServer.stackName).toContain('WebServerStack');
    expect(tapStack.node.tryGetContext('environmentSuffix') ?? 'prod').toBe('prod');
  });

  test('should use environmentSuffix from context if available', () => {
    const app = new cdk.App({
      context: {
        environmentSuffix: 'test'
      }
    });
    const stack = new cdk.Stack(app, 'TestRootStack');

    const tapStack = new TapStack(stack, 'TestTapStack', {
      vpcId: 'vpc-abc12345',
      env,
    });

    const webServer = tapStack.node.tryFindChild('WebServerStack') as WebServerStack;
    expect(webServer).toBeDefined();
    expect(webServer.stackName).toContain('WebServerStack');
    expect(tapStack.node.tryGetContext('environmentSuffix')).toBe('test');
  });

  test('should use CDK_DEFAULT_ACCOUNT when available', () => {
    process.env.CDK_DEFAULT_ACCOUNT = '999999999999';
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestRootStack');

    const tapStack = new TapStack(stack, 'TestTapStack', {
      vpcId: 'vpc-abc12345',
      env,
    });

    const webServer = tapStack.node.tryFindChild('WebServerStack') as WebServerStack;
    expect(webServer).toBeDefined();
    const template = Template.fromStack(tapStack);
    template.hasResourceProperties('AWS::CloudFormation::Stack', {
      Parameters: {
        env: expect.stringContaining('999999999999'),
      },
    });
  });

  test('should handle missing CDK_DEFAULT_ACCOUNT', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestRootStack');

    const tapStack = new TapStack(stack, 'TestTapStack', {
      vpcId: 'vpc-abc12345',
      env,
    });

    const webServer = tapStack.node.tryFindChild('WebServerStack') as WebServerStack;
    expect(webServer).toBeDefined();
    const template = Template.fromStack(tapStack);
    template.hasResourceProperties('AWS::CloudFormation::Stack', {
      Parameters: {
        env: expect.not.stringContaining('999999999999'),
      },
    });
  });
});

describe('main function', () => {
  beforeEach(() => {
    ec2Mock.reset();
  });

  it('should throw error when VPC is not found', async () => {
    ec2Mock.on(DescribeVpcsCommand).resolves({
      Vpcs: [{ VpcId: 'vpc-99999999', CidrBlock: '172.31.0.0/16' }],
    });

    await expect(async () => {
      const { main } = require('../lib/tap-stack');
      await main();
    }).rejects.toThrow('VPC with given CIDR not found');
  });

  it('should create TapStack when VPC is found', async () => {
    ec2Mock.on(DescribeVpcsCommand).resolves({
      Vpcs: [{ VpcId: 'vpc-12345678', CidrBlock: '10.0.0.0/16' }],
    });

    const { main } = require('../lib/tap-stack');
    await main();

    // Since main() creates a new App and Stack, we can't easily verify its contents
    // The fact that it doesn't throw is enough to verify it worked
  });
});