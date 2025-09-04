import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/vpc-stack';

describe('VpcStack', () => {
  describe('with explicit environment suffix', () => {
    let stack: cdk.Stack;
    let vpcStack: VpcStack;
    let template: Template;

    beforeEach(() => {
      const app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack');
      vpcStack = new VpcStack(stack, 'VpcStack', {
        environmentSuffix: 'test'
      });
      template = Template.fromStack(stack);
    });

    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets with correct configuration', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.0.0.0/24'
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.0.1.0/24'
      });
    });

    test('creates VPC Lattice Service Network', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-test',
        AuthType: 'NONE',
      });
    });

    test('creates VPC Lattice Service Network Association', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetworkVpcAssociation', {});
    });

    test('creates S3 Gateway endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Gateway',
      });
    });

    test('creates S3 Interface endpoint', () => {
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        VpcEndpointType: 'Interface',
        PrivateDnsEnabled: true,
      });
    });

    test('creates EC2 Interface endpoint', () => {
      // Check that we have 3 VPC endpoints total (1 Gateway + 2 Interface)
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 3);
      
      // Verify at least 2 are Interface endpoints
      const resources = template.toJSON().Resources;
      const interfaceEndpoints = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::VPCEndpoint' && r.Properties.VpcEndpointType === 'Interface'
      );
      expect(interfaceEndpoints.length).toBe(2);
    });

    test('creates security groups for VPC endpoints', () => {
      // Should have security groups for interface endpoints
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.anyValue(),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443
          })
        ])
      });
    });

    test('exports VPC properties', () => {
      expect(vpcStack.vpc).toBeDefined();
      expect(vpcStack.serviceNetwork).toBeDefined();
    });

    test('creates outputs with correct export names', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);
      
      expect(outputKeys.some(key => key.includes('VpcId'))).toBe(true);
      expect(outputKeys.some(key => key.includes('PublicSubnetIds'))).toBe(true);
      expect(outputKeys.some(key => key.includes('ServiceNetworkId'))).toBe(true);
    });
  });

  describe('with default environment suffix', () => {
    let stack: cdk.Stack;
    let template: Template;

    beforeEach(() => {
      const app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack');
      new VpcStack(stack, 'VpcStack');
      template = Template.fromStack(stack);
    });

    test('uses default dev environment suffix', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-dev',
        AuthType: 'NONE',
      });
    });
  });

  describe('with undefined environment suffix', () => {
    let stack: cdk.Stack;
    let template: Template;

    beforeEach(() => {
      const app = new cdk.App();
      stack = new cdk.Stack(app, 'TestStack');
      new VpcStack(stack, 'VpcStack', {
        environmentSuffix: undefined
      });
      template = Template.fromStack(stack);
    });

    test('falls back to default dev environment suffix', () => {
      template.hasResourceProperties('AWS::VpcLattice::ServiceNetwork', {
        Name: 'service-network-dev',
        AuthType: 'NONE',
      });
    });
  });
});