## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import {
  ec2,
  iam,
  rds,
  elasticloadbalancingv2,
  autoscaling,
  ssm,
  cloudwatch,
  logs,
  sns,
  cloudtrail,
  s3,
  kms,
} from '@cdktf/provider-aws';

export interface CommonTags {
  Project: string;
  Environment: string;
  Owner: string;
}

export interface VpcConfig {
  cidr: string;
  azCount: number;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  tags: CommonTags;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.Subnet[];
  public readonly privateSubnets: ec2.Subnet[];
  public readonly internetGateway: ec2.InternetGateway;
  public readonly natGateway: ec2.NatGateway;

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new ec2.Vpc(this, 'vpc', {
      cidrBlock: config.cidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.tags.Project}-vpc`,
        ...config.tags,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new ec2.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.tags.Project}-igw`,
        ...config.tags,
      },
    });

    // Get availability zones
    const azs = new ec2.DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create public subnets
    this.publicSubnets = [];
    for (let i = 0; i < config.azCount; i++) {
      const subnet = new ec2.Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: config.publicSubnetCidrs[i],
        availabilityZone: azs.names.get(i),
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.tags.Project}-public-subnet-${i}`,
          Type: 'Public',
          ...config.tags,
        },
      });
      this.publicSubnets.push(subnet);
    }

    // Create EIP for NAT Gateway
    const natEip = new ec2.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${config.tags.Project}-nat-eip`,
        ...config.tags,
      },
    });

    // Create NAT Gateway in first public subnet
    this.natGateway = new ec2.NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `${config.tags.Project}-nat-gateway`,
        ...config.tags,
      },
    });

    // Create private subnets
    this.privateSubnets = [];
    for (let i = 0; i < config.azCount; i++) {
      const subnet = new ec2.Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: config.privateSubnetCidrs[i],
        availabilityZone: azs.names.get(i),
        tags: {
          Name: `${config.tags.Project}-private-subnet-${i}`,
          Type: 'Private',
          ...config.tags,
        },
      });
      this.privateSubnets.push(subnet);
    }

    // Create route tables
    const publicRouteTable = new ec2.RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.tags.Project}-public-rt`,
        ...config.tags,
      },
    });

    new ec2.Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new ec2.RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create private route table
    const privateRouteTable = new ec2.RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.tags.Project}-private-rt`,
        ...config.tags,
      },
    });

    new ec2.Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new ec2.RouteTableAssociation(this, `private-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Create Network ACLs for additional security
    const publicNacl = new ec2.NetworkAcl(this, 'public-nacl', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.tags.Project}-public-nacl`,
        ...config.tags,
      },
    });

    // Allow all inbound and outbound traffic for public subnets (refined in security groups)
    new ec2.NetworkAclRule(this, 'public-nacl-inbound', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 0,
      toPort: 65535,
    });

    new ec2.NetworkAclRule(this, 'public-nacl-outbound', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      fromPort: 0,
      toPort: 65535,
      egress: true,
    });
  }
}

export interface SecurityGroupsConfig {
  vpcId: string;
  tags: CommonTags;
}

export class SecurityGroupsConstruct extends Construct {
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupsConfig) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'alb-sg', {
      name: `${config.tags.Project}-alb-sg`,
      description: 'Security group for Application Load Balancer',
      vpcId: config.vpcId,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: config.tags,
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'ec2-sg', {
      name: `${config.tags.Project}-ec2-sg`,
      description: 'Security group for EC2 instances',
      vpcId: config.vpcId,
      egress: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: config.tags,
    });

    // RDS Security Group
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'rds-sg', {
      name: `${config.tags.Project}-rds-sg`,
      description: 'Security group for RDS PostgreSQL',
      vpcId: config.vpcId,
      egress: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: config.tags,
    });

    // Add ingress rules after creation to avoid circular dependencies
    new ec2.SecurityGroupRule(this, 'ec2-from-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow HTTP from ALB',
    });

    new ec2.SecurityGroupRule(this, 'rds-from-ec2', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow PostgreSQL from EC2 instances',
    });
  }
}

export interface IamConfig {
  tags: CommonTags;
}

export class IamConstruct extends Construct {
  public readonly ec2Role: iam.IamRole;
  public readonly ec2InstanceProfile: iam.IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IamConfig) {
    super(scope, id);

    // EC2 assume role policy
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

    // EC2 IAM Role
    this.ec2Role = new iam.IamRole(this, 'ec2-role', {
      name: `${config.tags.Project}-ec2-role`,
      assumeRolePolicy: JSON.stringify(ec2AssumeRolePolicy),
      tags: config.tags,
    });

    // EC2 IAM Policy - Least privilege for SSM Parameter Store access
    const ec2Policy = new iam.IamPolicy(this, 'ec2-policy', {
      name: `${config.tags.Project}-ec2-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'ssm:GetParameter',
              'ssm:GetParameters',
              'ssm:GetParameterHistory',
              'ssm:GetParametersByPath',
            ],
            Resource: [
              `arn:aws:ssm:us-east-1:*:parameter/${config.tags.Project}/*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: ['*'],
            Condition: {
              StringEquals: {
                'kms:ViaService': 'ssm.us-east-1.amazonaws.com',
              },
            },
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: config.tags,
    });

    new iam.IamRolePolicyAttachment(this, 'ec2-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    // Attach AWS managed policies for CloudWatch
    new iam.IamRolePolicyAttachment(this, 'ec2-cloudwatch-policy', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    });

    // EC2 Instance Profile
    this.ec2InstanceProfile = new iam.IamInstanceProfile(this, 'ec2-instance-profile', {
      name: `${config.tags.Project}-ec2-instance-profile`,
      role: this.ec2Role.name,
      tags: config.tags,
    });
  }
}

export interface RdsConfig {
  subnetIds: string[];
  securityGroupIds: string[];
  instanceClass: string;
  allocatedStorage: number;
  storageEncrypted: boolean;
  backupRetentionPeriod: number;
  preferredBackupWindow: string;
  preferredMaintenanceWindow: string;
  tags: CommonTags;
}

export class RdsConstruct extends Construct {
  public readonly dbInstance: rds.DbInstance;
  public readonly dbSubnetGroup: rds.DbSubnetGroup;

  constructor(scope: Construct, id: string, config: RdsConfig) {
    super(scope, id);

    // Create DB subnet group
    this.dbSubnetGroup = new rds.DbSubnetGroup(this, 'db-subnet-group', {
      name: `${config.tags.Project}-db-subnet-group`,
      subnetIds: config.subnetIds,
      description: 'Subnet group for RDS instances',
      tags: config.tags,
    });

    // Create RDS PostgreSQL instance
    this.dbInstance = new rds.DbInstance(this, 'db-instance', {
      identifier: `${config.tags.Project}-postgres`,
      engine: 'postgres',
      engineVersion: '14.9',
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: config.storageEncrypted,
      kmsKeyId: 'alias/aws/rds', // AWS managed key
      dbName: 'appdb',
      username: 'dbadmin',
      password: 'temp-password-change-me', // Will be updated via SSM Parameter Store
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: config.securityGroupIds,
      multiAz: true, // High availability
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: config.preferredBackupWindow,
      maintenanceWindow: config.preferredMaintenanceWindow,
      enabledCloudwatchLogsExports: ['postgresql'], // Enhanced logging
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      deletionProtection: true, // Production safety
      copyTagsToSnapshot: true,
      tags: config.tags,
    });
  }
}

export interface AlbConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  tags: CommonTags;
}

export class AlbConstruct extends Construct {
  public readonly alb: elasticloadbalancingv2.Lb;
  public readonly targetGroup: elasticloadbalancingv2.LbTargetGroup;
  public readonly listener: elasticloadbalancingv2.LbListener;

  constructor(scope: Construct, id: string, config: AlbConfig) {
    super(scope, id);

    // Create Application Load Balancer
    this.alb = new elasticloadbalancingv2.Lb(this, 'alb', {
      name: `${config.tags.Project}-alb`,
      loadBalancerType: 'application',
      subnets: config.subnetIds,
      securityGroups: config.securityGroupIds,
      enableDeletionProtection: true,
      enableHttp2: true,
      tags: config.tags,
    });

    // Create target group
    this.targetGroup = new elasticloadbalancingv2.LbTargetGroup(this, 'target-group', {
      name: `${config.tags.Project}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId: config.vpcId,
      targetType: 'instance',
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
        path: '/health',
        matcher: '200',
      },
      deregistrationDelay: 30,
      tags: config.tags,
    });

    // Create HTTP listener (in production, use HTTPS with SSL certificate)
    this.listener = new elasticloadbalancingv2.LbListener(this, 'listener', {
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

export interface AsgConfig {
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  targetGroupArns: string[];
  instanceProfile: string;
  instanceType: string;
  amiId: string;
  keyName?: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  tags: CommonTags;
}

export class AsgConstruct extends Construct {
  public readonly launchTemplate: ec2.LaunchTemplate;
  public readonly autoScalingGroup: autoscaling.AutoscalingGroup;

  constructor(scope: Construct, id: string, config: AsgConfig) {
    super(scope, id);

    // User data script for EC2 instances
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install SSM agent (pre-installed on Amazon Linux 2)
# Configure CloudWatch agent via SSM Parameter Store config

# Install application dependencies
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
echo "OK" > /var/www/html/health

# Install PostgreSQL client
amazon-linux-extras install -y postgresql14

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a query -m ec2 -c default -s
`;

    // Create launch template
    this.launchTemplate = new ec2.LaunchTemplate(this, 'launch-template', {
      name: `${config.tags.Project}-launch-template`,
      imageId: config.amiId,
      instanceType: config.instanceType,
      iamInstanceProfile: {
        name: config.instanceProfile,
      },
      vpcSecurityGroupIds: config.securityGroupIds,
      keyName: config.keyName,
      userData: Buffer.from(userData).toString('base64'),
      monitoring: {
        enabled: true,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: config.tags,
        },
        {
          resourceType: 'volume',
          tags: config.tags,
        },
      ],
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoscalingGroup(this, 'asg', {
      name: `${config.tags.Project}-asg`,
      vpcZoneIdentifier: config.subnetIds,
      targetGroupArns: config.targetGroupArns,
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: config.minSize,
      maxSize: config.maxSize,
      desiredCapacity: config.desiredCapacity,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      tag: Object.entries(config.tags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Create scaling policies
    new autoscaling.AutoscalingPolicy(this, 'scale-up-policy', {
      name: `${config.tags.Project}-scale-up`,
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: 'TargetTrackingScaling',
      targetTrackingConfiguration: {
        targetValue: 70,
        predefinedMetricSpecification: {
          predefinedMetricType: 'ASGAverageCPUUtilization',
        },
      },
    });
  }
}

export interface MonitoringConfig {
  albArn: string;
  asgName: string;
  rdsId: string;
  tags: CommonTags;
}

export class MonitoringConstruct extends Construct {
  public readonly snsTopic: sns.SnsTopic;
  public readonly logGroup: logs.CloudwatchLogGroup;
  public readonly alarms: cloudwatch.CloudwatchMetricAlarm[];

  constructor(scope: Construct, id: string, config: MonitoringConfig) {
    super(scope, id);

    // Create SNS topic for alerts
    this.snsTopic = new sns.SnsTopic(this, 'alerts-topic', {
      name: `${config.tags.Project}-alerts`,
      displayName: `${config.tags.Project} Infrastructure Alerts`,
      tags: config.tags,
    });

    // Create CloudWatch Log Group
    this.logGroup = new logs.CloudwatchLogGroup(this, 'app-logs', {
      name: `/aws/application/${config.tags.Project}`,
      retentionInDays: 30,
      tags: config.tags,
    });

    // Create CloudWatch Alarms
    this.alarms = [];

    // ALB Target Response Time
    const albResponseTimeAlarm = new cloudwatch.CloudwatchMetricAlarm(this, 'alb-response-time-alarm', {
      alarmName: `${config.tags.Project}-alb-response-time`,
      alarmDescription: 'ALB target response time is too high',
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 1,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        LoadBalancer: config.albArn.split('/').slice(1).join('/'),
      },
      alarmActions: [this.snsTopic.arn],
      tags: config.tags,
    });
    this.alarms.push(albResponseTimeAlarm);

    // ASG CPU Utilization
    const asgCpuAlarm = new cloudwatch.CloudwatchMetricAlarm(this, 'asg-cpu-alarm', {
      alarmName: `${config.tags.Project}-asg-cpu-utilization`,
      alarmDescription: 'ASG average CPU utilization is too high',
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        AutoScalingGroupName: config.asgName,
      },
      alarmActions: [this.snsTopic.arn],
      tags: config.tags,
    });
    this.alarms.push(asgCpuAlarm);

    // RDS Free Storage Space
    const rdsFreeStorageAlarm = new cloudwatch.CloudwatchMetricAlarm(this, 'rds-free-storage-alarm', {
      alarmName: `${config.tags.Project}-rds-free-storage`,
      alarmDescription: 'RDS free storage space is low',
      metricName: 'FreeStorageSpace',
      namespace: 'AWS/RDS',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 1,
      threshold: 1073741824, // 1GB in bytes
      comparisonOperator: 'LessThanThreshold',
      dimensions: {
        DBInstanceIdentifier: config.rdsId,
      },
      alarmActions: [this.snsTopic.arn],
      tags: config.tags,
    });
    this.alarms.push(rdsFreeStorageAlarm);

    // RDS CPU Utilization
    const rdsCpuAlarm = new cloudwatch.CloudwatchMetricAlarm(this, 'rds-cpu-alarm', {
      alarmName: `${config.tags.Project}-rds-cpu-utilization`,
      alarmDescription: 'RDS CPU utilization is too high',
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 75,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        DBInstanceIdentifier: config.rdsId,
      },
      alarmActions: [this.snsTopic.arn],
      tags: config.tags,
    });
    this.alarms.push(rdsCpuAlarm);
  }
}

export interface CloudTrailConfig {
  tags: CommonTags;
}

export class CloudTrailConstruct extends Construct {
  public readonly trail: cloudtrail.CloudtrailTrail;
  public readonly bucket: s3.S3Bucket;

  constructor(scope: Construct, id: string, config: CloudTrailConfig) {
    super(scope, id);

    // Create S3 bucket for CloudTrail logs
    this.bucket = new s3.S3Bucket(this, 'cloudtrail-bucket', {
      bucket: `${config.tags.Project}-cloudtrail-${Date.now()}`,
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      lifecycleRule: [
        {
          id: 'expire-old-logs',
          enabled: true,
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
          expiration: {
            days: 365,
          },
        },
      ],
      tags: config.tags,
    });

    // Create bucket policy for CloudTrail
    new s3.S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: this.bucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: this.bucket.arn,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${this.bucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
        ],
      }),
    });

    // Create CloudTrail
    this.trail = new cloudtrail.CloudtrailTrail(this, 'trail', {
      name: `${config.tags.Project}-trail`,
      s3BucketName: this.bucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      eventSelector: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          dataResource: [
            {
              type: 'AWS::S3::Object',
              values: ['arn:aws:s3:::*/*'],
            },
          ],
        },
      ],
      tags: config.tags,
    });
  }
}

export interface SsmParameterConfig {
  name: string;
  value: string;
  type: 'String' | 'SecureString';
  description: string;
  tags: CommonTags;
}

export class SsmParameter extends Construct {
  public readonly parameter: ssm.SsmParameter;

  constructor(scope: Construct, id: string, config: SsmParameterConfig) {
    super(scope, id);

    this.parameter = new ssm.SsmParameter(this, 'parameter', {
      name: config.name,
      value: config.value,
      type: config.type,
      description: config.description,
      keyId: config.type === 'SecureString' ? 'alias/aws/ssm' : undefined,
      tags: config.tags,
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws';
import {
  VpcConstruct,
  SecurityGroupsConstruct,
  IamConstruct,
  RdsConstruct,
  AlbConstruct,
  AsgConstruct,
  MonitoringConstruct,
  CloudTrailConstruct,
  SsmParameter,
  CommonTags,
} from './modules';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Validate environment variables
    const projectName = process.env.PROJECT_NAME || 'tap-infra';
    const environment = process.env.ENVIRONMENT || 'production';
    const owner = process.env.OWNER || 'DevOpsTeam';
    
    // AWS Provider configuration
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{
        tags: {
          Terraform: 'true',
          ManagedBy: 'CDKTF',
        },
      }],
    });

    // Common tags for all resources
    const commonTags: CommonTags = {
      Project: projectName,
      Environment: environment,
      Owner: owner,
    };

    // VPC Configuration
    const vpc = new VpcConstruct(this, 'vpc', {
      cidr: '10.0.0.0/16',
      azCount: 2,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24'],
      tags: commonTags,
    });

    // Security Groups
    const securityGroups = new SecurityGroupsConstruct(this, 'security-groups', {
      vpcId: vpc.vpc.id,
      tags: commonTags,
    });

    // IAM Roles and Policies
    const iam = new IamConstruct(this, 'iam', {
      tags: commonTags,
    });

    // SSM Parameters for sensitive configuration
    // IMPORTANT: After deployment, update these values with actual secrets
    const dbPasswordParam = new SsmParameter(this, 'db-password', {
      name: `/${projectName}/rds/password`,
      value: 'CHANGE_ME_AFTER_DEPLOYMENT', // Update this via AWS Console or CLI
      type: 'SecureString',
      description: 'RDS master password - UPDATE AFTER DEPLOYMENT',
      tags: commonTags,
    });

    const appApiKeyParam = new SsmParameter(this, 'app-api-key', {
      name: `/${projectName}/app/api-key`,
      value: 'PLACEHOLDER_API_KEY', // Update this via AWS Console or CLI
      type: 'SecureString',
      description: 'Application API key - UPDATE AFTER DEPLOYMENT',
      tags: commonTags,
    });

    // CloudWatch Agent Configuration
    const cwAgentConfig = new SsmParameter(this, 'cw-agent-config', {
      name: `/${projectName}/cloudwatch/agent-config`,
      value: JSON.stringify({
        metrics: {
          namespace: projectName,
          metrics_collected: {
            cpu: {
              measurement: [
                {
                  name: 'cpu_usage_idle',
                  rename: 'CPU_USAGE_IDLE',
                  unit: 'Percent',
                },
              ],
              totalcpu: false,
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: [
                {
                  name: 'used_percent',
                  rename: 'DISK_USED_PERCENT',
                  unit: 'Percent',
                },
              ],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: [
                {
                  name: 'mem_used_percent',
                  rename: 'MEM_USED_PERCENT',
                  unit: 'Percent',
                },
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
                  file_path: '/var/log/httpd/access_log',
                  log_group_name: `/aws/application/${projectName}`,
                  log_stream_name: '{instance_id}/httpd/access',
                },
                {
                  file_path: '/var/log/httpd/error_log',
                  log_group_name: `/aws/application/${projectName}`,
                  log_stream_name: '{instance_id}/httpd/error',
                },
              ],
            },
          },
        },
      }),
      type: 'String',
      description: 'CloudWatch agent configuration',
      tags: commonTags,
    });

    // RDS PostgreSQL Database
    const rds = new RdsConstruct(this, 'rds', {
      subnetIds: vpc.privateSubnets.map(s => s.id),
      securityGroupIds: [securityGroups.rdsSecurityGroup.id],
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      storageEncrypted: true,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      tags: commonTags,
    });

    // Application Load Balancer
    const alb = new AlbConstruct(this, 'alb', {
      vpcId: vpc.vpc.id,
      subnetIds: vpc.publicSubnets.map(s => s.id),
      securityGroupIds: [securityGroups.albSecurityGroup.id],
      tags: commonTags,
    });

    // Auto Scaling Group
    const asg = new AsgConstruct(this, 'asg', {
      vpcId: vpc.vpc.id,
      subnetIds: vpc.publicSubnets.map(s => s.id),
      securityGroupIds: [securityGroups.ec2SecurityGroup.id],
      targetGroupArns: [alb.targetGroup.arn],
      instanceProfile: iam.ec2InstanceProfile.name,
      instanceType: 't3.micro',
      amiId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 in us-east-1 - verify latest
      keyName: process.env.EC2_KEY_NAME, // Optional: specify SSH key name
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      tags: commonTags,
    });

    // Monitoring and Alerting
    const monitoring = new MonitoringConstruct(this, 'monitoring', {
      albArn: alb.alb.arn,
      asgName: asg.autoScalingGroup.name,
      rdsId: rds.dbInstance.id,
      tags: commonTags,
    });

    // CloudTrail for API activity logging
    const cloudtrail = new CloudTrailConstruct(this, 'cloudtrail', {
      tags: commonTags,
    });

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: alb.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS PostgreSQL endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'asg-name', {
      value: asg.autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'cloudwatch-log-group', {
      value: monitoring.logGroup.name,
      description: 'CloudWatch Log Group name',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: monitoring.snsTopic.arn,
      description: 'SNS Topic ARN for alerts',
    });

    new TerraformOutput(this, 'ssm-db-password-parameter', {
      value: dbPasswordParam.parameter.name,
      description: 'SSM parameter name for RDS password (update after deployment)',
    });

    new TerraformOutput(this, 'ssm-api-key-parameter', {
      value: appApiKeyParam.parameter.name,
      description: 'SSM parameter name for application API key (update after deployment)',
    });

    new TerraformOutput(this, 'cloudtrail-s3-bucket', {
      value: cloudtrail.bucket.id,
      description: 'S3 bucket for CloudTrail logs',
    });
  }
}
```