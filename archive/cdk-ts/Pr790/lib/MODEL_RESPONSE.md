# Secure Cloud Infrastructure Implementation

I'll create a comprehensive secure cloud infrastructure using CDK TypeScript that meets all your requirements. Here's the complete implementation:

## File: lib/networking-stack.ts

```typescript
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

## File: lib/security-services-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class SecurityServicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Enable GuardDuty
    const guardDutyDetector = new guardduty.CfnDetector(this, 'GuardDutyDetector', {
      enable: true,
      findingPublishingFrequency: 'FIFTEEN_MINUTES',
      dataSources: {
        s3Logs: {
          enable: true,
        },
        kubernetesAuditLogs: {
          enable: true,
        },
        malwareProtection: {
          scanEc2InstanceWithFindings: {
            ebsVolumes: true,
          },
        },
      },
    });

    // Enable Security Hub
    const securityHub = new securityhub.CfnHub(this, 'SecurityHub', {
      autoEnableControls: true,
      controlFindingGenerator: 'STANDARD_CONTROL',
    });

    // Config Configuration Recorder
    const configRole = new iam.Role(this, 'ConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    const configBucket = new cdk.aws_s3.Bucket(this, 'ConfigBucket', {
      encryption: cdk.aws_s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        expiration: cdk.Duration.days(365),
        noncurrentVersionExpiration: cdk.Duration.days(90),
      }],
    });

    const deliveryChannel = new config.CfnDeliveryChannel(this, 'ConfigDeliveryChannel', {
      s3BucketName: configBucket.bucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'Daily',
      },
    });

    const configRecorder = new config.CfnConfigurationRecorder(this, 'ConfigRecorder', {
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: true,
      },
    });

    configRecorder.addDependsOn(deliveryChannel);

    cdk.Tags.of(this).add('Component', 'Security');
  }
}
```

## File: lib/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class StorageStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly dataBuckets: s3.Bucket[];
  public readonly accessLogBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for securing storage resources',
      keyRotation: true,
      pendingWindow: cdk.Duration.days(7),
    });

    // Create access logs bucket
    this.accessLogBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [{
        id: 'DeleteAccessLogs',
        expiration: cdk.Duration.days(90),
      }],
    });

    // Create multiple S3 buckets with strict security
    this.dataBuckets = [];
    const bucketNames = ['app-data', 'backup-data', 'logs-data'];
    
    bucketNames.forEach((name, index) => {
      const bucket = new s3.Bucket(this, `${name}-bucket`, {
        bucketName: `secure-${name}-${cdk.Aws.ACCOUNT_ID}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        serverAccessLogsBucket: this.accessLogBucket,
        serverAccessLogsPrefix: `access-logs/${name}/`,
        lifecycleRules: [{
          id: 'IntelligentTiering',
          transitions: [{
            storageClass: s3.StorageClass.INTELLIGENT_TIERING,
            transitionAfter: cdk.Duration.days(1),
          }],
          noncurrentVersionExpiration: cdk.Duration.days(30),
        }],
      });

      // Deny all public access
      bucket.addToResourcePolicy(new cdk.aws_iam.PolicyStatement({
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
      }));

      this.dataBuckets.push(bucket);
    });

    // Create RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS databases',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create RDS security group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS databases',
      allowAllOutbound: false,
    });

    // Create multiple RDS instances with encryption
    const databaseConfigs = [
      { id: 'primary', instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO) },
      { id: 'secondary', instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO) },
    ];

    databaseConfigs.forEach((config) => {
      new rds.DatabaseInstance(this, `Database${config.id}`, {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_7,
        }),
        instanceType: config.instanceType,
        credentials: rds.Credentials.fromGeneratedSecret('postgres', {
          secretName: `rds-credentials-${config.id}`,
        }),
        vpc: props.vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: this.kmsKey,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: false,
        deletionProtection: true,
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

## File: lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface ComputeStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
}

export class ComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // CloudWatch Log Group for EC2 instances
    const logGroup = new logs.LogGroup(this, 'EC2LogGroup', {
      logGroupName: '/aws/ec2/secure-instances',
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
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    const appServerRole = new iam.Role(this, 'AppServerRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for application server instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Add S3 read permissions for application servers
    appServerRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:ListBucket',
      ],
      resources: [
        `arn:aws:s3:::secure-app-data-${cdk.Aws.ACCOUNT_ID}`,
        `arn:aws:s3:::secure-app-data-${cdk.Aws.ACCOUNT_ID}/*`,
      ],
    }));

    // Create launch templates with encrypted EBS volumes
    const webServerLaunchTemplate = new ec2.LaunchTemplate(this, 'WebServerLaunchTemplate', {
      launchTemplateName: 'secure-web-server-template',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: webSecurityGroup,
      role: webServerRole,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(20, {
          volumeType: ec2.EbsDeviceVolumeType.GP3,
          encrypted: true,
          kmsKey: props.kmsKey,
        }),
      }],
      userData: ec2.UserData.forLinux(),
    });

    const appServerLaunchTemplate = new ec2.LaunchTemplate(this, 'AppServerLaunchTemplate', {
      launchTemplateName: 'secure-app-server-template',
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: appSecurityGroup,
      role: appServerRole,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(20, {
          volumeType: ec2.EbsDeviceVolumeType.GP3,
          encrypted: true,
          kmsKey: props.kmsKey,
        }),
      }],
      userData: ec2.UserData.forLinux(),
    });

    // Deploy EC2 instances across multiple AZs
    const webInstances = [];
    const appInstances = [];

    for (let i = 0; i < 2; i++) {
      // Web server instances
      const webInstance = new ec2.Instance(this, `WebServer${i}`, {
        launchTemplate: webServerLaunchTemplate,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [props.vpc.availabilityZones[i]],
        },
      });
      webInstances.push(webInstance);

      // Application server instances
      const appInstance = new ec2.Instance(this, `AppServer${i}`, {
        launchTemplate: appServerLaunchTemplate,
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          availabilityZones: [props.vpc.availabilityZones[i]],
        },
      });
      appInstances.push(appInstance);
    }

    cdk.Tags.of(this).add('Component', 'Compute');
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  kmsKey: kms.Key;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS topic for security alerts
    const alertTopic = new sns.Topic(this, 'SecurityAlertTopic', {
      displayName: 'Security Alerts',
      masterKey: props.kmsKey,
    });

    // CloudWatch dashboard for security metrics
    const securityDashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: 'SecureInfrastructure-Monitoring',
    });

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

## File: lib/security-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
  public readonly certificate: certificatemanager.Certificate;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Note: In a real implementation, you would have a domain
    // For this example, we'll create a self-signed certificate concept
    // Uncomment and modify the following if you have a domain:
    
    /*
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: 'your-domain.com',
    });

    this.certificate = new certificatemanager.Certificate(this, 'SSLCertificate', {
      domainName: '*.your-domain.com',
      validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
    });
    */

    // For demo purposes, we'll create a certificate without domain validation
    // In production, always use proper domain validation
    this.certificate = new certificatemanager.Certificate(this, 'SSLCertificate', {
      domainName: 'secure.internal',
      validation: certificatemanager.CertificateValidation.fromEmail(),
    });

    cdk.Tags.of(this).add('Component', 'Security');
  }
}
```

This implementation provides a comprehensive secure cloud infrastructure with:

1. **Encrypted Storage**: All RDS instances use encryption at rest with KMS keys, EBS volumes are encrypted, and S3 buckets use KMS encryption
2. **IAM Security**: Each EC2 instance has minimal privilege IAM roles, with Session Manager access enabled
3. **S3 Security**: All buckets block public access, have access logging enabled, and include lifecycle policies
4. **Modern Security Features**: GuardDuty for threat detection, Security Hub for centralized management, Config for compliance monitoring
5. **Network Security**: Multi-AZ VPC with proper subnet segmentation and security groups
6. **Monitoring**: CloudWatch dashboards, alarms, and encrypted log groups for comprehensive monitoring

Each stack is modular and can be deployed independently while maintaining security best practices throughout the infrastructure.