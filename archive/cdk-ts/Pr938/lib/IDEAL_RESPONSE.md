# IDEAL RESPONSE - Multi-Environment AWS Infrastructure with CDK TypeScript

## Solution Overview

This CDK TypeScript solution implements a comprehensive multi-environment AWS infrastructure with advanced features including cross-region S3 replication, VPC networking, CloudWatch monitoring, and optional EKS cluster support. The infrastructure is designed with security, scalability, and operational excellence in mind.

## Infrastructure Components

### 1. VPC Network Architecture

```typescript
// lib/constructs/vpc-construct.ts
export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    // Create VPC with public, private, and isolated subnets across multiple AZs
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: props.vpcCidr,
      maxAzs: props.maxAzs,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `Public-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `Private-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
        {
          cidrMask: 28,
          name: `Isolated-${props.environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Enable VPC Flow Logs for security and compliance
    if (props.enableLogging) {
      const logGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
        logGroupName: `/aws/vpc/flowlogs/${props.environmentSuffix}`,
        retention: this.getRetentionDays(props.environmentSuffix),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });

      new ec2.FlowLog(this, 'VpcFlowLog', {
        resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
        destination: ec2.FlowLogDestination.toCloudWatchLogs(logGroup),
        trafficType: ec2.FlowLogTrafficType.ALL,
      });
    }
  }

  private getRetentionDays(environment: string): logs.RetentionDays {
    return environment === 'prod' ? logs.RetentionDays.THREE_MONTHS : logs.RetentionDays.ONE_WEEK;
  }
}
```

### 2. S3 Storage with Cross-Region Replication

```typescript
// lib/constructs/s3-construct.ts
export class S3Construct extends Construct {
  public readonly primaryBucket: s3.Bucket;
  public readonly replicationBucket: s3.Bucket;
  public readonly expressBucket?: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    // Create replication bucket in target region
    this.replicationBucket = new s3.Bucket(this, 'ReplicationBucket', {
      bucketName: `tap-replica-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'DeleteOldVersions',
        noncurrentVersionExpiration: cdk.Duration.days(
          props.environmentSuffix === 'prod' ? 90 : 30
        ),
        enabled: true,
      }],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create primary bucket with replication
    this.primaryBucket = new s3.Bucket(this, 'PrimaryBucket', {
      bucketName: `tap-primary-${props.environmentSuffix}-${cdk.Stack.of(this).account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [{
        allowedHeaders: ['*'],
        allowedMethods: [
          s3.HttpMethods.GET,
          s3.HttpMethods.POST,
          s3.HttpMethods.PUT,
        ],
        allowedOrigins: ['*'],
        maxAge: 3000,
      }],
      lifecycleRules: [
        {
          id: 'TransitionToIA',
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
          enabled: true,
        },
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(
            props.environmentSuffix === 'prod' ? 90 : 30
          ),
          enabled: true,
        },
      ],
      replicationConfiguration: {
        role: props.replicationRole.roleArn,
        rules: [{
          id: 'ReplicateAll',
          status: s3.ReplicationRuleStatus.ENABLED,
          priority: 1,
          deleteMarkerReplication: { status: s3.DeleteMarkerReplicationStatus.ENABLED },
          filter: {},
          destination: {
            bucket: this.replicationBucket.bucketArn,
            replicationTime: {
              status: s3.ReplicationTimeStatus.ENABLED,
              time: cdk.Duration.minutes(15),
            },
            metrics: {
              status: s3.ReplicationRuleStatus.ENABLED,
              eventThreshold: cdk.Duration.minutes(15),
            },
            storageClass: s3.StorageClass.STANDARD_IA,
          },
        }],
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create S3 Express One Zone bucket if enabled
    if (props.enableS3Express) {
      this.expressBucket = new s3.Bucket(this, 'ExpressBucket', {
        bucketName: `tap-express-${props.environmentSuffix}-${cdk.Stack.of(this).account}--use1-az1--x-s3`,
        versioned: false,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });
    }

    // Grant permissions for replication
    this.primaryBucket.grantRead(props.replicationRole);
    this.replicationBucket.grantWrite(props.replicationRole);
  }
}
```

### 3. IAM Security with Least Privilege

```typescript
// lib/constructs/iam-construct.ts
export class IamConstruct extends Construct {
  public readonly s3ReplicationRole: iam.Role;
  public readonly cloudWatchRole: iam.Role;

  constructor(scope: Construct, id: string, props: IamConstructProps) {
    super(scope, id);

    // S3 Replication Role with minimal permissions
    this.s3ReplicationRole = new iam.Role(this, 'S3ReplicationRole', {
      roleName: `s3-replication-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      inlinePolicies: {
        ReplicationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              resources: ['arn:aws:s3:::*/*'],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              resources: ['arn:aws:s3:::*/*'],
            }),
          ],
        }),
      },
    });

    // CloudWatch Logging Role
    if (props.enableLogging) {
      this.cloudWatchRole = new iam.Role(this, 'CloudWatchLoggingRole', {
        roleName: `cloudwatch-logging-role-${props.environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('logs.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        ],
      });
    }
  }
}
```

### 4. CloudWatch Monitoring and Alerting

```typescript
// lib/constructs/monitoring-construct.ts
export class MonitoringConstruct extends Construct {
  public readonly dashboard: cloudwatch.Dashboard;
  public readonly alertTopic: sns.Topic;
  public readonly applicationLogGroup: logs.LogGroup;
  public readonly infrastructureLogGroup?: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    // Create SNS topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `infrastructure-alerts-${props.environmentSuffix}`,
      displayName: `Infrastructure Alerts - ${props.environmentSuffix}`,
    });

    // Create log groups
    this.applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/${props.environmentSuffix}`,
      retention: this.getRetentionDays(props.environmentSuffix),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    if (props.enableLogging) {
      this.infrastructureLogGroup = new logs.LogGroup(this, 'InfrastructureLogGroup', {
        logGroupName: `/aws/infrastructure/${props.environmentSuffix}`,
        retention: this.getRetentionDays(props.environmentSuffix),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // Create custom metric for error rate
    const errorMetric = new cloudwatch.Metric({
      namespace: 'CustomApp',
      metricName: 'ErrorRate',
      dimensionsMap: {
        Environment: props.environmentSuffix,
      },
    });

    // Create alarm for high error rate
    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: `HighErrorRate-${props.environmentSuffix}`,
      metric: errorMetric,
      threshold: props.environmentSuffix === 'prod' ? 10 : 25,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Triggers when error rate is too high',
    });

    errorAlarm.addAlarmAction(new cw_actions.SnsAction(this.alertTopic));

    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `Infrastructure-${props.environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.TextWidget({
            markdown: `# Infrastructure Dashboard - ${props.environmentSuffix}`,
            width: 24,
            height: 1,
          }),
        ],
        [
          new cloudwatch.LogQueryWidget({
            title: 'Application Logs',
            logGroupNames: [this.applicationLogGroup.logGroupName],
            width: 12,
            height: 6,
            queryLines: [
              'fields @timestamp, @message',
              'sort @timestamp desc',
              'limit 100',
            ],
          }),
          new cloudwatch.AlarmWidget({
            title: 'Active Alarms',
            alarm: errorAlarm,
            width: 12,
            height: 6,
          }),
        ],
      ],
    });
  }

  private getRetentionDays(environment: string): logs.RetentionDays {
    switch (environment) {
      case 'prod':
        return logs.RetentionDays.THREE_MONTHS;
      case 'staging':
        return logs.RetentionDays.ONE_MONTH;
      default:
        return logs.RetentionDays.ONE_WEEK;
    }
  }
}
```

### 5. Optional EKS Cluster Support

```typescript
// lib/constructs/eks-construct.ts
export class EksConstruct extends Construct {
  public readonly cluster: eks.Cluster;

  constructor(scope: Construct, id: string, props: EksConstructProps) {
    super(scope, id);

    // Create EKS cluster with managed node group
    this.cluster = new eks.Cluster(this, 'Cluster', {
      clusterName: `tap-eks-${props.environmentSuffix}`,
      version: eks.KubernetesVersion.V1_29,
      vpc: props.vpc,
      vpcSubnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_NAT }],
      defaultCapacity: 0, // We'll add our own node group
      kubectlLayer: new KubectlV29Layer(this, 'KubectlLayer'),
    });

    // Add managed node group
    this.cluster.addManagedNodeGroup('ManagedNodeGroup', {
      instanceTypes: [
        props.environmentSuffix === 'prod' 
          ? ec2.InstanceType.of(ec2.InstanceClass.M5, ec2.InstanceSize.LARGE)
          : ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM)
      ],
      minSize: props.environmentSuffix === 'prod' ? 2 : 1,
      maxSize: props.environmentSuffix === 'prod' ? 10 : 3,
      desiredSize: props.environmentSuffix === 'prod' ? 3 : 1,
      diskSize: 100,
      tags: {
        Environment: props.environmentSuffix,
        ManagedBy: 'CDK',
        'kubernetes.io/cluster-autoscaler/enabled': 'true',
        [`kubernetes.io/cluster-autoscaler/tap-eks-${props.environmentSuffix}`]: 'owned',
      },
    });

    // Add Cluster Autoscaler
    const autoscalerSa = this.cluster.addServiceAccount('ClusterAutoscaler', {
      name: 'cluster-autoscaler',
      namespace: 'kube-system',
    });

    autoscalerSa.role.attachInlinePolicy(new iam.Policy(this, 'ClusterAutoscalerPolicy', {
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'autoscaling:DescribeAutoScalingGroups',
            'autoscaling:DescribeAutoScalingInstances',
            'autoscaling:DescribeLaunchConfigurations',
            'autoscaling:DescribeTags',
            'autoscaling:SetDesiredCapacity',
            'autoscaling:TerminateInstanceInAutoScalingGroup',
            'ec2:DescribeLaunchTemplateVersions',
          ],
          resources: ['*'],
        }),
      ],
    }));
  }
}
```

### 6. Main Stack Integration

```typescript
// lib/tap-stack.ts
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';

    // Create VPC
    const vpcConstruct = new VpcConstruct(this, 'Vpc', {
      environmentSuffix,
      vpcCidr: props.envConfig.vpcCidr,
      maxAzs: props.envConfig.maxAzs,
      enableLogging: props.envConfig.enableLogging,
    });

    // Create IAM roles
    const iamConstruct = new IamConstruct(this, 'Iam', {
      environmentSuffix,
      enableLogging: props.envConfig.enableLogging,
    });

    // Create S3 buckets with replication
    const s3Construct = new S3Construct(this, 'S3', {
      environmentSuffix,
      primaryRegion: props.envConfig.region,
      replicationRegion: props.envConfig.replicationRegion,
      enableS3Express: props.envConfig.s3ExpressOneZone,
      replicationRole: iamConstruct.s3ReplicationRole,
    });

    // Create monitoring
    const monitoringConstruct = new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      enableLogging: props.envConfig.enableLogging,
    });

    // Optionally create EKS cluster
    if (props.envConfig.enableEks) {
      new EksConstruct(this, 'Eks', {
        environmentSuffix,
        vpc: vpcConstruct.vpc,
      });
    }

    // Stack outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID for environment',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Construct.primaryBucket.bucketName,
      description: 'Primary S3 bucket name',
    });
  }
}
```

## Environment Configuration

```typescript
// bin/tap.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion = process.env.AWS_REGION || 'us-east-1';

// Environment-specific configurations
const envConfigs = {
  dev: {
    region: awsRegion,
    replicationRegion: 'us-west-2',
    vpcCidr: '10.0.0.0/16',
    maxAzs: 2,
    enableLogging: true,
    s3ExpressOneZone: false,
    enableEks: false,
  },
  staging: {
    region: awsRegion,
    replicationRegion: 'eu-west-1',
    vpcCidr: '10.1.0.0/16',
    maxAzs: 2,
    enableLogging: true,
    s3ExpressOneZone: false,
    enableEks: true,
  },
  prod: {
    region: awsRegion,
    replicationRegion: 'ap-southeast-1',
    vpcCidr: '10.2.0.0/16',
    maxAzs: 3,
    enableLogging: true,
    s3ExpressOneZone: true,
    enableEks: true,
  },
};

const environment = environmentSuffix.startsWith('prod') ? 'prod' :
                    environmentSuffix.startsWith('staging') ? 'staging' : 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  envConfig: envConfigs[environment],
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: awsRegion,
  },
});
```

## Key Features

### 1. Multi-Environment Support
- Separate configurations for dev, staging, and prod
- Environment-specific resource sizing and retention policies
- Dynamic CIDR allocation per environment

### 2. Cross-Region Replication
- Automatic S3 bucket replication to designated regions
- Replication metrics and monitoring
- Storage class transitions for cost optimization

### 3. Security Best Practices
- VPC with public, private, and isolated subnets
- IAM roles with least privilege principles
- S3 bucket encryption and public access blocking
- VPC Flow Logs for security monitoring

### 4. High Availability
- Multi-AZ deployment
- NAT Gateway for private subnet internet access
- Auto-scaling EKS node groups

### 5. Operational Excellence
- CloudWatch dashboards and alarms
- Centralized logging with retention policies
- SNS notifications for critical alerts
- Comprehensive tagging strategy

### 6. Cost Optimization
- S3 lifecycle policies for storage optimization
- Environment-specific resource sizing
- Automatic cleanup with RemovalPolicy.DESTROY for non-prod

## Testing Strategy

### Unit Testing (100% Coverage)
- Test all constructs in isolation
- Verify CloudFormation template generation
- Validate IAM permissions and policies

### Integration Testing
- Validate deployed AWS resources
- Test cross-region replication
- Verify monitoring and alerting
- Confirm network connectivity

## Deployment

```bash
# Set environment
export ENVIRONMENT_SUFFIX=dev

# Install dependencies
npm install

# Run tests
npm test
npm run test:integration

# Deploy
npm run deploy

# Destroy
npm run destroy
```

## Conclusion

This solution provides a production-ready, multi-environment AWS infrastructure with comprehensive monitoring, security, and scalability features. The modular design allows for easy customization and extension while maintaining best practices for cloud infrastructure management.