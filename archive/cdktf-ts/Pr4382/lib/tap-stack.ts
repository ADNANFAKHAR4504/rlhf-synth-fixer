import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import {
  CacheModule,
  EcsModule,
  MonitoringModule,
  NetworkModule,
  RdsModule,
  SecretsModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Region handling
    const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE;
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'eu-west-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account
    const current = new DataAwsCallerIdentity(this, 'current');

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Network infrastructure
    const network = new NetworkModule(this, 'network', {
      environmentSuffix,
      awsRegion,
    });

    // Secrets management (fetch existing secrets)
    const secrets = new SecretsModule(this, 'secrets', {
      environmentSuffix,
    });

    // RDS Aurora Serverless
    const database = new RdsModule(this, 'database', {
      environmentSuffix,
      vpcId: network.vpc.id,
      privateSubnetIds: network.privateSubnetIds,
      dbSecurityGroupId: network.dbSecurityGroupId,
      dbUsername: secrets.dbUsername,
      dbPassword: secrets.dbPassword,
    });

    // ElastiCache Redis
    const cache = new CacheModule(this, 'cache', {
      environmentSuffix,
      vpcId: network.vpc.id,
      privateSubnetIds: network.privateSubnetIds,
      cacheSecurityGroupId: network.cacheSecurityGroupId,
    });

    // ECS Fargate cluster
    const ecs = new EcsModule(this, 'ecs', {
      environmentSuffix,
      vpcId: network.vpc.id,
      publicSubnetIds: network.publicSubnetIds,
      privateSubnetIds: network.privateSubnetIds,
      ecsSecurityGroupId: network.ecsSecurityGroupId,
      dbEndpoint: database.clusterEndpoint,
      cacheEndpoint: cache.primaryEndpoint,
      secretArn: secrets.dbSecretArn,
      awsRegion,
    });

    // Monitoring and logging
    const monitoring = new MonitoringModule(this, 'monitoring', {
      environmentSuffix,
      ecsClusterName: ecs.clusterName,
      dbClusterId: database.clusterId,
      cacheClusterId: cache.clusterId,
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: network.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecs.clusterName,
      description: 'ECS Cluster Name',
    });

    new TerraformOutput(this, 'ecs-service-name', {
      value: ecs.serviceName,
      description: 'ECS Service Name',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: ecs.albDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new TerraformOutput(this, 'rds-cluster-endpoint', {
      value: database.clusterEndpoint,
      description: 'RDS Aurora Cluster Endpoint',
    });

    new TerraformOutput(this, 'redis-endpoint', {
      value: cache.primaryEndpoint,
      description: 'ElastiCache Redis Primary Endpoint',
    });

    new TerraformOutput(this, 'log-group-name', {
      value: monitoring.logGroupName,
      description: 'CloudWatch Log Group Name',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'AWS Account ID',
    });
  }
}
