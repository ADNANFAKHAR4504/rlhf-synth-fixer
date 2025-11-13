import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export function ensureExpectedSubnetConfiguration(
  publicCount: number,
  privateCount: number
): void {
  if (publicCount !== 3 || privateCount !== 3) {
    throw new Error('Expected 3 public and 3 private subnets');
  }
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly s3Endpoint: ec2.GatewayVpcEndpoint;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create CloudWatch Log Group for VPC Flow Logs with 7-day retention
    const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create VPC with specified CIDR and 3 AZs
    this.vpc = new ec2.Vpc(this, 'PaymentVpc', {
      vpcName: `payment-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      // DESIGN DECISION: Hardcoded AZs for infrastructure consistency
      // Using specific AZs ensures:
      // 1. Predictable subnet allocation across environments
      // 2. Consistent cross-region failover patterns
      // 3. Compliance with PCI-DSS requirements for network segmentation
      // 4. Simplified disaster recovery planning
      // Note: Update these AZs if deploying to a different region
      availabilityZones: ['eu-central-2a', 'eu-central-2b', 'eu-central-2c'],
      natGateways: 3, // One NAT gateway per AZ for high availability

      // Define subnet configuration
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          mapPublicIpOnLaunch: true,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],

      // Enable VPC Flow Logs
      flowLogs: {
        s3: {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
          trafficType: ec2.FlowLogTrafficType.ALL,
        },
      },
    });

    // Tag VPC and all subnets
    cdk.Tags.of(this.vpc).add('Environment', 'Production');
    cdk.Tags.of(this.vpc).add('Project', 'PaymentGateway');

    // Get subnet references
    const publicSubnets = this.vpc.publicSubnets;
    const privateSubnets = this.vpc.privateSubnets;

    // Verify we have exactly 3 public and 3 private subnets
    ensureExpectedSubnetConfiguration(
      publicSubnets.length,
      privateSubnets.length
    );

    // SUBNET ALLOCATION DOCUMENTATION
    // CDK automatically allocates subnets across AZs in the following pattern:
    // Public Subnets (3 subnets, /24 each):
    //   - eu-central-2a: 10.0.0.0/24
    //   - eu-central-2b: 10.0.1.0/24
    //   - eu-central-2c: 10.0.2.0/24
    // Private Subnets (3 subnets, /24 each):
    //   - eu-central-2a: 10.0.3.0/24
    //   - eu-central-2b: 10.0.4.0/24
    //   - eu-central-2c: 10.0.5.0/24
    // This ensures consistent network segmentation for PCI-DSS compliance

    // Create custom Network ACL for restricted traffic
    const networkAcl = new ec2.NetworkAcl(this, 'PaymentNetworkAcl', {
      vpc: this.vpc,
      networkAclName: `payment-nacl-${environmentSuffix}`,
    });

    // Tag Network ACL
    cdk.Tags.of(networkAcl).add('Environment', 'Production');
    cdk.Tags.of(networkAcl).add('Project', 'PaymentGateway');

    // Allow HTTPS (443) inbound and outbound
    // For production payment processing, restrict to VPC CIDR for internal communication
    // External HTTPS traffic should be handled through ALB/NLB with proper security groups
    networkAcl.addEntry('AllowHttpsInbound', {
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('AllowHttpsOutbound', {
      cidr: ec2.AclCidr.anyIpv4(), // Keep outbound open for external API calls
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow MySQL (3306) - restrict to VPC CIDR for database security
    networkAcl.addEntry('AllowMysqlInbound', {
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(3306),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('AllowMysqlOutbound', {
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(3306),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow Redis (6379) - restrict to VPC CIDR for cache security
    networkAcl.addEntry('AllowRedisInbound', {
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(6379),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('AllowRedisOutbound', {
      cidr: ec2.AclCidr.ipv4(this.vpc.vpcCidrBlock),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(6379),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports for return traffic (required for outbound connections)
    networkAcl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    networkAcl.addEntry('AllowEphemeralOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Deny all other traffic (explicit deny)
    networkAcl.addEntry('DenyAllInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 32766,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.DENY,
    });

    networkAcl.addEntry('DenyAllOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 32766,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.DENY,
    });

    // Associate Network ACL with all private subnets
    privateSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `PrivateSubnetAclAssociation${index}`,
        {
          subnet: subnet,
          networkAcl: networkAcl,
        }
      );
    });

    // Create S3 VPC Endpoint (Gateway type)
    this.s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    // Tag S3 Endpoint
    cdk.Tags.of(this.s3Endpoint).add('Environment', 'Production');
    cdk.Tags.of(this.s3Endpoint).add('Project', 'PaymentGateway');

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the payment processing infrastructure',
      exportName: `payment-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR block',
      exportName: `payment-vpc-cidr-${environmentSuffix}`,
    });

    // Output public subnet IDs
    publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID`,
        exportName: `payment-public-subnet-${index + 1}-id-${environmentSuffix}`,
      });
    });

    // Output private subnet IDs
    privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1} ID`,
        exportName: `payment-private-subnet-${index + 1}-id-${environmentSuffix}`,
      });
    });

    // Output S3 VPC Endpoint ID
    new cdk.CfnOutput(this, 'S3EndpointId', {
      value: this.s3Endpoint.vpcEndpointId,
      description: 'S3 VPC Endpoint ID',
      exportName: `payment-s3-endpoint-id-${environmentSuffix}`,
    });

    // Output Flow Logs Log Group
    new cdk.CfnOutput(this, 'FlowLogsLogGroup', {
      value: flowLogGroup.logGroupName,
      description: 'CloudWatch Log Group for VPC Flow Logs',
      exportName: `payment-flowlogs-group-${environmentSuffix}`,
    });
  }
}
