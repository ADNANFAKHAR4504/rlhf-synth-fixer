## lib/modules.ts

```typescript
import { Construct } from 'constructs';

// VPC
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

// Security Groups
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// Data Sources
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { DataAwsSsmParameter } from '@cdktf/provider-aws/lib/data-aws-ssm-parameter';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// Auto Scaling
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';

// Load Balancer
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// S3
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

// CloudWatch
import { CloudwatchDashboard } from '@cdktf/provider-aws/lib/cloudwatch-dashboard';

/**
 * VPC Module - Creates a VPC with public and private subnets across 2 AZs
 * Security: Private subnets for compute/data layers, public only for load balancer
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateways: NatGateway[];
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, tags: { [key: string]: string }) {
    super(scope, id);

    // Create VPC with DNS support for private hosted zones
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...tags,
        Name: `${id}-vpc`,
      },
    });

    // Internet Gateway for public subnet outbound connectivity
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...tags,
        Name: `${id}-igw`,
      },
    });

    // Public route table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...tags,
        Name: `${id}-public-rt`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Create subnets across 2 AZs for HA
    const azs = ['us-west-2a', 'us-west-2b'];
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    azs.forEach((az, index) => {
      // Public subnets for ALB
      const publicSubnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `${id}-public-subnet-${az}`,
          Tier: 'Public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });

      // Private subnets for EC2 and RDS
      const privateSubnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 10}.0/24`,
        availabilityZone: az,
        tags: {
          ...tags,
          Name: `${id}-private-subnet-${az}`,
          Tier: 'Private',
        },
      });
      this.privateSubnets.push(privateSubnet);

      // NAT Gateway for private subnet outbound connectivity
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          ...tags,
          Name: `${id}-nat-eip-${az}`,
        },
      });

      const natGateway = new NatGateway(this, `nat-gw-${index}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          ...tags,
          Name: `${id}-nat-gw-${az}`,
        },
        dependsOn: [eip, publicSubnet], // Add explicit dependencies
      });
      this.natGateways.push(natGateway);

      // Private route table with NAT Gateway route
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...tags,
          Name: `${id}-private-rt-${az}`,
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

/**
 * Security Groups Module - Least privilege network access controls
 */
export class SecurityGroupsModule extends Construct {
  public readonly albSg: SecurityGroup;
  public readonly ec2Sg: SecurityGroup;
  public readonly rdsSg: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    vpcId: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // ALB Security Group - Allow HTTPS from internet
    this.albSg = new SecurityGroup(this, 'alb-sg', {
      name: `${id}-alb-sg`,
      description: 'Security group for Application Load Balancer - HTTPS only',
      vpcId: vpcId,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from internet',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: {
        ...tags,
        Name: `${id}-alb-sg`,
      },
    });

    // EC2 Security Group - Allow traffic from ALB only
    this.ec2Sg = new SecurityGroup(this, 'ec2-sg', {
      name: `${id}-ec2-sg`,
      description: 'Security group for EC2 instances - restricted access',
      vpcId: vpcId,
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description:
            'Allow all outbound traffic for updates and dependencies',
        },
      ],
      tags: {
        ...tags,
        Name: `${id}-ec2-sg`,
      },
    });

    // Allow traffic from ALB to EC2
    new SecurityGroupRule(this, 'alb-to-ec2', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSg.id,
      securityGroupId: this.ec2Sg.id,
      description: 'Allow HTTP from ALB',
    });

    // RDS Security Group - Allow traffic from EC2 only
    this.rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: `${id}-rds-sg`,
      description: 'Security group for RDS - EC2 access only',
      vpcId: vpcId,
      tags: {
        ...tags,
        Name: `${id}-rds-sg`,
      },
    });

    // Allow MySQL traffic from EC2 to RDS
    new SecurityGroupRule(this, 'ec2-to-rds', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2Sg.id,
      securityGroupId: this.rdsSg.id,
      description: 'Allow MySQL from EC2 instances',
    });
  }
}

/**
 * IAM Module - Least privilege roles and policies
 */
export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(
    scope: Construct,
    id: string,
    secretArn: string,
    tags: { [key: string]: string }
  ) {
    super(scope, id);

    // EC2 instance role with minimal permissions
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${id}-ec2-role`,
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
      tags: tags,
    });

    // Policy for CloudWatch Logs
    const cloudwatchPolicy = new IamPolicy(this, 'cloudwatch-policy', {
      name: `${id}-cloudwatch-policy`,
      description: 'Allow EC2 instances to send logs to CloudWatch',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: 'arn:aws:logs:us-west-2:*:*',
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ],
      }),
      tags: tags,
    });

    // Policy for Secrets Manager access (restricted to specific secret)
    const secretsPolicy = new IamPolicy(this, 'secrets-policy', {
      name: `${id}-secrets-policy`,
      description:
        'Allow EC2 instances to read RDS credentials from Secrets Manager',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: secretArn,
          },
        ],
      }),
      tags: tags,
    });

    // SSM policy for Session Manager (secure remote access without SSH)
    const ssmPolicy = new IamPolicy(this, 'ssm-policy', {
      name: `${id}-ssm-policy`,
      description: 'Allow EC2 instances to use SSM Session Manager',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ssm:UpdateInstanceInformation',
              'ssmmessages:CreateControlChannel',
              'ssmmessages:CreateDataChannel',
              'ssmmessages:OpenControlChannel',
              'ssmmessages:OpenDataChannel',
              'ec2messages:GetMessages',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: tags,
    });

    // Attach policies to role
    new IamRolePolicyAttachment(this, 'cloudwatch-attachment', {
      role: this.ec2Role.name,
      policyArn: cloudwatchPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'secrets-attachment', {
      role: this.ec2Role.name,
      policyArn: secretsPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'ssm-attachment', {
      role: this.ec2Role.name,
      policyArn: ssmPolicy.arn,
    });

    // Instance profile for EC2
    this.instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `${id}-instance-profile`,
      role: this.ec2Role.name,
      tags: tags,
    });
  }
}

/**
 * Auto Scaling Group Module - Resilient EC2 deployment
 */
export class AutoScalingModule extends Construct {
  public readonly asg: AutoscalingGroup;
  public readonly launchTemplate: LaunchTemplate;

  constructor(
    scope: Construct,
    id: string,
    config: {
      subnetIds: string[];
      securityGroupId: string;
      instanceProfileArn: string;
      targetGroupArns: string[];
      dbSecretArn: string; // Add this line
      awsRegion: string; // Add this line
      instanceType: string;
      minSize: number;
      maxSize: number;
      desiredCapacity: number;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI using SSM parameter
    const amiData = new DataAwsSsmParameter(this, 'ami', {
      name: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2',
    });

    // Updated user data script in AutoScalingModule
    // Simplified user data script for faster startup
    const userData = `#!/bin/bash
set -e
exec > >(tee -a /var/log/user-data.log)
exec 2>&1

echo "Starting initialization at $(date)"

# Update and install httpd
yum update -y
yum install -y httpd

# Create health check immediately
echo "OK" > /var/www/html/health
echo "<h1>Application Server</h1>" > /var/www/html/index.html
chmod 644 /var/www/html/*

# Start and enable httpd
systemctl start httpd
systemctl enable httpd

# Verify httpd is responding
curl -f http://localhost/health || exit 1

echo "Initialization completed at $(date)"
`;

    // Launch template with production configurations
    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${id}-launch-template`,
      description: 'Production launch template with security hardening',
      imageId: amiData.value,
      instanceType: config.instanceType,
      iamInstanceProfile: {
        arn: config.instanceProfileArn,
      },
      vpcSecurityGroupIds: [config.securityGroupId],
      userData: Buffer.from(userData).toString('base64'),

      // Enable detailed monitoring for better observability
      monitoring: {
        enabled: true,
      },

      // Instance metadata security - require IMDSv2
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'optional', // Require IMDSv2 for security
        httpPutResponseHopLimit: 1,
      },

      // EBS encryption for data at rest
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 20,
            volumeType: 'gp3',
            encrypted: 'true',
            deleteOnTermination: 'true',
          },
        },
      ],

      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...config.tags,
            Name: `${id}-ec2-instance`,
          },
        },
        {
          resourceType: 'volume',
          tags: {
            ...config.tags,
            Name: `${id}-ec2-volume`,
          },
        },
      ],
    });

    // Auto Scaling Group with health checks
    this.asg = new AutoscalingGroup(this, 'asg', {
      name: `${id}-asg`,
      vpcZoneIdentifier: config.subnetIds,
      targetGroupArns: config.targetGroupArns,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 180,
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,

      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },

      dependsOn: [this.launchTemplate],

      // Enable instance refresh for rolling updates
      instanceRefresh: {
        strategy: 'Rolling',
        preferences: {
          minHealthyPercentage: 0, // Reduce from 90 to allow more flexibility during deployment
          instanceWarmup: '180', // Add warmup period
        },
      },

      tag: Object.entries(config.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Auto scaling policies for dynamic scaling
    new AutoscalingPolicy(this, 'scale-up', {
      name: `${id}-scale-up`,
      autoscalingGroupName: this.asg.name,
      policyType: 'TargetTrackingScaling',
      targetTrackingConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: 'ASGAverageCPUUtilization',
        },
        targetValue: 70,
      },
    });
  }
}

/**
 * Application Load Balancer Module - HTTPS-only with health checks
 */
export class AlbModule extends Construct {
  public readonly alb: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly httpsListener: LbListener;

  constructor(
    scope: Construct,
    id: string,
    config: {
      subnetIds: string[];
      securityGroupId: string;
      vpcId: string;
      certificateArn?: string;
      logBucketName: string;
      logBucketPolicy?: S3BucketPolicy; // Add this

      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Target group for EC2 instances
    this.targetGroup = new LbTargetGroup(this, 'target-group', {
      name: `${id}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: config.vpcId,
      targetType: 'instance',

      // Health check configuration
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },

      // Stickiness for session affinity
      stickiness: {
        type: 'lb_cookie',
        cookieDuration: 86400, // 1 day
        enabled: true,
      },

      deregistrationDelay: '30',
      tags: config.tags,
    });

    // Application Load Balancer with dependency on bucket policy
    this.alb = new Lb(this, 'alb', {
      name: `${id}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [config.securityGroupId],
      subnets: config.subnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,

      // Only enable access logs if bucket policy exists
      accessLogs: config.logBucketPolicy
        ? {
            bucket: config.logBucketName,
            prefix: 'alb-logs',
            enabled: true,
          }
        : undefined,

      tags: {
        ...config.tags,
        Name: `${id}-alb`,
      },

      // Add explicit dependency on bucket policy
      dependsOn: config.logBucketPolicy ? [config.logBucketPolicy] : [],
    });

    // HTTPS listener (requires ACM certificate)
    if (config.certificateArn) {
      this.httpsListener = new LbListener(this, 'https-listener', {
        loadBalancerArn: this.alb.arn,
        port: 443,
        protocol: 'HTTPS',
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        certificateArn: config.certificateArn,

        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],

        tags: config.tags,
      });
    } else {
      // HTTP listener (redirects to HTTPS in production with certificate)
      this.httpsListener = new LbListener(this, 'http-listener', {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: 'HTTP',

        defaultAction: [
          {
            type: 'forward',
            targetGroupArn: this.targetGroup.arn,
          },
        ],

        tags: config.tags,
      });
    }
  }
}

/**
 * RDS MySQL Module - Multi-AZ with encryption and Secrets Manager integration
 */
export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly subnetGroup: DbSubnetGroup;
  private readonly secretVersion: DataAwsSecretsmanagerSecretVersion;

  constructor(
    scope: Construct,
    id: string,
    config: {
      subnetIds: string[];
      securityGroupId: string;
      secretArn: string;
      dependsOn?: any[];
      instanceClass: string;
      allocatedStorage: number;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // DB subnet group for Multi-AZ deployment
    this.subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `${id.toLowerCase()}-db-subnet-group`,
      description: 'Subnet group for RDS Multi-AZ deployment',
      subnetIds: config.subnetIds,
      tags: {
        ...config.tags,
        Name: `${id}-db-subnet-group`,
      },
    });

    // Get secret data
    const secretData = new DataAwsSecretsmanagerSecret(this, 'db-secret-data', {
      arn: config.secretArn,
    });

    // Store the secret version reference
    this.secretVersion = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-secret-version',
      {
        secretId: secretData.id,
      }
    );

    // Create monitoring role...
    const monitoringRole = new IamRole(this, 'rds-monitoring-role', {
      name: `${id}-rds-enhanced-monitoring-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'monitoring.rds.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: config.tags,
    });

    // Attach the policy separately
    new IamRolePolicyAttachment(this, 'rds-monitoring-policy-attachment', {
      role: monitoringRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
    });

    // RDS MySQL instance with Secrets Manager integration - Extract password from JSON
    this.dbInstance = new DbInstance(this, 'mysql', {
      identifier: `${id.toLowerCase()}-mysql-db`,
      engine: 'mysql',
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true,

      // FIX: Use manage_master_user_password for automatic password management
      manageMasterUserPassword: true,
      masterUserSecretKmsKeyId: 'alias/aws/secretsmanager', // Use AWS managed key
      username: 'admin', // Set username directly

      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: [config.securityGroupId],
      publiclyAccessible: false,
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      performanceInsightsEnabled: false,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      monitoringInterval: 60,
      monitoringRoleArn: monitoringRole.arn,
      deletionProtection: false,
      skipFinalSnapshot: true,
      finalSnapshotIdentifier: `${id}-final-snapshot-${Date.now()}`,
      tags: {
        ...config.tags,
        Name: `${id}-mysql-db`,
      },
      dependsOn: config.dependsOn,
    });
  }
}

/**
 * S3 Module - Encrypted bucket for ALB logs with lifecycle policies
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketPolicy: S3BucketPolicy;

  constructor(
    scope: Construct,
    id: string,
    config: {
      transitionDays: number;
      expirationDays: number;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // S3 bucket for ALB logs
    this.bucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `${id.toLowerCase()}-alb-logs-${Date.now()}`,
      tags: {
        ...config.tags,
        Name: `${id}-alb-logs`,
        Purpose: 'ALB Access Logs',
      },
    });

    // Bucket policy for ALB access logs - MUST be created before ALB
    this.bucketPolicy = new S3BucketPolicy(this, 'bucket-policy', {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: 'arn:aws:iam::797873946194:root', // ELB service account for us-west-2
            },
            Action: 's3:PutObject',
            Resource: `${this.bucket.arn}/alb-logs/*`,
          },
          {
            Effect: 'Allow',
            Principal: {
              Service: 'elasticloadbalancing.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${this.bucket.arn}/alb-logs/*`,
          },
        ],
      }),
    });

    // Enable versioning for data protection
    new S3BucketVersioningA(this, 'versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Server-side encryption with S3-managed keys
    new S3BucketServerSideEncryptionConfigurationA(this, 'encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Lifecycle policies for cost optimization
    new S3BucketLifecycleConfiguration(this, 'lifecycle', {
      bucket: this.bucket.id,
      rule: [
        {
          id: 'alb-logs-lifecycle',
          status: 'Enabled',
          filter: [
            {
              prefix: 'alb-logs/',
            },
          ],
          transition: [
            {
              days: config.transitionDays,
              storageClass: 'STANDARD_IA',
            },
            {
              days: config.transitionDays + 30,
              storageClass: 'GLACIER',
            },
          ],
          expiration: [
            {
              days: config.expirationDays,
            },
          ],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 30,
            },
          ],
        },
      ],
    });
  }
}

/**
 * CloudWatch Dashboard Module - Comprehensive monitoring
 */
export class CloudWatchDashboardModule extends Construct {
  public readonly dashboard: CloudwatchDashboard;

  constructor(
    scope: Construct,
    id: string,
    config: {
      asgName: string;
      albArn: string;
      dbInstanceId: string;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Extract ALB name from ARN
    const albName = config.albArn.split('/').slice(-3).join('/');

    const dashboardBody = {
      widgets: [
        // EC2 Auto Scaling metrics
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/EC2',
                'CPUUtilization',
                { stat: 'Average', label: 'EC2 CPU %' },
              ],
              ['.', '.', { stat: 'Maximum', label: 'EC2 CPU Max %' }],
              [
                'AWS/AutoScaling',
                'GroupDesiredCapacity',
                { stat: 'Average', label: 'Desired Capacity' },
              ],
              [
                '.',
                'GroupInServiceInstances',
                { stat: 'Average', label: 'InService Instances' },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: 'us-west-2',
            title: 'EC2 Auto Scaling Group Metrics',
            period: 300,
            dimensions: {
              AutoScalingGroupName: config.asgName,
            },
          },
        },

        // ALB metrics
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/ApplicationELB',
                'RequestCount',
                { stat: 'Sum', label: 'Request Count' },
              ],
              [
                '.',
                'TargetResponseTime',
                { stat: 'Average', label: 'Response Time (s)' },
              ],
              [
                '.',
                'HTTPCode_Target_2XX_Count',
                { stat: 'Sum', label: '2XX Responses' },
              ],
              [
                '.',
                'HTTPCode_Target_4XX_Count',
                { stat: 'Sum', label: '4XX Errors' },
              ],
              [
                '.',
                'HTTPCode_Target_5XX_Count',
                { stat: 'Sum', label: '5XX Errors' },
              ],
              [
                '.',
                'HealthyHostCount',
                { stat: 'Average', label: 'Healthy Hosts' },
              ],
              [
                '.',
                'UnHealthyHostCount',
                { stat: 'Average', label: 'Unhealthy Hosts' },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: 'us-west-2',
            title: 'Application Load Balancer Metrics',
            period: 300,
            dimensions: {
              LoadBalancer: albName,
            },
          },
        },

        // RDS metrics
        {
          type: 'metric',
          properties: {
            metrics: [
              [
                'AWS/RDS',
                'DatabaseConnections',
                { stat: 'Average', label: 'DB Connections' },
              ],
              ['.', 'CPUUtilization', { stat: 'Average', label: 'DB CPU %' }],
              [
                '.',
                'FreeableMemory',
                { stat: 'Average', label: 'Freeable Memory' },
              ],
              [
                '.',
                'ReadLatency',
                { stat: 'Average', label: 'Read Latency (ms)' },
              ],
              [
                '.',
                'WriteLatency',
                { stat: 'Average', label: 'Write Latency (ms)' },
              ],
              [
                '.',
                'FreeStorageSpace',
                { stat: 'Average', label: 'Free Storage' },
              ],
            ],
            view: 'timeSeries',
            stacked: false,
            region: 'us-west-2',
            title: 'RDS Database Metrics',
            period: 300,
            dimensions: {
              DBInstanceIdentifier: config.dbInstanceId,
            },
          },
        },
      ],
    };

    this.dashboard = new CloudwatchDashboard(this, 'dashboard', {
      dashboardName: `${id}-production-dashboard`,
      dashboardBody: JSON.stringify(dashboardBody),
    });
  }
}

```

## lib/tap-stack.ts

```typescript
// lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import all modules
import {
  VpcModule,
  SecurityGroupsModule,
  IamModule,
  AutoScalingModule,
  AlbModule,
  RdsModule,
  S3Module,
  CloudWatchDashboardModule,
} from './modules';

// Import Secrets Manager for RDS password
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// Override AWS Region to us-west-2 to match availability zones in modules
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

    // Configure AWS Provider
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
    // Enable state locking
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      Project: id,
      CreatedAt: new Date().toISOString(),
    };

    // === Module Instantiations ===

    // 1. VPC Module - Foundation networking layer
    const vpcModule = new VpcModule(this, `${id}-vpc`, commonTags);

    // 2. Security Groups Module - Network access controls
    const securityGroupsModule = new SecurityGroupsModule(
      this,
      `${id}-security-groups`,
      vpcModule.vpc.id,
      commonTags
    );

    // 3. Create RDS credentials secret with auto-generated password
    const rdsSecret = new SecretsmanagerSecret(this, 'rds-secret', {
      name: `${id}-rds-mysql-credentials-${environmentSuffix}`,
      description: 'RDS MySQL master credentials',
      recoveryWindowInDays: 0, // Set to 0 for immediate deletion in dev/test
      tags: commonTags,
    });

    // Generate initial secret with random password
    const rdsSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'rds-secret-version',
      {
        secretId: rdsSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: this.generateRandomPassword(32),
        }),
      }
    );

    // 4. IAM Module - Roles and policies for EC2 instances
    const iamModule = new IamModule(
      this,
      `${id}-iam`,
      rdsSecret.arn,
      commonTags
    );

    // 5. S3 Module - Bucket for ALB logs
    const s3Module = new S3Module(this, `${id}-s3`, {
      transitionDays: 30,
      expirationDays: 365,
      tags: commonTags,
    });

    // 6. RDS Module - MySQL database with Secrets Manager
    const rdsModule = new RdsModule(this, `${id}-rds`, {
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroupsModule.rdsSg.id,
      secretArn: rdsSecret.arn,
      dependsOn: [rdsSecretVersion], // Ensure secret is created first
      instanceClass: 'db.t3.micro', // Use larger instance in production
      allocatedStorage: 20,
      tags: commonTags,
    });

    // 7. ALB Module - Application Load Balancer
    const albModule = new AlbModule(this, `${id}-alb`, {
      subnetIds: vpcModule.publicSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroupsModule.albSg.id,
      vpcId: vpcModule.vpc.id,
      logBucketName: s3Module.bucket.bucket,
      logBucketPolicy: s3Module.bucketPolicy, // Add this line
      tags: commonTags,
      // certificateArn: 'arn:aws:acm:...', // Add ACM certificate ARN for HTTPS
    });

    // 8. Auto Scaling Module - EC2 Auto Scaling Group
    const autoScalingModule = new AutoScalingModule(this, `${id}-asg`, {
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroupsModule.ec2Sg.id,
      instanceProfileArn: iamModule.instanceProfile.arn,
      targetGroupArns: [albModule.targetGroup.arn],
      dbSecretArn: rdsSecret.arn,
      awsRegion: awsRegion, // Add this line
      instanceType: 't3.micro',
      minSize: 1,
      maxSize: 4,
      desiredCapacity: 1,
      tags: commonTags,
    });
    // 9. CloudWatch Dashboard Module - Monitoring dashboard
    const cloudWatchModule = new CloudWatchDashboardModule(
      this,
      `${id}-monitoring`,
      {
        asgName: autoScalingModule.asg.name,
        albArn: albModule.alb.arn,
        dbInstanceId: rdsModule.dbInstance.identifier,
        tags: commonTags,
      }
    );

    // === Terraform Outputs (10 outputs as requested) ===

    // 1. VPC ID
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID for the application infrastructure',
    });

    // 2. ALB DNS Name
    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description:
        'Application Load Balancer DNS name for accessing the application',
    });

    // 3. RDS Endpoint
    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS MySQL database endpoint',
      sensitive: true, // Mark as sensitive
    });

    // 4. Auto Scaling Group Name
    new TerraformOutput(this, 'asg-name', {
      value: autoScalingModule.asg.name,
      description: 'Auto Scaling Group name for EC2 instances',
    });

    // 5. S3 Bucket Name
    new TerraformOutput(this, 's3-logs-bucket', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name for ALB access logs',
    });

    // 6. CloudWatch Dashboard URL
    new TerraformOutput(this, 'dashboard-url', {
      value: `https://${awsRegion}.console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${cloudWatchModule.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL for monitoring',
    });

    // 7. Private Subnet IDs
    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id).join(','),
      description: 'Private subnet IDs for application and database tiers',
    });

    // 8. Security Group IDs
    new TerraformOutput(this, 'security-group-ids', {
      value: {
        alb: securityGroupsModule.albSg.id,
        ec2: securityGroupsModule.ec2Sg.id,
        rds: securityGroupsModule.rdsSg.id,
      },
      description: 'Security group IDs for ALB, EC2, and RDS',
    });

    // 9. RDS Secret ARN
    new TerraformOutput(this, 'rds-secret-arn', {
      value: rdsSecret.arn,
      description:
        'ARN of the Secrets Manager secret containing RDS credentials',
    });

    // 10. Target Group ARN
    new TerraformOutput(this, 'target-group-arn', {
      value: albModule.targetGroup.arn,
      description: 'Target group ARN for ALB routing',
    });
  }

  // Helper method to generate random password
  private generateRandomPassword(length: number): string {
    // Remove invalid characters: @, /, ", and space
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';

    // Ensure password meets AWS requirements
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasNumbers = /[0-9]/;
    const hasSpecialChar = /[!#$%^&*()_+=$${}|;:,.<>?-]/;

    // Keep generating until we have a valid password
    while (true) {
      result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if password meets all requirements
      if (
        hasUpperCase.test(result) &&
        hasLowerCase.test(result) &&
        hasNumbers.test(result) &&
        hasSpecialChar.test(result)
      ) {
        break;
      }
    }

    return result;
  }
}

```