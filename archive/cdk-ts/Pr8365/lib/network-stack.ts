import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly dmzSecurityGroup: ec2.SecurityGroup;
  public readonly internalSecurityGroup: ec2.SecurityGroup;
  public readonly secureSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: NetworkStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with 3 tiers
    this.vpc = new ec2.Vpc(this, 'TechCorpVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      // Enable easy cleanup for LocalStack testing
      restrictDefaultSecurityGroup: false,
      subnetConfiguration: [
        {
          name: 'DMZ',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Internal',
          // Changed from PRIVATE_WITH_EGRESS to PRIVATE_ISOLATED for LocalStack Community compatibility
          // This removes NAT Gateway dependency which has limited support in LocalStack Community Edition
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
        {
          name: 'Secure',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // DMZ Security Group - Web servers
    this.dmzSecurityGroup = new ec2.SecurityGroup(this, 'DmzSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for DMZ zone - Web servers',
      securityGroupName: `DMZ-SG-${environmentSuffix}`,
      allowAllOutbound: false,
    });

    // Allow HTTP and HTTPS from internet
    this.dmzSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );
    this.dmzSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Internal Security Group - Application servers
    this.internalSecurityGroup = new ec2.SecurityGroup(
      this,
      'InternalSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Internal zone - Application servers',
        securityGroupName: `Internal-SG-${environmentSuffix}`,
        allowAllOutbound: false,
      }
    );

    // Allow connections from DMZ on port 8080
    this.internalSecurityGroup.addIngressRule(
      this.dmzSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow connections from DMZ web servers'
    );

    // Secure Security Group - Database server
    this.secureSecurityGroup = new ec2.SecurityGroup(
      this,
      'SecureSecurityGroup',
      {
        vpc: this.vpc,
        description: 'Security group for Secure zone - Database server',
        securityGroupName: `Secure-SG-${environmentSuffix}`,
      }
    );

    // Allow connections from Internal zone on port 5432 (PostgreSQL)
    this.secureSecurityGroup.addIngressRule(
      this.internalSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow database connections from application servers'
    );

    // Allow SSH access for admin (from management)
    this.secureSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH access for database administration'
    );

    // Allow DMZ to connect to Internal
    this.dmzSecurityGroup.addEgressRule(
      this.internalSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow DMZ to connect to application servers'
    );

    // Allow Internal to connect to Secure
    this.internalSecurityGroup.addEgressRule(
      this.secureSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow application servers to connect to database'
    );

    // Network ACLs for additional security
    const dmzNacl = new ec2.NetworkAcl(this, 'DmzNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `DMZ-NACL-${environmentSuffix}`,
    });

    const internalNacl = new ec2.NetworkAcl(this, 'InternalNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `Internal-NACL-${environmentSuffix}`,
    });

    const secureNacl = new ec2.NetworkAcl(this, 'SecureNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `Secure-NACL-${environmentSuffix}`,
    });

    // DMZ NACL Rules
    dmzNacl.addEntry('AllowHttpInbound', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    dmzNacl.addEntry('AllowHttpsInbound', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    dmzNacl.addEntry('AllowEphemeralOutbound', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    dmzNacl.addEntry('AllowAppServerConnection', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(8080),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    // Internal NACL Rules
    internalNacl.addEntry('AllowFromDmz', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(8080),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    internalNacl.addEntry('AllowToDatabase', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(5432),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    internalNacl.addEntry('AllowEphemeralOutbound', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.anyIpv4(),
    });

    // Secure NACL Rules
    secureNacl.addEntry('AllowDatabaseConnections', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(5432),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    secureNacl.addEntry('AllowSshAdmin', {
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    secureNacl.addEntry('AllowEphemeralOutbound', {
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
    });

    // Associate NACLs with subnets
    const publicSubnets = this.vpc.publicSubnets;
    const privateSubnets = this.vpc.privateSubnets;
    const isolatedSubnets = this.vpc.isolatedSubnets;

    publicSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(this, `DmzNaclAssociation${index}`, {
        subnet,
        networkAcl: dmzNacl,
      });
    });

    privateSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `InternalNaclAssociation${index}`,
        {
          subnet,
          networkAcl: internalNacl,
        }
      );
    });

    isolatedSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `SecureNaclAssociation${index}`,
        {
          subnet,
          networkAcl: secureNacl,
        }
      );
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the TechCorp network',
    });

    new cdk.CfnOutput(this, 'DmzSecurityGroupId', {
      value: this.dmzSecurityGroup.securityGroupId,
      description: 'Security Group ID for DMZ zone',
    });

    new cdk.CfnOutput(this, 'InternalSecurityGroupId', {
      value: this.internalSecurityGroup.securityGroupId,
      description: 'Security Group ID for Internal zone',
    });

    new cdk.CfnOutput(this, 'SecureSecurityGroupId', {
      value: this.secureSecurityGroup.securityGroupId,
      description: 'Security Group ID for Secure zone',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Comma-separated list of public subnet IDs (DMZ)',
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: this.vpc.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Comma-separated list of private subnet IDs (Internal)',
    });

    new cdk.CfnOutput(this, 'IsolatedSubnetIds', {
      value: this.vpc.isolatedSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Comma-separated list of isolated subnet IDs (Secure)',
    });
  }
}
