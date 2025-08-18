import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface VpcStackProps {
  environmentSuffix?: string;
}

export class VpcStack extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: VpcStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with 3 AZs, public and private subnets
    this.vpc = new ec2.Vpc(this, `SecureVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      natGateways: 1, // One NAT Gateway for cost optimization
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add VPC Block Public Access for enhanced security
    new ec2.CfnVPCBlockPublicAccessOptions(this, 'VpcBlockPublicAccess', {
      internetGatewayBlockMode: 'block-bidirectional',
    });

    // Add Network ACLs for additional security
    const publicNetworkAcl = new ec2.NetworkAcl(this, 'PublicNetworkAcl', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Allow HTTP inbound traffic
    publicNetworkAcl.addEntry('AllowHttpInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow SSH inbound traffic
    publicNetworkAcl.addEntry('AllowSshInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow HTTPS inbound traffic
    publicNetworkAcl.addEntry('AllowHttpsInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow ephemeral ports for return traffic
    publicNetworkAcl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow all outbound traffic
    publicNetworkAcl.addEntry('AllowAllOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Private Network ACL
    const privateNetworkAcl = new ec2.NetworkAcl(this, 'PrivateNetworkAcl', {
      vpc: this.vpc,
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Allow inbound traffic from VPC CIDR
    privateNetworkAcl.addEntry('AllowVpcInbound', {
      cidr: ec2.AclCidr.ipv4('10.0.0.0/16'),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow ephemeral ports for return traffic
    privateNetworkAcl.addEntry('AllowEphemeralInboundPrivate', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
    });

    // Allow all outbound traffic
    privateNetworkAcl.addEntry('AllowAllOutboundPrivate', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
    });
  }
}
