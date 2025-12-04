import { TerraformStack, S3Backend } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { EcrRepository } from '@cdktf/provider-aws/lib/ecr-repository';
import { VpcConstruct } from './constructs/vpc-construct';
import { AuroraConstruct } from './constructs/aurora-construct';
import { EcsConstruct } from './constructs/ecs-construct';
import { AlbConstruct } from './constructs/alb-construct';
import { S3Construct } from './constructs/s3-construct';
import { CloudWatchConstruct } from './constructs/cloudwatch-construct';
import { EnvironmentConfig, DeploymentManifest, ResourceInfo } from './types';
import { TerraformOutput } from 'cdktf';

export interface BaseEnvironmentStackProps {
  config: EnvironmentConfig;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
}

export abstract class BaseEnvironmentStack extends TerraformStack {
  protected config: EnvironmentConfig;
  protected vpc: VpcConstruct;
  protected aurora: AuroraConstruct;
  protected alb: AlbConstruct;
  protected ecs: EcsConstruct;
  protected s3: S3Construct;
  protected cloudwatch: CloudWatchConstruct;
  protected sharedEcrRepository: EcrRepository;
  protected manifest: DeploymentManifest;

  constructor(scope: Construct, id: string, props: BaseEnvironmentStackProps) {
    super(scope, id);

    this.config = props.config;
    const awsRegion = props.awsRegion || 'us-east-1';
    const stateBucketRegion = props.stateBucketRegion || 'us-east-1';
    const stateBucket = props.stateBucket || 'iac-rlhf-tf-states';

    // Initialize manifest
    this.manifest = {
      environment: this.config.name,
      timestamp: new Date().toISOString(),
      resources: [],
      tags: this.getCommonTags(),
    };

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: this.getCommonTags(),
        },
      ],
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${this.config.name}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get availability zones (for future use if needed)
    // const azs = new DataAwsAvailabilityZones(this, 'azs', {
    //   state: 'available',
    // });

    // Validate configuration at synthesis time
    this.validateConfiguration();

    // Create shared ECR repository (once per account)
    this.sharedEcrRepository = new EcrRepository(this, 'ecr-repo', {
      name: `trading-app-${this.config.name}`,
      imageTagMutability: 'MUTABLE',
      imageScanningConfiguration: {
        scanOnPush: true,
      },
      forceDelete: true,
      tags: {
        Name: `ecr-trading-app-${this.config.name}`,
        ...this.getCommonTags(),
      },
    });

    this.addResourceToManifest({
      type: 'ECR Repository',
      name: this.sharedEcrRepository.name,
      arn: this.sharedEcrRepository.arn,
      properties: {
        repositoryUrl: this.sharedEcrRepository.repositoryUrl,
      },
    });

    // Create VPC
    this.vpc = new VpcConstruct(this, 'vpc', {
      environmentSuffix: this.config.name,
      cidrBlock: this.config.cidrBlock,
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`, `${awsRegion}c`],
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'VPC',
      name: `vpc-${this.config.name}`,
      arn: this.vpc.vpc.arn,
      properties: {
        cidrBlock: this.config.cidrBlock,
        vpcId: this.vpc.vpc.id,
      },
    });

    // Create Aurora cluster
    this.aurora = new AuroraConstruct(this, 'aurora', {
      environmentSuffix: this.config.name,
      vpcId: this.vpc.vpc.id,
      subnetIds: this.vpc.privateSubnets.map(s => s.id),
      engine: 'aurora-postgresql',
      engineVersion: '14.6',
      instanceClass: this.config.instanceType,
      instanceCount: this.getAuroraInstanceCount(),
      databaseName: 'tradingdb',
      masterUsername: 'dbadmin',
      replicationSourceArn: this.config.replicationSourceArn,
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'RDS Aurora Cluster',
      name: `aurora-cluster-${this.config.name}`,
      arn: this.aurora.cluster.arn,
      properties: {
        clusterIdentifier: this.aurora.cluster.clusterIdentifier,
        endpoint: this.aurora.cluster.endpoint,
        instanceCount: this.getAuroraInstanceCount(),
      },
    });

    // Create ALB
    this.alb = new AlbConstruct(this, 'alb', {
      environmentSuffix: this.config.name,
      vpcId: this.vpc.vpc.id,
      subnetIds: this.vpc.publicSubnets.map(s => s.id),
      certificateArn: this.config.certificateArn,
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'Application Load Balancer',
      name: `alb-${this.config.name}`,
      arn: this.alb.alb.arn,
      properties: {
        dnsName: this.alb.alb.dnsName,
        targetGroupArn: this.alb.targetGroup.arn,
      },
    });

    // Create ECS cluster and service
    this.ecs = new EcsConstruct(this, 'ecs', {
      environmentSuffix: this.config.name,
      vpcId: this.vpc.vpc.id,
      subnetIds: this.vpc.privateSubnets.map(s => s.id),
      ecrRepositoryUrl: this.sharedEcrRepository.repositoryUrl,
      imageTag: this.getImageTag(),
      containerPort: 8080,
      desiredCount: this.config.minCapacity,
      cpu: this.getEcsCpu(),
      memory: this.getEcsMemory(),
      targetGroupArn: this.alb.targetGroup.arn,
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'ECS Cluster',
      name: `ecs-cluster-${this.config.name}`,
      arn: this.ecs.cluster.arn,
      properties: {
        clusterName: this.ecs.cluster.name,
        serviceName: this.ecs.service.name,
        desiredCount: this.config.minCapacity,
      },
    });

    // Create S3 bucket for static assets
    this.s3 = new S3Construct(this, 's3-assets', {
      environmentSuffix: this.config.name,
      bucketName: 'trading-app-assets',
      enableVersioning: true,
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'S3 Bucket',
      name: `trading-app-assets-${this.config.name}`,
      arn: this.s3.bucket.arn,
      properties: {
        bucketName: this.s3.bucket.bucket,
      },
    });

    // Create CloudWatch dashboard and alarms
    this.cloudwatch = new CloudWatchConstruct(this, 'cloudwatch', {
      environmentSuffix: this.config.name,
      ecsClusterName: this.ecs.cluster.name,
      ecsServiceName: this.ecs.service.name,
      albTargetGroupArn: this.alb.targetGroup.arn,
      rdsClusterIdentifier: this.aurora.cluster.clusterIdentifier,
      alarmThresholds: this.getAlarmThresholds(),
      tags: this.getCommonTags(),
    });

    this.addResourceToManifest({
      type: 'CloudWatch Dashboard',
      name: `trading-app-${this.config.name}`,
      arn: this.cloudwatch.dashboard.dashboardArn,
      properties: {
        dashboardName: this.cloudwatch.dashboard.dashboardName,
        alarmCount: this.cloudwatch.alarms.length,
      },
    });

    // Create outputs
    this.createOutputs();
  }

  protected getCommonTags(): Record<string, string> {
    return {
      Environment: this.config.name,
      CostCenter: this.config.costCenter,
      DeploymentTimestamp: new Date().toISOString(),
      ManagedBy: 'CDKTF',
      Application: 'TradingApp',
    };
  }

  protected validateConfiguration(): void {
    const errors: string[] = [];

    if (!this.config.name) {
      errors.push('Environment name is required');
    }

    if (
      !this.config.cidrBlock ||
      !this.config.cidrBlock.match(/^10\.\d+\.0\.0\/16$/)
    ) {
      errors.push(
        `Invalid CIDR block: ${this.config.cidrBlock}. Must follow pattern 10.{env}.0.0/16`
      );
    }

    if (!this.config.accountId || this.config.accountId.length !== 12) {
      errors.push('Valid AWS account ID (12 digits) is required');
    }

    if (
      this.config.minCapacity < 1 ||
      this.config.maxCapacity < this.config.minCapacity
    ) {
      errors.push('Invalid capacity configuration');
    }

    if (errors.length > 0) {
      throw new Error(
        `Configuration validation failed for ${this.config.name}:\n${errors.join('\n')}`
      );
    }
  }

  protected abstract getAuroraInstanceCount(): number;
  protected abstract getEcsCpu(): string;
  protected abstract getEcsMemory(): string;
  protected abstract getImageTag(): string;
  protected abstract getAlarmThresholds(): {
    cpuUtilization: number;
    memoryUtilization: number;
    targetResponseTime: number;
    unhealthyHostCount: number;
    databaseConnections: number;
  };

  protected addResourceToManifest(resource: ResourceInfo): void {
    this.manifest.resources.push(resource);
  }

  protected createOutputs(): void {
    new TerraformOutput(this, 'vpc-id', {
      value: this.vpc.vpc.id,
      description: `VPC ID for ${this.config.name}`,
    });

    new TerraformOutput(this, 'alb-dns', {
      value: this.alb.alb.dnsName,
      description: `ALB DNS name for ${this.config.name}`,
    });

    new TerraformOutput(this, 'aurora-endpoint', {
      value: this.aurora.cluster.endpoint,
      description: `Aurora cluster endpoint for ${this.config.name}`,
      sensitive: true,
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: this.ecs.cluster.name,
      description: `ECS cluster name for ${this.config.name}`,
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: this.s3.bucket.bucket,
      description: `S3 bucket name for ${this.config.name}`,
    });

    new TerraformOutput(this, 'deployment-manifest', {
      value: JSON.stringify(this.manifest, null, 2),
      description: `Deployment manifest for ${this.config.name}`,
    });
  }
}
