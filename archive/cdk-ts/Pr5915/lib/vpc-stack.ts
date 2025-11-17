import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface VpcStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const environment = 'production';

    // Create VPC manually to have full control over configuration
    // CDK will automatically select 3 AZs from the deployed region
    const vpc = new ec2.Vpc(this, `FinancialAppVpc${environmentSuffix}`, {
      vpcName: `financial-app-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,

      // Define subnet configuration
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],

      // Create one NAT Gateway per AZ for high availability
      natGateways: 3,

      // Remove default security group rules
      restrictDefaultSecurityGroup: true,
    });

    this.vpc = vpc;

    // Apply tags to VPC
    cdk.Tags.of(vpc).add('Environment', environment);
    cdk.Tags.of(vpc).add('Project', 'financial-app');
    cdk.Tags.of(vpc).add('ManagedBy', 'cdk');
    cdk.Tags.of(vpc).add('Name', `financial-app-vpc-${environmentSuffix}`);

    // Rename route tables to follow the naming pattern: {env}-{az}-{type}-rt
    // CDK creates route tables automatically, we'll add custom names via tags
    const publicSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PUBLIC,
    }).subnets;
    const privateSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    }).subnets;

    // Tag public subnet route tables
    publicSubnets.forEach(subnet => {
      const az = subnet.availabilityZone;
      const azSuffix = az.slice(-1); // Get 'a', 'b', or 'c'
      cdk.Tags.of(subnet).add(
        'Name',
        `${environment}-${azSuffix}-public-subnet-${environmentSuffix}`
      );

      // Access the route table through the subnet - tag the subnet which will propagate to route table
      if (subnet instanceof ec2.Subnet) {
        // Route tables are automatically named by CDK, we tag subnets which helps identify associated route tables
        // Add tag to help identify the route table via CloudFormation
        cdk.Tags.of(subnet).add(
          'RouteTableName',
          `${environment}-${azSuffix}-public-rt-${environmentSuffix}`
        );
      }
    });

    // Tag private subnet route tables
    privateSubnets.forEach(subnet => {
      const az = subnet.availabilityZone;
      const azSuffix = az.slice(-1); // Get 'a', 'b', or 'c'
      cdk.Tags.of(subnet).add(
        'Name',
        `${environment}-${azSuffix}-private-subnet-${environmentSuffix}`
      );

      // Access the route table through the subnet - tag the subnet which will propagate to route table
      if (subnet instanceof ec2.Subnet) {
        // Route tables are automatically named by CDK, we tag subnets which helps identify associated route tables
        // Add tag to help identify the route table via CloudFormation
        cdk.Tags.of(subnet).add(
          'RouteTableName',
          `${environment}-${azSuffix}-private-rt-${environmentSuffix}`
        );
      }
    });

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(
      this,
      `VpcFlowLogGroup${environmentSuffix}`,
      {
        logGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    cdk.Tags.of(flowLogGroup).add('Environment', environment);
    cdk.Tags.of(flowLogGroup).add('Project', 'financial-app');
    cdk.Tags.of(flowLogGroup).add('ManagedBy', 'cdk');

    // Create IAM role for VPC Flow Logs
    const flowLogRole = new iam.Role(
      this,
      `VpcFlowLogRole${environmentSuffix}`,
      {
        roleName: `vpc-flow-log-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
      }
    );

    flowLogRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: [flowLogGroup.logGroupArn],
      })
    );

    cdk.Tags.of(flowLogRole).add('Environment', environment);
    cdk.Tags.of(flowLogRole).add('Project', 'financial-app');
    cdk.Tags.of(flowLogRole).add('ManagedBy', 'cdk');

    // Enable VPC Flow Logs capturing ALL traffic
    new ec2.CfnFlowLog(this, `VpcFlowLog${environmentSuffix}`, {
      resourceId: vpc.vpcId,
      resourceType: 'VPC',
      trafficType: 'ALL',
      logDestinationType: 'cloud-watch-logs',
      logGroupName: flowLogGroup.logGroupName,
      deliverLogsPermissionArn: flowLogRole.roleArn,
      tags: [
        { key: 'Environment', value: environment },
        { key: 'Project', value: 'financial-app' },
        { key: 'ManagedBy', value: 'cdk' },
        { key: 'Name', value: `vpc-flow-log-${environmentSuffix}` },
      ],
    });

    // Create Network ACL for public subnets to deny SSH from internet
    const publicNetworkAcl = new ec2.NetworkAcl(
      this,
      `PublicNetworkAcl${environmentSuffix}`,
      {
        vpc: vpc,
        networkAclName: `public-nacl-${environmentSuffix}`,
      }
    );

    cdk.Tags.of(publicNetworkAcl).add('Environment', environment);
    cdk.Tags.of(publicNetworkAcl).add('Project', 'financial-app');
    cdk.Tags.of(publicNetworkAcl).add('ManagedBy', 'cdk');
    cdk.Tags.of(publicNetworkAcl).add(
      'Name',
      `public-nacl-${environmentSuffix}`
    );

    // Deny inbound SSH (port 22) from anywhere - lowest priority rule
    publicNetworkAcl.addEntry(`DenySSHInbound${environmentSuffix}`, {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 1,
      traffic: ec2.AclTraffic.tcpPort(22),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.DENY,
    });

    // Allow all other inbound traffic
    publicNetworkAcl.addEntry(`AllowAllInbound${environmentSuffix}`, {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.INGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Allow all outbound traffic
    publicNetworkAcl.addEntry(`AllowAllOutbound${environmentSuffix}`, {
      cidr: ec2.AclCidr.ipv4('0.0.0.0/0'),
      ruleNumber: 100,
      traffic: ec2.AclTraffic.allTraffic(),
      direction: ec2.TrafficDirection.EGRESS,
      ruleAction: ec2.Action.ALLOW,
    });

    // Associate Network ACL with public subnets
    publicSubnets.forEach((subnet, index) => {
      new ec2.SubnetNetworkAclAssociation(
        this,
        `PublicNaclAssoc${index}${environmentSuffix}`,
        {
          networkAcl: publicNetworkAcl,
          subnet: subnet,
        }
      );
    });

    // Create Security Group for Web Tier
    this.webSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebSecurityGroup${environmentSuffix}`,
      {
        vpc: vpc,
        securityGroupName: `web-tier-sg-${environmentSuffix}`,
        description:
          'Security group for web tier - allows HTTP and HTTPS from internet',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from anywhere'
    );

    // Allow HTTPS from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from anywhere'
    );

    cdk.Tags.of(this.webSecurityGroup).add('Environment', environment);
    cdk.Tags.of(this.webSecurityGroup).add('Project', 'financial-app');
    cdk.Tags.of(this.webSecurityGroup).add('ManagedBy', 'cdk');
    cdk.Tags.of(this.webSecurityGroup).add(
      'Name',
      `web-tier-sg-${environmentSuffix}`
    );
    cdk.Tags.of(this.webSecurityGroup).add('Tier', 'web');

    // Create Security Group for App Tier
    this.appSecurityGroup = new ec2.SecurityGroup(
      this,
      `AppSecurityGroup${environmentSuffix}`,
      {
        vpc: vpc,
        securityGroupName: `app-tier-sg-${environmentSuffix}`,
        description:
          'Security group for app tier - allows HTTP and HTTPS only from web tier',
        allowAllOutbound: true,
      }
    );

    // Allow HTTP from web tier only
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from web tier'
    );

    // Allow HTTPS from web tier only
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(443),
      'Allow HTTPS from web tier'
    );

    cdk.Tags.of(this.appSecurityGroup).add('Environment', environment);
    cdk.Tags.of(this.appSecurityGroup).add('Project', 'financial-app');
    cdk.Tags.of(this.appSecurityGroup).add('ManagedBy', 'cdk');
    cdk.Tags.of(this.appSecurityGroup).add(
      'Name',
      `app-tier-sg-${environmentSuffix}`
    );
    cdk.Tags.of(this.appSecurityGroup).add('Tier', 'app');

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `VpcCidr-${environmentSuffix}`,
    });

    // Output public subnet IDs
    publicSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PublicSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Public Subnet ${index + 1} ID (${subnet.availabilityZone})`,
        exportName: `PublicSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Output private subnet IDs
    privateSubnets.forEach((subnet, index) => {
      new cdk.CfnOutput(this, `PrivateSubnet${index + 1}Id`, {
        value: subnet.subnetId,
        description: `Private Subnet ${index + 1} ID (${subnet.availabilityZone})`,
        exportName: `PrivateSubnet${index + 1}Id-${environmentSuffix}`,
      });
    });

    // Output security group IDs
    new cdk.CfnOutput(this, 'WebSecurityGroupId', {
      value: this.webSecurityGroup.securityGroupId,
      description: 'Web Tier Security Group ID',
      exportName: `WebSecurityGroupId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AppSecurityGroupId', {
      value: this.appSecurityGroup.securityGroupId,
      description: 'App Tier Security Group ID',
      exportName: `AppSecurityGroupId-${environmentSuffix}`,
    });

    // Output availability zones
    new cdk.CfnOutput(this, 'AvailabilityZones', {
      value: vpc.availabilityZones.join(','),
      description: 'Availability Zones used',
      exportName: `AvailabilityZones-${environmentSuffix}`,
    });
  }
}
