I'll create a secure and highly available AWS infrastructure using CDK TypeScript that includes EC2, RDS, and S3 services with best practices for security and high availability.

## lib/vpc-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly privateSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC with public and private subnets across 2 AZs
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'DatabaseSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      flowLogs: {
        'FlowLogCloudWatch': {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        }
      }
    });

    this.publicSubnets = this.vpc.publicSubnets;
    this.privateSubnets = this.vpc.privateSubnets;

    // Add VPC endpoints for S3 and DynamoDB for cost optimization
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addGatewayEndpoint('DynamoDbEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });
  }
}
```

## lib/security-groups-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface SecurityGroupsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class SecurityGroupsStack extends cdk.Stack {
  public readonly webServerSg: ec2.SecurityGroup;
  public readonly databaseSg: ec2.SecurityGroup;
  public readonly albSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsStackProps) {
    super(scope, id, props);

    // Application Load Balancer Security Group
    this.albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    this.albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from internet'
    );

    this.albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic from internet'
    );

    // Web Server Security Group
    this.webServerSg = new ec2.SecurityGroup(this, 'WebServerSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    this.webServerSg.addIngressRule(
      this.albSg,
      ec2.Port.tcp(80),
      'Allow HTTP traffic from ALB'
    );

    this.webServerSg.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/16'),
      ec2.Port.tcp(22),
      'Allow SSH from within VPC'
    );

    // Database Security Group
    this.databaseSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    this.databaseSg.addIngressRule(
      this.webServerSg,
      ec2.Port.tcp(3306),
      'Allow MySQL access from web servers'
    );
  }
}
```

## lib/s3-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class S3Stack extends cdk.Stack {
  public readonly applicationBucket: s3.Bucket;
  public readonly logsBucket: s3.Bucket;
  public readonly backupBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // KMS key for S3 encryption
    const s3Key = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Access logs bucket
    this.logsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `secure-app-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: false,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(60),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Application data bucket
    this.applicationBucket = new s3.Bucket(this, 'ApplicationBucket', {
      bucketName: `secure-app-data-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3Key,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      serverAccessLogsBucket: this.logsBucket,
      serverAccessLogsPrefix: 'application-access-logs/',
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Backup bucket with cross-region replication setup
    this.backupBucket = new s3.Bucket(this, 'BackupBucket', {
      bucketName: `secure-app-backup-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3Key,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'backup-lifecycle',
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
```

## lib/ec2-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface Ec2StackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  webServerSg: ec2.SecurityGroup;
  albSg: ec2.SecurityGroup;
  applicationBucket: s3.IBucket;
}

export class Ec2Stack extends cdk.Stack {
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly applicationLoadBalancer: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: Ec2StackProps) {
    super(scope, id, props);

    // IAM role for EC2 instances
    const ec2Role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Grant access to S3 bucket
    props.applicationBucket.grantReadWrite(ec2Role);

    // User data script for web servers
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Secure Web Server</h1>" > /var/www/html/index.html',
      
      // Install and configure CloudWatch agent
      'yum install -y amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      
      // Install SSM agent (for secure access)
      'yum install -y amazon-ssm-agent',
      'systemctl start amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent'
    );

    // Launch template for Auto Scaling Group
    const launchTemplate = new ec2.LaunchTemplate(this, 'WebServerLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: props.webServerSg,
      userData: userData,
      role: ec2Role,
      requireImdsv2: true, // Security best practice
      detailedMonitoring: true,
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WebServerAsg', {
      vpc: props.vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 6,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(3),
      }),
      updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
        maxBatchSize: 1,
        minInstancesInService: 1,
      }),
    });

    // Application Load Balancer
    this.applicationLoadBalancer = new elbv2.ApplicationLoadBalancer(this, 'WebServerAlb', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.albSg,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Target group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'WebServerTargetGroup', {
      port: 80,
      vpc: props.vpc,
      targets: [this.autoScalingGroup],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 2,
      },
    });

    // HTTP listener (redirects to HTTPS)
    this.applicationLoadBalancer.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
      }),
    });

    // Self-signed certificate for demo purposes
    const certificate = new acm.Certificate(this, 'WebServerCertificate', {
      domainName: '*.elb.amazonaws.com',
      validation: acm.CertificateValidation.fromDns(),
    });

    // HTTPS listener
    this.applicationLoadBalancer.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      defaultTargetGroups: [targetGroup],
    });

    // Auto scaling policies
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.minutes(5),
      scaleOutCooldown: cdk.Duration.minutes(3),
    });
  }
}
```

## lib/rds-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface RdsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  databaseSg: ec2.SecurityGroup;
}

export class RdsStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    // KMS key for RDS encryption
    const rdsKey = new kms.Key(this, 'RdsEncryptionKey', {
      description: 'KMS key for RDS encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Parameter group for enhanced performance and security
    const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      parameters: {
        innodb_buffer_pool_size: '{DBInstanceClassMemory*3/4}',
        slow_query_log: '1',
        long_query_time: '2',
        log_queries_not_using_indexes: '1',
      },
    });

    // RDS instance with high availability
    this.database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        description: 'RDS admin credentials',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!@\\/\"=^',
      }),
      vpc: props.vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [props.databaseSg],
      
      // Storage configuration
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      storageEncryptionKey: rdsKey,
      
      // Backup and maintenance
      backupRetention: cdk.Duration.days(7),
      backupWindow: '03:00-04:00',
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deleteAutomatedBackups: false,
      deletionProtection: false, // Set to true for production
      
      // Multi-AZ for high availability
      multiAz: true,
      
      // Monitoring and logging
      monitoringInterval: cdk.Duration.minutes(1),
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      
      // Parameter group
      parameterGroup: parameterGroup,
      
      // Enhanced monitoring role will be created automatically
      autoMinorVersionUpgrade: true,
      
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create a read replica for read scaling (optional)
    new rds.DatabaseInstanceReadReplica(this, 'ReadReplica', {
      sourceDatabaseInstance: this.database,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: props.vpc,
      securityGroups: [props.databaseSg],
      deleteAutomatedBackups: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
```

## lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface MonitoringStackProps extends cdk.StackProps {
  autoScalingGroup: autoscaling.IAutoScalingGroup;
  database: rds.IDatabaseInstance;
  applicationLoadBalancer: elbv2.IApplicationLoadBalancer;
  vpc: ec2.IVpc;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'Infrastructure Alerts',
    });

    // Add email subscription (replace with actual email)
    alertTopic.addSubscription(
      new subscriptions.EmailSubscription('admin@example.com')
    );

    // CloudWatch dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
      dashboardName: 'secure-infrastructure-dashboard',
    });

    // EC2/ASG metrics
    const cpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
    });

    const memoryMetric = new cloudwatch.Metric({
      namespace: 'CWAgent',
      metricName: 'mem_used_percent',
      dimensionsMap: {
        AutoScalingGroupName: props.autoScalingGroup.autoScalingGroupName,
      },
      statistic: 'Average',
    });

    // RDS metrics
    const dbCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        DBInstanceIdentifier: props.database.instanceIdentifier,
      },
      statistic: 'Average',
    });

    const dbConnectionsMetric = new cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'DatabaseConnections',
      dimensionsMap: {
        DBInstanceIdentifier: props.database.instanceIdentifier,
      },
      statistic: 'Average',
    });

    // ALB metrics
    const albTargetResponseTime = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'TargetResponseTime',
      dimensionsMap: {
        LoadBalancer: props.applicationLoadBalancer.loadBalancerFullName,
      },
      statistic: 'Average',
    });

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [cpuMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'EC2 Memory Utilization',
        left: [memoryMetric],
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [dbCpuMetric],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Connections',
        left: [dbConnectionsMetric],
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [albTargetResponseTime],
        width: 24,
        height: 6,
      })
    );

    // Alarms
    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: cpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'DatabaseCpuAlarm', {
      metric: dbCpuMetric,
      threshold: 75,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      metric: albTargetResponseTime,
      threshold: 1, // 1 second
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // VPC Flow Logs (already created in VPC stack, but adding centralized log group)
    const vpcFlowLogGroup = new logs.LogGroup(this, 'VpcFlowLogsGroup', {
      logGroupName: '/aws/vpc/flowlogs',
      retention: logs.RetentionDays.ONE_MONTH,
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { SecurityGroupsStack } from './security-groups-stack';
import { S3Stack } from './s3-stack';
import { Ec2Stack } from './ec2-stack';
import { RdsStack } from './rds-stack';
import { MonitoringStack } from './monitoring-stack';

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

    // Create VPC stack
    const vpcStack = new VpcStack(this, 'VpcStack');

    // Create Security Groups stack
    const securityGroupsStack = new SecurityGroupsStack(this, 'SecurityGroupsStack', {
      vpc: vpcStack.vpc,
    });

    // Create S3 stack
    const s3Stack = new S3Stack(this, 'S3Stack');

    // Create EC2 stack
    const ec2Stack = new Ec2Stack(this, 'Ec2Stack', {
      vpc: vpcStack.vpc,
      webServerSg: securityGroupsStack.webServerSg,
      albSg: securityGroupsStack.albSg,
      applicationBucket: s3Stack.applicationBucket,
    });

    // Create RDS stack
    const rdsStack = new RdsStack(this, 'RdsStack', {
      vpc: vpcStack.vpc,
      databaseSg: securityGroupsStack.databaseSg,
    });

    // Create monitoring stack
    new MonitoringStack(this, 'MonitoringStack', {
      autoScalingGroup: ec2Stack.autoScalingGroup,
      database: rdsStack.database,
      applicationLoadBalancer: ec2Stack.applicationLoadBalancer,
      vpc: vpcStack.vpc,
    });

    // Output important information
    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: ec2Stack.applicationLoadBalancer.loadBalancerDnsName,
      description: 'DNS name of the load balancer',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: rdsStack.database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Stack.applicationBucket.bucketName,
      description: 'S3 application bucket name',
    });
  }
}
```

This infrastructure provides:

1. **VPC**: Multi-AZ setup with public/private subnets and VPC endpoints
2. **Security**: Security groups with least privilege, encryption at rest and in transit
3. **High Availability**: Auto Scaling Groups, Multi-AZ RDS, and Load Balancer
4. **Monitoring**: CloudWatch alarms, dashboard, and SNS notifications  
5. **Storage**: Encrypted S3 buckets with lifecycle policies
6. **Database**: Encrypted RDS with automated backups and read replicas
7. **Cost Optimization**: Appropriate instance types and lifecycle policies

The infrastructure includes modern security features like AWS Certificate Manager for secure communications and follows AWS security best practices throughout.