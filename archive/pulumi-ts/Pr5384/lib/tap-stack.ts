/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * deploying a complete production-ready AWS environment including:
 * - VPC with public and private subnets across multiple AZs
 * - Application Load Balancer for traffic distribution
 * - Auto Scaling Group with EC2 instances
 * - RDS PostgreSQL database
 * - S3 bucket for application assets
 * - CloudWatch Log Groups for observability
 * - Security groups and IAM roles following least privilege
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * A suffix for identifying the deployment environment (e.g., 'dev', 'prod', unique identifier).
   * This is used to ensure resource uniqueness across deployments.
   */
  environmentSuffix: string;

  /**
   * AWS region where resources will be deployed.
   * Defaults to 'ap-northeast-1' as specified in requirements.
   */
  region?: string;

  /**
   * Optional default tags to apply to all resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the production AWS environment.
 *
 * This component orchestrates the creation of:
 * - Networking infrastructure (VPC, subnets, gateways, route tables)
 * - Compute resources (ALB, Auto Scaling Group, EC2 instances)
 * - Database (RDS PostgreSQL)
 * - Storage (S3 bucket)
 * - Observability (CloudWatch Log Groups)
 * - Security (Security Groups, IAM roles)
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly appLogGroupName: pulumi.Output<string>;
  public readonly infraLogGroupName: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix, region, and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix;
    const defaultTags = {
      Environment: 'production',
      ManagedBy: 'pulumi',
      ...(args.tags || {}),
    };

    // Get availability zones for the region
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // --- 1. VPC and Networking ---

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Name: `vpc-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `igw-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create public subnets in two AZs
    const publicSubnet1 = new aws.ec2.Subnet(
      `public-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-1-${environmentSuffix}`,
          Type: 'public',
          ...defaultTags,
        },
      },
      { parent: this }
    );

    const publicSubnet2 = new aws.ec2.Subnet(
      `public-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `public-subnet-2-${environmentSuffix}`,
          Type: 'public',
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create private subnets in two AZs
    const privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.11.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        tags: {
          Name: `private-subnet-1-${environmentSuffix}`,
          Type: 'private',
          ...defaultTags,
        },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.12.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        tags: {
          Name: `private-subnet-2-${environmentSuffix}`,
          Type: 'private',
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create Elastic IPs for NAT Gateways
    const eip1 = new aws.ec2.Eip(
      `eip-nat-1-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `eip-nat-1-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this, dependsOn: [internetGateway] }
    );

    const eip2 = new aws.ec2.Eip(
      `eip-nat-2-${environmentSuffix}`,
      {
        domain: 'vpc',
        tags: {
          Name: `eip-nat-2-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this, dependsOn: [internetGateway] }
    );

    // Create NAT Gateways (one per AZ)
    const natGateway1 = new aws.ec2.NatGateway(
      `nat-gateway-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        allocationId: eip1.id,
        tags: {
          Name: `nat-gateway-1-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    const natGateway2 = new aws.ec2.NatGateway(
      `nat-gateway-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        allocationId: eip2.id,
        tags: {
          Name: `nat-gateway-2-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create route table for public subnets
    const publicRouteTable = new aws.ec2.RouteTable(
      `public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          Name: `public-rt-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    new aws.ec2.RouteTableAssociation(
      `public-rta-1-${environmentSuffix}`,
      {
        subnetId: publicSubnet1.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `public-rta-2-${environmentSuffix}`,
      {
        subnetId: publicSubnet2.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    // Create route tables for private subnets (one per AZ with its own NAT Gateway)
    const privateRouteTable1 = new aws.ec2.RouteTable(
      `private-rt-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway1.id,
          },
        ],
        tags: {
          Name: `private-rt-1-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    const privateRouteTable2 = new aws.ec2.RouteTable(
      `private-rt-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: natGateway2.id,
          },
        ],
        tags: {
          Name: `private-rt-2-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Associate private subnets with their respective route tables
    new aws.ec2.RouteTableAssociation(
      `private-rta-1-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable1.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `private-rta-2-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable2.id,
      },
      { parent: this }
    );

    // --- 2. Security Groups ---

    // ALB Security Group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `alb-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP traffic from internet',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `alb-sg-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // EC2 Instance Security Group
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `ec2-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for EC2 instances',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            securityGroups: [albSecurityGroup.id],
            description: 'Allow HTTP traffic from ALB',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `ec2-sg-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // RDS Security Group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `rds-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for RDS PostgreSQL instance',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 5432,
            toPort: 5432,
            securityGroups: [ec2SecurityGroup.id],
            description: 'Allow PostgreSQL traffic from EC2 instances',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          Name: `rds-sg-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // --- 3. IAM Roles and Policies ---

    // IAM Role for EC2 instances
    const ec2Role = new aws.iam.Role(
      `ec2-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          Name: `ec2-role-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Attach CloudWatch Logs policy
    new aws.iam.RolePolicyAttachment(
      `ec2-cloudwatch-policy-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Create S3 bucket first (needed for IAM policy)
    const s3Bucket = new aws.s3.Bucket(
      `assets-bucket-${environmentSuffix}`,
      {
        bucket: `assets-bucket-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        lifecycleRules: [
          {
            id: 'transition-to-ia',
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        tags: {
          Name: `assets-bucket-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Block all public access to S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      `assets-bucket-public-access-block-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create inline policy for S3 access
    new aws.iam.RolePolicy(
      `ec2-s3-policy-${environmentSuffix}`,
      {
        role: ec2Role.id,
        policy: pulumi.interpolate`{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket"
              ],
              "Resource": [
                "${s3Bucket.arn}",
                "${s3Bucket.arn}/*"
              ]
            }
          ]
        }`,
      },
      { parent: this }
    );

    // Create IAM instance profile for EC2
    const ec2InstanceProfile = new aws.iam.InstanceProfile(
      `ec2-instance-profile-${environmentSuffix}`,
      {
        role: ec2Role.name,
        tags: {
          Name: `ec2-instance-profile-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // --- 4. CloudWatch Log Groups ---

    const appLogGroup = new aws.cloudwatch.LogGroup(
      `app-logs-${environmentSuffix}`,
      {
        name: `/aws/application/${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `app-logs-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    const infraLogGroup = new aws.cloudwatch.LogGroup(
      `infra-logs-${environmentSuffix}`,
      {
        name: `/aws/infrastructure/${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          Name: `infra-logs-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // --- 5. Application Load Balancer ---

    const alb = new aws.lb.LoadBalancer(
      `alb-${environmentSuffix}`,
      {
        name: `alb-${environmentSuffix}`,
        internal: false,
        loadBalancerType: 'application',
        securityGroups: [albSecurityGroup.id],
        subnets: [publicSubnet1.id, publicSubnet2.id],
        enableDeletionProtection: false,
        tags: {
          Name: `alb-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create target group for ALB
    const targetGroup = new aws.lb.TargetGroup(
      `tg-${environmentSuffix}`,
      {
        name: `tg-${environmentSuffix}`,
        port: 80,
        protocol: 'HTTP',
        vpcId: vpc.id,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
        },
        tags: {
          Name: `tg-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create ALB listener
    new aws.lb.Listener(
      `alb-listener-${environmentSuffix}`,
      {
        loadBalancerArn: alb.arn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // --- 6. Auto Scaling Group with Launch Template ---

    // Get Amazon Linux 2023 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // User data script to install and configure CloudWatch agent
    const userData = pulumi.interpolate`#!/bin/bash
set -e

# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install Apache web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create simple test page
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "${appLogGroup.name}",
            "log_stream_name": "{instance_id}/apache-access",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "${appLogGroup.name}",
            "log_stream_name": "{instance_id}/apache-error",
            "timezone": "UTC"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
`;

    // Create Launch Template
    const launchTemplate = new aws.ec2.LaunchTemplate(
      `launch-template-${environmentSuffix}`,
      {
        name: `launch-template-${environmentSuffix}`,
        imageId: ami.then(a => a.id),
        instanceType: 't3.micro',
        iamInstanceProfile: {
          arn: ec2InstanceProfile.arn,
        },
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        userData: userData.apply(ud => Buffer.from(ud).toString('base64')),
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: {
              Name: `asg-instance-${environmentSuffix}`,
              ...defaultTags,
            },
          },
        ],
      },
      { parent: this }
    );

    // Create Auto Scaling Group
    new aws.autoscaling.Group(
      `asg-${environmentSuffix}`,
      {
        name: `asg-${environmentSuffix}`,
        minSize: 2,
        maxSize: 4,
        desiredCapacity: 2,
        vpcZoneIdentifiers: [privateSubnet1.id, privateSubnet2.id],
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        targetGroupArns: [targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        tags: [
          {
            key: 'Name',
            value: `asg-${environmentSuffix}`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: 'production',
            propagateAtLaunch: true,
          },
          {
            key: 'ManagedBy',
            value: 'pulumi',
            propagateAtLaunch: true,
          },
        ],
      },
      { parent: this }
    );

    // --- 7. RDS PostgreSQL Database ---

    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `db-subnet-group-${environmentSuffix}`,
      {
        name: `db-subnet-group-${environmentSuffix}`,
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          Name: `db-subnet-group-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // Create RDS PostgreSQL instance
    const dbInstance = new aws.rds.Instance(
      `db-instance-${environmentSuffix}`,
      {
        identifier: `db-instance-${environmentSuffix}`,
        engine: 'postgres',
        engineVersion: '14.15',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        dbName: 'appdb',
        username: 'dbadmin',
        password: pulumi.secret('ChangeMe123456!'), // In production, use Secrets Manager
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        skipFinalSnapshot: true,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'mon:04:00-mon:05:00',
        storageEncrypted: true,
        publiclyAccessible: false,
        multiAz: false, // Set to true for production high availability
        tags: {
          Name: `db-instance-${environmentSuffix}`,
          ...defaultTags,
        },
      },
      { parent: this }
    );

    // --- 8. Exports ---

    this.vpcId = vpc.id;
    this.albDnsName = alb.dnsName;
    this.s3BucketName = s3Bucket.id;
    this.dbEndpoint = dbInstance.endpoint;
    this.appLogGroupName = appLogGroup.name;
    this.infraLogGroupName = infraLogGroup.name;

    // Register the outputs of this component
    this.registerOutputs({
      vpcId: this.vpcId,
      albDnsName: this.albDnsName,
      s3BucketName: this.s3BucketName,
      dbEndpoint: dbInstance.endpoint,
      appLogGroupName: appLogGroup.name,
      infraLogGroupName: infraLogGroup.name,
    });
  }
}
