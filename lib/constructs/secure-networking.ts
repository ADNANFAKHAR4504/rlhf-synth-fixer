import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as networkfirewall from 'aws-cdk-lib/aws-networkfirewall';
import { Construct } from 'constructs';

// Detect LocalStack environment
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

export interface SecureNetworkingProps {
  readonly cidr?: string;
  readonly maxAzs?: number;
}

export class SecureNetworking extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly webServerSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecureNetworkingProps = {}) {
    super(scope, id);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      maxAzs: props.maxAzs || 2,
      cidr: props.cidr || '10.0.0.0/16',
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-with-egress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security group for web server
    this.webServerSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebServerSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for web server',
        allowAllOutbound: true,
      }
    );

    // Allow SSH access from specific IP (replace with your IP)
    this.webServerSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your IP address
      ec2.Port.tcp(22),
      'SSH access from authorized IP'
    );

    // Allow HTTP traffic
    this.webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );

    // Allow HTTPS traffic
    this.webServerSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access'
    );

    // Network Firewall for enhanced security
    // NOTE: Network Firewall is NOT supported in LocalStack Community Edition
    // Only deploy in production AWS environments
    if (!isLocalStack) {
      const firewallPolicy = new networkfirewall.CfnFirewallPolicy(
        this,
        'FirewallPolicy',
        {
          firewallPolicyName: 'production-firewall-policy',
          firewallPolicy: {
            statelessDefaultActions: ['aws:pass'],
            statelessFragmentDefaultActions: ['aws:pass'],
            statefulRuleGroupReferences: [],
          },
        }
      );

      new networkfirewall.CfnFirewall(this, 'NetworkFirewall', {
        firewallName: 'production-network-firewall',
        firewallPolicyArn: firewallPolicy.attrFirewallPolicyArn,
        vpcId: this.vpc.vpcId,
        subnetMappings: this.vpc.publicSubnets.map(subnet => ({
          subnetId: subnet.subnetId,
        })),
      });
    }

    // Apply tags
    cdk.Tags.of(this.vpc).add('Environment', 'Production');
    cdk.Tags.of(this.webServerSecurityGroup).add('Environment', 'Production');
  }
}
