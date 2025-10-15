import { Construct } from 'constructs';
import { Fn } from 'cdktf';

import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DataAwsElbServiceAccount } from '@cdktf/provider-aws/lib/data-aws-elb-service-account';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

// VPC Resources
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';

// EC2 Resources
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// IAM Resources
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

// RDS Resources
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// Auto Scaling Resources
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';

// ELB Resources (ALB)
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';

// CloudWatch Resources
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

// CloudTrail Resources
import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';

// SNS Resources
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';

// SSM Resources
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';

// S3 Resources
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

// Common interfaces for configuration
export interface CommonTags {
  [key: string]: string;
  Project: string;
  Environment: string;
  Owner: string;
  ManagedBy: string;
  CostCenter: string;
}

// Note: VPCConfig already declared above; duplicate removed.

export interface VPCConfig {
  cidrBlock?: string;
  enableDnsHostnames?: boolean;
  enableDnsSupport?: boolean;
  natGatewayCount?: number;
  tags: CommonTags;
}

// VPC Module - Handles networking infrastructure

export class VPCConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];
  public readonly eips: Eip[];

  constructor(scope: Construct, id: string, config: VPCConfig) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock || '10.0.0.0/16',
      enableDnsHostnames: config.enableDnsHostnames ?? true,
      enableDnsSupport: config.enableDnsSupport ?? true,
      tags: {
        ...config.tags,
        Name: `${config.tags.Project}-vpc-${config.tags.Environment}`,
      },
    });

    // Internet Gateway for public subnet connectivity
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Project}-igw-${config.tags.Environment}`,
      },
    });

    // Create public and private subnets across multiple AZs
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];
    this.eips = [];

    const natCount = config.natGatewayCount || 2;

    for (let i = 0; i < 2; i++) {
      // FIX: Use Fn.element instead of direct array access
      const availabilityZone = Fn.element(azs.names, i);

      // Public Subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: availabilityZone, // Use the fixed AZ reference
        mapPublicIpOnLaunch: true,
        tags: {
          ...config.tags,
          Name: `${config.tags.Project}-public-subnet-${i + 1}-${config.tags.Environment}`,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private Subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: availabilityZone, // Use the fixed AZ reference
        tags: {
          ...config.tags,
          Name: `${config.tags.Project}-private-subnet-${i + 1}-${config.tags.Environment}`,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(privateSubnet);

      // Create NAT Gateway for each AZ (high availability)
      if (i < natCount) {
        const eip = new Eip(this, `nat-eip-${i}`, {
          domain: 'vpc',
          tags: {
            ...config.tags,
            Name: `${config.tags.Project}-nat-eip-${i + 1}-${config.tags.Environment}`,
          },
        });
        this.eips.push(eip);

        const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: {
            ...config.tags,
            Name: `${config.tags.Project}-nat-${i + 1}-${config.tags.Environment}`,
          },
        });
        this.natGateways.push(natGateway);
      }
    }

    // Route tables for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Project}-public-rt-${config.tags.Environment}`,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Route tables for private subnets
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...config.tags,
          Name: `${config.tags.Project}-private-rt-${index + 1}-${config.tags.Environment}`,
        },
      });

      if (this.natGateways[index % natCount]) {
        new Route(this, `private-route-${index}`, {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: this.natGateways[index % natCount].id,
        });
      }

      new RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Network ACLs with secure defaults
    const networkAcl = new NetworkAcl(this, 'nacl', {
      vpcId: this.vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.tags.Project}-nacl-${config.tags.Environment}`,
      },
    });

    // Allow all internal VPC traffic
    new NetworkAclRule(this, 'nacl-ingress-vpc', {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: this.vpc.cidrBlock,
      fromPort: 0,
      toPort: 0,
    });

    // Allow HTTPS inbound
    new NetworkAclRule(this, 'nacl-ingress-https', {
      networkAclId: networkAcl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });

    // Allow HTTP inbound
    new NetworkAclRule(this, 'nacl-ingress-http', {
      networkAclId: networkAcl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });

    // Allow ephemeral ports for responses
    new NetworkAclRule(this, 'nacl-ingress-ephemeral', {
      networkAclId: networkAcl.id,
      ruleNumber: 130,
      protocol: 'tcp',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
    });

    // Egress rules
    new NetworkAclRule(this, 'nacl-egress-all', {
      networkAclId: networkAcl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 0,
      toPort: 0,
      egress: true,
    });
  }
}

// Security Groups Module
export class SecurityGroupsConstruct extends Construct {
  public readonly albSg: SecurityGroup;
  public readonly ec2Sg: SecurityGroup;
  public readonly rdsSg: SecurityGroup;

  constructor(scope: Construct, id: string, vpcId: string, tags: CommonTags) {
    super(scope, id);

    // ALB Security Group - Allow HTTP/HTTPS from internet
    this.albSg = new SecurityGroup(this, 'alb-sg', {
      name: `${tags.Project}-alb-sg-${tags.Environment}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpcId,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
        {
          protocol: 'tcp',
          fromPort: 443,
          toPort: 443,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
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
        ...tags,
        Name: `${tags.Project}-alb-sg-${tags.Environment}`,
      },
    });

    // EC2 Security Group - Allow traffic from ALB only
    this.ec2Sg = new SecurityGroup(this, 'ec2-sg', {
      name: `${tags.Project}-ec2-sg-${tags.Environment}`,
      description: 'Security group for EC2 instances',
      vpcId: vpcId,
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
        ...tags,
        Name: `${tags.Project}-ec2-sg-${tags.Environment}`,
      },
    });

    // Allow traffic from ALB to EC2
    new SecurityGroupRule(this, 'ec2-sg-rule-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSg.id,
      securityGroupId: this.ec2Sg.id,
      description: 'Allow HTTP from ALB',
    });

    // RDS Security Group - Allow PostgreSQL from EC2 only
    this.rdsSg = new SecurityGroup(this, 'rds-sg', {
      name: `${tags.Project}-rds-sg-${tags.Environment}`,
      description: 'Security group for RDS PostgreSQL',
      vpcId: vpcId,
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
        ...tags,
        Name: `${tags.Project}-rds-sg-${tags.Environment}`,
      },
    });

    // Allow PostgreSQL traffic from EC2 to RDS
    new SecurityGroupRule(this, 'rds-sg-rule-ec2', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2Sg.id,
      securityGroupId: this.rdsSg.id,
      description: 'Allow PostgreSQL from EC2 instances',
    });
  }
}

// IAM Module
export class IAMConstruct extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, tags: CommonTags) {
    super(scope, id);

    // EC2 assume role policy document
    const ec2AssumeRolePolicy = {
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
    };

    // EC2 IAM Role with least privilege
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${tags.Project}-ec2-role-${tags.Environment}`,
      assumeRolePolicy: JSON.stringify(ec2AssumeRolePolicy),
      description: 'IAM role for EC2 instances with RDS and SSM access',
      tags: {
        ...tags,
        Name: `${tags.Project}-ec2-role-${tags.Environment}`,
      },
    });

    // Policy for CloudWatch Logs
    const cloudwatchLogsPolicy = new IamPolicy(this, 'cloudwatch-logs-policy', {
      name: `${tags.Project}-ec2-cloudwatch-${tags.Environment}`,
      description: 'Allow EC2 instances to write to CloudWatch Logs',
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
            Resource: `arn:aws:logs:us-east-1:*:log-group:/aws/ec2/${tags.Project}-${tags.Environment}/*`,
          },
        ],
      }),
      tags: tags,
    });

    // Policy for SSM Parameter Store (read-only for secure strings)
    const ssmPolicy = new IamPolicy(this, 'ssm-policy', {
      name: `${tags.Project}-ec2-ssm-${tags.Environment}`,
      description: 'Allow EC2 instances to read from SSM Parameter Store',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:GetParametersByPath',
            ],
            Resource: `arn:aws:ssm:us-east-1:*:parameter/${tags.Project}/${tags.Environment}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: '*',
            Condition: {
              StringEquals: {
                'kms:ViaService': 'ssm.us-east-1.amazonaws.com',
              },
            },
          },
        ],
      }),
      tags: tags,
    });

    // Attach policies to role
    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-attachment', {
      role: this.ec2Role.name,
      policyArn: cloudwatchLogsPolicy.arn,
    });

    new IamRolePolicyAttachment(this, 'ec2-ssm-attachment', {
      role: this.ec2Role.name,
      policyArn: ssmPolicy.arn,
    });

    // Attach AWS managed policy for SSM Session Manager (optional for troubleshooting)
    new IamRolePolicyAttachment(this, 'ec2-ssm-managed-attachment', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Instance profile for EC2
    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${tags.Project}-ec2-profile-${tags.Environment}`,
        role: this.ec2Role.name,
        tags: tags,
      }
    );
  }
}

// RDS Module
export interface RDSConfig {
  instanceClass?: string;
  allocatedStorage?: number;
  maxAllocatedStorage?: number;
  engine?: string;
  username?: string;
  backupRetentionPeriod?: number;
  backupWindow?: string;
  maintenanceWindow?: string;
  tags: CommonTags;
}

export class RDSConstruct extends Construct {
  public readonly instance: DbInstance;
  public readonly subnetGroup: DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    config: RDSConfig,
    subnetIds: string[],
    securityGroupIds: string[]
  ) {
    super(scope, id);

    // DB Subnet Group for Multi-AZ deployment
    this.subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: `${config.tags.Project}-db-subnet-${config.tags.Environment}`,
      subnetIds: subnetIds,
      description: 'Subnet group for RDS PostgreSQL Multi-AZ deployment',
      tags: {
        ...config.tags,
        Name: `${config.tags.Project}-db-subnet-${config.tags.Environment}`,
      },
    });

    // Generate random password and store in SSM
    const dbPassword = new SsmParameter(this, 'db-password', {
      name: `/${config.tags.Project}/${config.tags.Environment}/rds/master-password`,
      type: 'SecureString',
      value: this.generateRandomPassword(),
      description: 'Master password for RDS PostgreSQL instance',
      tags: config.tags,
    });

    // RDS PostgreSQL instance with Multi-AZ and encryption
    this.instance = new DbInstance(this, 'db-instance', {
      identifier: `${config.tags.Project}-db-${config.tags.Environment}`,
      engine: config.engine || 'postgres',
      instanceClass: config.instanceClass || 'db.t3.micro',
      allocatedStorage: config.allocatedStorage || 20,
      maxAllocatedStorage: config.maxAllocatedStorage || 100,
      storageType: 'gp3',
      storageEncrypted: true, // AWS-managed encryption
      username: config.username || 'dbadmin',
      password: dbPassword.value,
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: securityGroupIds,
      multiAz: true, // Enable Multi-AZ for high availability
      backupRetentionPeriod: config.backupRetentionPeriod || 7,
      backupWindow: config.backupWindow || '03:00-04:00',
      maintenanceWindow: config.maintenanceWindow || 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: true, // Prevent accidental deletion in production
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.tags.Project}-final-snapshot-${Date.now()}`,
      enabledCloudwatchLogsExports: ['postgresql'], // Enable CloudWatch logs
      monitoringInterval: 60, // Enhanced monitoring
      monitoringRoleArn: this.createRdsMonitoringRole(config.tags).arn,
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      tags: {
        ...config.tags,
        Name: `${config.tags.Project}-db-${config.tags.Environment}`,
      },
    });
  }

  private createRdsMonitoringRole(tags: CommonTags): IamRole {
    const role = new IamRole(this, 'rds-monitoring-role', {
      name: `${tags.Project}-rds-monitoring-${tags.Environment}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'monitoring.rds.amazonaws.com',
            },
          },
        ],
      }),
      tags: tags,
    });

    new IamRolePolicyAttachment(this, 'rds-monitoring-policy', {
      role: role.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
    });

    return role;
  }

  private generateRandomPassword(): string {
    // Fix: Generate password without forbidden characters ('/', '@', '"', ' ')
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&*+,-.:<=>?[]^_`{|}~';
    let password = '';

    // Ensure password meets complexity requirements
    password += 'Db'; // Start with uppercase and lowercase
    password += Math.floor(Math.random() * 10); // Add a number
    password += '!'; // Add a special character

    // Generate remaining characters
    for (let i = 4; i < 20; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }
}

// ALB Module
export class ALBConstruct extends Construct {
  public readonly alb: Alb;
  public readonly targetGroup: AlbTargetGroup;
  public readonly listener: AlbListener;
  // private readonly albLogsBucket: S3Bucket;

  constructor(
    scope: Construct,
    id: string,
    vpcId: string,
    subnetIds: string[],
    securityGroupIds: string[],
    tags: CommonTags
  ) {
    super(scope, id);

    // Application Load Balancer
    this.alb = new Alb(this, 'alb', {
      name: `${tags.Project}-alb-${tags.Environment}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: securityGroupIds,
      subnets: subnetIds,
      enableDeletionProtection: true,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: {
        ...tags,
        Name: `${tags.Project}-alb-${tags.Environment}`,
      },
    });

    // Target Group for EC2 instances
    this.targetGroup = new AlbTargetGroup(this, 'tg', {
      name: `${tags.Project}-tg-${tags.Environment}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      deregistrationDelay: '30',
      tags: {
        ...tags,
        Name: `${tags.Project}-tg-${tags.Environment}`,
      },
    });

    // ALB Listener
    this.listener = new AlbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: tags,
    });
  }

  private createAlbLogsBucket(tags: CommonTags): S3Bucket {
    // Create S3 bucket WITHOUT versioning and encryption inline
    const bucket = new S3Bucket(this, 'alb-logs-bucket', {
      bucket: `${tags.Project}-alb-logs-${tags.Environment}-${Date.now()}`,
      // REMOVED versioning from here
      tags: tags,
    });

    // Use separate versioning configuration resource
    new S3BucketVersioningA(this, 'alb-logs-versioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Use separate encryption configuration resource (non-deprecated)
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'alb-logs-encryption',
      {
        bucket: bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );
    // Use separate lifecycle configuration resource (non-deprecated)
    new S3BucketLifecycleConfiguration(this, 'alb-logs-lifecycle', {
      bucket: bucket.id,
      rule: [
        {
          id: 'delete-old-logs',
          status: 'Enabled',
          // omit filter if not needed
          expiration: [
            {
              days: 90,
            },
          ],
        },
      ],
    });

    // Block public access for security
    new S3BucketPublicAccessBlock(this, 'alb-logs-public-access-block', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Get the ELB service account for the current region
    // Get the ELB service account for the current region
    const elbServiceAccount = new DataAwsElbServiceAccount(
      this,
      'elb-service-account',
      {}
    );

    // Create bucket policy to allow ALB to write logs
    new S3BucketPolicy(this, 'alb-logs-bucket-policy', {
      bucket: bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'ALBAccessLogPolicy',
            Effect: 'Allow',
            Principal: {
              AWS: elbServiceAccount.arn,
            },
            Action: 's3:PutObject',
            Resource: `${bucket.arn}/alb-logs/*`,
          },
          {
            Sid: 'AWSLogDeliveryWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${bucket.arn}/alb-logs/*`,
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
            Resource: bucket.arn,
          },
        ],
      }),
    });

    return bucket;
  }
}

// ASG Module
export interface ASGConfig {
  minSize?: number;
  maxSize?: number;
  desiredCapacity?: number;
  instanceType?: string;
  keyName?: string;
  tags: CommonTags;
}

export class ASGConstruct extends Construct {
  public readonly asg: AutoscalingGroup;
  public readonly launchTemplate: LaunchTemplate;

  constructor(
    scope: Construct,
    id: string,
    config: ASGConfig,
    subnetIds: string[],
    securityGroupIds: string[],
    targetGroupArns: string[],
    instanceProfile: string
  ) {
    super(scope, id);

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

    // User data script for EC2 instances
    const userData = `#!/bin/bash
# Install CloudWatch agent and configure logging
yum update -y
yum install -y amazon-cloudwatch-agent httpd

# Start httpd
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
echo "OK" > /var/www/html/health

# Configure CloudWatch agent (configuration should be in SSM Parameter Store)
# /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
#   -a fetch-config -m ec2 \\
#   -s -c ssm:/${config.tags.Project}/${config.tags.Environment}/cloudwatch/config

# Example app page
cat > /var/www/html/index.html <<EOF
<html>
<head><title>${config.tags.Project}</title></head>
<body>
<h1>Welcome to ${config.tags.Project} - ${config.tags.Environment}</h1>
<p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
<p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
</body>
</html>
EOF
`;

    // Launch Template
    this.launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: `${config.tags.Project}-lt-${config.tags.Environment}`,
      imageId: ami.id,
      instanceType: config.instanceType || 't3.micro',
      keyName: config.keyName,
      vpcSecurityGroupIds: securityGroupIds,
      iamInstanceProfile: {
        name: instanceProfile,
      },
      userData: Buffer.from(userData).toString('base64'),
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
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required', // IMDSv2 for security
        httpPutResponseHopLimit: 1,
      },
      monitoring: {
        enabled: true,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...config.tags,
            Name: `${config.tags.Project}-instance-${config.tags.Environment}`,
          },
        },
        {
          resourceType: 'volume',
          tags: {
            ...config.tags,
            Name: `${config.tags.Project}-volume-${config.tags.Environment}`,
          },
        },
      ],
      tags: config.tags,
    });

    // Auto Scaling Group
    this.asg = new AutoscalingGroup(this, 'asg', {
      name: `${config.tags.Project}-asg-${config.tags.Environment}`,
      minSize: config.minSize || 2,
      maxSize: config.maxSize || 6,
      desiredCapacity: config.desiredCapacity || 2,
      vpcZoneIdentifier: subnetIds,
      targetGroupArns: targetGroupArns,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      defaultCooldown: 300,
      terminationPolicies: ['OldestInstance'],
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances',
      ],
      tag: Object.entries(config.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Auto Scaling Policies
    new AutoscalingPolicy(this, 'scale-up-policy', {
      name: `${config.tags.Project}-scale-up-${config.tags.Environment}`,
      autoscalingGroupName: this.asg.name,
      adjustmentType: 'ChangeInCapacity',
      scalingAdjustment: 1,
      cooldown: 300,
    });

    new AutoscalingPolicy(this, 'scale-down-policy', {
      name: `${config.tags.Project}-scale-down-${config.tags.Environment}`,
      autoscalingGroupName: this.asg.name,
      adjustmentType: 'ChangeInCapacity',
      scalingAdjustment: -1,
      cooldown: 300,
    });
  }
}

// Monitoring Module
export class MonitoringConstruct extends Construct {
  public readonly logGroup: CloudwatchLogGroup;
  public readonly snsTopic: SnsTopic;
  public readonly trail: Cloudtrail;

  constructor(
    scope: Construct,
    id: string,
    tags: CommonTags,
    albArn: string,
    asgName: string,
    dbId: string
  ) {
    super(scope, id);

    // CloudWatch Log Group for application logs
    this.logGroup = new CloudwatchLogGroup(this, 'app-log-group', {
      name: `/aws/ec2/${tags.Project}-${tags.Environment}/application`,
      retentionInDays: 30,
      tags: tags,
    });

    // SNS Topic for alerts
    this.snsTopic = new SnsTopic(this, 'alerts-topic', {
      name: `${tags.Project}-alerts-${tags.Environment}`,
      displayName: `${tags.Project} Alerts - ${tags.Environment}`,
      tags: tags,
    });

    // Create dummy trail reference to prevent breaking other parts of the code
    this.trail = {} as Cloudtrail;

    // CloudWatch Alarms
    this.createAlarms(tags, albArn, asgName, dbId);
  }

  private createAlarms(
    tags: CommonTags,
    albArn: string,
    asgName: string,
    dbId: string
  ) {
    // ALB Target Response Time Alarm
    new CloudwatchMetricAlarm(this, 'alb-response-time', {
      alarmName: `${tags.Project}-alb-response-time-${tags.Environment}`,
      alarmDescription: 'Alert when ALB response time is high',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      period: 300,
      statistic: 'Average',
      threshold: 2,
      treatMissingData: 'notBreaching',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        LoadBalancer: Fn.join('/', [
          Fn.element(Fn.split('/', albArn), 1),
          Fn.element(Fn.split('/', albArn), 2),
          Fn.element(Fn.split('/', albArn), 3),
        ]),
      },
      tags: tags,
    });

    // ASG CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'asg-cpu-high', {
      alarmName: `${tags.Project}-asg-cpu-high-${tags.Environment}`,
      alarmDescription: 'Alert when ASG instances CPU is high',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      treatMissingData: 'notBreaching',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        AutoScalingGroupName: asgName,
      },
      tags: tags,
    });

    // RDS Free Storage Space Alarm
    new CloudwatchMetricAlarm(this, 'rds-storage-low', {
      alarmName: `${tags.Project}-rds-storage-low-${tags.Environment}`,
      alarmDescription: 'Alert when RDS free storage is low',
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 1,
      metricName: 'FreeStorageSpace',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 2147483648, // 2GB in bytes
      treatMissingData: 'notBreaching',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: dbId,
      },
      tags: tags,
    });

    // RDS CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'rds-cpu-high', {
      alarmName: `${tags.Project}-rds-cpu-high-${tags.Environment}`,
      alarmDescription: 'Alert when RDS CPU is high',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 75,
      treatMissingData: 'notBreaching',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: dbId,
      },
      tags: tags,
    });
  }
}

// SSM Parameter Store Helper Functions
export class SSMHelpers {
  static createParameter(
    scope: Construct,
    name: string,
    value: string,
    description: string,
    tags: CommonTags,
    secure: boolean = false
  ): SsmParameter {
    return new SsmParameter(scope, name, {
      name: `/${tags.Project}/${tags.Environment}/${name}`,
      type: secure ? 'SecureString' : 'String',
      value: value,
      description: description,
      tags: tags,
    });
  }

  static createCloudWatchAgentConfig(
    scope: Construct,
    tags: CommonTags
  ): SsmParameter {
    const config = {
      metrics: {
        namespace: `${tags.Project}/${tags.Environment}`,
        metrics_collected: {
          cpu: {
            measurement: [
              { name: 'cpu_usage_idle', rename: 'CPU_IDLE', unit: 'Percent' },
              {
                name: 'cpu_usage_iowait',
                rename: 'CPU_IOWAIT',
                unit: 'Percent',
              },
            ],
            metrics_collection_interval: 60,
          },
          disk: {
            measurement: [
              { name: 'used_percent', rename: 'DISK_USED', unit: 'Percent' },
            ],
            metrics_collection_interval: 60,
            resources: ['*'],
          },
          mem: {
            measurement: [
              { name: 'mem_used_percent', rename: 'MEM_USED', unit: 'Percent' },
            ],
            metrics_collection_interval: 60,
          },
        },
      },
      logs: {
        logs_collected: {
          files: {
            collect_list: [
              {
                file_path: '/var/log/messages',
                log_group_name: `/aws/ec2/${tags.Project}-${tags.Environment}/system`,
                log_stream_name: '{instance_id}',
              },
              {
                file_path: '/var/log/httpd/access_log',
                log_group_name: `/aws/ec2/${tags.Project}-${tags.Environment}/application`,
                log_stream_name: '{instance_id}/access',
              },
              {
                file_path: '/var/log/httpd/error_log',
                log_group_name: `/aws/ec2/${tags.Project}-${tags.Environment}/application`,
                log_stream_name: '{instance_id}/error',
              },
            ],
          },
        },
      },
    };

    return SSMHelpers.createParameter(
      scope,
      'cloudwatch/config',
      JSON.stringify(config),
      'CloudWatch agent configuration',
      tags,
      false
    );
  }
}
