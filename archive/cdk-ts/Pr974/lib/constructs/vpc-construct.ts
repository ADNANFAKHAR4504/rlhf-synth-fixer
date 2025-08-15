import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { StackConfig } from '../interfaces/stack-config';

/**
 * VPC Construct that creates a highly available network infrastructure
 * with public and private subnets across multiple Availability Zones
 */
export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, config: StackConfig) {
    super(scope, id);

    // Create VPC with public and private subnets across multiple AZs
    this.vpc = new ec2.Vpc(this, 'MultiRegionVpc', {
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 3, // Use 3 AZs for high availability
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // Define subnet configuration for network segregation
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],

      // Configure NAT Gateway for private subnet internet access
      natGateways: 2, // Deploy NAT gateways in 2 AZs for redundancy
      natGatewayProvider: ec2.NatProvider.gateway(),
    });

    // Store subnet references for use by other constructs
    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Create VPC Flow Logs for network monitoring and security
    if (config.security.enableVpcFlowLogs) {
      new ec2.FlowLog(this, 'VpcFlowLog', {
        resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
        destination: ec2.FlowLogDestination.toCloudWatchLogs(),
        trafficType: ec2.FlowLogTrafficType.ALL,
      });
    }

    // Apply tags to VPC and all subnets
    cdk.Tags.of(this.vpc).add('Name', `MultiRegionApp-VPC-${config.region}`);
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this.vpc).add(key, value);
    });

    // Tag subnets for better identification
    this.publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        'Name',
        `PublicSubnet-${index + 1}-${config.region}`
      );
      cdk.Tags.of(subnet).add('SubnetType', 'Public');
    });

    this.privateSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        'Name',
        `PrivateSubnet-${index + 1}-${config.region}`
      );
      cdk.Tags.of(subnet).add('SubnetType', 'Private');
    });

    // Create Network ACLs for additional subnet-level security (least privilege principle)
    this.createNetworkAcls(config);
  }

  /**
   * Create Network ACLs for public and private subnets with least privilege access
   */
  private createNetworkAcls(config: StackConfig): void {
    // Public subnet NACL - allows HTTP/HTTPS from internet and ephemeral ports for responses
    const publicNacl = new ec2.NetworkAcl(this, 'PublicNacl', {
      vpc: this.vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Inbound rules for public subnets
    publicNacl.addEntry('AllowHTTPInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    publicNacl.addEntry('AllowHTTPSInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    publicNacl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Outbound rules for public subnets
    publicNacl.addEntry('AllowAllOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Private subnet NACL - more restrictive, only allows necessary traffic
    const privateNacl = new ec2.NetworkAcl(this, 'PrivateNacl', {
      vpc: this.vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // Inbound rules for private subnets - only from VPC and ephemeral ports
    privateNacl.addEntry('AllowVPCInbound', {
      cidr: ec2.AclCidr.ipv4(config.vpcCidr),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    privateNacl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Outbound rules for private subnets
    privateNacl.addEntry('AllowVPCOutbound', {
      cidr: ec2.AclCidr.ipv4(config.vpcCidr),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    privateNacl.addEntry('AllowHTTPSOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    privateNacl.addEntry('AllowHTTPOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Apply tags to NACLs
    cdk.Tags.of(publicNacl).add(
      'Name',
      `MultiRegionApp-Public-NACL-${config.region}`
    );
    cdk.Tags.of(privateNacl).add(
      'Name',
      `MultiRegionApp-Private-NACL-${config.region}`
    );

    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(publicNacl).add(key, value);
      cdk.Tags.of(privateNacl).add(key, value);
    });
  }
}
