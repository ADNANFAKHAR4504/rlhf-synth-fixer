import { Construct } from 'constructs';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

// Data Sources
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// Security Groups
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

// IAM
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';

// EC2 & Auto Scaling
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';

// Load Balancer
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';

// Monitoring
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// S3
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

// SNS
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';

// Secrets Manager
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { Fn } from 'cdktf';

export interface StandardTags {
  Environment: string;
  [key: string]: string;
}

export interface NetworkingModuleProps {
  region: string;
  standardTags: StandardTags;
}

export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly availabilityZones: DataAwsAvailabilityZones;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, props: NetworkingModuleProps) {
    super(scope, id);

    // Get availability zones
    this.availabilityZones = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.standardTags,
        Name: 'tap-vpc',
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...props.standardTags,
        Name: 'tap-igw',
      },
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        ...props.standardTags,
        Name: 'tap-public-route-table',
      },
    });

    // Create route to Internet Gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Create subnets
    const publicSubnets: Subnet[] = [];
    const privateSubnets: Subnet[] = [];

    // Create 2 public and 2 private subnets
    const azs = Fn.element(this.availabilityZones.names, 0);
    const azs2 = Fn.element(this.availabilityZones.names, 1);

    // Public Subnet 1
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: azs,
      mapPublicIpOnLaunch: true,
      tags: {
        ...props.standardTags,
        Name: 'tap-public-subnet-1',
      },
    });
    publicSubnets.push(publicSubnet1);

    // Public Subnet 2
    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: azs2,
      mapPublicIpOnLaunch: true,
      tags: {
        ...props.standardTags,
        Name: 'tap-public-subnet-2',
      },
    });
    publicSubnets.push(publicSubnet2);

    // Private Subnet 1
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: azs,
      tags: {
        ...props.standardTags,
        Name: 'tap-private-subnet-1',
      },
    });
    privateSubnets.push(privateSubnet1);

    // Private Subnet 2
    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: azs2,
      tags: {
        ...props.standardTags,
        Name: 'tap-private-subnet-2',
      },
    });
    privateSubnets.push(privateSubnet2);

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Set subnet IDs
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);
    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
  }
}

export interface SecurityGroupsModuleProps {
  vpcId: string;
  standardTags: StandardTags;
}

export class SecurityGroupsModule extends Construct {
  public readonly albSecurityGroup: SecurityGroup;
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsModuleProps) {
    super(scope, id);

    // ALB Security Group
    this.albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: 'tap-alb-security-group',
      description: 'Security group for Application Load Balancer',
      vpcId: props.vpcId,
      tags: {
        ...props.standardTags,
        Name: 'tap-alb-security-group',
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.albSecurityGroup.id,
    });

    // EC2 Security Group
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: 'tap-ec2-security-group',
      description: 'Security group for EC2 instances',
      vpcId: props.vpcId,
      tags: {
        ...props.standardTags,
        Name: 'tap-ec2-security-group',
      },
    });

    new SecurityGroupRule(this, 'ec2-ingress-alb', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: this.albSecurityGroup.id,
      securityGroupId: this.ec2SecurityGroup.id,
    });

    new SecurityGroupRule(this, 'ec2-ingress-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/8'],
      securityGroupId: this.ec2SecurityGroup.id,
    });

    new SecurityGroupRule(this, 'ec2-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: 'tap-rds-security-group',
      description: 'Security group for RDS instance',
      vpcId: props.vpcId,
      tags: {
        ...props.standardTags,
        Name: 'tap-rds-security-group',
      },
    });

    new SecurityGroupRule(this, 'rds-ingress-ec2', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
    });
  }
}

export interface IamModuleProps {
  standardTags: StandardTags;
  environmentSuffix?: string; // Add this
}

// Update the IamModule constructor
export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    // Create unique name with suffix
    const suffix = props.environmentSuffix || 'default';
    const roleName = `tap-ec2-role-${suffix}`;
    const profileName = `tap-ec2-instance-profile-${suffix}`;

    // EC2 IAM Role with unique name
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: roleName, // Use unique name
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
      tags: props.standardTags,
    });

    // EC2 IAM Role Policy
    new IamRolePolicy(this, 'ec2-policy', {
      name: `tap-ec2-policy-${suffix}`, // Make this unique too
      role: this.ec2Role.id,
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
            Resource: 'arn:aws:logs:*:*:*',
          },
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: 'arn:aws:s3:::tap-logs-bucket/*',
          },
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: 'arn:aws:secretsmanager:*:*:secret:tap-rds-credentials-*',
          },
        ],
      }),
    });

    // Instance Profile with unique name
    this.instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: profileName, // Use unique name
        role: this.ec2Role.name,
      }
    );
  }
}

export interface AutoScalingModuleProps {
  subnetIds: string[];
  securityGroupId: string;
  instanceProfileName: string;
  targetGroupArn: string;
  standardTags: StandardTags;
}

export class AutoScalingModule extends Construct {
  public readonly autoScalingGroup: AutoscalingGroup;
  public readonly scaleUpPolicy: AutoscalingPolicy;
  public readonly scaleDownPolicy: AutoscalingPolicy;

  constructor(scope: Construct, id: string, props: AutoScalingModuleProps) {
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

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: 'tap-launch-template',
      imageId: ami.id,
      instanceType: 't3.micro',
      // keyName: 'compute-key1',
      vpcSecurityGroupIds: [props.securityGroupId],
      iamInstanceProfile: {
        name: props.instanceProfileName,
      },
      userData: Buffer.from(
        `#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>TAP Application Server</h1>" > /var/www/html/index.html
        
        # Install CloudWatch agent
        yum install -y amazon-cloudwatch-agent
        
        # Configure detailed monitoring
        /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
      `
      ).toString('base64'),
      monitoring: {
        enabled: true,
      },
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            ...props.standardTags,
            Name: 'tap-web-server',
          },
        },
      ],
    });

    // Auto Scaling Group
    this.autoScalingGroup = new AutoscalingGroup(this, 'asg', {
      name: 'tap-auto-scaling-group',
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      minSize: 2,
      maxSize: 6,
      desiredCapacity: 2,
      vpcZoneIdentifier: props.subnetIds,
      targetGroupArns: [props.targetGroupArn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      enabledMetrics: [
        'GroupMinSize',
        'GroupMaxSize',
        'GroupDesiredCapacity',
        'GroupInServiceInstances',
        'GroupTotalInstances',
      ],
      tag: Object.entries(props.standardTags).map(([key, value]) => ({
        key,
        value,
        propagateAtLaunch: true,
      })),
    });

    // Scale Up Policy
    this.scaleUpPolicy = new AutoscalingPolicy(this, 'scale-up-policy', {
      name: 'tap-scale-up-policy',
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: 'SimpleScaling',
    });

    // Scale Down Policy
    this.scaleDownPolicy = new AutoscalingPolicy(this, 'scale-down-policy', {
      name: 'tap-scale-down-policy',
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: this.autoScalingGroup.name,
      policyType: 'SimpleScaling',
    });
  }
}

export interface LoadBalancerModuleProps {
  subnetIds: string[];
  securityGroupId: string;
  vpcId: string;
  standardTags: StandardTags;
}

export class LoadBalancerModule extends Construct {
  public readonly loadBalancer: Lb;
  public readonly targetGroup: LbTargetGroup;

  constructor(scope: Construct, id: string, props: LoadBalancerModuleProps) {
    super(scope, id);

    // Application Load Balancer
    this.loadBalancer = new Lb(this, 'alb', {
      name: 'tap-application-load-balancer',
      loadBalancerType: 'application',
      subnets: props.subnetIds,
      securityGroups: [props.securityGroupId],
      enableDeletionProtection: false,
      tags: {
        ...props.standardTags,
        Name: 'tap-application-load-balancer',
      },
    });

    // Target Group
    this.targetGroup = new LbTargetGroup(this, 'target-group', {
      name: 'tap-target-group',
      port: 80,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        path: '/',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      tags: props.standardTags,
    });

    // Listener
    new LbListener(this, 'listener', {
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
  }
}

export interface CloudWatchModuleProps {
  autoScalingGroupName: string;
  scaleUpPolicyArn: string;
  scaleDownPolicyArn: string;
  snsTopicArn: string;
  standardTags: StandardTags;
}

export class CloudWatchModule extends Construct {
  constructor(scope: Construct, id: string, props: CloudWatchModuleProps) {
    super(scope, id);

    // High CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'high-cpu-alarm', {
      alarmName: 'tap-high-cpu-utilization',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/AutoScaling',
      period: 120,
      statistic: 'Average',
      threshold: 70,
      alarmDescription: 'This metric monitors EC2 cpu utilization',
      alarmActions: [props.scaleUpPolicyArn, props.snsTopicArn],
      dimensions: {
        AutoScalingGroupName: props.autoScalingGroupName,
      },
      tags: props.standardTags,
    });

    // Low CPU Utilization Alarm
    new CloudwatchMetricAlarm(this, 'low-cpu-alarm', {
      alarmName: 'tap-low-cpu-utilization',
      comparisonOperator: 'LessThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/AutoScaling',
      period: 120,
      statistic: 'Average',
      threshold: 20,
      alarmDescription:
        'This metric monitors EC2 cpu utilization for scale down',
      alarmActions: [props.scaleDownPolicyArn, props.snsTopicArn],
      dimensions: {
        AutoScalingGroupName: props.autoScalingGroupName,
      },
      tags: props.standardTags,
    });
  }
}

export interface RdsModuleProps {
  subnetIds: string[];
  securityGroupId: string;
  standardTags: StandardTags;
}
export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly secret: SecretsmanagerSecret;
  public readonly monitoringRole: IamRole;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    // Create IAM role for RDS enhanced monitoring
    this.monitoringRole = new IamRole(this, 'rds-monitoring-role', {
      name: 'tap-rds-enhanced-monitoring-role',
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
      tags: props.standardTags,
    });

    // Attach the AWS managed policy for RDS enhanced monitoring
    new IamRolePolicyAttachment(this, 'rds-monitoring-policy-attachment', {
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      role: this.monitoringRole.name,
    });

    // DB Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'tap-db-subnet-group-tts',
      subnetIds: props.subnetIds,
      description: 'Database subnet group for TAP',
      tags: props.standardTags,
    });

    // RDS Instance with AWS managed password and enhanced monitoring
    this.dbInstance = new DbInstance(this, 'rds-instance', {
      identifier: 'tap-database',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: 'gp2',
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      dbName: 'tapdb',
      username: 'admin',
      manageMasterUserPassword: true,
      masterUserSecretKmsKeyId: 'alias/aws/secretsmanager',
      vpcSecurityGroupIds: [props.securityGroupId],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: true,
      storageEncrypted: true,
      monitoringInterval: 60,
      monitoringRoleArn: this.monitoringRole.arn, // Add this line
      performanceInsightsEnabled: false,
      deletionProtection: false,
      skipFinalSnapshot: true,
      tags: {
        ...props.standardTags,
        Name: 'tap-database',
      },
    });
  }
}

export interface S3ModuleProps {
  standardTags: StandardTags;
}

export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    // S3 Bucket for logs
    this.bucket = new S3Bucket(this, 'logs-bucket', {
      bucket: 'tap-logs-bucket-tss',
      tags: {
        ...props.standardTags,
        Name: 'tap-logs-bucket',
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

export interface SnsModuleProps {
  email: string;
  standardTags: StandardTags;
}

export class SnsModule extends Construct {
  public readonly topic: SnsTopic;

  constructor(scope: Construct, id: string, props: SnsModuleProps) {
    super(scope, id);

    // SNS Topic
    this.topic = new SnsTopic(this, 'alerts-topic', {
      name: 'tap-cloudwatch-alerts',
      displayName: 'TAP CloudWatch Alerts',
      tags: props.standardTags,
    });

    // SNS Topic Subscription
    new SnsTopicSubscription(this, 'email-subscription', {
      topicArn: this.topic.arn,
      protocol: 'email',
      endpoint: props.email,
    });
  }
}
