import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecureNetworking } from '../lib/constructs/secure-networking';

describe('SecureNetworking Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-west-2' },
    });
  });

  describe('default configuration', () => {
    beforeEach(() => {
      new SecureNetworking(stack, 'TestNetworking');
      template = Template.fromStack(stack);
    });

    test('creates VPC with default CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates subnets in 2 availability zones', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4);
    });

    test('tags VPC with Environment Production', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });
  });

  describe('custom configuration', () => {
    beforeEach(() => {
      new SecureNetworking(stack, 'TestNetworking', {
        cidr: '192.168.0.0/16',
        maxAzs: 3,
      });
      template = Template.fromStack(stack);
    });

    test('uses custom CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '192.168.0.0/16',
      });
    });

    test('creates subnets in 3 availability zones', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private
    });
  });

  describe('security group rules', () => {
    beforeEach(() => {
      new SecureNetworking(stack, 'TestNetworking');
      template = Template.fromStack(stack);
    });

    test('restricts SSH access to specific IP', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            CidrIp: '203.0.113.0/24',
          }),
        ]),
      });
    });

    test('allows HTTP from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('allows HTTPS from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });
  });

  describe('network firewall', () => {
    beforeEach(() => {
      new SecureNetworking(stack, 'TestNetworking');
      template = Template.fromStack(stack);
    });

    test('creates firewall policy', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::FirewallPolicy', {
        FirewallPolicyName: 'production-firewall-policy',
        FirewallPolicy: {
          StatelessDefaultActions: ['aws:pass'],
          StatelessFragmentDefaultActions: ['aws:pass'],
        },
      });
    });

    test('creates network firewall', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::Firewall', {
        FirewallName: 'production-network-firewall',
      });
    });

    test('associates firewall with public subnets', () => {
      const firewall = template.findResources('AWS::NetworkFirewall::Firewall');
      const firewallResource = Object.values(firewall)[0];
      expect(firewallResource.Properties.SubnetMappings).toHaveLength(2);
    });
  });
});