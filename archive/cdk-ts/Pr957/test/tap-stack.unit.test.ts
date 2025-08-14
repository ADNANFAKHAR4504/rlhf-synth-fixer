import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  describe('with explicit environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);
    });

  test('creates VPC with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('creates two public subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 2);

    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('creates Internet Gateway', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('creates route tables and associations', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 2); // One for each public subnet
    template.resourceCountIs('AWS::EC2::SubnetRouteTableAssociation', 2);
  });

  test('creates VPC Lattice Service Network', () => {
    template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
      Name: 'service-network-test',
      AuthType: 'NONE',
    });
  });

  test('creates VPC endpoints for AWS services', () => {
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 3); // Gateway + 2 Interface endpoints
  });

  test('outputs VPC and subnet information', () => {
    // Check that outputs exist - the exact name includes a hash after the environment suffix
    const outputs = template.findOutputs('*');
    const outputKeys = Object.keys(outputs);
    
    expect(outputKeys.some(key => key.startsWith('VpcStackVpcIdtest'))).toBe(true);
    expect(outputKeys.some(key => key.startsWith('VpcStackPublicSubnetIdstest'))).toBe(true);
    expect(outputKeys.some(key => key.startsWith('VpcStackServiceNetworkIdtest'))).toBe(true);
  });
  });

  describe('with context environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'contexttest'
        }
      });
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);
    });

    test('uses context environment suffix', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-contexttest',
        AuthType: 'NONE',
      });
    });
  });

  describe('with default environment suffix', () => {
    let app: cdk.App;
    let stack: TapStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);
    });

    test('uses default dev environment suffix', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-dev',
        AuthType: 'NONE',
      });
    });
  });
});
