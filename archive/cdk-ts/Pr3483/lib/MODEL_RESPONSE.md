# Wiki Platform Infrastructure CDK TypeScript

Here's the complete infrastructure code for your wiki platform:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkStack } from './network-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';

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

    // Network Stack
    const networkStack = new NetworkStack(this, `NetworkStack-${environmentSuffix}`, {
      vpcCidr: '10.200.0.0/16',
      environmentSuffix
    });

    // Database Stack
    const databaseStack = new DatabaseStack(this, `DatabaseStack-${environmentSuffix}`, {
      vpc: networkStack.vpc,
      environmentSuffix
    });

    // Storage Stack
    const storageStack = new StorageStack(this, `StorageStack-${environmentSuffix}`, {
      vpc: networkStack.vpc,
      environmentSuffix
    });

    // Compute Stack
    const computeStack = new ComputeStack(this, `ComputeStack-${environmentSuffix}`, {
      vpc: networkStack.vpc,
      database: databaseStack.database,
      redisCluster: storageStack.redisCluster,
      openSearchDomain: storageStack.openSearchDomain,
      mediaBucket: storageStack.mediaBucket,
      serviceNetwork: networkStack.serviceNetwork,
      environmentSuffix
    });

    // Monitoring Stack
    new MonitoringStack(this, `MonitoringStack-${environmentSuffix}`, {
      alb: computeStack.alb,
      autoScalingGroup: computeStack.autoScalingGroup,
      environmentSuffix
    });
  }
}
```

## lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface NetworkStackProps {
  vpcCidr: string;
  environmentSuffix: string;
}

export class NetworkStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly serviceNetwork: vpclattice.CfnServiceNetwork;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id);

    // VPC Configuration
    this.vpc = new ec2.Vpc(this, 'WikiVPC', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
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
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Lattice Service Network
    this.serviceNetwork = new vpclattice.CfnServiceNetwork(this, 'WikiServiceNetwork', {
      name: `wiki-service-network-${props.environmentSuffix}`,
      authType: 'AWS_IAM',
      tags: [{
        key: 'Environment',
        value: props.environmentSuffix,
      }],
    });

    // Associate VPC with Service Network
    new vpclattice.CfnServiceNetworkVpcAssociation(this, 'VpcAssociation', {
      serviceNetworkIdentifier: this.serviceNetwork.attrArn,
      vpcIdentifier: this.vpc.vpcId,
      securityGroupIds: [
        new ec2.SecurityGroup(this, 'LatticeSecurityGroup', {
          vpc: this.vpc,
          description: 'Security group for VPC Lattice',
          allowAllOutbound: true,
        }).securityGroupId,
      ],
    });

    // Tags
    cdk.Tags.of(this.vpc).add('Name', `WikiVPC-${props.environmentSuffix}`);
    cdk.Tags.of(this.vpc).add('Environment', props.environmentSuffix);
  }
}
```

## lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

interface DatabaseStackProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class DatabaseStack extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id);

    // Database Security Group
    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS PostgreSQL database',
      allowAllOutbound: false,
    });

    // Database Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for wiki database',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS PostgreSQL Database
    this.database = new rds.DatabaseInstance(this, 'WikiDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroup: dbSubnetGroup,
      securityGroups: [this.dbSecurityGroup],
      allocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      iops: 3000,
      databaseName: 'wikidb',
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      backupRetention: cdk.Duration.days(14),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.MONTHS_12,
      cloudwatchLogsExports: ['postgresql'],
      autoMinorVersionUpgrade: true,
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // Enable Database Insights (new feature)
    const cfnDatabase = this.database.node.defaultChild as rds.CfnDBInstance;
    cfnDatabase.addPropertyOverride('EnableCloudwatchLogsExports', ['postgresql']);
    cfnDatabase.addPropertyOverride('DatabaseInsightsMode', 'standard');

    // Tags
    cdk.Tags.of(this.database).add('Name', `WikiDatabase-${props.environmentSuffix}`);
    cdk.Tags.of(this.database).add('Environment', props.environmentSuffix);
  }
}
```

## lib/storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface StorageStackProps {
  vpc: ec2.Vpc;
  environmentSuffix: string;
}

export class StorageStack extends Construct {
  public readonly redisCluster: elasticache.CfnCacheCluster;
  public readonly openSearchDomain: opensearch.Domain;
  public readonly mediaBucket: s3.Bucket;
  public readonly redisSecurityGroup: ec2.SecurityGroup;
  public readonly openSearchSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    // Redis Security Group
    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for ElastiCache Redis',
      allowAllOutbound: false,
    });

    // Redis Subnet Group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cache',
      subnetIds: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
    });

    // ElastiCache Redis Cluster
    this.redisCluster = new elasticache.CfnCacheCluster(this, 'WikiRedisCache', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      cacheSubnetGroupName: redisSubnetGroup.ref,
      vpcSecurityGroupIds: [this.redisSecurityGroup.securityGroupId],
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      snapshotRetentionLimit: 7,
      snapshotWindow: '03:00-04:00',
      tags: [{
        key: 'Name',
        value: `WikiRedisCache-${props.environmentSuffix}`,
      }, {
        key: 'Environment',
        value: props.environmentSuffix,
      }],
    });

    // OpenSearch Security Group
    this.openSearchSecurityGroup = new ec2.SecurityGroup(this, 'OpenSearchSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for OpenSearch domain',
      allowAllOutbound: true,
    });

    // OpenSearch Domain
    this.openSearchDomain = new opensearch.Domain(this, 'WikiSearchDomain', {
      version: opensearch.EngineVersion.OPENSEARCH_2_11,
      capacity: {
        dataNodeInstanceType: 't3.small.search',
        dataNodes: 2,
      },
      ebs: {
        volumeSize: 20,
        volumeType: ec2.EbsDeviceVolumeType.GP3,
      },
      nodeToNodeEncryption: true,
      encryptionAtRest: {
        enabled: true,
      },
      vpcOptions: {
        subnets: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnets.slice(0, 2),
        securityGroups: [this.openSearchSecurityGroup],
      },
      logging: {
        slowSearchLogEnabled: true,
        appLogEnabled: true,
        slowIndexLogEnabled: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for Media Uploads
    this.mediaBucket = new s3.Bucket(this, 'WikiMediaBucket', {
      bucketName: `wiki-media-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(90),
        abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
      }],
      cors: [{
        allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3000,
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Tags
    cdk.Tags.of(this.mediaBucket).add('Name', `WikiMediaBucket-${props.environmentSuffix}`);
    cdk.Tags.of(this.mediaBucket).add('Environment', props.environmentSuffix);
  }
}
```

## lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as vpclattice from 'aws-cdk-lib/aws-vpclattice';
import { Construct } from 'constructs';

interface ComputeStackProps {
  vpc: ec2.Vpc;
  database: rds.DatabaseInstance;
  redisCluster: elasticache.CfnCacheCluster;
  openSearchDomain: opensearch.Domain;
  mediaBucket: s3.Bucket;
  serviceNetwork: vpclattice.CfnServiceNetwork;
  environmentSuffix: string;
}

export class ComputeStack extends Construct {
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id);

    // ALB Security Group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'WikiALB', {
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // EC2 Security Group
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // IAM Role for EC2 Instances
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Grant S3 permissions
    props.mediaBucket.grantReadWrite(ec2Role);

    // Grant OpenSearch permissions
    props.openSearchDomain.grantReadWrite(ec2Role);

    // User Data Script
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Wiki Platform</h1>" > /var/www/html/index.html'
    );

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'WikiLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: ec2Role,
      securityGroup: ec2SecurityGroup,
      userData: userData,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(20, {
          volumeType: ec2.EbsDeviceVolumeType.GP3,
          encrypted: true,
        }),
      }],
    });

    // Auto Scaling Group
    this.autoScalingGroup = new autoscaling.AutoScalingGroup(this, 'WikiASG', {
      vpc: props.vpc,
      launchTemplate: launchTemplate,
      minCapacity: 2,
      maxCapacity: 5,
      desiredCapacity: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheck: autoscaling.HealthCheck.elb({
        grace: cdk.Duration.minutes(5),
      }),
    });

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'WikiTargetGroup', {
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [this.autoScalingGroup],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // ALB Listener
    this.alb.addListener('HttpListener', {
      port: 80,
      defaultTargetGroups: [targetGroup],
    });

    // Auto Scaling Policies
    this.autoScalingGroup.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      cooldown: cdk.Duration.minutes(5),
    });

    this.autoScalingGroup.scaleOnRequestCount('RequestCountScaling', {
      targetRequestsPerMinute: 1000,
    });

    // VPC Lattice Service
    const latticeTargetGroup = new vpclattice.CfnTargetGroup(this, 'LatticeTargetGroup', {
      type: 'ALB',
      targets: [{
        id: this.alb.loadBalancerArn,
        port: 80,
      }],
      config: {
        port: 80,
        protocol: 'HTTP',
        protocolVersion: 'HTTP1',
        vpcIdentifier: props.vpc.vpcId,
        healthCheck: {
          enabled: true,
          protocol: 'HTTP',
          path: '/',
        },
      },
    });

    const latticeService = new vpclattice.CfnService(this, 'WikiLatticeService', {
      name: `wiki-service-${props.environmentSuffix}`,
      authType: 'AWS_IAM',
    });

    new vpclattice.CfnListener(this, 'LatticeListener', {
      serviceIdentifier: latticeService.attrArn,
      protocol: 'HTTP',
      port: 80,
      defaultAction: {
        forward: {
          targetGroups: [{
            targetGroupIdentifier: latticeTargetGroup.attrArn,
            weight: 100,
          }],
        },
      },
    });

    new vpclattice.CfnServiceNetworkServiceAssociation(this, 'ServiceAssociation', {
      serviceIdentifier: latticeService.attrArn,
      serviceNetworkIdentifier: props.serviceNetwork.attrArn,
    });

    // Configure Security Group Rules for Database Access
    const dbSecurityGroup = props.database.connections.securityGroups[0];
    dbSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from EC2 instances'
    );

    // Configure Security Group Rules for Redis Access
    const redisSecurityGroup = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'ImportedRedisSecurityGroup',
      props.redisCluster.attrRedisEndpointAddress
    );

    // Tags
    cdk.Tags.of(this.alb).add('Name', `WikiALB-${props.environmentSuffix}`);
    cdk.Tags.of(this.autoScalingGroup).add('Name', `WikiASG-${props.environmentSuffix}`);
    cdk.Tags.of(this.autoScalingGroup).add('Environment', props.environmentSuffix);
  }
}
```

## lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  alb: elbv2.ApplicationLoadBalancer;
  autoScalingGroup: autoscaling.AutoScalingGroup;
  environmentSuffix: string;
}

export class MonitoringStack extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    // SNS Topic for Alerts
    const alertTopic = new sns.Topic(this, 'WikiAlertTopic', {
      displayName: `Wiki Platform Alerts - ${props.environmentSuffix}`,
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'WikiDashboard', {
      dashboardName: `wiki-platform-${props.environmentSuffix}`,
    });

    // Edit Activity Metric
    const editActivityMetric = new cloudwatch.Metric({
      namespace: 'WikiPlatform',
      metricName: 'EditActivity',
      dimensionsMap: {
        Environment: props.environmentSuffix,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    // ALB Metrics
    const targetResponseTimeMetric = new cloudwatch.Metric({
      namespace: 'AWS/ELB',
      metricName: 'TargetResponseTime',
      dimensionsMap: {
        LoadBalancer: props.alb.loadBalancerFullName,
      },
      statistic: cloudwatch.Stats.AVERAGE,
      period: cdk.Duration.minutes(5),
    });

    const requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ELB',
      metricName: 'RequestCount',
      dimensionsMap: {
        LoadBalancer: props.alb.loadBalancerFullName,
      },
      statistic: cloudwatch.Stats.SUM,
      period: cdk.Duration.minutes(5),
    });

    const healthyHostCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ELB',
      metricName: 'HealthyHostCount',
      dimensionsMap: {
        LoadBalancer: props.alb.loadBalancerFullName,
      },
      statistic: cloudwatch.Stats.MINIMUM,
      period: cdk.Duration.minutes(5),
    });

    // Auto Scaling Metrics
    const cpuUtilizationMetric = props.autoScalingGroup.metricCpuUtilization();
    const groupInServiceInstancesMetric = props.autoScalingGroup.metricGroupInServiceInstances();

    // Dashboard Widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Edit Activity',
        left: [editActivityMetric],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Request Count',
        left: [requestCountMetric],
        width: 12,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Target Response Time',
        left: [targetResponseTimeMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'Healthy Hosts',
        left: [healthyHostCountMetric],
        width: 8,
      }),
      new cloudwatch.GraphWidget({
        title: 'CPU Utilization',
        left: [cpuUtilizationMetric],
        width: 8,
      })
    );

    dashboard.addWidgets(
      new cloudwatch.SingleValueWidget({
        title: 'In Service Instances',
        metrics: [groupInServiceInstancesMetric],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Average Response Time',
        metrics: [targetResponseTimeMetric],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Total Requests',
        metrics: [requestCountMetric],
        width: 6,
      }),
      new cloudwatch.SingleValueWidget({
        title: 'Daily Edit Activity',
        metrics: [editActivityMetric],
        width: 6,
      })
    );

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      metric: targetResponseTimeMetric,
      threshold: 1000,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when response time is above 1 second',
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'LowHealthyHostsAlarm', {
      metric: healthyHostCountMetric,
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when healthy hosts drop below 1',
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: cpuUtilizationMetric,
      threshold: 85,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when CPU utilization is above 85%',
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Custom Metric for Edit Activity
    new cloudwatch.Alarm(this, 'HighEditActivityAlarm', {
      metric: editActivityMetric,
      threshold: 10000,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when edit activity exceeds 10,000 edits in 5 minutes',
    }).addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Tags
    cdk.Tags.of(dashboard).add('Name', `WikiDashboard-${props.environmentSuffix}`);
    cdk.Tags.of(dashboard).add('Environment', props.environmentSuffix);
    cdk.Tags.of(alertTopic).add('Name', `WikiAlerts-${props.environmentSuffix}`);
    cdk.Tags.of(alertTopic).add('Environment', props.environmentSuffix);
  }
}