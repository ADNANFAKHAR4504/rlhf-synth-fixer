import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as networkfirewall from 'aws-cdk-lib/aws-networkfirewall';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

class SecurityStack extends Construct {
  constructor(scope, id, props) {
    super(scope, id);

    // Create Network Firewall Rule Group with managed rules
    const firewallRuleGroup = new networkfirewall.CfnRuleGroup(
      this,
      'ThreatProtectionRuleGroup',
      {
        capacity: 100,
        ruleGroupName: `threat-protection-${props.environmentSuffix}`,
        type: 'STATEFUL',
        description: 'Managed rule group for threat protection',
        ruleGroup: {
          statefulRuleOptions: {
            ruleOrder: 'DEFAULT_ACTION_ORDER',
          },
          rulesSource: {
            statefulRules: [
              {
                action: 'DROP',
                header: {
                  destination: 'ANY',
                  destinationPort: 'ANY',
                  direction: 'ANY',
                  protocol: 'TCP',
                  source: 'ANY',
                  sourcePort: 'ANY',
                },
                ruleOptions: [
                  {
                    keyword: 'msg',
                    settings: ['"Block malicious traffic"'],
                  },
                  {
                    keyword: 'sid',
                    settings: ['1001'],
                  },
                ],
              },
            ],
          },
        },
        tags: [
          {
            key: 'Environment',
            value: 'Production',
          },
        ],
      }
    );

    // Create Network Firewall Policy
    const firewallPolicy = new networkfirewall.CfnFirewallPolicy(
      this,
      'NetworkFirewallPolicy',
      {
        firewallPolicyName: `security-policy-${props.environmentSuffix}`,
        firewallPolicy: {
          statefulRuleGroupReferences: [
            {
              resourceArn: firewallRuleGroup.attrRuleGroupArn,
            },
          ],
          statelessDefaultActions: ['aws:forward_to_sfe'],
          statelessFragmentDefaultActions: ['aws:forward_to_sfe'],
        },
        description: 'Network firewall policy for threat protection',
        tags: [
          {
            key: 'Environment',
            value: 'Production',
          },
        ],
      }
    );

    // Create Network Firewall
    const networkFirewall = new networkfirewall.CfnFirewall(
      this,
      'NetworkFirewall',
      {
        firewallName: `security-firewall-${props.environmentSuffix}`,
        firewallPolicyArn: firewallPolicy.attrFirewallPolicyArn,
        vpcId: props.vpc.vpcId,
        subnetMappings: props.vpc.publicSubnets.map(subnet => ({
          subnetId: subnet.subnetId,
        })),
        description: 'Network firewall for VPC protection',
        tags: [
          {
            key: 'Environment',
            value: 'Production',
          },
        ],
      }
    );

    // Create IAM role for VPC Lattice with least privilege
    const latticeServiceRole = new iam.Role(this, 'VpcLatticeServiceRole', {
      roleName: `vpc-lattice-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('vpc-lattice.amazonaws.com'),
      description: 'IAM role for VPC Lattice service network',
    });

    // Add minimal policy for VPC Lattice
    latticeServiceRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'vpc-lattice:ListServices',
          'vpc-lattice:GetService',
          'vpc-lattice:CreateServiceNetworkVpcAssociation',
          'vpc-lattice:GetServiceNetworkVpcAssociation',
        ],
        resources: ['*'],
      })
    );

    // Create VPC Lattice Service Network
    const serviceNetwork = new vpclattice.CfnServiceNetwork(
      this,
      'SecureServiceNetwork',
      {
        name: `secure-service-network-${props.environmentSuffix}`,
        authType: 'AWS_IAM',
        tags: [
          {
            key: 'Environment',
            value: 'Production',
          },
          {
            key: 'Component',
            value: 'ServiceMesh',
          },
        ],
      }
    );

    // Associate VPC with Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(
      this,
      'ServiceNetworkVpcAssociation',
      {
        serviceNetworkIdentifier: serviceNetwork.attrId,
        vpcIdentifier: props.vpc.vpcId,
        tags: [
          {
            key: 'Environment',
            value: 'Production',
          },
        ],
      }
    );

    // Create Security Groups for different tiers
    const webTierSecurityGroup = new ec2.SecurityGroup(
      this,
      'WebTierSecurityGroup',
      {
        vpc: props.vpc,
        securityGroupName: `web-tier-sg-${props.environmentSuffix}`,
        description: 'Security group for web tier with least privilege access',
        allowAllOutbound: false,
      }
    );

    // Allow HTTPS inbound from anywhere
    webTierSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow HTTP inbound from anywhere (for ALB health checks)
    webTierSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow outbound HTTPS for API calls
    webTierSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS'
    );

    const appTierSecurityGroup = new ec2.SecurityGroup(
      this,
      'AppTierSecurityGroup',
      {
        vpc: props.vpc,
        securityGroupName: `app-tier-sg-${props.environmentSuffix}`,
        description: 'Security group for application tier',
        allowAllOutbound: false,
      }
    );

    // Allow inbound from web tier only
    appTierSecurityGroup.addIngressRule(
      webTierSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier'
    );

    // Allow outbound HTTPS for API calls
    appTierSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS'
    );

    // Tag all security resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Component', 'Security');

    // Output important resource identifiers
    new cdk.CfnOutput(this, 'NetworkFirewallArn', {
      value: networkFirewall.attrFirewallArn,
      description: 'Network Firewall ARN',
    });

    new cdk.CfnOutput(this, 'ServiceNetworkId', {
      value: serviceNetwork.attrId,
      description: 'VPC Lattice Service Network ID',
    });

    new cdk.CfnOutput(this, 'WebTierSecurityGroupId', {
      value: webTierSecurityGroup.securityGroupId,
      description: 'Web Tier Security Group ID',
    });
  }
}

export { SecurityStack };