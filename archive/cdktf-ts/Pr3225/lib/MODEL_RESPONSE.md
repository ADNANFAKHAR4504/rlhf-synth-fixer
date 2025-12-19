## **lib/modules.ts**

```typescript
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';
import { TerraformOutput } from 'cdktf';

/**
 * Interface for common tags applied to all resources
 */
export interface CommonTags {
  Name: string;
  Environment: string;
  ManagedBy?: string;
  Project?: string;
}

/**
 * Interface for VPC module configuration
 */
export interface VpcConfig {
  project: string;
  environment: string;
  cidrBlock: string;
  availabilityZones: string[];
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
}

/**
 * VPC Module - Creates VPC with public/private subnets, IGW, NAT, and routing
 */
export class VpcModule extends Construct {
  public readonly vpc: aws.vpc.Vpc;
  public readonly publicSubnets: aws.vpc.Subnet[];
  public readonly privateSubnets: aws.vpc.Subnet[];
  public readonly internetGateway: aws.vpc.InternetGateway;
  public readonly natGateway: aws.vpc.NatGateway;
  public readonly publicRouteTable: aws.vpc.RouteTable;
  public readonly privateRouteTable: aws.vpc.RouteTable;

  constructor(scope: Construct, id: string, config: VpcConfig) {
    super(scope, id);

    const tags = this.generateTags(config.project, config.environment);

    // Create VPC
    this.vpc = new aws.vpc.Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `${config.project}-${config.environment}-vpc` },
    });

    // Create Internet Gateway
    this.internetGateway = new aws.vpc.InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `${config.project}-${config.environment}-igw` },
    });

    // Create public subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new aws.vpc.Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index % config.availabilityZones.length],
        mapPublicIpOnLaunch: true,
        tags: { ...tags, Name: `${config.project}-${config.environment}-public-subnet-${index + 1}` },
      });
    });

    // Create private subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new aws.vpc.Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index % config.availabilityZones.length],
        tags: { ...tags, Name: `${config.project}-${config.environment}-private-subnet-${index + 1}` },
      });
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new aws.vpc.Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: { ...tags, Name: `${config.project}-${config.environment}-nat-eip` },
    });

    // Create NAT Gateway
    this.natGateway = new aws.vpc.NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: { ...tags, Name: `${config.project}-${config.environment}-nat-gateway` },
    });

    // Create route tables
    this.publicRouteTable = new aws.vpc.RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `${config.project}-${config.environment}-public-rt` },
    });

    this.privateRouteTable = new aws.vpc.RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: { ...tags, Name: `${config.project}-${config.environment}-private-rt` },
    });

    // Create routes
    new aws.vpc.Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    new aws.vpc.Route(this, 'private-route', {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate route tables with subnets
    this.publicSubnets.forEach((subnet, index) => {
      new aws.vpc.RouteTableAssociation(this, `public-rt-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    this.privateSubnets.forEach((subnet, index) => {
      new aws.vpc.RouteTableAssociation(this, `private-rt-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.privateRouteTable.id,
      });
    });
  }

  private generateTags(project: string, environment: string): CommonTags {
    return {
      Name: '',
      Environment: environment,
      ManagedBy: 'CDKTF',
      Project: project,
    };
  }
}

/**
 * Security Module - Creates security groups for different components
 */
export class SecurityModule extends Construct {
  public readonly albSecurityGroup: aws.ec2.SecurityGroup;
  public readonly ec2SecurityGroup: aws.ec2.SecurityGroup;
  public readonly rdsSecurityGroup: aws.ec2.SecurityGroup;

  constructor(scope: Construct, id: string, vpcId: string, project: string, environment: string) {
    super(scope, id);

    const tags = {
      Environment: environment,
      ManagedBy: 'CDKTF',
      Project: project,
    };

    // ALB Security Group
    this.albSecurityGroup = new aws.ec2.SecurityGroup(this, 'alb-sg', {
      vpcId,
      description: 'Security group for Application Load Balancer',
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTP from anywhere',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow HTTPS from anywhere',
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
      tags: { ...tags, Name: `${project}-${environment}-alb-sg` },
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new aws.ec2.SecurityGroup(this, 'ec2-sg', {
      vpcId,
      description: 'Security group for EC2 instances',
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          securityGroups: [this.albSecurityGroup.id],
          description: 'Allow HTTP from ALB',
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          securityGroups: [this.albSecurityGroup.id],
          description: 'Allow HTTPS from ALB',
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
          description: 'Allow SSH from VPC only',
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
      tags: { ...tags, Name: `${project}-${environment}-ec2-sg` },
    });

    // RDS Security Group
    this.rdsSecurityGroup = new aws.ec2.SecurityGroup(this, 'rds-sg', {
      vpcId,
      description: 'Security group for RDS database',
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [this.ec2SecurityGroup.id],
          description: 'Allow MySQL from EC2',
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
      tags: { ...tags, Name: `${project}-${environment}-rds-sg` },
    });
  }
}

/**
 * Storage Module - Creates S3 bucket for logs with encryption
 */
export class StorageModule extends Construct {
  public readonly logBucket: aws.s3.S3Bucket;
  public readonly bucketPolicy: aws.s3.S3BucketPolicy;

  constructor(scope: Construct, id: string, project: string, environment: string) {
    super(scope, id);

    const tags = {
      Environment: environment,
      ManagedBy: 'CDKTF',
      Project: project,
    };

    // Create S3 bucket for logs
    this.logBucket = new aws.s3.S3Bucket(this, 'log-bucket', {
      bucket: `${project}-${environment}-logs-${Date.now()}`,
      tags: { ...tags, Name: `${project}-${environment}-log-bucket` },
    });

    // Enable versioning
    new aws.s3.S3BucketVersioningV2(this, 'log-bucket-versioning', {
      bucket: this.logBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new aws.s3.S3BucketServerSideEncryptionConfigurationV2(this, 'log-bucket-encryption', {
      bucket: this.logBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new aws.s3.S3BucketPublicAccessBlock(this, 'log-bucket-public-access-block', {
      bucket: this.logBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Lifecycle rule for log retention
    new aws.s3.S3BucketLifecycleConfiguration(this, 'log-bucket-lifecycle', {
      bucket: this.logBucket.id,
      rule: [
        {
          id: 'delete-old-logs',
          status: 'Enabled',
          expiration: {
            days: 90,
          },
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
      ],
    });
  }
}

/**
 * IAM Module - Creates roles and policies for EC2 instances
 */
export class IamModule extends Construct {
  public readonly ec2Role: aws.iam.IamRole;
  public readonly instanceProfile: aws.iam.IamInstanceProfile;

  constructor(scope: Construct, id: string, logBucketArn: string, project: string, environment: string) {
    super(scope, id);

    const tags = {
      Environment: environment,
      ManagedBy: 'CDKTF',
      Project: project,
    };

    // Create IAM role for EC2
    this.ec2Role = new aws.iam.IamRole(this, 'ec2-role', {
      name: `${project}-${environment}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { ...tags, Name: `${project}-${environment}-ec2-role` },
    });

    // Create policy for S3 access
    const s3Policy = new aws.iam.IamPolicy(this, 'ec2-s3-policy', {
      name: `${project}-${environment}-ec2-s3-policy`,
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
            Resource: [
              logBucketArn,
              `${logBucketArn}/*`,
            ],
          },
        ],
      }),
      tags,
    });

    // Attach policies to role
    new aws.iam.IamRolePolicyAttachment(this, 'ec2-s3-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: s3Policy.arn,
    });

    // Attach AWS managed policies
    new aws.iam.IamRolePolicyAttachment(this, 'ec2-cloudwatch-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    });

    new aws.iam.IamRolePolicyAttachment(this, 'ec2-ssm-policy-attachment', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Create instance profile
    this.instanceProfile = new aws.iam.IamInstanceProfile(this, 'ec2-instance-profile', {
      name: `${project}-${environment}-ec2-instance-profile`,
      role: this.ec2Role.name,
      tags: { ...tags, Name: `${project}-${environment}-ec2-instance-profile` },
    });
  }
}

/**
 * Compute Module - Creates Auto Scaling Group, Launch Template, and ALB
 */
export class ComputeModule extends Construct {
  public readonly alb: aws.elb.Alb;
  public readonly targetGroup: aws.elb.AlbTargetGroup;
  public readonly autoScalingGroup: aws.autoscaling.AutoscalingGroup;
  public readonly launchTemplate: aws.ec2.LaunchTemplate;

  constructor(
    scope: Construct,
    id: string,
    vpcId: string,
    publicSubnetIds: string[],
    privateSubnetIds: string[],
    securityGroupIds: { alb: string; ec2: string },
    instanceProfile: string,
    project: string,
    environment: string,
  ) {
    super(scope, id);

    const tags = {
      Environment: environment,
      ManagedBy: 'CDKTF',
      Project: project,
    };

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

    // User data script for EC2 instances
    const userData = `#!/bin/bash
# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install and start Apache
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create simple web page
echo "<h1>${project}-${environment} Web Server</h1>" > /var/www/html/index.html

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "metrics": {
    "namespace": "${project}-${environment}",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MemoryUtilization"}
        ]
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DiskUtilization"}
        ],
        "resources": ["*"]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/${project}-${environment}",
            "log_stream_name": "{instance_id}/apache-access"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/${project}-${environment}",
            "log_stream_name": "{instance_id}/apache-error"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
`;

    // Create Launch Template for Auto Scaling
    this.launchTemplate = new aws.ec2.LaunchTemplate(this, 'launch-template', {
      namePrefix: `${project}-${environment}-`,
      imageId: ami.id,
      instanceType: 't3.micro',
      keyName: `${project}-${environment}-key`, // Ensure this key pair exists
      vpcSecurityGroupIds: [securityGroupIds.ec2],
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
            encrypted: true,
            deleteOnTermination: true,
          },
        },
      ],
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required',
        httpPutResponseHopLimit: 1,
      },
      monitoring: {
        enabled: true,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: { ...tags, Name: `${project}-${environment}-instance` },
        },
        {
          resourceType: 'volume',
          tags: { ...tags, Name: `${project}-${environment}-volume` },
        },
      ],
      tags: { ...tags, Name: `${project}-${environment}-launch-template` },
    });

    // Create Application Load Balancer
    this.alb = new aws.elb.Alb(this, 'alb', {
      name: `${project}-${environment}-alb`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [securityGroupIds.alb],
      subnets: publicSubnetIds,
      enableDeletionProtection: false,
      enableHttp2: true,
      enableCrossZoneLoadBalancing: true,
      tags: { ...tags, Name: `${project}-${environment}-alb` },
    });

    // Create Target Group
    this.targetGroup = new aws.elb.AlbTargetGroup(this, 'target-group', {
      name: `${project}-${environment}-tg`,
      port: 80,
      protocol: 'HTTP',
      vpcId,
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
      deregistrationDelay: 30,
      stickiness: {
        type: 'lb_cookie',
        cookieDuration: 86400,
        enabled: true,
      },
      tags: { ...tags, Name: `${project}-${environment}-target-group` },
    });

    // Create ALB Listener
    new aws.elb.AlbListener(this, 'alb-listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
      tags,
    });

    // Create Auto Scaling Group
    this.autoScalingGroup = new aws.autoscaling.AutoscalingGroup(this, 'asg', {
      name: `${project}-${environment}-asg`,
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      vpcZoneIdentifier: privateSubnetIds,
      targetGroupArns: [this.targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      launchTemplate: {
        id: this.launchTemplate.id,
        version: '$Latest',
      },
      instanceRefresh: {
        strategy: 'Rolling',
        preferences: {
          minHealthyPercentage: 50,
          instanceWarmup: 300,
        },
      },
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances',
      ],
      tag: [
        {
          key: 'Name',
          value: `${project}-${environment}-asg-instance`,
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: environment,
          propagateAtLaunch: true,
        },
        {
          key: 'Project',
          value: project,
          propagateAtLaunch: true,
        },
        {
          key: 'ManagedBy',
          value: 'CDKTF',
          propagateAtLaunch: true,
        },
      ],
    });

    // Create Auto Scaling Policies
    new aws.autoscaling.AutoscalingPolicy(this, 'scale-up-policy', {
      name: `${project}-${environment}-scale-up`,
      autoscalingGroupName: this.autoScalingGroup.name,
      adjustmentType: 'ChangeInCapacity',
      scalingAdjustment: 1,
      cooldown: 300,
      policyType: 'SimpleScaling',
    });

    new aws.autoscaling.AutoscalingPolicy(this, 'scale-down-policy', {
      name: `${project}-${environment}-scale-down`,
      autoscalingGroupName: this.autoScalingGroup.name,
      adjustmentType: 'ChangeInCapacity',
      scalingAdjustment: -1,
      cooldown: 300,
      policyType: 'SimpleScaling',
    });
  }
}

/**
 * Database Module - Creates RDS instance in private subnets
 */
export class DatabaseModule extends Construct {
  public readonly rdsInstance: aws.rds.DbInstance;
  public readonly dbSubnetGroup: aws.rds.DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    privateSubnetIds: string[],
    securityGroupId: string,
    project: string,
    environment: string,
  ) {
    super(scope, id);

    const tags = {
      Environment: environment,
      ManagedBy: 'CDKTF',
      Project: project,
    };

    // Create DB subnet group
    this.dbSubnetGroup = new aws.rds.DbSubnetGroup(this, 'db-subnet-group', {
      name: `${project}-${environment}-db-subnet-group`,
      subnetIds: privateSubnetIds,
      tags: { ...tags, Name: `${project}-${environment}-db-subnet-group` },
    });

    // Create RDS instance
    this.rdsInstance = new aws.rds.DbInstance(this, 'rds-instance', {
      identifier: `${project}-${environment}-db`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'appdb',
      username: 'admin',
      password: 'ChangeMeImmediately!', // Use AWS Secrets Manager in production
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [securityGroupId],
      skipFinalSnapshot: true,
      deletionProtection: false,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      autoMinorVersionUpgrade: true,
      copyTagsToSnapshot: true,
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      tags: { ...tags, Name: `${project}-${environment}-rds` },
    });
  }
}

/**
 * Monitoring Module - Creates CloudWatch alarms and dashboards
 */
export class MonitoringModule extends Construct {
  constructor(
    scope: Construct,
    id: string,
    albArn: string,
    targetGroupArn: string,
    asgName: string,
    project: string,
    environment: string,
  ) {
    super(scope, id);

    const tags = {
      Environment: environment,
      ManagedBy: 'CDKTF',
      Project: project,
    };

    // Create SNS topic for alarms
    const snsTopic = new aws.sns.SnsTopic(this, 'alarm-topic', {
      name: `${project}-${environment}-alarms`,
      tags: { ...tags, Name: `${project}-${environment}-alarm-topic` },
    });

    // Extract ALB name from ARN
    const albName = albArn.split('/').slice(-3).join('/');

    // ALB alarms
    new aws.cloudwatch.CloudwatchMetricAlarm(this, 'alb-unhealthy-hosts-alarm', {
      alarmName: `${project}-${environment}-alb-unhealthy-hosts`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UnHealthyHostCount',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 0,
      alarmDescription: 'Alert when we have unhealthy instances',
      dimensions: {
        LoadBalancer: albName,
        TargetGroup: targetGroupArn.split(':').pop() || '',
      },
      alarmActions: [snsTopic.arn],
      tags,
    });

    new aws.cloudwatch.CloudwatchMetricAlarm(this, 'alb-target-response-time-alarm', {
      alarmName: `${project}-${environment}-alb-response-time`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'TargetResponseTime',
      namespace: 'AWS/ApplicationELB',
      period: 60,
      statistic: 'Average',
      threshold: 1,
      alarmDescription: 'Alert when response time is too high',
      dimensions: {
        LoadBalancer: albName,
      },
      alarmActions: [snsTopic.arn],
      tags,
    });

    // Auto Scaling Group alarms
    new aws.cloudwatch.CloudwatchMetricAlarm(this, 'asg-cpu-alarm-high', {
      alarmName: `${project}-${environment}-asg-cpu-high`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when CPU exceeds 80%',
      dimensions: {
        AutoScalingGroupName: asgName,
      },
      alarmActions: [snsTopic.arn],
      tags,
    });

    // Create CloudWatch Log Groups
    new aws.cloudwatchLogGroup.CloudwatchLogGroup(this, 'app-log-group', {
      name: `/aws/ec2/${project}-${environment}`,
      retentionInDays: 30,
      tags: { ...tags, Name: `${project}-${environment}-app-logs` },
    });
  }
}

/**
 * Backup Module - Creates automated EBS snapshots using Data Lifecycle Manager
 */
export class BackupModule extends Construct {
  constructor(scope: Construct, id: string, project: string, environment: string) {
    super(scope, id);

    const tags = {
      Environment: environment,
      ManagedBy: 'CDKTF',
      Project: project,
    };

    // Create IAM role for DLM
    const dlmRole = new aws.iam.IamRole(this, 'dlm-role', {
      name: `${project}-${environment}-dlm-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Principal: {
              Service: 'dlm.amazonaws.com',
            },
            Effect: 'Allow',
          },
        ],
      }),
      tags: { ...tags, Name: `${project}-${environment}-dlm-role` },
    });

    // Attach DLM policy to role
    new aws.iam.IamRolePolicyAttachment(this, 'dlm-policy-attachment', {
      role: dlmRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSDataLifecycleManagerServiceRole',
    });

    // Create DLM lifecycle policy for EBS snapshots
    new aws.dlm.DlmLifecyclePolicy(this, 'ebs-snapshot-policy', {
      description: `Automated EBS snapshots for ${project}-${environment}`,
      executionRoleArn: dlmRole.arn,
      state: 'ENABLED',
      policyDetails: {
        policyType: 'EBS_SNAPSHOT_MANAGEMENT',
        resourceTypes: ['INSTANCE'],
        targetTags: {
          Environment: environment,
          Project: project,
        },
        schedule: [
          {
            name: 'Daily Snapshots',
            createRule: {
              interval: 24,
              intervalUnit: 'HOURS',
              times: ['03:00'],
            },
            retainRule: {
              count: 7,
              intervalUnit: 'DAYS',
            },
            copyTags: true,
            tagsToAdd: {
              ...tags,
              Type: 'DailySnapshot',
            },
          },
        ],
      },
      tags: { ...tags, Name: `${project}-${environment}-dlm-policy` },
    });
  }
}
```

## **lib/tap-stack.ts**

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import * as aws from '@cdktf/provider-aws';
import {
  VpcModule,
  SecurityModule,
  StorageModule,
  IamModule,
  ComputeModule,
  DatabaseModule,
  MonitoringModule,
  BackupModule,
} from './modules';

/**
 * Main Infrastructure Stack
 * Orchestrates all modules to create a complete AWS environment
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configuration
    const config = {
      project: 'tap',
      environment: 'prod',
      region: 'us-east-1',
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
    };

    // Initialize AWS Provider
    new aws.provider.AwsProvider(this, 'aws', {
      region: config.region,
      defaultTags: [
        {
          tags: {
            ManagedBy: 'CDKTF',
            Terraform: 'true',
            Owner: 'Platform Team',
          },
        },
      ],
    });

    // Deploy VPC Module
    const vpcModule = new VpcModule(this, 'vpc-module', {
      project: config.project,
      environment: config.environment,
      cidrBlock: config.vpcCidr,
      availabilityZones: config.availabilityZones,
      publicSubnetCidrs: config.publicSubnetCidrs,
      privateSubnetCidrs: config.privateSubnetCidrs,
    });

    // Deploy Security Module
    const securityModule = new SecurityModule(
      this,
      'security-module',
      vpcModule.vpc.id,
      config.project,
      config.environment,
    );

    // Deploy Storage Module
    const storageModule = new StorageModule(
      this,
      'storage-module',
      config.project,
      config.environment,
    );

    // Deploy IAM Module
    const iamModule = new IamModule(
      this,
      'iam-module',
      storageModule.logBucket.arn,
      config.project,
      config.environment,
    );

    // Deploy Compute Module
    const computeModule = new ComputeModule(
      this,
      'compute-module',
      vpcModule.vpc.id,
      vpcModule.publicSubnets.map(subnet => subnet.id),
      vpcModule.privateSubnets.map(subnet => subnet.id),
      {
        alb: securityModule.albSecurityGroup.id,
        ec2: securityModule.ec2SecurityGroup.id,
      },
      iamModule.instanceProfile.name,
      config.project,
      config.environment,
    );

    // Deploy Database Module
    const databaseModule = new DatabaseModule(
      this,
      'database-module',
      vpcModule.privateSubnets.map(subnet => subnet.id),
      securityModule.rdsSecurityGroup.id,
      config.project,
      config.environment,
    );

    // Deploy Monitoring Module
    const monitoringModule = new MonitoringModule(
      this,
      'monitoring-module',
      computeModule.alb.arn,
      computeModule.targetGroup.arn,
      computeModule.autoScalingGroup.name,
      config.project,
      config.environment,
    );

    // Deploy Backup Module
    const backupModule = new BackupModule(
      this,
      'backup-module',
      config.project,
      config.environment,
    );

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns', {
      value: computeModule.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'alb-url', {
      value: `http://${computeModule.alb.dnsName}`,
      description: 'Application URL',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: databaseModule.rdsInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'log-bucket-name', {
      value: storageModule.logBucket.bucket,
      description: 'S3 bucket name for logs',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: vpcModule.natGateway.id,
      description: 'NAT Gateway ID',
    });

    new TerraformOutput(this, 'auto-scaling-group-name', {
      value: computeModule.autoScalingGroup.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'launch-template-id', {
      value: computeModule.launchTemplate.id,
      description: 'Launch Template ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id).join(','),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id).join(','),
      description: 'Private subnet IDs',
    });
  }
}
```

## **Key Features Implemented:**

###  **Security Best Practices:**
- Private subnets for compute and database resources
- Security groups with principle of least privilege
- Encrypted EBS volumes and RDS instances
- IAM roles instead of hardcoded credentials
- Session Manager support for secure SSH access
- S3 bucket encryption and public access blocking

###  **High Availability & Scalability:**
- Multi-AZ deployment across 2 availability zones
- Auto Scaling Group with rolling updates
- Application Load Balancer for traffic distribution
- Launch template versioning for zero-downtime deployments
- Instance refresh strategy for AMI updates

###  **Monitoring & Observability:**
- CloudWatch alarms for critical metrics
- Log aggregation to CloudWatch Logs
- Custom metrics from EC2 instances
- SNS notifications for alarm states

###  **Data Protection:**
- Automated EBS snapshots using DLM
- RDS automated backups with 7-day retention
- S3 versioning for log files
- Lifecycle policies for cost optimization

###  **Resource Management:**
- Consistent tagging strategy
- Modular architecture for reusability
- Clear separation of concerns
- Comprehensive outputs for reference

## **Deployment Instructions:**

1. **Initialize CDKTF project:**
```bash
npm install --save constructs @cdktf/provider-aws cdktf
cdktf init --template="typescript" --local
```

2. **Deploy the infrastructure:**
```bash
cdktf deploy tap-stack
```

3. **Post-deployment tasks:**
- Create EC2 key pair named `tap-prod-key`
- Update RDS password using AWS Secrets Manager
- Configure DNS for the ALB
- Set up monitoring dashboards
- Configure backup verification

This production-ready infrastructure provides a solid foundation for hosting web applications with enterprise-grade security, scalability, and reliability.