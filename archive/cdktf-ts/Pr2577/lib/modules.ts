import { Construct } from 'constructs';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';

import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

export interface ModulesConfig {
  environment: string;
  project: string;
  enableRds: boolean;
  enableAutoScaling: boolean;
  instanceType: string;
  dbInstanceClass: string;
  dbUsername: string;
  dbPassword: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
}

export class InfrastructureModules extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly webSecurityGroup: SecurityGroup;
  public readonly dbSecurityGroup: SecurityGroup;
  public readonly ec2Role: IamRole;
  public readonly s3Bucket: S3Bucket;
  public readonly loadBalancer: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly autoScalingGroup?: AutoscalingGroup;
  public readonly rdsInstance?: DbInstance;
  public readonly cpuAlarm?: CloudwatchMetricAlarm;
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string, config: ModulesConfig) {
    super(scope, id);

    // Get availability zones for multi-AZ deployment
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // Create sanitized naming convention to avoid AWS naming constraint violations
    const sanitizedProject = config.project
      .replace(/[^a-zA-Z0-9-]/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
      .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
      .toLowerCase();

    // Create short name for resources with length constraints (ALB, Target Groups)
    const shortName = `${sanitizedProject.substring(0, 10)}-${config.environment}`;

    const commonTags = {
      Name: `${sanitizedProject}-${config.environment}`,
      Environment: config.environment,
      Project: config.project,
    };

    // 1. VPC - Custom VPC with DNS support for RDS resolution
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-vpc`,
      },
    });

    // Internet Gateway for public subnet internet access
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-igw`,
      },
    });

    // 2. Public Subnets - Two subnets in different AZs for high availability
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs for ELB
        tags: {
          ...commonTags,
          Name: `${sanitizedProject}-${config.environment}-public-subnet-${i + 1}`,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(subnet);
    }

    // 3. Private Subnets - For RDS instances (no internet access)
    this.privateSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: false, // No public IPs for security
        tags: {
          ...commonTags,
          Name: `${sanitizedProject}-${config.environment}-private-subnet-${i + 1}`,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(subnet);
    }

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-public-rt`,
      },
    });

    // Route to internet gateway for public subnets
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // 4. Security Groups - Implementing least privilege principle

    // Web Security Group - Allow HTTP/HTTPS inbound only
    this.webSecurityGroup = new SecurityGroup(this, 'web-sg', {
      name: `${sanitizedProject}-${config.environment}-web-sg`,
      description: 'Security group for web servers - HTTP/HTTPS only',
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-web-sg`,
      },
    });

    // HTTP inbound rule
    new SecurityGroupRule(this, 'web-sg-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow HTTP traffic from internet',
    });

    // HTTPS inbound rule
    new SecurityGroupRule(this, 'web-sg-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow HTTPS traffic from internet',
    });

    // Allow all outbound traffic for updates and S3 access
    new SecurityGroupRule(this, 'web-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Database Security Group - Only allow access from web servers
    this.dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `${sanitizedProject}-${config.environment}-db-sg`,
      description:
        'Security group for RDS - Allow access only from web servers',
      vpcId: this.vpc.id,
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-db-sg`,
      },
    });

    // MySQL/Aurora port 3306 - only from web security group
    new SecurityGroupRule(this, 'db-sg-mysql', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.dbSecurityGroup.id,
      description: 'Allow MySQL access from web servers only',
    });

    // 5. KMS Key for S3 encryption
    this.kmsKey = new KmsKey(this, 'kms-key', {
      description: 'KMS key for S3 bucket encryption',
      keyUsage: 'ENCRYPT_DECRYPT',
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-kms-key`,
      },
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/${sanitizedProject}-${config.environment}-s3-key`,
      targetKeyId: this.kmsKey.keyId,
    });

    // 6. IAM Role for EC2 instances - S3 access with least privilege
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${sanitizedProject}-${config.environment}-ec2-role`,
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
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-ec2-role`,
      },
    });

    // 7. S3 Bucket with KMS encryption and public access blocked
    this.s3Bucket = new S3Bucket(this, 's3-bucket', {
      bucket: `${sanitizedProject}-${config.environment.toLowerCase()}-${Date.now()}`,
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-s3-bucket`,
      },
    });

    // S3 access policy - restricted to specific bucket (reference after bucket creation)
    new IamRolePolicy(this, 'ec2-s3-policy', {
      name: `${sanitizedProject}-${config.environment}-s3-policy`,
      role: this.ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [this.s3Bucket.arn, `${this.s3Bucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Resource: this.kmsKey.arn,
          },
        ],
      }),
    });

    // Instance profile for EC2
    const instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${sanitizedProject}-${config.environment}-instance-profile`,
        role: this.ec2Role.name,
      }
    );

    // Server-side encryption with KMS
    new S3BucketServerSideEncryptionConfigurationA(this, 's3-encryption', {
      bucket: this.s3Bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: this.kmsKey.arn,
            sseAlgorithm: 'aws:kms',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block all public access to S3 bucket
    new S3BucketPublicAccessBlock(this, 's3-public-block', {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // 8. Application Load Balancer - Using shortened name to meet 32 character limit
    this.loadBalancer = new Lb(this, 'alb', {
      name: `${shortName}-alb`.substring(0, 32), // Ensure ALB name is ≤ 32 chars
      loadBalancerType: 'application',
      subnets: this.publicSubnets.map(subnet => subnet.id),
      securityGroups: [this.webSecurityGroup.id],
      enableDeletionProtection: false, // Set to true in production
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-alb`,
      },
    });

    // Target Group for ALB - Using shortened name to meet 32 character limit
    this.targetGroup = new LbTargetGroup(this, 'tg', {
      name: `${shortName}-tg`.substring(0, 32), // Ensure TG name is ≤ 32 chars
      port: 80,
      protocol: 'HTTP',
      vpcId: this.vpc.id,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        path: '/',
        matcher: '200',
        protocol: 'HTTP',
        port: 'traffic-port',
      },
      tags: {
        ...commonTags,
        Name: `${sanitizedProject}-${config.environment}-tg`,
      },
    });

    // ALB Listener
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: this.loadBalancer.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });

    // 9. Launch Template for Auto Scaling Group
    const launchTemplate = new LaunchTemplate(this, 'lt', {
      name: `${sanitizedProject}-${config.environment}-lt`,
      imageId: ami.id,
      instanceType: config.instanceType,
      keyName: undefined, // Add key pair name if needed for SSH access
      vpcSecurityGroupIds: [this.webSecurityGroup.id],
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      monitoring: {
        enabled: true, // Enable detailed monitoring
      },
      userData: Buffer.from(
        `#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Hello from ${config.environment} Environment</h1>" > /var/www/html/index.html
        # Install CloudWatch agent for detailed monitoring
        wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
        rpm -U ./amazon-cloudwatch-agent.rpm
      `
      ).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...commonTags,
            Name: `${sanitizedProject}-${config.environment}-instance`,
          },
        },
      ],
    });

    // 10. Auto Scaling Group (conditional deployment)
    if (config.enableAutoScaling) {
      this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
        name: `${sanitizedProject}-${config.environment}-asg`,
        minSize: config.minSize,
        maxSize: config.maxSize,
        desiredCapacity: config.desiredCapacity,
        vpcZoneIdentifier: this.publicSubnets.map(subnet => subnet.id),
        targetGroupArns: [this.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: launchTemplate.id,
          version: '$Latest',
        },
        tag: [
          {
            key: 'Name',
            value: `${sanitizedProject}-${config.environment}-asg`,
            propagateAtLaunch: true,
          },
          {
            key: 'Environment',
            value: config.environment,
            propagateAtLaunch: true,
          },
          {
            key: 'Project',
            value: config.project,
            propagateAtLaunch: true,
          },
        ],
      });

      // Auto Scaling Policy - Scale Up
      const scaleUpPolicy = new AutoscalingPolicy(this, 'scale-up-policy', {
        name: `${sanitizedProject}-${config.environment}-scale-up`,
        scalingAdjustment: 1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'SimpleScaling',
      });

      // Auto Scaling Policy - Scale Down
      const scaleDownPolicy = new AutoscalingPolicy(this, 'scale-down-policy', {
        name: `${sanitizedProject}-${config.environment}-scale-down`,
        scalingAdjustment: -1,
        adjustmentType: 'ChangeInCapacity',
        cooldown: 300,
        autoscalingGroupName: this.autoScalingGroup.name,
        policyType: 'SimpleScaling',
      });

      // 11. CloudWatch Alarms for Auto Scaling
      this.cpuAlarm = new CloudwatchMetricAlarm(this, 'cpu-high-alarm', {
        alarmName: `${sanitizedProject}-${config.environment}-cpu-high`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'This metric monitors ec2 cpu utilization',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        alarmActions: [scaleUpPolicy.arn],
        tags: {
          ...commonTags,
          Name: `${sanitizedProject}-${config.environment}-cpu-high-alarm`,
        },
      });

      // CPU Low Alarm for scaling down
      new CloudwatchMetricAlarm(this, 'cpu-low-alarm', {
        alarmName: `${sanitizedProject}-${config.environment}-cpu-low`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 120,
        statistic: 'Average',
        threshold: 20,
        alarmDescription:
          'This metric monitors ec2 cpu utilization for scale down',
        dimensions: {
          AutoScalingGroupName: this.autoScalingGroup.name,
        },
        alarmActions: [scaleDownPolicy.arn],
        tags: {
          ...commonTags,
          Name: `${sanitizedProject}-${config.environment}-cpu-low-alarm`,
        },
      });
    }

    // 12. RDS Instance (conditional deployment)
    if (config.enableRds) {
      // DB Subnet Group for RDS
      const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
        name: `${sanitizedProject}-${config.environment}-db-subnet-group`,
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        tags: {
          ...commonTags,
          Name: `${sanitizedProject}-${config.environment}-db-subnet-group`,
        },
      });

      // RDS Instance - MySQL in private subnets
      // Fix: Remove consecutive hyphens from RDS identifier
      const rdsIdentifier = `${sanitizedProject}-${config.environment}-db`;

      this.rdsInstance = new DbInstance(this, 'rds', {
        identifier: rdsIdentifier,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true, // Encrypt storage at rest
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: config.dbInstanceClass,
        dbName: 'appdb',
        username: config.dbUsername,
        password: config.dbPassword,
        vpcSecurityGroupIds: [this.dbSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        skipFinalSnapshot: true, // Set to false in production
        deletionProtection: false, // Set to true in production
        publiclyAccessible: false, // Critical: No public access
        multiAz: false, // Set to true for production
        monitoringInterval: 0,
        tags: {
          ...commonTags,
          Name: `${sanitizedProject}-${config.environment}-rds`,
        },
      });
    }
  }
}
