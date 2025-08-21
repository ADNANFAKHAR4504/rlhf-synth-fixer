```typescript
// compute-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  instanceRole: iam.Role;
  kmsKey: kms.Key;
}

export class ComputeStack extends cdk.NestedStack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Instance profile for EC2
    new iam.CfnInstanceProfile(
      this,
      `${props.environmentSuffix}-instance-profile`,
      {
        instanceProfileName: `${props.environmentSuffix}-instance-profile`,
        roles: [props.instanceRole.roleName],
      }
    );

    // Launch template with encrypted EBS volumes
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `${props.environmentSuffix}-launch-template`,
      {
        launchTemplateName: `${props.environmentSuffix}-launch-template`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        securityGroup: props.securityGroup,
        role: props.instanceRole,
        userData: ec2.UserData.forLinux(),
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: props.kmsKey,
              volumeType: ec2.EbsDeviceVolumeType.GP3,
            }),
          },
        ],
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      `${props.environmentSuffix}-asg`,
      {
        autoScalingGroupName: `${props.environmentSuffix}-asg`,
        vpc: props.vpc,
        launchTemplate: launchTemplate,
        minCapacity: 1,
        maxCapacity: 3,
        desiredCapacity: 2,
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `${props.environmentSuffix}-alb`,
      {
        loadBalancerName: `${props.environmentSuffix}-alb`,
        vpc: props.vpc,
        internetFacing: true,
        securityGroup: props.securityGroup,
      }
    );

    // Target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `${props.environmentSuffix}-tg`,
      {
        targetGroupName: `${props.environmentSuffix}-tg`,
        vpc: props.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [autoScalingGroup],
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 2,
        },
      }
    );

    // ALB Listener
    this.loadBalancer.addListener(`${props.environmentSuffix}-listener`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });
  }
}

```

```typescript
// data-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface DataStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  cloudTrailBucket: s3.Bucket;
}

export class DataStack extends cdk.NestedStack {
  public readonly database: rds.DatabaseInstance;
  public readonly applicationBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // RDS subnet group
    const subnetGroup = new rds.SubnetGroup(
      this,
      `${props.environmentSuffix}-subnet-group`,
      {
        subnetGroupName: `${props.environmentSuffix}-subnet-group`,
        description: 'Subnet group for RDS database',
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // RDS instance with encryption
    this.database = new rds.DatabaseInstance(
      this,
      `${props.environmentSuffix}-database`,
      {
        instanceIdentifier: `${props.environmentSuffix}-database`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc: props.vpc,
        subnetGroup: subnetGroup,
        storageEncrypted: true,
        storageEncryptionKey: props.kmsKey,
        multiAz: false,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Application S3 bucket with security policies
    this.applicationBucket = new s3.Bucket(
      this,
      `${props.environmentSuffix}-app-bucket`,
      {
        bucketName: `${props.environmentSuffix}-app-bucket-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: props.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'IntelligentTiering',
            enabled: true,
            transitions: [
              {
                storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                transitionAfter: cdk.Duration.days(1),
              },
            ],
          },
        ],
      }
    );

    // Bucket policy to prevent public PUT operations
    this.applicationBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyPublicPutObject',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:DeleteObject'],
        resources: [this.applicationBucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            'aws:PrincipalServiceName': [
              'ec2.amazonaws.com',
              'lambda.amazonaws.com',
            ],
          },
        },
      })
    );
  }
}

```

```typescript
// monitoring-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  snsTopicArn: string;
}

export class MonitoringStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const alertTopic = sns.Topic.fromTopicArn(
      this,
      'AlertTopic',
      props.snsTopicArn
    );

    // CloudWatch alarms for security monitoring
    const securityAlarm = new cloudwatch.Alarm(
      this,
      `${props.environmentSuffix}-security-alarm`,
      {
        alarmName: `${props.environmentSuffix}-security-events`,
        alarmDescription: 'Alarm for security events from GuardDuty',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/GuardDuty',
          metricName: 'FindingCount',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );

    securityAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // Multi-region GuardDuty setup (using custom resource or manual setup)
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1'];
    regions.forEach((region, _index) => {
      if (region !== cdk.Stack.of(this).region) {
        // Note: For multi-region GuardDuty, you would need to deploy separate stacks
        // or use a custom resource. This is a placeholder for the concept.
        new cdk.CfnOutput(this, `GuardDutyRegion${_index}`, {
          value: `GuardDuty should be enabled in ${region}`,
          description: `Manual setup required for GuardDuty in ${region}`,
        });
      }
    });
  }
}

```

```typescript
// network-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface NetworkStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
}

export class NetworkStack extends cdk.NestedStack {
  public readonly vpc: ec2.Vpc;
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // VPC
    this.vpc = new ec2.Vpc(this, `${props.environmentSuffix}-vpc`, {
      vpcName: `${props.environmentSuffix}-vpc`,
      maxAzs: 3,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security group for ALB
    this.albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.environmentSuffix}-alb-sg`,
      {
        vpc: this.vpc,
        securityGroupName: `${props.environmentSuffix}-alb-sg`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security group for EC2 instances - restrictive SSH access
    this.ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.environmentSuffix}-ec2-sg`,
      {
        vpc: this.vpc,
        securityGroupName: `${props.environmentSuffix}-ec2-sg`,
        description:
          'Security group for EC2 instances with restricted SSH access',
        allowAllOutbound: true,
      }
    );

    // Only allow SSH from specific IP ranges (replace with your actual IPs)
    const allowedSshIps = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];

    allowedSshIps.forEach(ipRange => {
      this.ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(22),
        `Allow SSH from ${ipRange}`
      );
    });

    // Allow HTTP traffic from ALB
    this.ec2SecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Security group for RDS
    this.rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `${props.environmentSuffix}-rds-sg`,
      {
        vpc: this.vpc,
        securityGroupName: `${props.environmentSuffix}-rds-sg`,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2'
    );
  }
}

```

```typescript
// security-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
}

export class SecurityStack extends cdk.NestedStack {
  public readonly kmsKey: kms.Key;
  public readonly ec2Role: iam.Role;
  public readonly cloudTrailBucket: s3.Bucket;
  public readonly securityAlertsTopic: sns.Topic;
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    this.kmsKey = new kms.Key(this, `${props.environmentSuffix}-security-key`, {
      alias: `${props.environmentSuffix}-security-key`,
      description: `KMS key for ${props.environmentSuffix} environment encryption`,
      enableKeyRotation: true,
      pendingWindow: cdk.Duration.days(7),
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: ['kms:GenerateDataKey*', 'kms:DescribeKey', 'kms:Decrypt'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // S3 bucket for CloudTrail logs with security policies
    this.cloudTrailBucket = new s3.Bucket(
      this,
      `${props.environmentSuffix}-cloudtrail-logs`,
      {
        bucketName: `${props.environmentSuffix}-cloudtrail-logs-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'DeleteOldVersions',
            expiredObjectDeleteMarker: true,
            noncurrentVersionExpiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Bucket policy to prevent public PUT operations
    this.cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyPublicPut',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [this.cloudTrailBucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            'aws:PrincipalServiceName': ['cloudtrail.amazonaws.com'],
          },
        },
      })
    );

    // CloudTrail with encryption
    new cloudtrail.Trail(this, `${props.environmentSuffix}-cloudtrail`, {
      trailName: `${props.environmentSuffix}-security-trail`,
      bucket: this.cloudTrailBucket,
      encryptionKey: this.kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
    });

    // IAM role for EC2 instances with read-only S3 permissions
    this.ec2Role = new iam.Role(this, `${props.environmentSuffix}-ec2-role`, {
      roleName: `${props.environmentSuffix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        S3ReadOnlyPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // SNS topic for security alerts with restricted access
    this.securityAlertsTopic = new sns.Topic(
      this,
      `${props.environmentSuffix}-security-alerts`,
      {
        topicName: `${props.environmentSuffix}-security-alerts`,
        masterKey: this.kmsKey,
      }
    );

    this.securityAlertsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAWSServices',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal('guardduty.amazonaws.com'),
          new iam.ServicePrincipal('securityhub.amazonaws.com'),
          new iam.ServicePrincipal('cloudwatch.amazonaws.com'),
        ],
        actions: ['sns:Publish'],
        resources: [this.securityAlertsTopic.topicArn],
      })
    );

    // GuardDuty detector
    new guardduty.CfnDetector(this, `${props.environmentSuffix}-guardduty`, {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
    });

    // Security Hub
    new securityhub.CfnHub(this, `${props.environmentSuffix}-security-hub`, {
      enableDefaultStandards: true,
    });

    // Output to indicate GuardDuty and Security Hub should be enabled
    new cdk.CfnOutput(this, 'GuardDutyStatus', {
      value: 'GuardDuty is enabled in the account',
      description: 'GuardDuty detector monitoring for security threats',
    });

    new cdk.CfnOutput(this, 'SecurityHubStatus', {
      value: 'Security Hub is enabled in the account',
      description: 'Security Hub for centralized security management',
    });

    // WAF Web ACL for application load balancer
    this.webAcl = new wafv2.CfnWebACL(
      this,
      `${props.environmentSuffix}-web-acl`,
      {
        name: `${props.environmentSuffix}-web-acl`,
        scope: 'REGIONAL',
        defaultAction: { allow: {} },
        rules: [
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 1,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'CommonRuleSetMetric',
            },
          },
          {
            name: 'AWSManagedRulesKnownBadInputsRuleSet',
            priority: 2,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'KnownBadInputsMetric',
            },
          },
          {
            name: 'AWSManagedRulesSQLiRuleSet',
            priority: 3,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesSQLiRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              sampledRequestsEnabled: true,
              cloudWatchMetricsEnabled: true,
              metricName: 'SQLiRuleSetMetric',
            },
          },
        ],
        visibilityConfig: {
          sampledRequestsEnabled: true,
          cloudWatchMetricsEnabled: true,
          metricName: `${props.environmentSuffix}WebAcl`,
        },
      }
    );

    // IAM users with MFA requirement
    const securityGroup = new iam.Group(
      this,
      `${props.environmentSuffix}-security-group`
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowViewAccountInfo',
        effect: iam.Effect.ALLOW,
        actions: ['iam:GetAccountPasswordPolicy', 'iam:ListVirtualMFADevices'],
        resources: ['*'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowManageOwnPasswords',
        effect: iam.Effect.ALLOW,
        actions: ['iam:ChangePassword', 'iam:GetUser'],
        resources: ['arn:aws:iam::*:user/${aws:username}'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowManageOwnAccessKeys',
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:CreateAccessKey',
          'iam:DeleteAccessKey',
          'iam:ListAccessKeys',
          'iam:UpdateAccessKey',
        ],
        resources: ['arn:aws:iam::*:user/${aws:username}'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowManageOwnVirtualMFADevice',
        effect: iam.Effect.ALLOW,
        actions: ['iam:CreateVirtualMFADevice', 'iam:DeleteVirtualMFADevice'],
        resources: ['arn:aws:iam::*:mfa/${aws:username}'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowManageOwnUserMFA',
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:DeactivateMFADevice',
          'iam:EnableMFADevice',
          'iam:ListMFADevices',
          'iam:ResyncMFADevice',
        ],
        resources: ['arn:aws:iam::*:user/${aws:username}'],
      })
    );

    securityGroup.addToPolicy(
      new iam.PolicyStatement({
        sid: 'DenyAllExceptUnlessSignedInWithMFA',
        effect: iam.Effect.DENY,
        notActions: [
          'iam:CreateVirtualMFADevice',
          'iam:EnableMFADevice',
          'iam:GetUser',
          'iam:ListMFADevices',
          'iam:ListVirtualMFADevices',
          'iam:ResyncMFADevice',
          'sts:GetSessionToken',
        ],
        resources: ['*'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );
  }
}

```

```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const stackName = this.stackName;

    // Create VPC with public and private subnets across 2 AZs
    const vpc = new ec2.Vpc(this, 'WebAppVPC', {
      vpcName: `webapp-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      securityGroupName: `alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      securityGroupName: `ec2-sg-${environmentSuffix}`,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow app port from ALB'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      securityGroupName: `rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from EC2 instances'
    );

    // IAM Role for EC2 instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
    });

    // User data script for EC2 instances
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web App Server</h1>" > /var/www/html/index.html',
      'echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html'
    );

    // Launch Template for Auto Scaling
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebAppLaunchTemplate',
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        userData,
        role: ec2Role,
      }
    );

    // Auto Scaling Group
    const autoScalingGroup = new autoscaling.AutoScalingGroup(
      this,
      'WebAppASG',
      {
        vpc,
        autoScalingGroupName: `webapp-asg-${environmentSuffix}`,
        launchTemplate,
        minCapacity: 2,
        maxCapacity: 6,
        desiredCapacity: 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.minutes(5),
        }),
      }
    );

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      vpc,
      loadBalancerName: `webapp-alb-${environmentSuffix}`,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target Group for ALB
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebAppTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          path: '/',
          interval: cdk.Duration.seconds(30),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 5,
        },
      }
    );

    // Attach Auto Scaling Group to Target Group
    autoScalingGroup.attachToApplicationTargetGroup(targetGroup);

    // ALB Listener
    alb.addListener('WebAppListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // RDS Subnet Group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Database Instance
    const database = new rds.DatabaseInstance(this, 'WebAppDatabase', {
      databaseName: `webappdb${environmentSuffix}`.replace(/-/g, ''),
      instanceIdentifier: `webapp-db-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      credentials: rds.Credentials.fromGeneratedSecret('admin'),
      multiAz: true,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      deleteAutomatedBackups: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Must be false for destroyable resources
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Ensure resource can be destroyed
      securityGroups: [rdsSecurityGroup],
      subnetGroup,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'DefaultParameterGroup',
        'default.mysql8.0'
      ),
    });

    // Auto Scaling Policies
    autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `${stackName}-LoadBalancerDNS`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerArn', {
      value: alb.loadBalancerArn,
      description: 'Application Load Balancer ARN',
      exportName: `${stackName}-LoadBalancerArn`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `${stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.instanceEndpoint.port.toString(),
      description: 'RDS database port',
      exportName: `${stackName}-DatabasePort`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${stackName}-VPCId`,
    });

    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value: autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `${stackName}-AutoScalingGroupName`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `${stackName}-EnvironmentSuffix`,
    });
  }
}

```