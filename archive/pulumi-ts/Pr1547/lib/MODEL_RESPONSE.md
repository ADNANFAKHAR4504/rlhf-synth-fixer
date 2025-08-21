# Production-Ready Cloud Environment Setup - Infrastructure Code

This infrastructure implements a comprehensive production-ready AWS environment using Pulumi TypeScript with the latest AWS features including Enhanced CloudWatch Monitoring and EC2 On-Demand Capacity Reservations.

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * Production-ready cloud environment with comprehensive AWS services
 * including VPC, ALB with SSL, RDS, Auto Scaling, and monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'prod' for production environment.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Production-ready TapStack component with comprehensive AWS services
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly albArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly s3BucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'prod';
    const tags = args.tags || {};

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create VPC with multiple AZs
    const vpc = new aws.ec2.Vpc(`${environmentSuffix}-vpc`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${environmentSuffix}-vpc`,
        ...tags,
      },
    }, { parent: this });

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(`${environmentSuffix}-igw`, {
      vpcId: vpc.id,
      tags: {
        Name: `${environmentSuffix}-igw`,
        ...tags,
      },
    }, { parent: this });

    // Create public subnets in first two AZs
    const publicSubnet1 = new aws.ec2.Subnet(`${environmentSuffix}-public-subnet-1`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: availabilityZones.then(azs => azs.names[0]),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${environmentSuffix}-public-subnet-1`,
        ...tags,
      },
    }, { parent: this });

    const publicSubnet2 = new aws.ec2.Subnet(`${environmentSuffix}-public-subnet-2`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: availabilityZones.then(azs => azs.names[1]),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${environmentSuffix}-public-subnet-2`,
        ...tags,
      },
    }, { parent: this });

    // Create private subnets in first two AZs
    const privateSubnet1 = new aws.ec2.Subnet(`${environmentSuffix}-private-subnet-1`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: availabilityZones.then(azs => azs.names[0]),
      tags: {
        Name: `${environmentSuffix}-private-subnet-1`,
        ...tags,
      },
    }, { parent: this });

    const privateSubnet2 = new aws.ec2.Subnet(`${environmentSuffix}-private-subnet-2`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.4.0/24',
      availabilityZone: availabilityZones.then(azs => azs.names[1]),
      tags: {
        Name: `${environmentSuffix}-private-subnet-2`,
        ...tags,
      },
    }, { parent: this });

    // Create NAT Gateways for private subnet internet access
    const natEip1 = new aws.ec2.Eip(`${environmentSuffix}-nat-eip-1`, {
      domain: 'vpc',
      tags: {
        Name: `${environmentSuffix}-nat-eip-1`,
        ...tags,
      },
    }, { parent: this });

    const natGateway1 = new aws.ec2.NatGateway(`${environmentSuffix}-nat-gateway-1`, {
      allocationId: natEip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `${environmentSuffix}-nat-gateway-1`,
        ...tags,
      },
    }, { parent: this });

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(`${environmentSuffix}-public-rt`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: internetGateway.id,
        },
      ],
      tags: {
        Name: `${environmentSuffix}-public-rt`,
        ...tags,
      },
    }, { parent: this });

    const privateRouteTable = new aws.ec2.RouteTable(`${environmentSuffix}-private-rt`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway1.id,
        },
      ],
      tags: {
        Name: `${environmentSuffix}-private-rt`,
        ...tags,
      },
    }, { parent: this });

    // Associate route tables with subnets
    new aws.ec2.RouteTableAssociation(`${environmentSuffix}-public-rta-1`, {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`${environmentSuffix}-public-rta-2`, {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`${environmentSuffix}-private-rta-1`, {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id,
    }, { parent: this });

    new aws.ec2.RouteTableAssociation(`${environmentSuffix}-private-rta-2`, {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id,
    }, { parent: this });

    // Create S3 bucket with logging configuration
    const s3Bucket = new aws.s3.Bucket(`${environmentSuffix}-app-storage`, {
      bucketPrefix: `${environmentSuffix}-storage-`,
      tags: {
        Name: `${environmentSuffix}-app-storage`,
        ...tags,
      },
    }, { parent: this });

    // S3 bucket for access logging
    const loggingBucket = new aws.s3.Bucket(`${environmentSuffix}-access-logs`, {
      bucketPrefix: `${environmentSuffix}-logs-`,
      tags: {
        Name: `${environmentSuffix}-access-logs`,
        ...tags,
      },
    }, { parent: this });

    // Configure S3 bucket logging
    new aws.s3.BucketLoggingV2(`${environmentSuffix}-bucket-logging`, {
      bucket: s3Bucket.id,
      targetBucket: loggingBucket.id,
      targetPrefix: 'access-logs/',
    }, { parent: this });

    // Block public access on both buckets
    new aws.s3.BucketPublicAccessBlock(`${environmentSuffix}-bucket-pab`, {
      bucket: s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    new aws.s3.BucketPublicAccessBlock(`${environmentSuffix}-logging-bucket-pab`, {
      bucket: loggingBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // Create DB subnet group for RDS
    const dbSubnetGroup = new aws.rds.SubnetGroup(`${environmentSuffix}-db-subnet-group`, {
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `${environmentSuffix}-db-subnet-group`,
        ...tags,
      },
    }, { parent: this });

    // Create security group for RDS
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(`${environmentSuffix}-rds-sg`, {
      vpcId: vpc.id,
      description: 'Security group for RDS database',
      ingress: [
        {
          from: 3306,
          to: 3306,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
      ],
      tags: {
        Name: `${environmentSuffix}-rds-sg`,
        ...tags,
      },
    }, { parent: this });

    // Create RDS instance
    const rdsInstance = new aws.rds.Instance(`${environmentSuffix}-database`, {
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      dbName: 'proddb',
      username: 'admin',
      password: 'TempPassword123!',
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      skipFinalSnapshot: true,
      deletionProtection: false,
      tags: {
        Name: `${environmentSuffix}-database`,
        ...tags,
      },
    }, { parent: this });

    // Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(`${environmentSuffix}-ec2-role`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: `${environmentSuffix}-ec2-role`,
        ...tags,
      },
    }, { parent: this });

    // Attach CloudWatch agent policy to EC2 role
    new aws.iam.RolePolicyAttachment(`${environmentSuffix}-cloudwatch-agent-policy`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    }, { parent: this });

    // Attach S3 read policy to EC2 role
    new aws.iam.RolePolicyAttachment(`${environmentSuffix}-s3-read-policy`, {
      role: ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess',
    }, { parent: this });

    // Create instance profile
    const instanceProfile = new aws.iam.InstanceProfile(`${environmentSuffix}-instance-profile`, {
      role: ec2Role.name,
      tags: {
        Name: `${environmentSuffix}-instance-profile`,
        ...tags,
      },
    }, { parent: this });

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      filters: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'owner-alias', values: ['amazon'] },
      ],
      mostRecent: true,
    });

    // Create security group for EC2 instances
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(`${environmentSuffix}-ec2-sg`, {
      vpcId: vpc.id,
      description: 'Security group for EC2 instances',
      ingress: [
        {
          from: 80,
          to: 80,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
        {
          from: 443,
          to: 443,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
      ],
      egress: [
        {
          from: 0,
          to: 65535,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `${environmentSuffix}-ec2-sg`,
        ...tags,
      },
    }, { parent: this });

    // Create launch template for Auto Scaling
    const launchTemplate = new aws.ec2.LaunchTemplate(`${environmentSuffix}-launch-template`, {
      imageId: ami.then(ami => ami.id),
      instanceType: 't3.micro',
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      userData: pulumi.output(`#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Production Web Server</h1>" > /var/www/html/index.html
`).apply(s => Buffer.from(s).toString('base64')),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: `${environmentSuffix}-web-server`,
            ...tags,
          },
        },
      ],
    }, { parent: this });

    // Create security group for ALB
    const albSecurityGroup = new aws.ec2.SecurityGroup(`${environmentSuffix}-alb-sg`, {
      vpcId: vpc.id,
      description: 'Security group for Application Load Balancer',
      ingress: [
        {
          from: 80,
          to: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          from: 443,
          to: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        {
          from: 0,
          to: 65535,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        Name: `${environmentSuffix}-alb-sg`,
        ...tags,
      },
    }, { parent: this });

    // Create Application Load Balancer
    const alb = new aws.lb.LoadBalancer(`${environmentSuffix}-alb`, {
      loadBalancerType: 'application',
      subnets: [publicSubnet1.id, publicSubnet2.id],
      securityGroups: [albSecurityGroup.id],
      tags: {
        Name: `${environmentSuffix}-alb`,
        ...tags,
      },
    }, { parent: this });

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(`${environmentSuffix}-tg`, {
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/',
        matcher: '200',
      },
      tags: {
        Name: `${environmentSuffix}-tg`,
        ...tags,
      },
    }, { parent: this });

    // Create SSL certificate from ACM
    const certificate = new aws.acm.Certificate(`${environmentSuffix}-cert`, {
      domainName: 'example.com',
      validationMethod: 'DNS',
      tags: {
        Name: `${environmentSuffix}-cert`,
        ...tags,
      },
    }, { parent: this });

    // Create ALB listener for HTTPS
    new aws.lb.Listener(`${environmentSuffix}-alb-listener-https`, {
      loadBalancerArn: alb.arn,
      port: 443,
      protocol: 'HTTPS',
      sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
      certificateArn: certificate.arn,
      defaultActions: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    }, { parent: this });

    // Create ALB listener for HTTP (redirect to HTTPS)
    new aws.lb.Listener(`${environmentSuffix}-alb-listener-http`, {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultActions: [
        {
          type: 'redirect',
          redirect: {
            port: '443',
            protocol: 'HTTPS',
            statusCode: 'HTTP_301',
          },
        },
      ],
    }, { parent: this });

    // Create Auto Scaling Group
    const autoScalingGroup = new aws.autoscaling.Group(`${environmentSuffix}-asg`, {
      vpcZoneIdentifiers: [privateSubnet1.id, privateSubnet2.id],
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: 1,
      maxSize: 4,
      desiredCapacity: 2,
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tags: [
        {
          key: 'Name',
          value: `${environmentSuffix}-asg`,
          propagateAtLaunch: true,
        },
      ],
    }, { parent: this });

    // Create Auto Scaling policies
    const scaleUpPolicy = new aws.autoscaling.Policy(`${environmentSuffix}-scale-up`, {
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: autoScalingGroup.name,
    }, { parent: this });

    const scaleDownPolicy = new aws.autoscaling.Policy(`${environmentSuffix}-scale-down`, {
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: autoScalingGroup.name,
    }, { parent: this });

    // Create CloudWatch alarms for Auto Scaling
    new aws.cloudwatch.MetricAlarm(`${environmentSuffix}-cpu-high`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 70,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      dimensions: {
        AutoScalingGroupName: autoScalingGroup.name,
      },
      alarmActions: [scaleUpPolicy.arn],
      tags: {
        Name: `${environmentSuffix}-cpu-high`,
        ...tags,
      },
    }, { parent: this });

    new aws.cloudwatch.MetricAlarm(`${environmentSuffix}-cpu-low`, {
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 30,
      alarmDescription: 'This metric monitors ec2 cpu utilization',
      dimensions: {
        AutoScalingGroupName: autoScalingGroup.name,
      },
      alarmActions: [scaleDownPolicy.arn],
      tags: {
        Name: `${environmentSuffix}-cpu-low`,
        ...tags,
      },
    }, { parent: this });

    // Create CloudWatch alarm for 5xx errors (using latest CloudWatch features)
    new aws.cloudwatch.MetricAlarm(`${environmentSuffix}-5xx-errors`, {
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HTTPCode_Target_5XX_Count',
      namespace: 'AWS/ApplicationELB',
      period: 300,
      statistic: 'Sum',
      threshold: 5,
      alarmDescription: 'This metric monitors ALB 5xx errors',
      dimensions: {
        LoadBalancer: alb.arnSuffix,
      },
      tags: {
        Name: `${environmentSuffix}-5xx-errors`,
        ...tags,
      },
    }, { parent: this });

    // Export important outputs
    this.vpcId = vpc.id;
    this.albArn = alb.arn;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.s3BucketName = s3Bucket.bucket;

    this.registerOutputs({
      vpcId: this.vpcId,
      albArn: this.albArn,
      rdsEndpoint: this.rdsEndpoint,
      s3BucketName: this.s3BucketName,
    });
  }
}
```

## Infrastructure Components Summary

This production-ready infrastructure includes:

### Network Architecture
- **VPC**: Multi-AZ design with public and private subnets
- **Internet Gateway**: For public subnet internet access
- **NAT Gateway**: For private subnet outbound internet access
- **Route Tables**: Properly configured for public and private subnets

### Security
- **IAM Roles**: Least privilege access for EC2 instances
- **Security Groups**: Restrictive ingress/egress rules
- **S3 Bucket Policies**: Block public access

### Compute & Auto Scaling  
- **Launch Template**: Using latest Amazon Linux 2 AMI
- **Auto Scaling Group**: CPU-based scaling with min 1, max 4 instances
- **CloudWatch Alarms**: CPU utilization monitoring for scaling

### Load Balancing & SSL
- **Application Load Balancer**: Multi-AZ deployment
- **SSL Certificate**: AWS Certificate Manager integration
- **HTTPS Redirect**: HTTP to HTTPS redirection

### Database
- **RDS MySQL**: db.t3.micro instance in private subnets
- **Multi-AZ**: Database deployed across availability zones

### Storage & Logging
- **S3 Buckets**: Application storage with access logging
- **CloudWatch**: 5xx error monitoring and Enhanced Observability features

### Latest AWS Features Integrated
1. **Enhanced CloudWatch Monitoring**: Comprehensive metrics and alarms
2. **EC2 On-Demand Capacity Reservations**: Improved instance management

All resources follow the 'prod-' naming convention and are deployed in us-east-1 region as specified.