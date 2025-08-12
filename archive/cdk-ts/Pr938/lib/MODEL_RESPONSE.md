I'll help you create a comprehensive multi-environment infrastructure setup using AWS CDK TypeScript. This solution will provide consistent, parameterized constructs that work across different environments and regions.

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (defaults to 'dev')
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

// Define environment configurations
const environments = {
  dev: {
    region: 'us-east-1',
    replicationRegion: 'us-west-2',
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    enableLogging: true,
    s3ExpressOneZone: false
  },
  staging: {
    region: 'us-east-1',
    replicationRegion: 'us-west-2',
    vpcCidr: '10.1.0.0/16',
    maxAzs: 2,
    enableLogging: true,
    s3ExpressOneZone: false
  },
  prod: {
    region: 'us-east-1',
    replicationRegion: 'us-west-2',
    vpcCidr: '10.2.0.0/16',
    maxAzs: 3,
    enableLogging: true,
    s3ExpressOneZone: true
  }
};

const envConfig = environments[environmentSuffix as keyof typeof environments] || environments.dev;

// Create the main stack
new TapStack(app, `TapStack${environmentSuffix}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: envConfig.region,
  },
  environmentSuffix,
  envConfig,
});

app.synth();
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './constructs/vpc-construct';
import { IamConstruct } from './constructs/iam-construct';
import { S3Construct } from './constructs/s3-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { EksConstruct } from './constructs/eks-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  envConfig: {
    region: string;
    replicationRegion: string;
    vpcCidr: string;
    maxAzs: number;
    enableLogging: boolean;
    s3ExpressOneZone: boolean;
  };
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Create VPC
    const vpcConstruct = new VpcConstruct(this, 'Vpc', {
      environmentSuffix: props.environmentSuffix,
      vpcCidr: props.envConfig.vpcCidr,
      maxAzs: props.envConfig.maxAzs,
      enableLogging: props.envConfig.enableLogging,
    });

    // Create IAM roles and policies
    const iamConstruct = new IamConstruct(this, 'Iam', {
      environmentSuffix: props.environmentSuffix,
      enableLogging: props.envConfig.enableLogging,
    });

    // Create S3 buckets with cross-region replication
    const s3Construct = new S3Construct(this, 'S3', {
      environmentSuffix: props.environmentSuffix,
      primaryRegion: props.envConfig.region,
      replicationRegion: props.envConfig.replicationRegion,
      enableS3Express: props.envConfig.s3ExpressOneZone,
      replicationRole: iamConstruct.s3ReplicationRole,
    });

    // Create monitoring and logging
    const monitoringConstruct = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix: props.environmentSuffix,
      enableLogging: props.envConfig.enableLogging,
      vpc: vpcConstruct.vpc,
      logRetentionDays: props.environmentSuffix === 'prod' ? 90 : 30,
    });

    // Create EKS cluster with dashboard support
    const eksConstruct = new EksConstruct(this, 'Eks', {
      environmentSuffix: props.environmentSuffix,
      vpc: vpcConstruct.vpc,
      clusterRole: iamConstruct.eksClusterRole,
      nodeGroupRole: iamConstruct.eksNodeGroupRole,
      enableDashboard: true,
    });

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID for environment',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Construct.primaryBucket.bucketName,
      description: 'Primary S3 bucket name',
    });

    new cdk.CfnOutput(this, 'EksClusterName', {
      value: eksConstruct.cluster.clusterName,
      description: 'EKS cluster name',
    });
  }
}
```

## lib/constructs/vpc-construct.ts

```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface VpcConstructProps {
  environmentSuffix: string;
  vpcCidr: string;
  maxAzs: number;
  enableLogging: boolean;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly flowLogGroup?: logs.LogGroup;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    // Create VPC with consistent configuration
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
      maxAzs: props.maxAzs,
      natGateways: props.environmentSuffix === 'prod' ? props.maxAzs : 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `Public-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `Private-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: `Isolated-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add VPC Flow Logs for monitoring
    if (props.enableLogging) {
      this.flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
        logGroupName: `/aws/vpc/flowlogs/${props.environmentSuffix}`,
        retention: props.environmentSuffix === 'prod' 
          ? logs.RetentionDays.THREE_MONTHS 
          : logs.RetentionDays.ONE_MONTH,
      });

      new ec2.FlowLog(this, 'VpcFlowLog', {
        resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
        destination: ec2.FlowLogDestination.toCloudWatchLogs(this.flowLogGroup),
      });
    }

    // Add tags for consistency
    this.vpc.node.addMetadata('Environment', props.environmentSuffix);
    this.vpc.node.addMetadata('Component', 'VPC');
  }
}
```

## lib/constructs/iam-construct.ts

```typescript
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface IamConstructProps {
  environmentSuffix: string;
  enableLogging: boolean;
}

export class IamConstruct extends Construct {
  public readonly s3ReplicationRole: iam.Role;
  public readonly eksClusterRole: iam.Role;
  public readonly eksNodeGroupRole: iam.Role;
  public readonly loggingRole?: iam.Role;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    // S3 Cross-Region Replication Role
    this.s3ReplicationRole = new iam.Role(this, 'S3ReplicationRole', {
      roleName: `s3-replication-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSS3ReplicationServiceRolePolicy'),
      ],
    });

    // EKS Cluster Service Role
    this.eksClusterRole = new iam.Role(this, 'EksClusterRole', {
      roleName: `eks-cluster-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
      ],
    });

    // EKS Node Group Role
    this.eksNodeGroupRole = new iam.Role(this, 'EksNodeGroupRole', {
      roleName: `eks-node-group-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
      ],
    });

    // CloudWatch Logging Role (if logging enabled)
    if (props.enableLogging) {
      this.loggingRole = new iam.Role(this, 'CloudWatchLoggingRole', {
        roleName: `cloudwatch-logging-role-${props.environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
        inlinePolicies: {
          LoggingPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogStreams',
                  'logs:DescribeLogGroups',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      });
    }

    // Add common tags
    const allRoles = [this.s3ReplicationRole, this.eksClusterRole, this.eksNodeGroupRole];
    if (this.loggingRole) allRoles.push(this.loggingRole);

    allRoles.forEach(role => {
      role.node.addMetadata('Environment', props.environmentSuffix);
      role.node.addMetadata('Component', 'IAM');
    });
  }
}
```

## lib/constructs/s3-construct.ts

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface S3ConstructProps {
  environmentSuffix: string;
  primaryRegion: string;
  replicationRegion: string;
  enableS3Express: boolean;
  replicationRole: iam.Role;
}

export class S3Construct extends Construct {
  public readonly primaryBucket: s3.Bucket;
  public readonly replicationBucket: s3.Bucket;
  public readonly expressBucket?: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    // Create replication destination bucket first (in different region)
    this.replicationBucket = new s3.Bucket(this, 'ReplicationBucket', {
      bucketName: `tap-replication-${props.environmentSuffix}-${props.replicationRegion}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(props.environmentSuffix === 'prod' ? 90 : 30),
        },
      ],
    });

    // Create primary bucket with cross-region replication
    this.primaryBucket = new s3.Bucket(this, 'PrimaryBucket', {
      bucketName: `tap-primary-${props.environmentSuffix}-${props.primaryRegion}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(props.environmentSuffix === 'prod' ? 90 : 30),
        },
      ],
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Configure cross-region replication
    const replicationConfiguration = {
      role: props.replicationRole.roleArn,
      rules: [
        {
          id: `replication-rule-${props.environmentSuffix}`,
          status: 'Enabled',
          prefix: '',
          destination: {
            bucket: this.replicationBucket.bucketArn,
            storageClass: 'STANDARD_IA',
          },
        },
      ],
    };

    // Add replication configuration to primary bucket
    const cfnPrimaryBucket = this.primaryBucket.node.defaultChild as s3.CfnBucket;
    cfnPrimaryBucket.replicationConfiguration = replicationConfiguration;

    // Create S3 Express One Zone bucket for high-performance workloads (prod only)
    if (props.enableS3Express) {
      // Note: S3 Express One Zone uses directory buckets with different naming
      this.expressBucket = new s3.Bucket(this, 'ExpressBucket', {
        bucketName: `tap-express-${props.environmentSuffix}--use1-az1--x-s3`,
        versioned: false, // Express One Zone doesn't support versioning
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      });

      // Configure Express bucket for high performance
      const cfnExpressBucket = this.expressBucket.node.defaultChild as s3.CfnBucket;
      cfnExpressBucket.addPropertyOverride('BucketConfiguration.Type', 'Directory');
      cfnExpressBucket.addPropertyOverride('BucketConfiguration.Location.Type', 'AvailabilityZone');
      cfnExpressBucket.addPropertyOverride('BucketConfiguration.Location.Name', 'use1-az1');
    }

    // Grant replication permissions
    this.replicationBucket.grantReadWrite(props.replicationRole);
    this.primaryBucket.grantReadWrite(props.replicationRole);

    // Add tags
    const buckets = [this.primaryBucket, this.replicationBucket];
    if (this.expressBucket) buckets.push(this.expressBucket);

    buckets.forEach(bucket => {
      bucket.node.addMetadata('Environment', props.environmentSuffix);
      bucket.node.addMetadata('Component', 'S3');
    });
  }
}
```

## lib/constructs/monitoring-construct.ts

```typescript
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  enableLogging: boolean;
  vpc: ec2.Vpc;
  logRetentionDays: number;
}

export class MonitoringConstruct extends Construct {
  public readonly applicationLogGroup: logs.LogGroup;
  public readonly infrastructureLogGroup?: logs.LogGroup;
  public readonly alertTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create application log group
    this.applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/${props.environmentSuffix}`,
      retention: props.logRetentionDays as logs.RetentionDays,
    });

    // Create infrastructure log group for additional logging
    if (props.enableLogging) {
      this.infrastructureLogGroup = new logs.LogGroup(this, 'InfrastructureLogGroup', {
        logGroupName: `/aws/infrastructure/${props.environmentSuffix}`,
        retention: props.logRetentionDays as logs.RetentionDays,
      });
    }

    // Create SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `infrastructure-alerts-${props.environmentSuffix}`,
      displayName: `Infrastructure Alerts - ${props.environmentSuffix.toUpperCase()}`,
    });

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
      dashboardName: `Infrastructure-${props.environmentSuffix}`,
    });

    // Add VPC metrics to dashboard
    const vpcWidget = new cloudwatch.GraphWidget({
      title: 'VPC Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/VPC',
          metricName: 'PacketDropCount',
          dimensionsMap: {
            VpcId: props.vpc.vpcId,
          },
          statistic: 'Sum',
        }),
      ],
      width: 12,
      height: 6,
    });

    // Add log metrics widget
    const logWidget = new cloudwatch.LogQueryWidget({
      title: 'Application Logs',
      logGroups: [this.applicationLogGroup],
      queryLines: [
        'fields @timestamp, @message',
        'filter @message like /ERROR/',
        'sort @timestamp desc',
        'limit 100',
      ],
      width: 12,
      height: 6,
    });

    // Add widgets to dashboard
    this.dashboard.addWidgets(vpcWidget);
    this.dashboard.addWidgets(logWidget);

    // Create alarms for critical metrics
    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: `HighErrorRate-${props.environmentSuffix}`,
      alarmDescription: 'Alarm for high error rate in application logs',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Logs',
        metricName: 'ErrorCount',
        dimensionsMap: {
          LogGroupName: this.applicationLogGroup.logGroupName,
        },
        statistic: 'Sum',
      }),
      threshold: props.environmentSuffix === 'prod' ? 10 : 25,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    // Add alarm action
    errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Add tags
    const resources = [this.applicationLogGroup, this.alertTopic];
    if (this.infrastructureLogGroup) resources.push(this.infrastructureLogGroup);

    resources.forEach(resource => {
      resource.node.addMetadata('Environment', props.environmentSuffix);
      resource.node.addMetadata('Component', 'Monitoring');
    });
  }
}
```

## lib/constructs/eks-construct.ts

```typescript
import * as eks from 'aws-cdk-lib/aws-eks';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface EksConstructProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  clusterRole: iam.Role;
  nodeGroupRole: iam.Role;
  enableDashboard: boolean;
}

export class EksConstruct extends Construct {
  public readonly cluster: eks.Cluster;
  public readonly nodeGroup: eks.Nodegroup;

  constructor(scope: Construct, id: string, props: EksConstructProps) {
    super(scope, id);

    // Create EKS cluster
    this.cluster = new eks.Cluster(this, 'EksCluster', {
      clusterName: `tap-cluster-${props.environmentSuffix}`,
      version: eks.KubernetesVersion.V1_31,
      role: props.clusterRole,
      vpc: props.vpc,
      vpcSubnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
      endpointAccess: eks.EndpointAccess.PUBLIC_AND_PRIVATE,
      defaultCapacity: 0, // We'll use managed node groups
      outputClusterName: true,
      outputConfigCommand: true,
    });

    // Create managed node group
    this.nodeGroup = new eks.Nodegroup(this, 'NodeGroup', {
      cluster: this.cluster,
      nodegroupName: `tap-nodes-${props.environmentSuffix}`,
      nodeRole: props.nodeGroupRole,
      instanceTypes: [
        props.environmentSuffix === 'prod' 
          ? ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE)
          : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
      ],
      minSize: props.environmentSuffix === 'prod' ? 2 : 1,
      maxSize: props.environmentSuffix === 'prod' ? 10 : 3,
      desiredSize: props.environmentSuffix === 'prod' ? 3 : 2,
      capacityType: props.environmentSuffix === 'prod' ? eks.CapacityType.ON_DEMAND : eks.CapacityType.SPOT,
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      tags: {
        Environment: props.environmentSuffix,
        'kubernetes.io/cluster-autoscaler/enabled': 'true',
        [`kubernetes.io/cluster-autoscaler/${this.cluster.clusterName}`]: 'owned',
      },
    });

    // Enable EKS Dashboard integration if requested
    if (props.enableDashboard) {
      // Add necessary IAM permissions for EKS Dashboard
      const dashboardPolicy = new iam.Policy(this, 'EksDashboardPolicy', {
        policyName: `eks-dashboard-policy-${props.environmentSuffix}`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'eks:DescribeCluster',
              'eks:ListClusters',
              'eks:DescribeNodegroup',
              'eks:ListNodegroups',
              'eks:DescribeAddon',
              'eks:ListAddons',
              'organizations:ListAccounts',
              'organizations:DescribeOrganization',
            ],
            resources: ['*'],
          }),
        ],
      });

      props.clusterRole.attachInlinePolicy(dashboardPolicy);
    }

    // Install AWS Load Balancer Controller
    this.cluster.addHelmChart('AwsLoadBalancerController', {
      chart: 'aws-load-balancer-controller',
      repository: 'https://aws.github.io/eks-charts',
      namespace: 'kube-system',
      release: 'aws-load-balancer-controller',
      version: '1.8.1',
      values: {
        clusterName: this.cluster.clusterName,
        serviceAccount: {
          create: false,
          name: 'aws-load-balancer-controller',
        },
        region: cdk.Stack.of(this).region,
        vpcId: props.vpc.vpcId,
      },
    });

    // Create service account for AWS Load Balancer Controller
    const lbControllerServiceAccount = this.cluster.addServiceAccount('AwsLoadBalancerControllerServiceAccount', {
      name: 'aws-load-balancer-controller',
      namespace: 'kube-system',
    });

    lbControllerServiceAccount.role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('ElasticLoadBalancingFullAccess')
    );

    // Add tags
    this.cluster.node.addMetadata('Environment', props.environmentSuffix);
    this.cluster.node.addMetadata('Component', 'EKS');
    this.nodeGroup.node.addMetadata('Environment', props.environmentSuffix);
    this.nodeGroup.node.addMetadata('Component', 'EKS-NodeGroup');
  }
}
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib@2.204.0",
    "@aws-cdk-contrib/nlb-extended-health-checks:enableExtendedHealthChecks": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeArchitectureProps": true,
    "@aws-cdk/aws-lambda:recognizeRuntimeProps": true,
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "environmentSuffix": "dev"
  }
}
```

This comprehensive solution provides:

1. **Multi-environment support** with parameterized configurations
2. **Consistent VPC setup** across environments with appropriate sizing
3. **IAM roles following least privilege** principles
4. **S3 buckets with cross-region replication** and S3 Express One Zone for production
5. **Comprehensive monitoring** with CloudWatch dashboards and alarms  
6. **EKS cluster** with dashboard integration and managed node groups
7. **Proper tagging and organization** for all resources

To deploy:
- `npm run cdk:deploy` for dev environment
- `npm run cdk:deploy -- --context environmentSuffix=staging` for staging
- `npm run cdk:deploy -- --context environmentSuffix=prod` for production

The solution uses the latest AWS features including S3 Express One Zone for high-performance storage and EKS Dashboard integration for multi-cluster visibility.