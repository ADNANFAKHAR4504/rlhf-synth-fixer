```typescript
// compute-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  environmentSuffix?: string;
}

export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix || 'dev';

    // CloudWatch Log Group for EC2 instances
    new logs.LogGroup(this, 'EC2LogGroup', {
      logGroupName: `/aws/ec2/secure-instances-${suffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: props.kmsKey,
    });

    // Create security groups for EC2 instances
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    const appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for application servers',
      allowAllOutbound: true,
    });

    // Allow HTTPS traffic from internet to web servers
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Allow HTTP traffic from web servers to app servers
    appSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow HTTP from web servers'
    );

    // Create IAM roles for EC2 instances with minimal privileges
    const webServerRole = new iam.Role(this, 'WebServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for web server instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    const appServerRole = new iam.Role(this, 'AppServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for application server instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add S3 read permissions for application servers
    appServerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          `arn:aws:s3:::secure-app-data-${suffix}-${cdk.Aws.ACCOUNT_ID}`,
          `arn:aws:s3:::secure-app-data-${suffix}-${cdk.Aws.ACCOUNT_ID}/*`,
        ],
      })
    );

    // Create launch templates with encrypted EBS volumes (not used directly, instances created inline)
    /* const webServerLaunchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        launchTemplateName: `secure-web-server-template-${suffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: webSecurityGroup,
        role: webServerRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: props.kmsKey,
            }),
          },
        ],
        userData: ec2.UserData.forLinux(),
      }
    ); */

    /* const appServerLaunchTemplate = new ec2.LaunchTemplate(
      this,
      'AppServerLaunchTemplate',
      {
        launchTemplateName: `secure-app-server-template-${suffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: appSecurityGroup,
        role: appServerRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: props.kmsKey,
            }),
          },
        ],
        userData: ec2.UserData.forLinux(),
      }
    ); */

    // Deploy EC2 instances across multiple AZs
    const webInstances = [];
    const appInstances = [];

    for (let i = 0; i < 2; i++) {
      // Web server instances
      const webInstance = new ec2.Instance(this, `WebServer${i}`, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [props.vpc.availabilityZones[i]],
        },
        securityGroup: webSecurityGroup,
        role: webServerRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: props.kmsKey,
            }),
          },
        ],
        userData: ec2.UserData.forLinux(),
      });
      webInstances.push(webInstance);

      // Application server instances
      const appInstance = new ec2.Instance(this, `AppServer${i}`, {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [props.vpc.availabilityZones[i]],
        },
        securityGroup: appSecurityGroup,
        role: appServerRole,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              volumeType: ec2.EbsDeviceVolumeType.GP3,
              encrypted: true,
              kmsKey: props.kmsKey,
            }),
          },
        ],
        userData: ec2.UserData.forLinux(),
      });
      appInstances.push(appInstance);
    }

    cdk.Tags.of(this).add('Component', 'Compute');
  }
}

```

```typescript
// monitoring-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
// import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  kmsKey: kms.Key;
  environmentSuffix?: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix || 'dev';

    // SNS topic for security alerts
    const alertTopic = new sns.Topic(this, 'SecurityAlertTopic', {
      displayName: 'Security Alerts',
      masterKey: props.kmsKey,
    });

    // CloudWatch dashboard for security metrics
    const securityDashboard = new cloudwatch.Dashboard(
      this,
      'SecurityDashboard',
      {
        dashboardName: `SecureInfrastructure-Monitoring-${suffix}`,
      }
    );

    // GuardDuty findings metric
    const guardDutyMetric = new cloudwatch.Metric({
      namespace: 'AWS/GuardDuty',
      metricName: 'FindingCount',
      statistic: 'Sum',
    });

    // Config compliance metric
    const configComplianceMetric = new cloudwatch.Metric({
      namespace: 'AWS/Config',
      metricName: 'ComplianceByConfigRule',
      statistic: 'Average',
    });

    // Create alarms
    new cloudwatch.Alarm(this, 'GuardDutyFindingsAlarm', {
      metric: guardDutyMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when GuardDuty detects threats',
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Add widgets to dashboard
    securityDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'GuardDuty Findings',
        left: [guardDutyMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Config Rule Compliance',
        left: [configComplianceMetric],
        width: 12,
      })
    );

    // Security log group
    new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: '/aws/security/audit',
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: props.kmsKey,
    });

    cdk.Tags.of(this).add('Component', 'Monitoring');
  }
}

```

```typescript
// networking-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkingStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets across 3 AZs
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 3,
      natGateways: 3,
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
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for network monitoring
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    cdk.Tags.of(this).add('Component', 'Networking');
  }
}

```

```typescript
// security-services-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class SecurityServicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Note: Many AWS security services (GuardDuty, Security Hub, Config) are often already enabled
    // at the organization level and cannot be re-enabled per stack/environment.
    // In this demo, we'll create placeholder resources to demonstrate the concept.

    // In production, you would:
    // 1. Check if services are already enabled at the org level
    // 2. If not, enable them once for the entire organization
    // 3. Use APIs to configure and monitor these services
    // 4. Import existing resources where possible

    // For demonstration purposes, we're adding tags to identify this as a security stack
    // In a real scenario, this stack would contain:
    // - GuardDuty configuration
    // - Security Hub standards enablement
    // - Config rules and remediation
    // - CloudTrail configuration
    // - AWS WAF rules
    // - Network Firewall rules

    cdk.Tags.of(this).add('Component', 'Security');
  }
}

```

```typescript
// security-stack.ts
import * as cdk from 'aws-cdk-lib';
// import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
// import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
  // public readonly certificate: certificatemanager.Certificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Note: ACM Certificate creation requires a valid domain name with DNS or email validation
    // Since we don't have a real domain, certificate creation is commented out
    // In production, you would:
    // 1. Have a real domain in Route53
    // 2. Use DNS validation (recommended) or email validation
    // 3. Create the certificate as shown in the commented code below

    /*
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'your-domain.com',
    });

    this.certificate = new certificatemanager.Certificate(this, 'SSLCertificate', {
      domainName: '*.your-domain.com',
      validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
    });
    */

    // For now, we'll just add tags to identify this as a security component
    // In a real scenario, this stack would contain certificates, WAF rules, etc.

    cdk.Tags.of(this).add('Component', 'Security');
    cdk.Tags.of(this).add('Note', 'Certificate creation requires valid domain');
  }
}

```

```typescript
// storage-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  environmentSuffix?: string;
}

export class StorageStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly dataBuckets: s3.Bucket[];
  public readonly accessLogBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix || 'dev';

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: `KMS key for securing storage resources - ${suffix}`,
      enableKeyRotation: true,
      pendingWindow: cdk.Duration.days(7),
    });

    // Allow CloudWatch Logs to use the KMS key
    this.kmsKey.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'Enable CloudWatch Logs',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal('logs.amazonaws.com')],
        actions: [
          'kms:Encrypt*',
          'kms:Decrypt*',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:Describe*',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`,
          },
        },
      })
    );

    // Create access logs bucket
    this.accessLogBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `secure-access-logs-${suffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: 'DeleteAccessLogs',
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create multiple S3 buckets with strict security
    this.dataBuckets = [];
    const bucketNames = ['app-data', 'backup-data', 'logs-data'];

    bucketNames.forEach((name, _index) => {
      const bucket = new s3.Bucket(this, `${name}-bucket`, {
        bucketName: `secure-${name}-${suffix}-${cdk.Aws.ACCOUNT_ID}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        serverAccessLogsBucket: this.accessLogBucket,
        serverAccessLogsPrefix: `access-logs/${name}/`,
        lifecycleRules: [
          {
            id: 'IntelligentTiering',
            transitions: [
              {
                storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                transitionAfter: cdk.Duration.days(1),
              },
            ],
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      // Deny all public access
      bucket.addToResourcePolicy(
        new cdk.aws_iam.PolicyStatement({
          sid: 'DenyPublicAccess',
          effect: cdk.aws_iam.Effect.DENY,
          principals: [new cdk.aws_iam.AnyPrincipal()],
          actions: ['s3:*'],
          resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
          conditions: {
            Bool: {
              'aws:SecureTransport': 'false',
            },
          },
        })
      );

      this.dataBuckets.push(bucket);
    });

    // Create RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: `Subnet group for RDS databases - ${suffix}`,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create RDS security group
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for RDS databases',
        allowAllOutbound: false,
      }
    );

    // Create multiple RDS instances with encryption
    const databaseConfigs = [
      {
        id: 'primary',
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
      },
      {
        id: 'secondary',
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
      },
    ];

    databaseConfigs.forEach(config => {
      new rds.DatabaseInstance(this, `Database${config.id}`, {
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Add this line
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_7,
        }),
        instanceType: config.instanceType,
        credentials: rds.Credentials.fromGeneratedSecret('postgres', {
          secretName: `rds-credentials-${config.id}-${suffix}`,
        }),
        vpc: props.vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: this.kmsKey,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        deletionProtection: false,
        multiAz: false, // Set to false to reduce deployment time
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        monitoringInterval: cdk.Duration.seconds(60),
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: this.kmsKey,
      });
    });

    cdk.Tags.of(this).add('Component', 'Storage');
  }
}

```

```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import security infrastructure stacks
import { ComputeStack } from './compute-stack';
import { MonitoringStack } from './monitoring-stack';
import { NetworkingStack } from './networking-stack';
import { SecurityServicesStack } from './security-services-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  stackName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create networking infrastructure first
    const networkingStack = new NetworkingStack(
      this,
      `NetworkingStack${environmentSuffix}`,
      {
        env: props?.env,
        stackName: `NetworkingStack${environmentSuffix}`,
        description: `Networking infrastructure for ${environmentSuffix} environment`,
      }
    );

    // Create security services
    new SecurityServicesStack(
      this,
      `SecurityServicesStack${environmentSuffix}`,
      {
        env: props?.env,
        stackName: `SecurityServicesStack${environmentSuffix}`,
        description: `Security services for ${environmentSuffix} environment`,
      }
    );

    // Create storage with encryption
    const storageStack = new StorageStack(
      this,
      `StorageStack${environmentSuffix}`,
      {
        vpc: networkingStack.vpc,
        env: props?.env,
        stackName: `StorageStack${environmentSuffix}`,
        environmentSuffix: environmentSuffix,
        description: `Storage resources for ${environmentSuffix} environment`,
      }
    );

    // Create compute infrastructure
    const computeStack = new ComputeStack(
      this,
      `ComputeStack${environmentSuffix}`,
      {
        vpc: networkingStack.vpc,
        kmsKey: storageStack.kmsKey,
        env: props?.env,
        stackName: `ComputeStack${environmentSuffix}`,
        environmentSuffix: environmentSuffix,
        description: `Compute resources for ${environmentSuffix} environment`,
      }
    );

    // Create monitoring and alerting
    const monitoringStack = new MonitoringStack(
      this,
      `MonitoringStack${environmentSuffix}`,
      {
        kmsKey: storageStack.kmsKey,
        env: props?.env,
        stackName: `MonitoringStack${environmentSuffix}`,
        environmentSuffix: environmentSuffix,
        description: `Monitoring infrastructure for ${environmentSuffix} environment`,
      }
    );

    // Create security certificates
    new SecurityStack(this, `SecurityStack${environmentSuffix}`, {
      env: props?.env,
      stackName: `SecurityStack${environmentSuffix}`,
      description: `Security certificates for ${environmentSuffix} environment`,
    });

    // Set up dependencies
    storageStack.addDependency(networkingStack);
    computeStack.addDependency(networkingStack);
    computeStack.addDependency(storageStack);
    monitoringStack.addDependency(storageStack);

    // Export stack outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VPCId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: storageStack.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `KMSKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for this deployment',
      exportName: `EnvironmentSuffix-${environmentSuffix}`,
    });
  }
}

```