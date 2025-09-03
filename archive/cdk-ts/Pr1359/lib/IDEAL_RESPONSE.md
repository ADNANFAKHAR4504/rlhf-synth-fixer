```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix;

    // Get SSH IP address from context or use default parameter
    const sshIpAddress =
      this.node.tryGetContext('sshIpAddress') ||
      new cdk.CfnParameter(this, 'SshIpAddress', {
        type: 'String',
        description: 'IP address allowed for SSH access',
        default: '0.0.0.0/32',
      }).valueAsString;

    // 1. VPC: Create VPC with CIDR block 10.0.0.0/16
    const vpc = new ec2.Vpc(this, `ProductionVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [], // We'll create subnets manually
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Tag VPC with Environment: Production
    cdk.Tags.of(vpc).add('Environment', 'Production');

    // 2. Subnets: Define two subnets within the VPC
    const subnet1 = new ec2.Subnet(
      this,
      `ProductionSubnet1${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: cdk.Stack.of(this).availabilityZones[0],
        mapPublicIpOnLaunch: true,
      }
    );

    const subnet2 = new ec2.Subnet(
      this,
      `ProductionSubnet2${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: cdk.Stack.of(this).availabilityZones[1],
        mapPublicIpOnLaunch: true,
      }
    );

    // Tag subnets with Environment: Production
    cdk.Tags.of(subnet1).add('Environment', 'Production');
    cdk.Tags.of(subnet2).add('Environment', 'Production');

    // Create Internet Gateway and route table for public access
    const internetGateway = new ec2.CfnInternetGateway(
      this,
      `ProductionIGW${environmentSuffix}`
    );
    new ec2.CfnVPCGatewayAttachment(
      this,
      `ProductionIGWAttachment${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
        internetGatewayId: internetGateway.ref,
      }
    );

    const routeTable = new ec2.CfnRouteTable(
      this,
      `ProductionRouteTable${environmentSuffix}`,
      {
        vpcId: vpc.vpcId,
      }
    );

    new ec2.CfnRoute(this, `ProductionRoute${environmentSuffix}`, {
      routeTableId: routeTable.ref,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: internetGateway.ref,
    });

    new ec2.CfnSubnetRouteTableAssociation(
      this,
      `Subnet1RouteTableAssociation${environmentSuffix}`,
      {
        subnetId: subnet1.subnetId,
        routeTableId: routeTable.ref,
      }
    );

    new ec2.CfnSubnetRouteTableAssociation(
      this,
      `Subnet2RouteTableAssociation${environmentSuffix}`,
      {
        subnetId: subnet2.subnetId,
        routeTableId: routeTable.ref,
      }
    );

    // 3. S3 Bucket: Create S3 bucket with versioning enabled
    const s3Bucket = new s3.Bucket(
      this,
      `ProductionS3Bucket${environmentSuffix}`,
      {
        // Don't use explicit bucket name to avoid token issues, let CDK generate a unique name
        versioned: true, // Enable versioning as required
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Must be destroyable as per QA requirements
        autoDeleteObjects: true, // Automatically delete objects on stack deletion
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Security best practice
      }
    );

    // Tag S3 bucket with Environment: Production
    cdk.Tags.of(s3Bucket).add('Environment', 'Production');

    // 4. IAM Role: Create IAM role following least-privilege principle
    const ec2Role = new iam.Role(
      this,
      `ProductionEC2Role${environmentSuffix}`,
      {
        roleName: `tap-ec2-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        description: 'IAM role for EC2 instance with S3 and CloudWatch access',
        inlinePolicies: {
          // Least-privilege policy for S3 bucket access (read/write only to our bucket)
          S3BucketAccess: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:ListBucket',
                  's3:GetBucketLocation',
                ],
                resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
              }),
            ],
          }),
          // Least-privilege policy for CloudWatch logging
          CloudWatchLogging: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogStreams',
                  'logs:DescribeLogGroups',
                ],
                resources: [
                  `arn:aws:logs:${this.region}:${this.account}:log-group:*`,
                ],
              }),
            ],
          }),
        },
      }
    );

    // Tag IAM role with Environment: Production
    cdk.Tags.of(ec2Role).add('Environment', 'Production');

    // Create instance profile for the EC2 instance
    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      `ProductionInstanceProfile${environmentSuffix}`,
      {
        instanceProfileName: `tap-instance-profile-${environmentSuffix}`,
        roles: [ec2Role.roleName],
      }
    );

    // 6. Security Group: Allow inbound SSH traffic only from specified IP
    const securityGroup = new ec2.SecurityGroup(
      this,
      `ProductionSecurityGroup${environmentSuffix}`,
      {
        securityGroupName: `tap-security-group-${environmentSuffix}`,
        vpc: vpc,
        description: 'Security group for production EC2 instance',
        allowAllOutbound: true, // Allow all outbound traffic
      }
    );

    // Add SSH inbound rule for specified IP address only
    securityGroup.addIngressRule(
      ec2.Peer.ipv4(sshIpAddress),
      ec2.Port.tcp(22),
      'Allow SSH access from specified IP address'
    );

    // Tag security group with Environment: Production
    cdk.Tags.of(securityGroup).add('Environment', 'Production');

    // 5. EC2 Instance: t3.medium launched in subnet1 with IAM role
    const ec2Instance = new ec2.CfnInstance(
      this,
      `ProductionEC2Instance${environmentSuffix}`,
      {
        instanceType: 't3.medium', // Required instance type
        imageId: new ec2.AmazonLinuxImage({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        }).getImage(this).imageId,
        subnetId: subnet1.subnetId, // Launch in first subnet
        securityGroupIds: [securityGroup.securityGroupId],
        iamInstanceProfile: instanceProfile.ref, // Attach IAM role
        userData: cdk.Fn.base64(`#!/bin/bash
        yum update -y
        yum install -y awscli
        # Install CloudWatch agent for logging
        yum install -y amazon-cloudwatch-agent
      `),
      }
    );

    // Tag EC2 instance with Environment: Production
    cdk.Tags.of(ec2Instance).add('Environment', 'Production');

    // 8. Dependencies: Ensure resources are created in correct order
    // EC2 instance depends on IAM role and instance profile
    ec2Instance.addDependency(instanceProfile);

    // Instance profile depends on IAM role
    instanceProfile.addDependency(ec2Role.node.defaultChild as cdk.CfnResource);

    // EC2 instance depends on route table associations for internet access
    ec2Instance.node.addDependency(routeTable);

    // Output important resource information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.ref,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'EC2PublicIp', {
      value: ec2Instance.attrPublicIp,
      description: 'EC2 Instance Public IP',
    });
  }
}
```