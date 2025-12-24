```
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      ipAddresses: ec2.IpAddresses.cidr(props.cidr),
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    // Backup vault - use shorter naming to stay within AWS limits
    const stackNameShort = cdk.Stack.of(this)
      .stackName.replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10);
    this.vault = new backup.BackupVault(this, 'BackupVault', {
      backupVaultName: `tap-${props.environment}-backup-${stackNameShort}`,
      encryptionKey: props.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Backup plan - use our custom vault
    this.plan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: `tap-${props.environment}-plan-${stackNameShort}`,
      backupVault: this.vault,
    });

    // Add backup rules - comply with AWS Backup lifecycle requirements
    this.plan.addRule(
      new backup.BackupPlanRule({
        ruleName: 'DailyBackups',
        scheduleExpression: events.Schedule.cron({
          hour: '2',
          minute: '0',
        }),
        deleteAfter: cdk.Duration.days(120), // Must be at least 90 days after cold storage
        moveToColdStorageAfter: cdk.Duration.days(7),
      })
    );

    this.plan.addRule(
      new backup.BackupPlanRule({
        ruleName: 'WeeklyBackups',
        scheduleExpression: events.Schedule.cron({
          weekDay: 'SUN',
          hour: '3',
          minute: '0',
        }),
        deleteAfter: cdk.Duration.days(365), // Must be at least 90 days after cold storage
        moveToColdStorageAfter: cdk.Duration.days(30),
      })
    );

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
    const stackNameShort = cdk.Stack.of(this)
      .stackName.replace(/[^a-zA-Z0-9]/g, '')
      .substring(0, 10);
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `tap-${props.environment}-alarms-${stackNameShort}`,
      masterKey: props.kmsKey,
    });

    // CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `tap-${props.environment}-dashboard-${stackNameShort}`,
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

// VPC Peering Construct for cross-region connectivity
class VpcPeeringConstruct extends Construct {
  public readonly peeringConnection: ec2.CfnVPCPeeringConnection;
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

    this.peeringConnection = new ec2.CfnVPCPeeringConnection(
      this,
      'PeeringConnection',
      {
        vpcId: props.sourceVpc.vpcId,
        peerVpcId: props.targetVpcId,
        peerRegion: props.targetRegion,
      }
    );

    // Apply tags
    cdk.Tags.of(this.peeringConnection).add('Environment', props.environment);
    cdk.Tags.of(this.peeringConnection).add('CostCenter', props.costCenter);
    cdk.Tags.of(this.peeringConnection).add(
      'Name',
      props.naming.generateName('peering')
    );
  }
}

// Pipeline Construct for CI/CD
class PipelineConstruct extends Construct {
  public readonly pipeline: codepipeline.Pipeline;
  public readonly buildProject: codebuild.Project;

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

    // Check if CodeCommit is enabled (default to false, can be enabled via context)
    let enableCodeCommit =
      scope.node.tryGetContext('enableCodeCommit') === 'true';

    let repository: codecommit.IRepository | undefined;
    let sourceAction: codepipeline.IAction;
    let sourceOutput: codepipeline.Artifact;

    // Default to S3 source action
    sourceOutput = new codepipeline.Artifact();
    sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'Source',
      bucket: props.artifactBucket,
      bucketKey: 'source.zip',
      output: sourceOutput,
    });

    if (enableCodeCommit) {
      try {
        // CodeCommit repository
        repository = new codecommit.Repository(this, 'Repository', {
          repositoryName: props.naming.generateName('repo'),
          description: `Infrastructure repository for ${props.environment}`,
        });

        sourceOutput = new codepipeline.Artifact();
        sourceAction = new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'Source',
          repository: repository,
          output: sourceOutput,
        });

        // Apply tags to repository
        cdk.Tags.of(repository).add('Environment', props.environment);
        cdk.Tags.of(repository).add('CostCenter', props.costCenter);
      } catch (error) {
        console.warn(
          'CodeCommit repository creation failed, using S3 source:',
          error
        );
        // Keep the default S3 source action
      }
    }

    // CodeBuild project
    this.buildProject = new codebuild.Project(this, 'BuildProject', {
      projectName: props.naming.generateName('build'),
      source: repository
        ? codebuild.Source.codeCommit({ repository })
        : codebuild.Source.s3({
            bucket: props.artifactBucket,
            path: 'source.zip',
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
    const buildOutput = new codepipeline.Artifact();

    this.pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: props.naming.generateName('pipeline'),
      artifactBucket: props.artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [sourceAction],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: this.buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
      ],
    });

    // Apply tags
    cdk.Tags.of(this.buildProject).add('Environment', props.environment);
    cdk.Tags.of(this.buildProject).add('CostCenter', props.costCenter);
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
    let backupConstruct: BackupConstruct | undefined;
    if (environmentConfig.enableBackup) {
      backupConstruct = new BackupConstruct(this, 'Backup', {
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
    let monitoringConstruct: MonitoringConstruct | undefined;
    if (environmentConfig.enableMonitoring) {
      monitoringConstruct = new MonitoringConstruct(this, 'Monitoring', {
        kmsKey: kmsConstruct.key,
        environment: environmentConfig.environment,
        costCenter: environmentConfig.costCenter,
        naming: naming,
        vpc: vpcConstruct.vpc,
      });
    }

    // Pipeline for CI/CD
    const pipelineConstruct = new PipelineConstruct(this, 'Pipeline', {
      kmsKey: kmsConstruct.key,
      artifactBucket: artifactBucket.bucket,
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
    });

    // VPC Peering (conditional - only when target VPC is specified)
    const targetVpcId = this.node.tryGetContext('targetVpcId');
    const targetRegion = this.node.tryGetContext('targetRegion');

    let vpcPeeringConstruct: VpcPeeringConstruct | undefined;
    if (targetVpcId && targetRegion) {
      vpcPeeringConstruct = new VpcPeeringConstruct(this, 'VpcPeering', {
        sourceVpc: vpcConstruct.vpc,
        targetVpcId: targetVpcId,
        targetRegion: targetRegion,
        environment: environmentConfig.environment,
        costCenter: environmentConfig.costCenter,
        naming: naming,
      });
    }

    // Outputs for integration testing
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
      exportName: `${naming.generateName('vpc')}-id`,
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: vpcConstruct.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: `${naming.generateName('vpc')}-cidr`,
    });

    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: vpcConstruct.privateSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Private Subnet IDs (comma-separated)',
      exportName: `${naming.generateName('vpc')}-private-subnets`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpcConstruct.publicSubnets
        .map(subnet => subnet.subnetId)
        .join(','),
      description: 'Public Subnet IDs (comma-separated)',
      exportName: `${naming.generateName('vpc')}-public-subnets`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsConstruct.key.keyId,
      description: 'KMS Key ID',
      exportName: `${naming.generateName('kms')}-id`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: kmsConstruct.key.keyArn,
      description: 'KMS Key ARN',
      exportName: `${naming.generateName('kms')}-arn`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucket.bucketName,
      description: 'Artifact S3 Bucket Name',
      exportName: `${naming.generateName('s3', 'artifacts')}-name`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketArn', {
      value: artifactBucket.bucket.bucketArn,
      description: 'Artifact S3 Bucket ARN',
      exportName: `${naming.generateName('s3', 'artifacts')}-arn`,
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucket.bucketName,
      description: 'Data S3 Bucket Name',
      exportName: `${naming.generateName('s3', 'data')}-name`,
    });

    new cdk.CfnOutput(this, 'DataBucketArn', {
      value: dataBucket.bucket.bucketArn,
      description: 'Data S3 Bucket ARN',
      exportName: `${naming.generateName('s3', 'data')}-arn`,
    });

    new cdk.CfnOutput(this, 'BackupRoleArn', {
      value: iamConstruct.backupRole.roleArn,
      description: 'Backup IAM Role ARN',
      exportName: `${naming.generateName('backup', 'role')}-arn`,
    });

    new cdk.CfnOutput(this, 'MonitoringRoleArn', {
      value: iamConstruct.monitoringRole.roleArn,
      description: 'Monitoring IAM Role ARN',
      exportName: `${naming.generateName('monitoring', 'role')}-arn`,
    });

    // Conditional outputs for backup resources
    if (environmentConfig.enableBackup && backupConstruct) {
      new cdk.CfnOutput(this, 'BackupVaultName', {
        value: backupConstruct.vault.backupVaultName,
        description: 'Backup Vault Name',
        exportName: `${naming.generateName('backup', 'vault')}-name`,
      });

      new cdk.CfnOutput(this, 'BackupVaultArn', {
        value: backupConstruct.vault.backupVaultArn,
        description: 'Backup Vault ARN',
        exportName: `${naming.generateName('backup', 'vault')}-arn`,
      });

      new cdk.CfnOutput(this, 'BackupPlanName', {
        value: backupConstruct.plan.backupPlanArn.split('/').pop() || '',
        description: 'Backup Plan Name',
        exportName: `${naming.generateName('backup', 'plan')}-name`,
      });

      new cdk.CfnOutput(this, 'BackupPlanArn', {
        value: backupConstruct.plan.backupPlanArn,
        description: 'Backup Plan ARN',
        exportName: `${naming.generateName('backup', 'plan')}-arn`,
      });
    }

    // Conditional outputs for monitoring resources
    if (environmentConfig.enableMonitoring && monitoringConstruct) {
      new cdk.CfnOutput(this, 'AlarmTopicArn', {
        value: monitoringConstruct.alarmTopic.topicArn,
        description: 'SNS Alarm Topic ARN',
        exportName: `${naming.generateName('monitoring', 'topic')}-arn`,
      });

      new cdk.CfnOutput(this, 'AlarmTopicName', {
        value: monitoringConstruct.alarmTopic.topicName,
        description: 'SNS Alarm Topic Name',
        exportName: `${naming.generateName('monitoring', 'topic')}-name`,
      });

      new cdk.CfnOutput(this, 'DashboardName', {
        value: monitoringConstruct.dashboard.dashboardName,
        description: 'CloudWatch Dashboard Name',
        exportName: `${naming.generateName('monitoring', 'dashboard')}-name`,
      });
    }

    // Pipeline outputs
    new cdk.CfnOutput(this, 'CodeBuildProjectName', {
      value: pipelineConstruct.buildProject.projectName,
      description: 'CodeBuild Project Name',
      exportName: `${naming.generateName('build')}-name`,
    });

    new cdk.CfnOutput(this, 'CodeBuildProjectArn', {
      value: pipelineConstruct.buildProject.projectArn,
      description: 'CodeBuild Project ARN',
      exportName: `${naming.generateName('build')}-arn`,
    });

    new cdk.CfnOutput(this, 'CodePipelineName', {
      value: pipelineConstruct.pipeline.pipelineName,
      description: 'CodePipeline Name',
      exportName: `${naming.generateName('pipeline')}-name`,
    });

    new cdk.CfnOutput(this, 'CodePipelineArn', {
      value: pipelineConstruct.pipeline.pipelineArn,
      description: 'CodePipeline ARN',
      exportName: `${naming.generateName('pipeline')}-arn`,
    });

    // Conditional outputs for VPC peering
    if (targetVpcId && targetRegion && vpcPeeringConstruct) {
      new cdk.CfnOutput(this, 'VpcPeeringConnectionId', {
        value: vpcPeeringConstruct.peeringConnection.ref,
        description: 'VPC Peering Connection ID',
        exportName: `${naming.generateName('peering')}-id`,
      });
    }

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