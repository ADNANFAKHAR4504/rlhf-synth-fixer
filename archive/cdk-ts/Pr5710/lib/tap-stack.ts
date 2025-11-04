import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create VPC with specific CIDR
    const vpc = new ec2.Vpc(this, `Vpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 2, // NAT Gateways in first two public subnets
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 23,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Tag all resources in VPC
    cdk.Tags.of(vpc).add('Environment', 'production');
    cdk.Tags.of(vpc).add('Project', 'apac-expansion');

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(
      this,
      `VpcFlowLogGroup-${environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK, // 7 days retention
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(
      this,
      `VpcFlowLogRole-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        description: 'Role for VPC Flow Logs to write to CloudWatch',
      }
    );

    flowLogGroup.grantWrite(flowLogRole);

    // Enable VPC Flow Logs
    new ec2.CfnFlowLog(this, `VpcFlowLog-${environmentSuffix}`, {
      resourceId: vpc.vpcId,
      resourceType: 'VPC',
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logGroupName: flowLogGroup.logGroupName,
      deliverLogsPermissionArn: flowLogRole.roleArn,
      tags: [
        { key: 'Environment', value: 'production' },
        { key: 'Project', value: 'apac-expansion' },
      ],
    });

    // Create custom Network ACLs for public subnets
    const publicNetworkAcl = new ec2.NetworkAcl(
      this,
      `PublicNetworkAcl-${environmentSuffix}`,
      {
        vpc,
        subnetSelection: { subnetType: ec2.SubnetType.PUBLIC },
      }
    );

    cdk.Tags.of(publicNetworkAcl).add('Environment', 'production');
    cdk.Tags.of(publicNetworkAcl).add('Project', 'apac-expansion');
    cdk.Tags.of(publicNetworkAcl).add(
      'Name',
      `production-public-nacl-${environmentSuffix}`
    );

    // Allow HTTP inbound
    publicNetworkAcl.addEntry('AllowHttpInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow HTTPS inbound
    publicNetworkAcl.addEntry('AllowHttpsInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow SSH inbound
    publicNetworkAcl.addEntry('AllowSshInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports inbound (for return traffic)
    publicNetworkAcl.addEntry('AllowEphemeralInbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow all outbound traffic
    publicNetworkAcl.addEntry('AllowAllOutbound', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Create custom Network ACLs for private subnets
    const privateNetworkAcl = new ec2.NetworkAcl(
      this,
      `PrivateNetworkAcl-${environmentSuffix}`,
      {
        vpc,
        subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      }
    );

    cdk.Tags.of(privateNetworkAcl).add('Environment', 'production');
    cdk.Tags.of(privateNetworkAcl).add('Project', 'apac-expansion');
    cdk.Tags.of(privateNetworkAcl).add(
      'Name',
      `production-private-nacl-${environmentSuffix}`
    );

    // Allow HTTP inbound from VPC
    privateNetworkAcl.addEntry('AllowHttpInboundVpc', {
      cidr: ec2.AclCidr.ipv4(vpc.vpcCidrBlock),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.tcpPort(80),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow HTTPS inbound from VPC
    privateNetworkAcl.addEntry('AllowHttpsInboundVpc', {
      cidr: ec2.AclCidr.ipv4(vpc.vpcCidrBlock),
      ruleNumber: 110,
      traffic: ec2.AclTraffic.tcpPort(443),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow SSH inbound from VPC
    privateNetworkAcl.addEntry('AllowSshInboundVpc', {
      cidr: ec2.AclCidr.ipv4(vpc.vpcCidrBlock),
      ruleNumber: 120,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow ephemeral ports inbound
    privateNetworkAcl.addEntry('AllowEphemeralInboundPrivate', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 130,
      traffic: ec2.AclTraffic.tcpPortRange(1024, 65535),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow all outbound traffic
    privateNetworkAcl.addEntry('AllowAllOutboundPrivate', {
      cidr: ec2.AclCidr.anyIpv4(),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Name route tables following the pattern {env}-{tier}-rt
    vpc.publicSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        'Name',
        `production-public-subnet-${index + 1}-${environmentSuffix}`
      );
    });

    vpc.privateSubnets.forEach((subnet, index) => {
      cdk.Tags.of(subnet).add(
        'Name',
        `production-private-subnet-${index + 1}-${environmentSuffix}`
      );
    });

    // Export VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    // Export Public Subnet IDs
    vpc.publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnetId${index + 1}`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID`,
        exportName: `PublicSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Export Private Subnet IDs
    vpc.privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnetId${index + 1}`, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1} ID`,
        exportName: `PrivateSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Export NAT Gateway information
    new cdk.CfnOutput(this, 'NatGatewayCount', {
      value: '2',
      description: 'Number of NAT Gateways deployed',
      exportName: `NatGatewayCount-${environmentSuffix}`,
    });

    // Export Internet Gateway ID
    new cdk.CfnOutput(this, 'InternetGatewayId', {
      value: vpc.internetGatewayId!,
      description: 'Internet Gateway ID',
      exportName: `InternetGatewayId-${environmentSuffix}`,
    });

    // Export Flow Log Group Name
    new cdk.CfnOutput(this, 'FlowLogGroupName', {
      value: flowLogGroup.logGroupName,
      description: 'VPC Flow Logs CloudWatch Log Group Name',
      exportName: `FlowLogGroupName-${environmentSuffix}`,
    });
  }
}
