import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Cloud Environment Infrastructure', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });
      
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should create EC2 instances in private subnets', () => {
      template.resourceCountIs('AWS::EC2::Instance', 2);
    });

    test('should create security groups with proper rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: `ALB Security Group for ${environmentSuffix} environment`
      });
      
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: `EC2 Security Group for ${environmentSuffix} environment`
      });
    });

    test('should create Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });

    test('should create NAT Gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });
});