import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// Common interface for module configuration
export interface BaseModuleConfig {
  environment: string;
  project: string;
  awsRegion: string;
}

// Common tags applied to all resources
const commonTags = {
  Environment: 'Production',
  Owner: 'DevOpsTeam',
  Compliance: 'SecurityBaseline',
  ManagedBy: 'CDKTF',
};

// VPC Module Configuration
export interface VpcModuleConfig extends BaseModuleConfig {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  allowedSshCidr: string;
}

export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateways: aws.natGateway.NatGateway[];
  public readonly securityGroupWeb: aws.securityGroup.SecurityGroup;
  public readonly securityGroupSsh: aws.securityGroup.SecurityGroup;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    const commonTags = {
      Project: config.project,
      Environment: config.environment,
      Security: 'Restricted',
    };

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...commonTags,
        Name: `${config.environment}-network-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-igw`,
        },
      }
    );

    // Create Public Subnets
    this.publicSubnets = [];
    config.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new aws.subnet.Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-public-subnet-${index + 1}`,
        },
      });
      this.publicSubnets.push(subnet);
    });

    // Create Private Subnets
    this.privateSubnets = [];
    config.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new aws.subnet.Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-private-subnet-${index + 1}`,
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Create Elastic IPs for NAT Gateways
    this.natGateways = [];
    this.publicSubnets.forEach((subnet, index) => {
      const eip = new aws.eip.Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-nat-eip-${index + 1}`,
        },
      });

      const natGateway = new aws.natGateway.NatGateway(
        this,
        `nat-gateway-${index}`,
        {
          allocationId: eip.id,
          subnetId: subnet.id,
          tags: {
            ...commonTags,
            Name: `${config.environment}-network-nat-gateway-${index + 1}`,
          },
        }
      );
      this.natGateways.push(natGateway);
    });

    // Create Route Tables
    const publicRouteTable = new aws.routeTable.RouteTable(
      this,
      'public-route-table',
      {
        vpcId: this.vpc.id,
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-public-rt`,
        },
      }
    );

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, index) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    // Private Route Tables
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.routeTable.RouteTable(
        this,
        `private-route-table-${index}`,
        {
          vpcId: this.vpc.id,
          tags: {
            ...commonTags,
            Name: `${config.environment}-network-private-rt-${index + 1}`,
          },
        }
      );

      new aws.route.Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index % this.natGateways.length].id,
      });

      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Security Group for Web Traffic
    this.securityGroupWeb = new aws.securityGroup.SecurityGroup(
      this,
      'sg-web',
      {
        vpcId: this.vpc.id,
        description: 'Security group for web traffic',
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-sg-web`,
        },
      }
    );

    new aws.securityGroupRule.SecurityGroupRule(this, 'sg-web-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroupWeb.id,
    });

    new aws.securityGroupRule.SecurityGroupRule(this, 'sg-web-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroupWeb.id,
    });

    // Security Group for SSH
    this.securityGroupSsh = new aws.securityGroup.SecurityGroup(
      this,
      'sg-ssh',
      {
        vpcId: this.vpc.id,
        description: 'Security group for SSH access',
        tags: {
          ...commonTags,
          Name: `${config.environment}-network-sg-ssh`,
        },
      }
    );

    new aws.securityGroupRule.SecurityGroupRule(this, 'sg-ssh-rule', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [config.allowedSshCidr],
      securityGroupId: this.securityGroupSsh.id,
    });

    // Egress rules for all security groups
    [this.securityGroupWeb, this.securityGroupSsh].forEach((sg, index) => {
      new aws.securityGroupRule.SecurityGroupRule(this, `sg-egress-${index}`, {
        type: 'egress',
        fromPort: 0,
        toPort: 65535,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        securityGroupId: sg.id,
      });
    });
  }
}
// KMS Module - Encryption Key Management
export class KmsModule extends Construct {
  public readonly key: aws.kmsKey.KmsKey;
  public readonly keyAlias: aws.kmsAlias.KmsAlias;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create KMS key for encryption
    this.key = new aws.kmsKey.KmsKey(this, 'master-key', {
      description: 'Master encryption key for production environment',
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      tags: commonTags,
    });

    // Create key alias
    this.keyAlias = new aws.kmsAlias.KmsAlias(this, 'master-key-alias', {
      name: 'alias/production-master-key',
      targetKeyId: this.key.keyId,
    });
  }
}

// S3 Module - Logging and Content Storage
export class S3Module extends Construct {
  public readonly logBucket: aws.s3Bucket.S3Bucket;
  public readonly bucketPolicy: aws.s3BucketPolicy.S3BucketPolicy;

  constructor(scope: Construct, id: string, kmsKey: aws.kmsKey.KmsKey) {
    super(scope, id);

    // Create S3 bucket for logs
    this.logBucket = new aws.s3Bucket.S3Bucket(this, 'log-bucket', {
      bucket: `production-logs-${Date.now()}`,
      tags: commonTags,
      forceDestroy: false,
    });

    // Enable versioning
    new aws.s3BucketVersioning.S3BucketVersioningA(
      this,
      'log-bucket-versioning',
      {
        bucket: this.logBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Enable server-side encryption
    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'log-bucket-encryption',
      {
        bucket: this.logBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block all public access
    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'log-bucket-pab',
      {
        bucket: this.logBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // Add lifecycle rules for cost management
    new aws.s3BucketLifecycleConfiguration.S3BucketLifecycleConfiguration(
      this,
      'log-bucket-lifecycle',
      {
        bucket: this.logBucket.id,
        rule: [
          {
            id: 'archive-old-logs',
            status: 'Enabled',
            transition: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
            expiration: [
              {
                days: 365,
              },
            ],
          },
        ],
      }
    );

    // Configure bucket logging
    new aws.s3BucketLogging.S3BucketLoggingA(this, 'log-bucket-logging', {
      bucket: this.logBucket.id,
      targetBucket: this.logBucket.id,
      targetPrefix: 'access-logs/',
    });
  }
}

// IAM Module - Roles and Policies
export class IamModule extends Construct {
  public readonly ec2Role: aws.iamRole.IamRole;
  public readonly instanceProfile: aws.iamInstanceProfile.IamInstanceProfile;

  constructor(
    scope: Construct,
    id: string,
    s3BucketArn: string,
    rdsResourceArn: string
  ) {
    super(scope, id);

    // EC2 assume role policy
    const assumeRolePolicy = JSON.stringify({
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
    });

    // Create IAM role for EC2
    this.ec2Role = new aws.iamRole.IamRole(this, 'ec2-role', {
      name: 'production-ec2-role-12345',
      assumeRolePolicy: assumeRolePolicy,
      tags: commonTags,
    });

    // S3 read-only policy
    const s3Policy = new aws.iamPolicy.IamPolicy(this, 's3-read-policy', {
      name: 'production-s3-read-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket', 's3:GetBucketLocation'],
            Resource: [s3BucketArn, `${s3BucketArn}/*`],
          },
        ],
      }),
    });

    // RDS access policy
    const rdsPolicy = new aws.iamPolicy.IamPolicy(this, 'rds-policy', {
      name: 'production-rds-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['rds:DescribeDBInstances', 'rds:ListTagsForResource'],
            Resource: rdsResourceArn,
          },
        ],
      }),
    });

    // CloudWatch logs policy
    const cloudwatchPolicy = new aws.iamPolicy.IamPolicy(
      this,
      'cloudwatch-policy',
      {
        name: 'production-cloudwatch-policy',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'cloudwatch:PutMetricData',
              ],
              Resource: '*',
            },
          ],
        }),
      }
    );

    // Attach policies to role
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      's3-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: s3Policy.arn,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'rds-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: rdsPolicy.arn,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'cloudwatch-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: cloudwatchPolicy.arn,
      }
    );

    // Create instance profile
    this.instanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-profile',
      {
        name: 'production-ec2-profile',
        role: this.ec2Role.name,
      }
    );
  }
}

// RDS Module - PostgreSQL Database
export class RdsModule extends Construct {
  public readonly instance: aws.dbInstance.DbInstance;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly endpoint: string;
  public readonly resourceArn: string;

  constructor(
    scope: Construct,
    id: string,
    vpc: aws.vpc.Vpc,
    privateSubnets: aws.subnet.Subnet[],
    kmsKey: aws.kmsKey.KmsKey
  ) {
    super(scope, id);

    // Create DB subnet group
    const dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: 'production-db-subnet',
        subnetIds: privateSubnets.map(s => s.id),
        tags: {
          ...commonTags,
          Name: 'production-db-subnet-group',
        },
      }
    );

    // Create security group for RDS
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'rds-sg', {
      name: 'production-rds-sg',
      description: 'Security group for RDS PostgreSQL',
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: 'production-rds-sg',
      },
    });

    // Allow PostgreSQL from within VPC
    new aws.securityGroupRule.SecurityGroupRule(this, 'rds-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: [vpc.cidrBlock],
      securityGroupId: this.securityGroup.id,
    });

    // Create RDS instance
    this.instance = new aws.dbInstance.DbInstance(this, 'postgres', {
      identifier: 'production-postgres',
      engine: 'postgres',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      dbName: 'productiondb',
      username: 'dbadmin',
      manageMasterUserPassword: true,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      multiAz: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `production-postgres-final-${Date.now()}`,
      tags: commonTags,
    });

    this.endpoint = this.instance.endpoint;
    this.resourceArn = this.instance.arn;
  }
}

// EC2 Module - Application Server
export class Ec2Module extends Construct {
  public readonly instance: aws.instance.Instance;
  public readonly securityGroup: aws.securityGroup.SecurityGroup;
  public readonly publicIp: string;

  constructor(
    scope: Construct,
    id: string,
    vpc: aws.vpc.Vpc,
    publicSubnet: aws.subnet.Subnet,
    instanceProfile: aws.iamInstanceProfile.IamInstanceProfile,
    adminIpRange: string = '0.0.0.0/32' // Replace with actual admin IP
  ) {
    super(scope, id);

    // Create security group for EC2
    this.securityGroup = new aws.securityGroup.SecurityGroup(this, 'ec2-sg', {
      name: 'production-ec2-sg',
      description: 'Security group for EC2 instance',
      vpcId: vpc.id,
      tags: {
        ...commonTags,
        Name: 'production-ec2-sg',
      },
    });

    // Allow SSH from admin IP
    new aws.securityGroupRule.SecurityGroupRule(this, 'ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [adminIpRange],
      securityGroupId: this.securityGroup.id,
    });

    // Allow HTTP/HTTPS for web application
    new aws.securityGroupRule.SecurityGroupRule(this, 'http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    new aws.securityGroupRule.SecurityGroupRule(this, 'https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Allow all outbound
    new aws.securityGroupRule.SecurityGroupRule(this, 'ec2-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.securityGroup.id,
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new aws.dataAwsAmi.DataAwsAmi(this, 'amazon-linux-2', {
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

    // User data script for CloudWatch agent installation
    const userData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
{
  "metrics": {
    "namespace": "Production/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_USAGE_IDLE", "unit": "Percent"},
          {"name": "cpu_usage_iowait", "rename": "CPU_USAGE_IOWAIT", "unit": "Percent"},
          "cpu_time_guest"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED_PERCENT", "unit": "Percent"},
          "disk_free"
        ],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED_PERCENT", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      },
      "netstat": {
        "measurement": [
          "tcp_established",
          "tcp_time_wait"
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/production",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  }
}
EOF
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
`;

    // Create EC2 instance
    this.instance = new aws.instance.Instance(this, 'app-server', {
      ami: ami.id,
      instanceType: 't3.medium',
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [this.securityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      associatePublicIpAddress: true,
      userData: Buffer.from(userData).toString('base64'),
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 30,
        encrypted: true,
        deleteOnTermination: true,
      },
      monitoring: true,
      tags: {
        ...commonTags,
        Name: 'production-app-server',
      },
    });

    this.publicIp = this.instance.publicIp;
  }
}

// Monitoring Module - CloudWatch and SNS
export class MonitoringModule extends Construct {
  public readonly snsTopic: aws.snsTopic.SnsTopic;
  public readonly cpuAlarm: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm;
  public readonly rdsStorageAlarm: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm;

  constructor(
    scope: Construct,
    id: string,
    ec2InstanceId: string,
    rdsInstanceId: string,
    emailAddress: string
    // kmsKey?: aws.kmsKey.KmsKey
  ) {
    super(scope, id);

    // Create SNS topic for alerts
    this.snsTopic = new aws.snsTopic.SnsTopic(this, 'alerts-topic', {
      name: 'production-alerts',
      displayName: 'Production Environment Alerts',
      tags: commonTags,
    });

    // Subscribe email to SNS topic
    new aws.snsTopicSubscription.SnsTopicSubscription(
      this,
      'email-subscription',
      {
        topicArn: this.snsTopic.arn,
        protocol: 'email',
        endpoint: emailAddress,
      }
    );

    // CloudWatch Log Group
    new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'app-logs', {
      name: '/aws/ec2/productionts',
      retentionInDays: 30,
      // ...(kmsKey && { kmsKeyId: kmsKey.arn }),
      tags: commonTags,
    });

    // EC2 CPU Alarm
    this.cpuAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'ec2-cpu-alarm',
      {
        alarmName: 'production-ec2-high-cpu',
        alarmDescription: 'EC2 instance CPU utilization is too high',
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        statistic: 'Average',
        period: 300,
        evaluationPeriods: 2,
        threshold: 80,
        comparisonOperator: 'GreaterThanThreshold',
        dimensions: {
          InstanceId: ec2InstanceId,
        },
        alarmActions: [this.snsTopic.arn],
        tags: commonTags,
      }
    );

    // RDS Storage Space Alarm
    this.rdsStorageAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-storage-alarm',
      {
        alarmName: 'production-rds-low-storage',
        alarmDescription: 'RDS free storage space is running low',
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        statistic: 'Average',
        period: 300,
        evaluationPeriods: 1,
        threshold: 10737418240, // 10GB in bytes
        comparisonOperator: 'LessThanThreshold',
        dimensions: {
          DBInstanceIdentifier: rdsInstanceId,
        },
        alarmActions: [this.snsTopic.arn],
        tags: commonTags,
      }
    );

    // RDS CPU Alarm
    new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: 'production-rds-high-cpu',
      alarmDescription: 'RDS CPU utilization is too high',
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 75,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        DBInstanceIdentifier: rdsInstanceId,
      },
      alarmActions: [this.snsTopic.arn],
      tags: commonTags,
    });
  }
}

// CloudFront Module - Content Delivery
export class CloudFrontModule extends Construct {
  public readonly distribution: aws.cloudfrontDistribution.CloudfrontDistribution;
  public readonly oac: aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl;

  constructor(scope: Construct, id: string, s3Bucket: aws.s3Bucket.S3Bucket) {
    super(scope, id);

    // Create Origin Access Control
    this.oac =
      new aws.cloudfrontOriginAccessControl.CloudfrontOriginAccessControl(
        this,
        's3-oac',
        {
          name: 'production-s3-oac',
          description: 'OAC for S3 bucket access',
          originAccessControlOriginType: 's3',
          signingBehavior: 'always',
          signingProtocol: 'sigv4',
        }
      );

    // CloudFront distribution
    this.distribution = new aws.cloudfrontDistribution.CloudfrontDistribution(
      this,
      'cdn',
      {
        enabled: true,
        isIpv6Enabled: true,
        comment: 'Production CDN Distribution',
        defaultRootObject: 'index.html',
        priceClass: 'PriceClass_100',

        origin: [
          {
            domainName: s3Bucket.bucketRegionalDomainName,
            originId: 'S3-Origin',
            originAccessControlId: this.oac.id,
          },
        ],

        defaultCacheBehavior: {
          targetOriginId: 'S3-Origin',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: ['GET', 'HEAD', 'OPTIONS'],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,

          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
        },

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
          minimumProtocolVersion: 'TLSv1.2_2021',
        },

        tags: commonTags,
      }
    );

    // Update S3 bucket policy to allow CloudFront access
    new aws.s3BucketPolicy.S3BucketPolicy(this, 'cdn-bucket-policy', {
      bucket: s3Bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontOAC',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${s3Bucket.arn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': this.distribution.arn,
              },
            },
          },
        ],
      }),
    });
  }
}
