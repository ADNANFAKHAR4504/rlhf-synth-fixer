// tap-stack.ts - LocalStack Community Edition Compatible
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

// Note: AWS Backup, CodeCommit, CodeBuild, CodePipeline, and VPC Flow Logs removed for LocalStack Community Edition

interface EnvironmentConfig {
  environment: string;
  costCenter: string;
  regions: string[];
  vpcCidrs: { [region: string]: string };
  enableMonitoring: boolean;
}

interface NamingConfig {
  prefix: string;
  separator: string;
  includeRegion: boolean;
  includeEnvironment: boolean;
}

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
      parts.push(this.region.replace(/-/g, ''));
    }
    parts.push(resourceType);
    if (suffix) {
      parts.push(suffix);
    }
    return parts.join(this.config.separator).toLowerCase();
  }
}

class KmsConstruct extends Construct {
  public readonly key: kms.Key;
  public readonly alias: kms.Alias;

  constructor(scope: Construct, id: string, props: { environment: string; costCenter: string; naming: ResourceNaming }) {
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
    cdk.Tags.of(this.key).add('Environment', props.environment);
    cdk.Tags.of(this.key).add('CostCenter', props.costCenter);
  }
}

class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly privateSubnets: ec2.ISubnet[];
  public readonly publicSubnets: ec2.ISubnet[];

  constructor(scope: Construct, id: string, props: { cidr: string; environment: string; costCenter: string; naming: ResourceNaming }) {
    super(scope, id);
    this.vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr(props.cidr),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        { cidrMask: 24, name: 'Public', subnetType: ec2.SubnetType.PUBLIC },
        { cidrMask: 24, name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      ],
    });
    this.privateSubnets = this.vpc.privateSubnets;
    this.publicSubnets = this.vpc.publicSubnets;
    cdk.Tags.of(this.vpc).add('Environment', props.environment);
    cdk.Tags.of(this.vpc).add('CostCenter', props.costCenter);
    cdk.Tags.of(this.vpc).add('Name', props.naming.generateName('vpc'));
  }
}

class S3Construct extends Construct {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: { kmsKey: kms.IKey; environment: string; costCenter: string; naming: ResourceNaming; bucketSuffix?: string }) {
    super(scope, id);
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.naming.generateName('s3', props.bucketSuffix),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    cdk.Tags.of(this.bucket).add('Environment', props.environment);
    cdk.Tags.of(this.bucket).add('CostCenter', props.costCenter);
  }
}

class IamConstruct extends Construct {
  public readonly monitoringRole: iam.Role;

  constructor(scope: Construct, id: string, props: { environment: string; costCenter: string; naming: ResourceNaming }) {
    super(scope, id);
    this.monitoringRole = new iam.Role(this, 'MonitoringRole', {
      roleName: props.naming.generateName('monitoring', 'role'),
      assumedBy: new iam.ServicePrincipal('cloudwatch.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });
    cdk.Tags.of(this.monitoringRole).add('Environment', props.environment);
    cdk.Tags.of(this.monitoringRole).add('CostCenter', props.costCenter);
  }
}

class MonitoringConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;
  public readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props: { kmsKey: kms.IKey; environment: string; costCenter: string; naming: ResourceNaming; vpc: ec2.IVpc }) {
    super(scope, id);
    const stackNameShort = cdk.Stack.of(this).stackName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `tap-${props.environment}-alarms-${stackNameShort}`,
      masterKey: props.kmsKey,
    });
    this.dashboard = new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `tap-${props.environment}-dashboard-${stackNameShort}`,
    });
    const vpcMetric = new cloudwatch.Metric({
      namespace: 'AWS/VPC',
      metricName: 'PacketsDropped',
      dimensionsMap: { VpcId: props.vpc.vpcId },
    });
    new cloudwatch.Alarm(this, 'VpcPacketsDroppedAlarm', {
      alarmName: props.naming.generateName('vpc', 'packets-dropped-alarm'),
      metric: vpcMetric,
      threshold: 100,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });
    cdk.Tags.of(this.alarmTopic).add('Environment', props.environment);
    cdk.Tags.of(this.alarmTopic).add('CostCenter', props.costCenter);
  }
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environmentConfig: EnvironmentConfig = {
      environment: this.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'development',
      costCenter: this.node.tryGetContext('costCenter') || process.env.COST_CENTER || 'engineering',
      regions: this.node.tryGetContext('regions')?.split(',') || ['us-east-1'],
      vpcCidrs: this.node.tryGetContext('vpcCidrs') || { 'us-east-1': '10.0.0.0/16' },
      enableMonitoring: this.node.tryGetContext('enableMonitoring') !== 'false',
    };

    const namingConfig: NamingConfig = {
      prefix: this.node.tryGetContext('namePrefix') || process.env.NAME_PREFIX || 'tap',
      separator: '-',
      includeRegion: true,
      includeEnvironment: true,
    };

    const currentRegion = this.region;
    const naming = new ResourceNaming(namingConfig, environmentConfig.environment, currentRegion);

    const kmsConstruct = new KmsConstruct(this, 'Kms', {
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
    });

    const vpcConstruct = new VpcConstruct(this, 'Vpc', {
      cidr: environmentConfig.vpcCidrs[currentRegion] || '10.0.0.0/16',
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
    });

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

    const iamConstruct = new IamConstruct(this, 'Iam', {
      environment: environmentConfig.environment,
      costCenter: environmentConfig.costCenter,
      naming: naming,
    });

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
      value: vpcConstruct.privateSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Private Subnet IDs',
      exportName: `${naming.generateName('vpc')}-private-subnets`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpcConstruct.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public Subnet IDs',
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

    new cdk.CfnOutput(this, 'MonitoringRoleArn', {
      value: iamConstruct.monitoringRole.roleArn,
      description: 'Monitoring IAM Role ARN',
      exportName: `${naming.generateName('monitoring', 'role')}-arn`,
    });

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

    cdk.Tags.of(this).add('Environment', environmentConfig.environment);
    cdk.Tags.of(this).add('CostCenter', environmentConfig.costCenter);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Region', currentRegion);
    cdk.Tags.of(this).add('LocalStack', 'true');
  }
}
