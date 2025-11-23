/**
 * TapStack - Three-tier AWS environment for payment processing application
 *
 * This stack creates a production-ready infrastructure with:
 * - VPC with public, private, and database subnets across 2 AZs
 * - Internet Gateway and NAT Gateways for connectivity
 * - Security groups for web, app, and database tiers
 * - EC2 instances with IMDSv2 enforcement
 * - RDS subnet group for database tier
 * - S3 bucket with versioning
 * - VPC flow logs with CloudWatch integration
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackProps {
  tags?: { [key: string]: string };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly region: pulumi.Output<string>;
  public readonly vpcId: pulumi.Output<string>;
  public readonly internetGatewayId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly databaseSubnetIds: pulumi.Output<string[]>;
  public readonly natGatewayIds: pulumi.Output<string[]>;
  public readonly webInstanceIds: pulumi.Output<string[]>;
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly appSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;
  public readonly dbSubnetGroupName: pulumi.Output<string>;
  public readonly flowLogsRoleArn: pulumi.Output<string>;
  public readonly flowLogsLogGroupName: pulumi.Output<string>;
  public readonly flowLogId: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly s3BucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    props: TapStackProps = {},
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    // Get environment suffix from environment variable or config
    const config = new pulumi.Config();
    const stackName = pulumi.getStack();
    const environmentSuffix =
      process.env.ENVIRONMENT_SUFFIX || config.get('env') || stackName;

    // Resolve AWS region from environment or Pulumi config
    const awsConfig = new pulumi.Config('aws');
    const region =
      process.env.AWS_REGION ||
      awsConfig.get('region') ||
      process.env.AWS_DEFAULT_REGION;

    if (!region) {
      throw new Error(
        'AWS region is not configured. Set AWS_REGION env var or configure aws:region.'
      );
    }

    const provider = new aws.Provider(
      `${name}-provider`,
      { region },
      { parent: this }
    );

    const defaultResourceOptions: pulumi.ResourceOptions = {
      parent: this,
      provider,
    };

    // Get availability zones for the region
    const availabilityZones = aws.getAvailabilityZonesOutput(
      {
        state: 'available',
      },
      { provider }
    );

    // Merge default tags with provided tags
    const defaultTags = {
      Environment: 'Production',
      Project: 'PaymentApp',
      ManagedBy: 'Pulumi',
      ...props.tags,
    };

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `payment-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...defaultTags,
          Name: `payment-vpc-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `payment-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `payment-igw-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create public subnets (2 AZs)
    const publicSubnet1 = new aws.ec2.Subnet(
      `payment-public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.names[0],
        mapPublicIpOnLaunch: true,
        tags: {
          ...defaultTags,
          Name: `payment-public-subnet-1-${environmentSuffix}`,
          Tier: 'Public',
        },
      },
      defaultResourceOptions
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `payment-public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.names[1],
        mapPublicIpOnLaunch: true,
        tags: {
          ...defaultTags,
          Name: `payment-public-subnet-2-${environmentSuffix}`,
          Tier: 'Public',
        },
      },
      defaultResourceOptions
    );

    // Create private subnets (2 AZs)
    const privateSubnet1 = new aws.ec2.Subnet(
      `payment-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: availabilityZones.names[0],
        tags: {
          ...defaultTags,
          Name: `payment-private-subnet-1-${environmentSuffix}`,
          Tier: 'Private',
        },
      },
      defaultResourceOptions
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `payment-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: availabilityZones.names[1],
        tags: {
          ...defaultTags,
          Name: `payment-private-subnet-2-${environmentSuffix}`,
          Tier: 'Private',
        },
      },
      defaultResourceOptions
    );

    // Create database subnets (2 AZs)
    const databaseSubnet1 = new aws.ec2.Subnet(
      `payment-db-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.21.0/24',
        availabilityZone: availabilityZones.names[0],
        tags: {
          ...defaultTags,
          Name: `payment-db-subnet-1-${environmentSuffix}`,
          Tier: 'Database',
        },
      },
      defaultResourceOptions
    );

    const databaseSubnet2 = new aws.ec2.Subnet(
      `payment-db-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.22.0/24',
        availabilityZone: availabilityZones.names[1],
        tags: {
          ...defaultTags,
          Name: `payment-db-subnet-2-${environmentSuffix}`,
          Tier: 'Database',
        },
      },
      defaultResourceOptions
    );

    // Create Elastic IPs for NAT Gateways
    const eip1 = new aws.ec2.Eip(
      `payment-nat-eip-1-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          ...defaultTags,
          Name: `payment-nat-eip-1-${environmentSuffix}`,
        },
      },
      pulumi.mergeOptions(defaultResourceOptions, {
        dependsOn: [internetGateway],
      })
    );

    const eip2 = new aws.ec2.Eip(
      `payment-nat-eip-2-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          ...defaultTags,
          Name: `payment-nat-eip-2-${environmentSuffix}`,
        },
      },
      pulumi.mergeOptions(defaultResourceOptions, {
        dependsOn: [internetGateway],
      })
    );

    // Create NAT Gateways in public subnets
    const natGateway1 = new aws.ec2.NatGateway(
      `payment-nat-gw-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        allocationId: eip1.id,
        tags: {
          ...defaultTags,
          Name: `payment-nat-gw-1-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    const natGateway2 = new aws.ec2.NatGateway(
      `payment-nat-gw-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        allocationId: eip2.id,
        tags: {
          ...defaultTags,
          Name: `payment-nat-gw-2-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `payment-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `payment-public-rt-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create route to Internet Gateway
    new aws.ec2.Route(
      `payment-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      defaultResourceOptions
    );

    // Associate public subnets with public route table
    new aws.ec2.RouteTableAssociation(
      `payment-public-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      defaultResourceOptions
    );

    new aws.ec2.RouteTableAssociation(
      `payment-public-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      defaultResourceOptions
    );

    // Create route table for private subnet 1
    const privateRouteTable1 = new aws.ec2.RouteTable(
      `payment-private-rt-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `payment-private-rt-1-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create route to NAT Gateway 1
    new aws.ec2.Route(
      `payment-private-route-1-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable1.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway1.id,
      },
      defaultResourceOptions
    );

    // Associate private subnet 1 with private route table 1
    new aws.ec2.RouteTableAssociation(
      `payment-private-rta-1-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable1.id,
      },
      defaultResourceOptions
    );

    // Create route table for private subnet 2
    const privateRouteTable2 = new aws.ec2.RouteTable(
      `payment-private-rt-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `payment-private-rt-2-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create route to NAT Gateway 2
    new aws.ec2.Route(
      `payment-private-route-2-${environmentSuffix}`,
      {
        routeTableId: privateRouteTable2.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway2.id,
      },
      defaultResourceOptions
    );

    // Associate private subnet 2 with private route table 2
    new aws.ec2.RouteTableAssociation(
      `payment-private-rta-2-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable2.id,
      },
      defaultResourceOptions
    );

    // Create route table for database subnets
    const databaseRouteTable = new aws.ec2.RouteTable(
      `payment-db-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          ...defaultTags,
          Name: `payment-db-rt-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Associate database subnets with database route table
    new aws.ec2.RouteTableAssociation(
      `payment-db-rta-1-${environmentSuffix}`,
      {
        subnetId: databaseSubnet1.id,
        routeTableId: databaseRouteTable.id,
      },
      defaultResourceOptions
    );

    new aws.ec2.RouteTableAssociation(
      `payment-db-rta-2-${environmentSuffix}`,
      {
        subnetId: databaseSubnet2.id,
        routeTableId: databaseRouteTable.id,
      },
      defaultResourceOptions
    );

    // Create security group for web tier
    const webSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-web-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description:
          'Security group for web tier - allows HTTP/HTTPS from internet',
        ingress: [
          {
            description: 'Allow HTTP traffic from internet',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
          {
            description: 'Allow HTTPS traffic from internet',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          {
            description: 'Allow all outbound traffic',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...defaultTags,
          Name: `payment-web-sg-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create security group for application tier
    const appSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-app-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description:
          'Security group for application tier - allows traffic from web tier',
        egress: [
          {
            description: 'Allow all outbound traffic',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...defaultTags,
          Name: `payment-app-sg-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Add ingress rule for app tier from web tier
    new aws.ec2.SecurityGroupRule(
      `payment-app-ingress-from-web-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 8080,
        toPort: 8080,
        protocol: 'tcp',
        sourceSecurityGroupId: webSecurityGroup.id,
        securityGroupId: appSecurityGroup.id,
        description: 'Allow traffic from web tier on port 8080',
      },
      defaultResourceOptions
    );

    // Create security group for database tier
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `payment-db-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description:
          'Security group for database tier - allows traffic from application tier',
        egress: [
          {
            description: 'Allow all outbound traffic',
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...defaultTags,
          Name: `payment-db-sg-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Add ingress rule for database tier from app tier
    new aws.ec2.SecurityGroupRule(
      `payment-db-ingress-from-app-${environmentSuffix}`,
      {
        type: 'ingress',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        sourceSecurityGroupId: appSecurityGroup.id,
        securityGroupId: dbSecurityGroup.id,
        description: 'Allow PostgreSQL traffic from application tier',
      },
      defaultResourceOptions
    );

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmiOutput(
      {
        mostRecent: true,
        owners: ['amazon'],
        filters: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
          {
            name: 'state',
            values: ['available'],
          },
        ],
      },
      { provider }
    );

    // Create EC2 instance in public subnet 1 with IMDSv2
    const webInstance1 = new aws.ec2.Instance(
      `payment-web-instance-1-${environmentSuffix}`,
      {
        ami: ami.id,
        instanceType: 't3.micro',
        subnetId: publicSubnet1.id,
        vpcSecurityGroupIds: [webSecurityGroup.id],
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // Enforce IMDSv2
          httpPutResponseHopLimit: 1,
        },
        tags: {
          ...defaultTags,
          Name: `payment-web-instance-1-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create EC2 instance in public subnet 2 with IMDSv2
    const webInstance2 = new aws.ec2.Instance(
      `payment-web-instance-2-${environmentSuffix}`,
      {
        ami: ami.id,
        instanceType: 't3.micro',
        subnetId: publicSubnet2.id,
        vpcSecurityGroupIds: [webSecurityGroup.id],
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // Enforce IMDSv2
          httpPutResponseHopLimit: 1,
        },
        tags: {
          ...defaultTags,
          Name: `payment-web-instance-2-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create RDS subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `payment-db-subnet-group-${environmentSuffix}`,
      {
        subnetIds: [databaseSubnet1.id, databaseSubnet2.id],
        description: 'Subnet group for RDS database instances',
        tags: {
          ...defaultTags,
          Name: `payment-db-subnet-group-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create S3 bucket with versioning
    const bucket = new aws.s3.Bucket(
      `payment-data-${environmentSuffix}`,
      {
        bucketPrefix: `payment-data-${environmentSuffix}-`,
        versioning: {
          enabled: true,
        },
        tags: {
          ...defaultTags,
          Name: `payment-data-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create IAM role for VPC Flow Logs
    const flowLogsRole = new aws.iam.Role(
      `payment-flow-logs-role-${environmentSuffix}`,
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
          ...defaultTags,
          Name: `payment-flow-logs-role-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create IAM policy for VPC Flow Logs
    const flowLogsPolicy = new aws.iam.RolePolicy(
      `payment-flow-logs-policy-${environmentSuffix}`,
      {
        role: flowLogsRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogGroups',
                'logs:DescribeLogStreams',
              ],
              Resource: '*',
            },
          ],
        }),
      },
      defaultResourceOptions
    );

    // Create CloudWatch Log Group for VPC Flow Logs
    const flowLogsLogGroup = new aws.cloudwatch.LogGroup(
      `payment-vpc-flow-logs-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags: {
          ...defaultTags,
          Name: `payment-vpc-flow-logs-${environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Create VPC Flow Logs
    const flowLog = new aws.ec2.FlowLog(
      `payment-vpc-flow-log-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        trafficType: 'ALL',
        logDestinationType: 'cloud-watch-logs',
        logDestination: flowLogsLogGroup.arn,
        iamRoleArn: flowLogsRole.arn,
        tags: {
          ...defaultTags,
          Name: `payment-vpc-flow-log-${environmentSuffix}`,
        },
      },
      pulumi.mergeOptions(defaultResourceOptions, {
        dependsOn: [flowLogsPolicy],
      })
    );

    // Export outputs
    this.region = pulumi.output(region);
    this.vpcId = vpc.id;
    this.internetGatewayId = internetGateway.id;
    this.publicSubnetIds = pulumi.output([publicSubnet1.id, publicSubnet2.id]);
    this.privateSubnetIds = pulumi.output([
      privateSubnet1.id,
      privateSubnet2.id,
    ]);
    this.databaseSubnetIds = pulumi.output([
      databaseSubnet1.id,
      databaseSubnet2.id,
    ]);
    this.natGatewayIds = pulumi.output([natGateway1.id, natGateway2.id]);
    this.webInstanceIds = pulumi.output([webInstance1.id, webInstance2.id]);
    this.webSecurityGroupId = webSecurityGroup.id;
    this.appSecurityGroupId = appSecurityGroup.id;
    this.dbSecurityGroupId = dbSecurityGroup.id;
    this.dbSubnetGroupName = dbSubnetGroup.name;
    this.flowLogsRoleArn = flowLogsRole.arn;
    this.flowLogsLogGroupName = flowLogsLogGroup.name;
    this.flowLogId = flowLog.id;
    this.s3BucketName = bucket.id;
    this.s3BucketArn = bucket.arn;

    // Register outputs
    this.registerOutputs({
      region: this.region,
      vpcId: this.vpcId,
      internetGatewayId: this.internetGatewayId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      databaseSubnetIds: this.databaseSubnetIds,
      natGatewayIds: this.natGatewayIds,
      webInstanceIds: this.webInstanceIds,
      webSecurityGroupId: this.webSecurityGroupId,
      appSecurityGroupId: this.appSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
      dbSubnetGroupName: this.dbSubnetGroupName,
      flowLogsRoleArn: this.flowLogsRoleArn,
      flowLogsLogGroupName: this.flowLogsLogGroupName,
      flowLogId: this.flowLogId,
      s3BucketName: this.s3BucketName,
      s3BucketArn: this.s3BucketArn,
    });
  }
}
