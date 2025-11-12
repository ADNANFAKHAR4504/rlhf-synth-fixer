## modules.ts

```typescript
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
```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { InfrastructureModules, ModulesConfig } from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Configuration for the infrastructure
    // These values can be parameterized through environment variables or config files
    const config: ModulesConfig = {
      environment: process.env.ENVIRONMENT || 'dev',
      project: 'IaC - AWS Nova Model Breaking',

      // Conditional deployment flags - can be controlled via environment variables
      enableRds: process.env.ENABLE_RDS === 'true' || true, // Default to true
      enableAutoScaling: process.env.ENABLE_ASG === 'true' || true, // Default to true

      // EC2 Configuration
      instanceType: process.env.INSTANCE_TYPE || 't3.micro', // Cost-effective for dev/test

      // RDS Configuration
      dbInstanceClass: process.env.DB_INSTANCE_CLASS || 'db.t3.micro',
      dbUsername: process.env.DB_USERNAME || 'admin',
      dbPassword: process.env.DB_PASSWORD || 'changeme123!', // Use AWS Secrets Manager in production

      // Auto Scaling Configuration
      minSize: parseInt(process.env.MIN_SIZE || '1'),
      maxSize: parseInt(process.env.MAX_SIZE || '3'),
      desiredCapacity: parseInt(process.env.DESIRED_CAPACITY || '2'),
    };

    // Validate configuration
    this.validateConfig(config);

    // Deploy the infrastructure modules
    const infrastructure = new InfrastructureModules(
      this,
      'infrastructure',
      config
    );

    // Outputs for external consumption and operational visibility
    // These outputs provide essential information for connecting to and managing the infrastructure

    // VPC Information
    new TerraformOutput(this, 'vpc-id', {
      value: infrastructure.vpc.id,
      description: 'ID of the VPC',
      sensitive: false,
    });

    new TerraformOutput(this, 'vpc-cidr', {
      value: infrastructure.vpc.cidrBlock,
      description: 'CIDR block of the VPC',
      sensitive: false,
    });

    // Load Balancer Information
    new TerraformOutput(this, 'load-balancer-dns', {
      value: infrastructure.loadBalancer.dnsName,
      description: 'DNS name of the Application Load Balancer',
      sensitive: false,
    });

    new TerraformOutput(this, 'load-balancer-zone-id', {
      value: infrastructure.loadBalancer.zoneId,
      description: 'Hosted zone ID of the load balancer',
      sensitive: false,
    });

    // Auto Scaling Group Information (conditional output)
    if (config.enableAutoScaling && infrastructure.autoScalingGroup) {
      new TerraformOutput(this, 'autoscaling-group-name', {
        value: infrastructure.autoScalingGroup.name,
        description: 'Name of the Auto Scaling Group',
        sensitive: false,
      });

      new TerraformOutput(this, 'autoscaling-group-arn', {
        value: infrastructure.autoScalingGroup.arn,
        description: 'ARN of the Auto Scaling Group',
        sensitive: false,
      });
    }

    // RDS Information (conditional output)
    if (config.enableRds && infrastructure.rdsInstance) {
      new TerraformOutput(this, 'rds-endpoint', {
        value: infrastructure.rdsInstance.endpoint,
        description: 'RDS instance endpoint',
        sensitive: false, // Endpoint is not sensitive, but connection details are
      });

      new TerraformOutput(this, 'rds-port', {
        value: infrastructure.rdsInstance.port.toString(),
        description: 'RDS instance port',
        sensitive: false,
      });

      // Note: Database credentials should be managed through AWS Secrets Manager
      // and not exposed as outputs in production environments
    }

    // S3 Bucket Information
    new TerraformOutput(this, 's3-bucket-name', {
      value: infrastructure.s3Bucket.bucket,
      description: 'Name of the S3 bucket',
      sensitive: false,
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: infrastructure.s3Bucket.arn,
      description: 'ARN of the S3 bucket',
      sensitive: false,
    });

    // KMS Key Information
    new TerraformOutput(this, 'kms-key-id', {
      value: infrastructure.kmsKey.keyId,
      description: 'ID of the KMS key used for S3 encryption',
      sensitive: false,
    });

    // CloudWatch Alarm Information (conditional output)
    if (config.enableAutoScaling && infrastructure.cpuAlarm) {
      new TerraformOutput(this, 'cpu-alarm-arn', {
        value: infrastructure.cpuAlarm.arn,
        description: 'ARN of the CPU utilization CloudWatch alarm',
        sensitive: false,
      });
    }

    // Security Group Information for troubleshooting and integration
    new TerraformOutput(this, 'web-security-group-id', {
      value: infrastructure.webSecurityGroup.id,
      description: 'ID of the web security group',
      sensitive: false,
    });

    new TerraformOutput(this, 'db-security-group-id', {
      value: infrastructure.dbSecurityGroup.id,
      description: 'ID of the database security group',
      sensitive: false,
    });

    // Subnet Information for potential future integrations
    new TerraformOutput(this, 'public-subnet-ids', {
      value: infrastructure.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
      sensitive: false,
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: infrastructure.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
      sensitive: false,
    });

    // IAM Role Information
    new TerraformOutput(this, 'ec2-role-arn', {
      value: infrastructure.ec2Role.arn,
      description: 'ARN of the EC2 IAM role',
      sensitive: false,
    });
  }

  /**
   * Validates the configuration to ensure all required values are present and valid
   * This helps catch configuration errors early in the deployment process
   */
  private validateConfig(config: ModulesConfig): void {
    const errors: string[] = [];

    // Validate environment
    if (!config.environment || config.environment.trim() === '') {
      errors.push('Environment must be specified');
    }

    // Validate project name
    if (!config.project || config.project.trim() === '') {
      errors.push('Project name must be specified');
    }

    // Validate instance type
    const validInstanceTypes = [
      't3.micro',
      't3.small',
      't3.medium',
      't3.large',
      'm5.large',
      'm5.xlarge',
    ];
    if (!validInstanceTypes.includes(config.instanceType)) {
      console.warn(
        `Instance type ${config.instanceType} may not be optimal. Consider using: ${validInstanceTypes.join(', ')}`
      );
    }

    // Validate Auto Scaling configuration
    if (config.enableAutoScaling) {
      if (config.minSize < 1) {
        errors.push('Minimum size must be at least 1');
      }
      if (config.maxSize < config.minSize) {
        errors.push(
          'Maximum size must be greater than or equal to minimum size'
        );
      }
      if (
        config.desiredCapacity < config.minSize ||
        config.desiredCapacity > config.maxSize
      ) {
        errors.push(
          'Desired capacity must be between minimum and maximum size'
        );
      }
    }

    // Validate RDS configuration
    if (config.enableRds) {
      if (!config.dbUsername || config.dbUsername.length < 1) {
        errors.push('Database username must be specified when RDS is enabled');
      }
      if (!config.dbPassword || config.dbPassword.length < 8) {
        errors.push(
          'Database password must be at least 8 characters when RDS is enabled'
        );
      }

      // Warn about using default password
      if (config.dbPassword === 'changeme123!') {
        console.warn(
          'WARNING: Using default database password. Please change this for production deployments and consider using AWS Secrets Manager.'
        );
      }
    }

    // Throw error if any validation failures
    if (errors.length > 0) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }

    // Log configuration summary
    console.log('Configuration Summary:');
    console.log(`- Environment: ${config.environment}`);
    console.log(`- Project: ${config.project}`);
    console.log(`- RDS Enabled: ${config.enableRds}`);
    console.log(`- Auto Scaling Enabled: ${config.enableAutoScaling}`);
    console.log(`- Instance Type: ${config.instanceType}`);
    if (config.enableAutoScaling) {
      console.log(
        `- ASG Size: ${config.minSize}-${config.maxSize} (desired: ${config.desiredCapacity})`
      );
    }
    if (config.enableRds) {
      console.log(`- DB Instance Class: ${config.dbInstanceClass}`);
    }
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```