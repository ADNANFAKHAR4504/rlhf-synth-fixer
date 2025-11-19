/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It creates a production-grade VPC infrastructure with 3-tier subnet architecture,
 * NAT instances, VPC Flow Logs, and comprehensive security configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * AWS region for the deployment
   */
  region?: string;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component creates a complete VPC infrastructure including:
 * - VPC with DNS support
 * - Public, Private, and Database subnets across 3 AZs
 * - NAT Instances for outbound traffic
 * - Security Groups with zero-trust model
 * - Network ACLs
 * - VPC Flow Logs (S3 and CloudWatch)
 * - S3 VPC Endpoint
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly vpcCidr: pulumi.Output<string>;
  public readonly internetGatewayId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly databaseSubnetIds: pulumi.Output<string>[];
  public readonly natInstanceIds: pulumi.Output<string>[];
  public readonly natInstancePrivateIps: pulumi.Output<string>[];
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly appSecurityGroupId: pulumi.Output<string>;
  public readonly databaseSecurityGroupId: pulumi.Output<string>;
  public readonly flowLogsBucketName: pulumi.Output<string>;
  public readonly flowLogsLogGroupName: pulumi.Output<string>;
  public readonly s3EndpointId: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const region = args.region || 'us-east-1';
    const commonTags = args.tags || {
      Environment: 'production',
      Project: 'payment-platform',
      CostCenter: 'engineering',
    };

    // Define availability zones
    const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `payment-vpc-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `payment-igw-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Public Subnets
    const publicSubnets = availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `public-subnet-${az}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${index + 1}.0/24`,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            ...commonTags,
            Name: `public-subnet-${az}-${environmentSuffix}`,
            Tier: 'public',
          },
        },
        { parent: this }
      );
    });

    // Create Private Subnets
    const privateSubnets = availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `private-subnet-${az}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${10 + index * 2}.0/23`,
          availabilityZone: az,
          tags: {
            ...commonTags,
            Name: `private-subnet-${az}-${environmentSuffix}`,
            Tier: 'private',
          },
        },
        { parent: this }
      );
    });

    // Create Database Subnets
    const databaseSubnets = availabilityZones.map((az, index) => {
      return new aws.ec2.Subnet(
        `database-subnet-${az}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${20 + index}.0/24`,
          availabilityZone: az,
          tags: {
            ...commonTags,
            Name: `database-subnet-${az}-${environmentSuffix}`,
            Tier: 'database',
          },
        },
        { parent: this }
      );
    });

    // Get latest Ubuntu 20.04 AMI
    const ubuntuAmi = aws.ec2.getAmi({
      mostRecent: true,
      filters: [
        {
          name: 'name',
          values: ['ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
      owners: ['099720109477'], // Canonical
    });

    // Create Security Group for NAT Instances
    const natSecurityGroup = new aws.ec2.SecurityGroup(
      `nat-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for NAT instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['10.0.0.0/16'],
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['10.0.0.0/16'],
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...commonTags,
          Name: `nat-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create NAT Instances
    const natInstances = publicSubnets.map((subnet, index) => {
      return new aws.ec2.Instance(
        `nat-instance-${availabilityZones[index]}-${environmentSuffix}`,
        {
          ami: ubuntuAmi.then((ami: aws.ec2.GetAmiResult) => ami.id),
          instanceType: 't3.micro',
          subnetId: subnet.id,
          vpcSecurityGroupIds: [natSecurityGroup.id],
          sourceDestCheck: false,
          userData: `#!/bin/bash
echo 1 > /proc/sys/net/ipv4/ip_forward
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables-save > /etc/iptables.rules
echo "iptables-restore < /etc/iptables.rules" >> /etc/rc.local
`,
          tags: {
            ...commonTags,
            Name: `nat-instance-${availabilityZones[index]}-${environmentSuffix}`,
          },
        },
        { parent: this }
      );
    });

    // Create Public Route Table
    const publicRouteTable = new aws.ec2.RouteTable(
      `production-public-main-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `production-public-main-rt-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add route to Internet Gateway
    void new aws.ec2.Route(
      `public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate Public Subnets with Public Route Table
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `public-rta-${availabilityZones[index]}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    // Create Private Route Tables (one per AZ)
    const privateRouteTables = availabilityZones.map((az, index) => {
      const routeTable = new aws.ec2.RouteTable(
        `production-private-${az}-rt-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...commonTags,
            Name: `production-private-${az}-rt-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      // Add route to NAT instance
      new aws.ec2.Route(
        `private-route-${az}-${environmentSuffix}`,
        {
          routeTableId: routeTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          networkInterfaceId: natInstances[index].primaryNetworkInterfaceId,
        },
        { parent: this }
      );

      return routeTable;
    });

    // Associate Private Subnets with Private Route Tables
    privateSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `private-rta-${availabilityZones[index]}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTables[index].id,
        },
        { parent: this }
      );
    });

    // Create Database Route Tables (one per AZ, no internet access)
    const databaseRouteTables = availabilityZones.map(az => {
      const routeTable = new aws.ec2.RouteTable(
        `production-database-${az}-rt-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: {
            ...commonTags,
            Name: `production-database-${az}-rt-${environmentSuffix}`,
          },
        },
        { parent: this }
      );

      return routeTable;
    });

    // Associate Database Subnets with Database Route Tables
    databaseSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `database-rta-${availabilityZones[index]}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: databaseRouteTables[index].id,
        },
        { parent: this }
      );
    });

    // Create Security Group for Web Tier
    const webSecurityGroup = new aws.ec2.SecurityGroup(
      `web-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description:
          'Security group for web tier - allows HTTP/HTTPS from internet',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
          },
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...commonTags,
          Name: `web-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create Security Group for App Tier
    const appSecurityGroup = new aws.ec2.SecurityGroup(
      `app-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description:
          'Security group for app tier - allows port 8080 from web tier only',
        tags: {
          ...commonTags,
          Name: `app-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add ingress rule for app tier (must reference web SG after creation)
    void new aws.ec2.SecurityGroupRule(
      `app-ingress-${environmentSuffix}`,
      {
        type: 'ingress',
        securityGroupId: appSecurityGroup.id,
        protocol: 'tcp',
        fromPort: 8080,
        toPort: 8080,
        sourceSecurityGroupId: webSecurityGroup.id,
        description: 'Allow port 8080 from web tier',
      },
      { parent: this }
    );

    // Add egress rule for app tier
    void new aws.ec2.SecurityGroupRule(
      `app-egress-${environmentSuffix}`,
      {
        type: 'egress',
        securityGroupId: appSecurityGroup.id,
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
      { parent: this }
    );

    // Create Security Group for Database Tier
    const databaseSecurityGroup = new aws.ec2.SecurityGroup(
      `database-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description:
          'Security group for database tier - allows port 5432 from app tier only',
        tags: {
          ...commonTags,
          Name: `database-sg-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Add ingress rule for database tier
    void new aws.ec2.SecurityGroupRule(
      `database-ingress-${environmentSuffix}`,
      {
        type: 'ingress',
        securityGroupId: databaseSecurityGroup.id,
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        sourceSecurityGroupId: appSecurityGroup.id,
        description: 'Allow port 5432 from app tier',
      },
      { parent: this }
    );

    // Add egress rule for database tier
    void new aws.ec2.SecurityGroupRule(
      `database-egress-${environmentSuffix}`,
      {
        type: 'egress',
        securityGroupId: databaseSecurityGroup.id,
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
      { parent: this }
    );

    // Create Network ACL for Public Subnets
    const publicNetworkAcl = new aws.ec2.NetworkAcl(
      `public-nacl-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...commonTags,
          Name: `public-nacl-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Public NACL Rules - Inbound
    new aws.ec2.NetworkAclRule(
      `public-nacl-ingress-http-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 100,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 80,
        toPort: 80,
        egress: false,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `public-nacl-ingress-https-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 110,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 443,
        toPort: 443,
        egress: false,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `public-nacl-ingress-ephemeral-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 120,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 32768,
        toPort: 65535,
        egress: false,
      },
      { parent: this }
    );

    // Public NACL Rules - Outbound
    new aws.ec2.NetworkAclRule(
      `public-nacl-egress-http-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 100,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 80,
        toPort: 80,
        egress: true,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `public-nacl-egress-https-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 110,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 443,
        toPort: 443,
        egress: true,
      },
      { parent: this }
    );

    new aws.ec2.NetworkAclRule(
      `public-nacl-egress-ephemeral-${environmentSuffix}`,
      {
        networkAclId: publicNetworkAcl.id,
        ruleNumber: 120,
        protocol: 'tcp',
        ruleAction: 'allow',
        cidrBlock: '0.0.0.0/0',
        fromPort: 32768,
        toPort: 65535,
        egress: true,
      },
      { parent: this }
    );

    // Associate Public Subnets with Public NACL
    publicSubnets.forEach((subnet, index) => {
      new aws.ec2.NetworkAclAssociation(
        `public-nacl-assoc-${availabilityZones[index]}-${environmentSuffix}`,
        {
          networkAclId: publicNetworkAcl.id,
          subnetId: subnet.id,
        },
        { parent: this }
      );
    });

    // Create S3 Bucket for VPC Flow Logs
    const flowLogsBucket = new aws.s3.Bucket(
      `vpc-flow-logs-${environmentSuffix}-eu`,
      {
        bucket: `vpc-flow-logs-${environmentSuffix}-eu`,
        tags: {
          ...commonTags,
          Name: `vpc-flow-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Configure server-side encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `flow-logs-bucket-encryption-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      },
      { parent: this }
    );

    // Configure lifecycle policy
    new aws.s3.BucketLifecycleConfiguration(
      `flow-logs-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        rules: [
          {
            id: 'expire-logs',
            status: 'Enabled',
            expiration: {
              days: 7,
            },
          },
        ],
      },
      { parent: this }
    );

    // Block public access to S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      `flow-logs-bucket-public-access-block-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `vpc-flow-logs-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...commonTags,
          Name: `vpc-flow-logs-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create CloudWatch Log Group
    const flowLogsLogGroup = new aws.cloudwatch.LogGroup(
      `vpc-flow-logs-${environmentSuffix}`,
      {
        name: `/aws/vpc/flow-logs-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...commonTags,
          Name: `vpc-flow-logs-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // IAM Policy for Flow Logs to CloudWatch
    const flowLogsPolicy = new aws.iam.RolePolicy(
      `vpc-flow-logs-policy-${environmentSuffix}`,
      {
        role: flowLogsRole.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                "Resource": "${flowLogsLogGroup.arn}:*"
            }
        ]
    }`,
      },
      { parent: this }
    );

    // S3 Bucket Policy for VPC Flow Logs
    void new aws.s3.BucketPolicy(
      `flow-logs-bucket-policy-${environmentSuffix}`,
      {
        bucket: flowLogsBucket.id,
        policy: pulumi.all([flowLogsBucket.arn]).apply((args: string[]) => {
          const bucketArn = args[0];
          return JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AWSLogDeliveryWrite',
                Effect: 'Allow',
                Principal: {
                  Service: 'delivery.logs.amazonaws.com',
                },
                Action: 's3:PutObject',
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              },
              {
                Sid: 'AWSLogDeliveryAclCheck',
                Effect: 'Allow',
                Principal: {
                  Service: 'delivery.logs.amazonaws.com',
                },
                Action: 's3:GetBucketAcl',
                Resource: bucketArn,
              },
            ],
          });
        }),
      },
      { parent: this }
    );

    // Create VPC Flow Logs to S3
    void new aws.ec2.FlowLog(
      `vpc-flow-log-s3-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        trafficType: 'ALL',
        logDestinationType: 's3',
        logDestination: flowLogsBucket.arn,
        tags: {
          ...commonTags,
          Name: `vpc-flow-log-s3-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create VPC Flow Logs to CloudWatch
    void new aws.ec2.FlowLog(
      `vpc-flow-log-cloudwatch-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        trafficType: 'ALL',
        logDestinationType: 'cloud-watch-logs',
        logDestination: flowLogsLogGroup.arn,
        iamRoleArn: flowLogsRole.arn,
        tags: {
          ...commonTags,
          Name: `vpc-flow-log-cloudwatch-${environmentSuffix}`,
        },
      },
      { parent: this, dependsOn: [flowLogsPolicy] }
    );

    // Create S3 VPC Endpoint
    const s3Endpoint = new aws.ec2.VpcEndpoint(
      `s3-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: `com.amazonaws.${region}.s3`,
        vpcEndpointType: 'Gateway',
        routeTableIds: privateRouteTables.map(rt => rt.id),
        tags: {
          ...commonTags,
          Name: `s3-endpoint-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Set output properties
    this.vpcId = vpc.id;
    this.vpcCidr = vpc.cidrBlock;
    this.internetGatewayId = internetGateway.id;
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
    this.databaseSubnetIds = databaseSubnets.map(subnet => subnet.id);
    this.natInstanceIds = natInstances.map(instance => instance.id);
    this.natInstancePrivateIps = natInstances.map(
      instance => instance.privateIp
    );
    this.webSecurityGroupId = webSecurityGroup.id;
    this.appSecurityGroupId = appSecurityGroup.id;
    this.databaseSecurityGroupId = databaseSecurityGroup.id;
    this.flowLogsBucketName = flowLogsBucket.id;
    this.flowLogsLogGroupName = flowLogsLogGroup.name;
    this.s3EndpointId = s3Endpoint.id;

    // Register the outputs of this component.
    super.registerOutputs({
      vpcId: this.vpcId,
      vpcCidr: this.vpcCidr,
      internetGatewayId: this.internetGatewayId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      databaseSubnetIds: this.databaseSubnetIds,
      natInstanceIds: this.natInstanceIds,
      natInstancePrivateIps: this.natInstancePrivateIps,
      webSecurityGroupId: this.webSecurityGroupId,
      appSecurityGroupId: this.appSecurityGroupId,
      databaseSecurityGroupId: this.databaseSecurityGroupId,
      flowLogsBucketName: this.flowLogsBucketName,
      flowLogsLogGroupName: this.flowLogsLogGroupName,
      s3EndpointId: this.s3EndpointId,
    });
  }
}
