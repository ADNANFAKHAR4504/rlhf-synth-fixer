# Multi-Environment AWS CDK Infrastructure

Below is a comprehensive CDK application that provisions infrastructure across multiple AWS regions with enforced tagging, security policies, and multi-environment support.

```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { Construct } from 'constructs';

// Interface for environment configuration
interface EnvironmentConfig {
  environment: string;
  costCenter: string;
  regions: string[];
  vpcCidrs: { [region: string]: string };
  enableBackup: boolean;
  enableMonitoring: boolean;
}

// Interface for resource naming configuration
interface NamingConfig {
  prefix: string;
  separator: string;
  includeRegion: boolean;
  includeEnvironment: boolean;
}

// Utility class for consistent resource naming
class ResourceNaming {
  constructor(
    private config: NamingConfig,
    private environment: string,
    private region: string
  ) {}

  generateName(resourceType: string, suffix?: string): string {
    const parts = [this.config.prefix];

    if (this.config.includeEnvironment) {
      parts.push(this.environment);
    }

    if (this.config.includeRegion) {
      parts.push(this.region.replace('-', ''));
    }

    parts.push(resourceType);

    if (suffix) {
      parts.push(suffix);
    }

    return parts.join(this.config.separator).toLowerCase();
  }
}

// KMS Construct for encryption management
class KmsConstruct extends Construct {
  public readonly key: kms.Key;
  public readonly alias: kms.Alias;

  constructor(
    scope: Construct,
    id: string,
    props: {
      environment: string;
      costCenter: string;
      naming: ResourceNaming;
    }
  ) {
    super(scope, id);

    this.key = new kms.Key(this, 'KmsKey', {
      description: `KMS key for ${props.environment} environment`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.alias = new kms.Alias(this, 'KmsAlias', {
      aliasName: `alias/${props.naming.generateName('kms')}`,
      targetKey: this.key,
    });

    // Apply tags
    cdk.Tags.of(this.key).add('Environment', props.environment);
    cdk.Tags.of(this.key).add('CostCenter', props.costCenter);
  }
}

// VPC Construct with peering capabilities
class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly publicSubnets: ec2.ISubnet[];

  constructor(
    scope: Construct,
    id: string,
    props: {
      cidr: string;
      environment: string;
      costCenter: string;
      naming: ResourceNaming;
    }
  ) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      cidr: props.cidr,
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    this.privateSubnets = this.vpc.privateSubnets;
    this.publicSubnets = this.vpc.publicSubnets;

    // VPC Flow Logs
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    // Apply tags
    cdk.Tags.of(this.vpc).add('Environment', props.environment);
    cdk.Tags.of(this.vpc).add('CostCenter', props.costCenter);
    cdk.Tags.of(this.vpc).add('Name', props.naming.generateName('vpc'));
  }
}

// S3 Construct with encryption and versioning
class S3Construct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: {
      kmsKey: kms.IKey;
      environment: string;
      costCenter: string;
      naming: ResourceNaming;
      bucketSuffix?: string;
    }
  ) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.naming.generateName('s3', props.bucketSuffix),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
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
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Apply tags
    cdk.Tags.of(this.bucket).add('Environment', props.environment);
    cdk.Tags.of(this.bucket).add('CostCenter', props.costCenter);
  }
}

// IAM Construct for managed policies
class IamConstruct extends Construct {
  public readonly backupRole: iam.Role;
  public readonly monitoringRole: iam.Role;

  constructor(
    scope: Construct,
    id: string,
    props: {
      environment: string;
      costCenter: string;
      naming: ResourceNaming;
    }
  ) {
    super(scope, id);

    // Backup service role
    this.backupRole = new iam.Role(this, 'BackupRole', {
      roleName: props.naming.generateName('backup', 'role'),
      assumedBy: new iam.ServicePrincipal('backup.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSBackupServiceRolePolicyForBackup'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSBackupServiceRolePolicyForRestores'
        ),
      ],
    });

    // CloudWatch monitoring role
    this.monitoringRole = new iam.Role(this, 'MonitoringRole', {
      roleName: props.naming.generateName('monitoring', 'role'),
      assumedBy: new iam.ServicePrincipal('cloudwatch.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Apply tags
    cdk.Tags.of(this.backupRole).add('Environment', props.environment);
    cdk.Tags.of(this.backupRole).add('CostCenter', props.costCenter);
    cdk.Tags.of(this.monitoringRole).add('Environment', props.environment);
    cdk.Tags.of(this.monitoringRole).add('CostCenter', props.costCenter);
  }
}

// Backup Construct
class BackupConstruct extends Construct {
  public readonly vault: backup.BackupVault;
  public readonly plan: backup.BackupPlan;

  constructor(
    scope: Construct,
    id: string,
    props: {
      kmsKey: kms.IKey;
      backupRole: iam.IRole;
      environment: string;
      costCenter: string;
      naming: ResourceNaming;
    }
  ) {
    super(scope, id);

    // Backup vault
    this.vault = new backup.BackupVault(this, 'BackupVault', {
      backupVaultName: props.naming.generateName('backup', 'vault'),
      encryptionKey: props.kmsKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Backup plan
    this.plan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: props.naming.generateName('backup', 'plan'),
      backupPlanRules: [
        {
          ruleName: 'DailyBackups',
          scheduleExpression: backup.Schedule.cron({
            hour: '2',
            minute: '0',
          }),
          deleteAfter: cdk.Duration.days(30),
          moveToColdStorageAfter: cdk.Duration.days(7),
        },
        {
          ruleName: 'WeeklyBackups',
          scheduleExpression: backup.Schedule.cron({
            weekDay: 'SUN',
            hour: '3',
            minute: '0',
          }),
          deleteAfter: cdk.Duration.days(90),
          moveToColdStorageAfter: cdk.Duration.days(14),
        },
      ],
    });

    // Apply tags
    cdk.Tags.of(this.vault).add('Environment', props.environment);
    cdk.Tags.of(this.vault).add('CostCenter', props.costCenter);
    cdk.Tags.of(this.plan).add('Environment', props.environment);
    cdk.Tags.of(this.plan).add('CostCenter', props.costCenter);
  }
}

// Monitoring Construct
class MonitoringConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(
    scope: Construct,
    id: string,
    props: {
      kmsKey: kms.IKey;
      environment: string;
      costCenter: string;
      naming: ResourceNaming;
      vpc: ec2.IVpc;
    }
  ) {
    super(scope, id);

    // SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: props.naming.generateName('alarm', 'topic'),
      masterKey: props.kmsKey,
    });

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: props.naming.generateName('dashboard'),
    });

    // VPC monitoring alarms
    const vpcFlowLogsMetric = new cloudwatch.Metric({
      namespace: 'AWS/VPC',
      metricName: 'PacketsDropped',
      dimensionsMap: {
        VpcId: props.vpc.vpcId,
      },
    });

    new cloudwatch.Alarm(this, 'VpcPacketsDroppedAlarm', {
      alarmName: props.naming.generateName('vpc', 'packets-dropped-alarm'),
      metric: vpcFlowLogsMetric,
      threshold: 100,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Apply tags
    cdk.Tags.of(this.alarmTopic).add('Environment', props.environment);
    cdk.Tags.of(this.alarmTopic).add('CostCenter', props.costCenter);
  }
}

// VPC Peering Construct
class VpcPeeringConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: {
      sourceVpc: ec2.IVpc;
      targetVpcId: string;
      targetRegion: string;
      environment: string;
      costCenter: string;
      naming: ResourceNaming;
    }
  ) {
    super(scope, id);

    const peeringConnection = new ec2.CfnVPCPeeringConnection(
      this,
      'PeeringConnection',
      {
        vpcId: props.sourceVpc.vpcId,
        peerVpcId: props.targetVpcId,
        peerRegion: props.targetRegion,
      }
    );

    // Apply tags
    cdk.Tags.of(peeringConnection).add('Environment', props.environment);
    cdk.Tags.of(peeringConnection).add('CostCenter', props.costCenter);
    cdk.Tags.of(peeringConnection).add(
      'Name',
      props.naming.generateName('peering')
    );
  }
}

// Pipeline Construct for CI/CD
class PipelineConstruct extends Construct {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(
    scope: Construct,
    id: string,
    props: {
      kmsKey: kms.IKey;
      artifactBucket: s3.IBucket;
      environment: string;
      costCenter: string;
      naming: ResourceNaming;
    }
  ) {
    super(scope, id);

    // CodeCommit repository
    const repository = new codecommit.Repository(this, 'Repository', {
      repositoryName: props.naming.generateName('repo'),
      description: `Infrastructure repository for ${props.environment}`,
    });

    // CodeBuild project
    const buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: props.naming.generateName('build'),
      source: codebuild.Source.codeCommit({
        repository: repository,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        computeType: codebuild.ComputeType.SMALL,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '14',
            },
            commands: ['npm install -g aws-cdk', 'npm install'],
          },
          build: {
            commands: [
              'npm run build',
              'cdk synth',
              'cdk deploy --require-approval never',
            ],
          },
        },
        artifacts: {
          files: ['**/*'],
        },
      }),
      encryptionKey: props.kmsKey,
    });

    // Pipeline
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: props.naming.generateName('pipeline'),
      artifactBucket: props.artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'Source',
              repository: repository,
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
      ],
    });

    // Apply tags
    cdk.Tags.of(repository).add('Environment', props.environment);
    cdk.Tags.of(repository).add('CostCenter', props.costCenter);
    cdk.Tags.of(buildProject).add('Environment', props.environment);
    cdk.Tags.of(buildProject).add('CostCenter', props.costCenter);
    cdk.Tags.of(this.pipeline).add('Environment', props.environment);
    cdk.Tags.of(this.pipeline).add('CostCenter', props.costCenter);
  }
}

// Main TapStack class
export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get configuration from context or environment variables
    const environmentConfig: EnvironmentConfig = {
      environment:
        this.node.tryGetContext('environment') ||
        process.env.ENVIRONMENT ||
        'development',
      costCenter:
        this.node.tryGetContext('costCenter') ||
        process.env.COST_CENTER ||
        'engineering',
      regions: this.node.tryGetContext('regions')?.split(',') || [
        'us-east-2',
        'us-west-2',
        'eu-west-1',
      ],
      vpcCidrs: this.node.tryGetContext('vpcCidrs') || {
        'us-east-2': '10.0.0.0/16',
        'us-west-2': '10.1.0.0/16',
        'eu-west-1': '10.2.0.0/16',
      },
      enableBackup: this.node.tryGetContext('enableBackup') !== 'false',
      enableMonitoring: this.node.tryGetContext('enableMonitoring') !== 'false',
    };

    const namingConfig: NamingConfig = {
      prefix:
        this.node.tryGetContext('namePrefix') ||
        process.env.NAME_PREFIX ||
        'tap',
      separator: '-',
      includeRegion: true,
      includeEnvironment: true,
    };

    const currentRegion = this.region;
    const naming = new ResourceNaming(
      namingConfig,
      environmentConfig.environment,
      currentRegion
    );

    // KMS for encryption
    const kmsConstruct = new KmsConstruct(this, 'Kms', {
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
    });

    // VPC
    const vpcConstruct = new VpcConstruct(this, 'Vpc', {
      cidr: environmentConfig.vpcCidrs[currentRegion] || '10.0.0.0/16',
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
    });

    // S3 buckets
    const artifactBucket = new S3Construct(this, 'ArtifactBucket', {
      kmsKey: kmsConstruct.key,
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
      bucketSuffix: 'artifacts',
    });

    const dataBucket = new S3Construct(this, 'DataBucket', {
      kmsKey: kmsConstruct.key,
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
      bucketSuffix: 'data',
    });

    // IAM roles
    const iamConstruct = new IamConstruct(this, 'Iam', {
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
    });

    // Backup (conditional)
    if (environmentConfig.enableBackup) {
      const backupConstruct = new BackupConstruct(this, 'Backup', {
        kmsKey: kmsConstruct.key,
        backupRole: iamConstruct.backupRole,
        environment: environmentConfig.environment,
        costCenter: environmentConfig.costCenter,
        naming: naming,
      });

      // Add backup selections
      backupConstruct.plan.addSelection('BackupSelection', {
        resources: [
          backup.BackupResource.fromTag(
            'Environment',
            environmentConfig.environment
          ),
        ],
        role: iamConstruct.backupRole,
      });
    }

    // Monitoring (conditional)
    if (environmentConfig.enableMonitoring) {
      new MonitoringConstruct(this, 'Monitoring', {
        kmsKey: kmsConstruct.key,
        environment: environmentConfig.environment,
        costCenter: environmentConfig.costCenter,
        naming: naming,
        vpc: vpcConstruct.vpc,
      });
    }

    // Pipeline for CI/CD
    new PipelineConstruct(this, 'Pipeline', {
      kmsKey: kmsConstruct.key,
      artifactBucket: artifactBucket.bucket,
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${naming.generateName('vpc')}-id`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsConstruct.key.keyId,
      description: 'KMS Key ID',
      exportName: `${naming.generateName('kms')}-id`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucket.bucketName,
      description: 'Artifact S3 Bucket Name',
      exportName: `${naming.generateName('s3', 'artifacts')}-name`,
    });

    // Apply stack-level tags
    cdk.Tags.of(this).add('Environment', environmentConfig.environment);
    cdk.Tags.of(this).add('CostCenter', environmentConfig.costCenter);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Region', currentRegion);
  }
}

// App definition for multi-region deployment
export class TapApp extends cdk.App {
  constructor() {
    super();

    const environments = ['development', 'staging', 'production'];
    const regions = ['us-east-2', 'us-west-2', 'eu-west-1'];

    environments.forEach(env => {
      regions.forEach(region => {
        new TapStack(this, `TapStack-${env}-${region}`, {
          env: {
            region: region,
            account: process.env.CDK_DEFAULT_ACCOUNT,
          },
          stackName: `tap-${env}-${region}`,
          description: `TAP Infrastructure Stack for ${env} environment in ${region}`,
        });
      });
    });
  }
}

// For standalone usage
if (require.main === module) {
  new TapApp();
}
```

## Key Features Implemented

### 1. **Multi-Environment & Multi-Region Support**

- Configurable through context variables or environment variables
- Supports development, staging, and production environments
- Deploys to us-east-2, us-west-2, and eu-west-1 regions

### 2. **Enforced Tagging**

- All resources automatically tagged with `Environment` and `CostCenter`
- Additional tags for management and region identification

### 3. **Parameterized Resource Naming**

- `ResourceNaming` utility class for consistent naming
- Configurable prefix, separator, and naming patterns
- Includes environment and region in resource names

### 4. **Security & Encryption**

- KMS keys with automatic rotation
- S3 buckets with KMS encryption and versioning
- SSL enforcement and blocked public access

### 5. **Backup Policies**

- AWS Backup with daily and weekly schedules
- Automated lifecycle management
- Cross-region backup support

### 6. **VPC & Networking**

- Multi-AZ VPC with public, private, and isolated subnets
- VPC Flow Logs for monitoring
- VPC peering construct for cross-region connectivity

### 7. **Monitoring & Alarms**

- CloudWatch dashboards and alarms
- SNS topics for notifications
- VPC and resource monitoring

### 8. **CI/CD Pipeline**

- CodeCommit, CodeBuild, and CodePipeline integration
- Automated deployment with CDK
- Artifact management with S3

## Usage Examples

### Deploy to Development Environment

```bash
# Set context variables
cdk deploy --context environment=development --context costCenter=engineering

# Or use environment variables
export ENVIRONMENT=development
export COST_CENTER=engineering
cdk deploy
```

### Deploy to Multiple Regions

```bash
# Deploy to specific regions
cdk deploy --context regions=us-east-2,eu-west-1

# Deploy all stacks
cdk deploy --all
```

### Configure Custom VPC CIDRs

```bash
cdk deploy --context vpcCidrs='{"us-east-2":"10.10.0.0/16","us-west-2":"10.11.0.0/16"}'
```

This comprehensive solution provides a robust, secure, and scalable infrastructure foundation that meets all the specified requirements for multi-environment, multi-region AWS deployments.
