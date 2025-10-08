import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// VPC Module - Network Foundation
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.subnet.Subnet[];
  public readonly privateSubnets: aws.subnet.Subnet[];
  public readonly internetGateway: aws.internetGateway.InternetGateway;
  public readonly natGateway: aws.natGateway.NatGateway;
  public readonly securityGroupWeb: aws.securityGroup.SecurityGroup;
  public readonly securityGroupDatabase: aws.securityGroup.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: {
      cidrBlock: string;
      availabilityZones?: string[];
      azCount: number;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Use provided availability zones or fetch them dynamically
    let subnetAZs: string[];

    if (
      props.availabilityZones &&
      props.availabilityZones.length >= props.azCount
    ) {
      subnetAZs = props.availabilityZones;
    } else {
      // Existing code to get AZs dynamically
      const availabilityZones =
        new aws.dataAwsAvailabilityZones.DataAwsAvailabilityZones(this, 'azs', {
          state: 'available',
        });
      subnetAZs = availabilityZones.names; // This is an array, no need for get()
    }

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...props.tags, Name: `${id}-vpc` },
    });

    // Create public and private subnets
    this.publicSubnets = [];
    this.privateSubnets = [];

    for (let i = 0; i < props.azCount; i++) {
      // Public subnet
      const publicSubnet = new aws.subnet.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2}.0/24`,
        availabilityZone: subnetAZs[i],
        mapPublicIpOnLaunch: true,
        tags: {
          ...props.tags,
          Name: `${id}-public-subnet-${i}`,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(publicSubnet);
      // Private subnet
      const privateSubnet = new aws.subnet.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i * 2 + 1}.0/24`,
        availabilityZone: subnetAZs[i],
        tags: {
          ...props.tags,
          Name: `${id}-private-subnet-${i}`,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(privateSubnet);
    }

    // Internet Gateway
    this.internetGateway = new aws.internetGateway.InternetGateway(
      this,
      'igw',
      {
        vpcId: this.vpc.id,
        tags: { ...props.tags, Name: `${id}-igw` },
      }
    );

    // Elastic IP for NAT Gateway
    const eip = new aws.eip.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: { ...props.tags, Name: `${id}-nat-eip` },
    });

    // NAT Gateway
    this.natGateway = new aws.natGateway.NatGateway(this, 'nat', {
      allocationId: eip.id,
      subnetId: this.publicSubnets[0].id,
      tags: { ...props.tags, Name: `${id}-nat` },
    });

    // Route tables
    const publicRouteTable = new aws.routeTable.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: { ...props.tags, Name: `${id}-public-rt` },
    });

    new aws.route.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    this.publicSubnets.forEach((subnet, idx) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `public-rt-assoc-${idx}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        }
      );
    });

    const privateRouteTable = new aws.routeTable.RouteTable(
      this,
      'private-rt',
      {
        vpcId: this.vpc.id,
        tags: { ...props.tags, Name: `${id}-private-rt` },
      }
    );

    new aws.route.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    this.privateSubnets.forEach((subnet, idx) => {
      new aws.routeTableAssociation.RouteTableAssociation(
        this,
        `private-rt-assoc-${idx}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        }
      );
    });

    // Security Groups
    this.securityGroupWeb = new aws.securityGroup.SecurityGroup(
      this,
      'sg-web',
      {
        name: `${id}-sg-web`,
        description: 'Security group for web tier',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { ...props.tags, Name: `${id}-sg-web` },
      }
    );

    this.securityGroupDatabase = new aws.securityGroup.SecurityGroup(
      this,
      'sg-database',
      {
        name: `${id}-sg-database`,
        description: 'Security group for database tier',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [this.securityGroupWeb.id],
            description: 'MySQL from web tier',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { ...props.tags, Name: `${id}-sg-database` },
      }
    );
  }
}

// IAM Module - Identity and Access Management
export class IamModule extends Construct {
  public readonly ec2Role: aws.iamRole.IamRole;
  public readonly ec2InstanceProfile: aws.iamInstanceProfile.IamInstanceProfile;
  public readonly s3AccessPolicy: aws.iamPolicy.IamPolicy;
  public readonly secretsManagerPolicy: aws.iamPolicy.IamPolicy;

  constructor(
    scope: Construct,
    id: string,
    props: {
      s3BucketArn: string;
      secretArn: string;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // EC2 Instance Role
    this.ec2Role = new aws.iamRole.IamRole(this, 'ec2-role', {
      name: `${id}-ec2-role`,
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
      tags: props.tags,
    });

    // Instance Profile
    this.ec2InstanceProfile = new aws.iamInstanceProfile.IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${id}-ec2-instance-profile`,
        role: this.ec2Role.name,
        tags: props.tags,
      }
    );

    // S3 Access Policy
    this.s3AccessPolicy = new aws.iamPolicy.IamPolicy(
      this,
      's3-access-policy',
      {
        name: `${id}-s3-access-policy`,
        description: 'Policy for S3 bucket access',
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
              Resource: [props.s3BucketArn, `${props.s3BucketArn}/*`],
            },
          ],
        }),
        tags: props.tags,
      }
    );

    // Secrets Manager Policy
    this.secretsManagerPolicy = new aws.iamPolicy.IamPolicy(
      this,
      'secrets-manager-policy',
      {
        name: `${id}-secrets-manager-policy`,
        description: 'Policy for Secrets Manager access',
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ],
              Resource: props.secretArn,
            },
          ],
        }),
        tags: props.tags,
      }
    );

    // Attach policies to role
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-s3-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: this.s3AccessPolicy.arn,
      }
    );

    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-secrets-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: this.secretsManagerPolicy.arn,
      }
    );

    // CloudWatch Logs policy
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-cloudwatch-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      }
    );

    // SSM policy for Session Manager
    new aws.iamRolePolicyAttachment.IamRolePolicyAttachment(
      this,
      'ec2-ssm-policy-attachment',
      {
        role: this.ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
      }
    );
  }
}

// Secrets Manager Module
export class SecretsManagerModule extends Construct {
  public readonly dbSecret: aws.secretsmanagerSecret.SecretsmanagerSecret;
  public readonly dbSecretVersion: aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion;

  constructor(
    scope: Construct,
    id: string,
    props: {
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // RDS Master Password Secret
    this.dbSecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'db-secret',
      {
        name: `${id}-db-secret`,
        description: 'RDS master password',
        recoveryWindowInDays: 7,
        tags: props.tags,
      }
    );

    this.dbSecretVersion =
      new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
        this,
        'db-secret-version',
        {
          secretId: this.dbSecret.id,
          secretString: JSON.stringify({
            username: 'admin',
            password: process.env.DB_PASSWORD || 'ChangeMe123!', // Use env variable or default
          }),
        }
      );
  }
}

// S3 Module - Storage Layer
export class S3Module extends Construct {
  public readonly bucket: aws.s3Bucket.S3Bucket;
  public readonly bucketVersioning: aws.s3BucketVersioning.S3BucketVersioningA;
  public readonly bucketEncryption: aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA;
  public readonly bucketPublicAccessBlock: aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock;
  public readonly bucketLogging: aws.s3BucketLogging.S3BucketLoggingA;
  public readonly logBucket: aws.s3Bucket.S3Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: {
      bucketName: string;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Log bucket
    this.logBucket = new aws.s3Bucket.S3Bucket(this, 'log-bucket', {
      bucket: `${props.bucketName}-logs`,
      tags: { ...props.tags, Name: `${props.bucketName}-logs` },
    });

    // Main bucket
    this.bucket = new aws.s3Bucket.S3Bucket(this, 'bucket', {
      bucket: props.bucketName,
      tags: { ...props.tags, Name: props.bucketName },
    });

    // Enable versioning
    this.bucketVersioning = new aws.s3BucketVersioning.S3BucketVersioningA(
      this,
      'bucket-versioning',
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Enable encryption
    this.bucketEncryption =
      new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
        this,
        'bucket-encryption',
        {
          bucket: this.bucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
              },
              bucketKeyEnabled: true,
            },
          ],
        }
      );

    // Block public access
    this.bucketPublicAccessBlock =
      new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
        this,
        'bucket-public-access-block',
        {
          bucket: this.bucket.id,
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }
      );

    // Enable logging
    this.bucketLogging = new aws.s3BucketLogging.S3BucketLoggingA(
      this,
      'bucket-logging',
      {
        bucket: this.bucket.id,
        targetBucket: this.logBucket.id,
        targetPrefix: 'access-logs/',
      }
    );
  }
}

// RDS Module - Database Layer
export class RdsModule extends Construct {
  public readonly dbSubnetGroup: aws.dbSubnetGroup.DbSubnetGroup;
  public readonly dbInstance: aws.dbInstance.DbInstance;

  constructor(
    scope: Construct,
    id: string,
    props: {
      vpcId: string;
      subnetIds: string[];
      securityGroupId: string;
      dbName: string;
      username: string;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // DB Subnet Group
    this.dbSubnetGroup = new aws.dbSubnetGroup.DbSubnetGroup(
      this,
      'db-subnet-group',
      {
        name: `${id}-db-subnet-group`,
        description: 'Subnet group for RDS',
        subnetIds: props.subnetIds,
        tags: props.tags,
      }
    );

    // RDS Instance
    this.dbInstance = new aws.dbInstance.DbInstance(this, 'db-instance', {
      identifier: `${id}-db`,
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: props.dbName,
      username: props.username,
      manageMasterUserPassword: true,
      multiAz: true,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [props.securityGroupId],
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      deletionProtection: false,
      skipFinalSnapshot: true,
      enabledCloudwatchLogsExports: ['error'],
      tags: props.tags,
    });
  }
}

// EC2 Module - Compute Layer
export class Ec2Module extends Construct {
  public readonly launchTemplate: aws.launchTemplate.LaunchTemplate;
  public readonly autoScalingGroup: aws.autoscalingGroup.AutoscalingGroup;
  public readonly applicationLoadBalancer: aws.alb.Alb;
  public readonly targetGroup: aws.albTargetGroup.AlbTargetGroup;
  public readonly albListener: aws.albListener.AlbListener;

  constructor(
    scope: Construct,
    id: string,
    props: {
      vpcId: string;
      publicSubnetIds: string[];
      privateSubnetIds: string[];
      securityGroupId: string;
      instanceProfileArn: string;
      userData: string;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // Launch Template
    this.launchTemplate = new aws.launchTemplate.LaunchTemplate(
      this,
      'launch-template',
      {
        name: `${id}-launch-template`,
        imageId: 'ami-0989fb15ce71ba39e', // Amazon Linux 2 AMI
        instanceType: 't3.micro',
        iamInstanceProfile: { arn: props.instanceProfileArn },
        vpcSecurityGroupIds: [props.securityGroupId],
        userData: Buffer.from(props.userData).toString('base64'),
        monitoring: { enabled: true },
        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required',
          httpPutResponseHopLimit: 1,
        },
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: props.tags,
          },
        ],
        tags: props.tags,
      }
    );

    // Application Load Balancer
    this.applicationLoadBalancer = new aws.alb.Alb(this, 'alb', {
      name: `${id}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [props.securityGroupId],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      tags: props.tags,
    });

    // Target Group
    this.targetGroup = new aws.albTargetGroup.AlbTargetGroup(
      this,
      'target-group',
      {
        name: `${id}-tg`,
        port: 80,
        protocol: 'HTTP',
        vpcId: props.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          path: '/',
          matcher: '200',
        },
        tags: props.tags,
      }
    );

    // ALB Listener
    this.albListener = new aws.albListener.AlbListener(this, 'alb-listener', {
      loadBalancerArn: this.applicationLoadBalancer.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags: props.tags,
    });

    // Auto Scaling Group
    this.autoScalingGroup = new aws.autoscalingGroup.AutoscalingGroup(
      this,
      'asg',
      {
        name: `${id}-asg`,
        minSize: 2,
        maxSize: 6,
        desiredCapacity: 2,
        vpcZoneIdentifier: props.privateSubnetIds,
        targetGroupArns: [this.targetGroup.arn],
        healthCheckType: 'ELB',
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: this.launchTemplate.id,
          version: '$Latest',
        },
        tag: Object.entries(props.tags).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      }
    );

    // Auto Scaling Policies
    new aws.autoscalingPolicy.AutoscalingPolicy(this, 'scale-up-policy', {
      name: `${id}-scale-up`,
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
    });

    new aws.autoscalingPolicy.AutoscalingPolicy(this, 'scale-down-policy', {
      name: `${id}-scale-down`,
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
    });
  }
}

// Monitoring Module - CloudWatch
export class MonitoringModule extends Construct {
  public readonly dashboard: aws.cloudwatchDashboard.CloudwatchDashboard;
  public readonly cpuAlarm: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm;
  public readonly rdsAlarm: aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm;
  public readonly snsTopicAlarm: aws.snsTopic.SnsTopic;

  constructor(
    scope: Construct,
    id: string,
    props: {
      autoScalingGroupName: string;
      dbInstanceId: string;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    // SNS Topic for Alarms
    this.snsTopicAlarm = new aws.snsTopic.SnsTopic(this, 'alarm-topic', {
      name: `${id}-alarms`,
      tags: props.tags,
    });

    // CPU Utilization Alarm
    this.cpuAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'cpu-alarm',
      {
        alarmName: `${id}-cpu-utilization`,
        alarmDescription: 'Triggers when CPU utilization is too high',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/EC2',
        period: 300,
        statistic: 'Average',
        threshold: 75,
        dimensions: {
          AutoScalingGroupName: props.autoScalingGroupName,
        },
        alarmActions: [this.snsTopicAlarm.arn],
        tags: props.tags,
      }
    );

    // RDS CPU Alarm
    this.rdsAlarm = new aws.cloudwatchMetricAlarm.CloudwatchMetricAlarm(
      this,
      'rds-cpu-alarm',
      {
        alarmName: `${id}-rds-cpu`,
        alarmDescription: 'RDS CPU utilization alarm',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        dimensions: {
          DBInstanceIdentifier: props.dbInstanceId,
        },
        alarmActions: [this.snsTopicAlarm.arn],
        tags: props.tags,
      }
    );

    // CloudWatch Dashboard
    this.dashboard = new aws.cloudwatchDashboard.CloudwatchDashboard(
      this,
      'dashboard',
      {
        dashboardName: `${id}-dashboard`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/EC2', 'CPUUtilization', { stat: 'Average' }],
                  ['AWS/RDS', 'CPUUtilization', { stat: 'Average' }],
                  ['AWS/RDS', 'DatabaseConnections', { stat: 'Average' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'System Metrics',
              },
            },
          ],
        }),
      }
    );
  }
}

// Logging Module - CloudWatch Logs
export class LoggingModule extends Construct {
  public readonly logGroup: aws.cloudwatchLogGroup.CloudwatchLogGroup;

  constructor(
    scope: Construct,
    id: string,
    props: {
      retentionDays: number;
      tags: { [key: string]: string };
    }
  ) {
    super(scope, id);

    this.logGroup = new aws.cloudwatchLogGroup.CloudwatchLogGroup(
      this,
      'log-group',
      {
        name: `/aws/${id}`,
        retentionInDays: props.retentionDays,
        tags: props.tags,
      }
    );
  }
}
