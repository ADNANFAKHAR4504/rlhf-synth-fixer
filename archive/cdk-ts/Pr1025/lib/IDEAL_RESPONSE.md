# AWS CDK TypeScript Infrastructure

This solution provides AWS infrastructure using CDK TypeScript.

## lib/compute-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ComputeConstructProps {
  vpc: ec2.IVpc;
  environmentSuffix: string;
  securityGroup: ec2.ISecurityGroup;
  instanceType?: ec2.InstanceType;
  keyPairName?: string;
}

export class ComputeConstruct extends Construct {
  public readonly instances: ec2.Instance[];
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

    // Create IAM role for EC2 instances
    this.role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for web application EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add custom policy for S3 access (if needed)
    this.role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: ['*'], // This should be restricted to specific buckets in production
      })
    );

    // User data script for instance setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Web Application Server</h1>" > /var/www/html/index.html',
      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',
      // Install Inspector agent
      'curl -O https://inspector-agent.amazonaws.com/linux/latest/install',
      'bash install'
    );

    this.instances = [];

    // Create EC2 instances in each private subnet
    props.vpc.privateSubnets.forEach((subnet, index) => {
      const instance = new ec2.Instance(this, `WebAppInstance${index + 1}`, {
        vpc: props.vpc,
        vpcSubnets: { subnets: [subnet] },
        instanceType:
          props.instanceType ||
          ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: props.securityGroup,
        role: this.role,
        userData: userData,
        keyName: props.keyPairName,
      });

      cdk.Tags.of(instance).add(
        'Name',
        `WebApp-Instance-${index + 1}-${props.environmentSuffix}`
      );
      cdk.Tags.of(instance).add('Component', 'Compute');
      cdk.Tags.of(instance).add('Environment', props.environmentSuffix);

      this.instances.push(instance);
    });
  }
}
```

## lib/database-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  vpc: ec2.IVpc;
  environmentSuffix: string;
  securityGroup: ec2.ISecurityGroup;
  instanceType?: ec2.InstanceType;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly credentials: rds.DatabaseSecret;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // Create database credentials
    this.credentials = new rds.DatabaseSecret(this, 'DbCredentials', {
      username: 'admin',
    });

    // Create RDS database instance
    this.database = new rds.DatabaseInstance(this, 'Database', {
      databaseName: `webapp${props.environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType:
        props.instanceType ||
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(this.credentials),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [props.securityGroup],
      storageEncrypted: true,
      allocatedStorage: 20,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: false, // Set to true in production
      multiAz: false, // Cost optimization for dev/test
      autoMinorVersionUpgrade: true,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add tags
    cdk.Tags.of(this.database).add('Component', 'Database');
    cdk.Tags.of(this.database).add('Environment', props.environmentSuffix);
  }
}
```

## lib/monitoring-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  instances: ec2.Instance[];
  database: rds.DatabaseInstance;
}

export class MonitoringConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `webapp-alarms-${props.environmentSuffix}`,
      displayName: 'Web Application Alarms',
    });

    // Create CloudWatch dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `WebApp-Dashboard-${props.environmentSuffix}`,
    });

    // Create alarms for EC2 instances
    props.instances.forEach((instance, index) => {
      // CPU Utilization alarm
      const cpuAlarm = new cloudwatch.Alarm(this, `CpuAlarm${index + 1}`, {
        alarmName: `webapp-cpu-${index + 1}-${props.environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            InstanceId: instance.instanceId,
          },
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      });
      cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alarmTopic));

      // Status Check alarm
      const statusAlarm = new cloudwatch.Alarm(
        this,
        `StatusAlarm${index + 1}`,
        {
          alarmName: `webapp-status-${index + 1}-${props.environmentSuffix}`,
          metric: new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'StatusCheckFailed',
            dimensionsMap: {
              InstanceId: instance.instanceId,
            },
          }),
          threshold: 1,
          evaluationPeriods: 1,
        }
      );
      statusAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(this.alarmTopic)
      );
    });

    // Database monitoring
    const dbConnections = new cloudwatch.Alarm(this, 'DbConnectionsAlarm', {
      alarmName: `webapp-db-connections-${props.environmentSuffix}`,
      metric: props.database.metricDatabaseConnections(),
      threshold: 80,
      evaluationPeriods: 2,
    });
    dbConnections.addAlarmAction(
      new cloudwatchActions.SnsAction(this.alarmTopic)
    );

    // Add widgets to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: props.instances.map(
          instance =>
            new cloudwatch.Metric({
              namespace: 'AWS/EC2',
              metricName: 'CPUUtilization',
              dimensionsMap: {
                InstanceId: instance.instanceId,
              },
            })
        ),
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [props.database.metricDatabaseConnections()],
        width: 12,
        height: 6,
      })
    );

    // Add tags
    cdk.Tags.of(this.alarmTopic).add('Component', 'Monitoring');
    cdk.Tags.of(this.alarmTopic).add('Environment', props.environmentSuffix);
  }
}
```

## lib/networking-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkingConstructProps {
  environmentSuffix: string;
  cidrBlock?: string;
  maxAzs?: number;
}

export class NetworkingConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Create VPC with public and private subnets across multiple AZs
    this.vpc = new ec2.Vpc(this, 'WebAppVpc', {
      cidr: props.cidrBlock || '10.0.0.0/16',
      maxAzs: props.maxAzs || 2,
      natGateways: 1, // Cost optimization - use 1 NAT Gateway
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `public-subnet-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `private-subnet-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Add tags
    cdk.Tags.of(this.vpc).add('Component', 'Networking');
    cdk.Tags.of(this.vpc).add('Environment', props.environmentSuffix);
  }
}
```

## lib/security-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface SecurityConstructProps {
  vpc: ec2.IVpc;
  environmentSuffix: string;
}

export class SecurityConstruct extends Construct {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Create security group for web servers
    this.webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web application servers',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow HTTPS traffic from anywhere
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow SSH from VPC
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC'
    );

    // Create security group for database
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Allow MySQL access from web servers only
    this.dbSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL from web servers'
    );

    // Create WAF Web ACL with AWS managed rules
    this.webAcl = new wafv2.CfnWebACL(this, 'WebAcl', {
      name: `webapp-waf-${props.environmentSuffix}`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      description: 'WAF for web application protection',
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
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'webAclMetric',
      },
    });

    // Add tags
    cdk.Tags.of(this.webSecurityGroup).add('Component', 'Security');
    cdk.Tags.of(this.webSecurityGroup).add(
      'Environment',
      props.environmentSuffix
    );
    cdk.Tags.of(this.dbSecurityGroup).add('Component', 'Security');
    cdk.Tags.of(this.dbSecurityGroup).add(
      'Environment',
      props.environmentSuffix
    );
  }
}
```

## lib/storage-construct.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environmentSuffix: string;
  bucketName?: string;
}

export class StorageConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly logBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    // Create logging bucket first
    this.logBucket = new s3.Bucket(this, 'LogBucket', {
      bucketName: `webapp-logs-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    // Create main application bucket
    this.bucket = new s3.Bucket(this, 'AppBucket', {
      bucketName:
        props.bucketName ||
        `webapp-data-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: this.logBucket,
      serverAccessLogsPrefix: 'access-logs/',
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Add tags
    cdk.Tags.of(this.bucket).add('Component', 'Storage');
    cdk.Tags.of(this.bucket).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.logBucket).add('Component', 'Storage');
    cdk.Tags.of(this.logBucket).add('Environment', props.environmentSuffix);
  }
}
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeConstruct } from './compute-construct';
import { DatabaseConstruct } from './database-construct';
import { MonitoringConstruct } from './monitoring-construct';
import { NetworkingConstruct } from './networking-construct';
import { SecurityConstruct } from './security-construct';
import { StorageConstruct } from './storage-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create networking infrastructure
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
    });

    // Create security infrastructure
    const security = new SecurityConstruct(this, 'Security', {
      vpc: networking.vpc,
      environmentSuffix,
    });

    // Create compute infrastructure
    const compute = new ComputeConstruct(this, 'Compute', {
      vpc: networking.vpc,
      environmentSuffix,
      securityGroup: security.webSecurityGroup,
    });

    // Create database infrastructure
    const database = new DatabaseConstruct(this, 'Database', {
      vpc: networking.vpc,
      environmentSuffix,
      securityGroup: security.dbSecurityGroup,
    });

    // Create storage infrastructure
    const storage = new StorageConstruct(this, 'Storage', {
      environmentSuffix,
    });

    // Create monitoring infrastructure
    const monitoring = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      instances: compute.instances,
      database: database.database,
    });

    // Output important information
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `${this.stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: storage.bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: `${this.stackName}-S3BucketName`,
    });

    new cdk.CfnOutput(this, 'WAFWebAclArn', {
      value: security.webAcl.attrArn,
      description: 'WAF Web ACL ARN',
      exportName: `${this.stackName}-WAFWebAclArn`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
```

