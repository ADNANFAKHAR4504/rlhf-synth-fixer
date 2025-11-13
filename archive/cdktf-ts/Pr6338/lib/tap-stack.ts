import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { VpcConstruct } from './vpc-construct';
import { AuroraConstruct } from './aurora-construct';
import { EcrConstruct } from './ecr-construct';
import { EcsConstruct } from './ecs-construct';
import { S3Construct } from './s3-construct';
import { MonitoringConstruct } from './monitoring-construct';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
  certificateArn?: string; // Optional ACM certificate ARN for HTTPS
}

// Environment configuration interface
interface EnvironmentConfig {
  name: string;
  cidrBase: number;
  rds: {
    instanceCount: number;
    instanceClass: string;
    readReplicaCount: number; // Number of read replicas
  };
  ecs: {
    desiredCount: number;
    cpu: string;
    memory: string;
  };
  alarms: {
    cpuThreshold: number;
    memoryThreshold: number;
  };
  certificateArn?: string; // Optional ACM certificate ARN for HTTPS
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

// Environment configurations for multi-environment support within a single AWS account
// All three environments (dev, staging, prod) will be deployed to the same account
// but with isolated VPCs and environment-specific resource configurations
const environmentConfigs: Record<string, EnvironmentConfig> = {
  dev: {
    name: 'dev',
    cidrBase: 1,
    rds: {
      instanceCount: 1,
      instanceClass: 'db.t3.medium',
      readReplicaCount: 0, // No read replicas for dev
    },
    ecs: { desiredCount: 1, cpu: '256', memory: '512' },
    alarms: { cpuThreshold: 80, memoryThreshold: 80 },
  },
  staging: {
    name: 'staging',
    cidrBase: 2,
    rds: {
      instanceCount: 1,
      instanceClass: 'db.t3.large',
      readReplicaCount: 1, // 1 read replica for staging
    },
    ecs: { desiredCount: 2, cpu: '512', memory: '1024' },
    alarms: { cpuThreshold: 75, memoryThreshold: 75 },
  },
  prod: {
    name: 'prod',
    cidrBase: 3,
    rds: {
      instanceCount: 2,
      instanceClass: 'db.r5.large',
      readReplicaCount: 2, // 2 read replicas for prod (HA)
    },
    ecs: { desiredCount: 3, cpu: '1024', memory: '2048' },
    alarms: { cpuThreshold: 70, memoryThreshold: 70 },
  },
};

/**
 * TapStack - Multi-environment infrastructure deployment within a single AWS account
 *
 * This stack creates isolated environments (dev, staging, prod) within the same AWS account.
 * Each environment gets its own VPC with unique CIDR ranges, RDS clusters, ECS services,
 * and other resources, all properly tagged and named with environmentSuffix for uniqueness.
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider for single account deployment
    // This expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Random Provider for password generation
    new RandomProvider(this, 'random');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Determine environment configuration (default to dev if not found)
    const envConfig =
      environmentConfigs[environmentSuffix] || environmentConfigs.dev;

    // Create VPC with environment-specific CIDR
    const vpc = new VpcConstruct(this, 'Vpc', {
      environmentName: envConfig.name,
      cidrBase: envConfig.cidrBase,
      environmentSuffix,
    });

    // Create ECR repository for container images
    const ecr = new EcrConstruct(this, 'Ecr', {
      environmentName: envConfig.name,
      environmentSuffix,
    });

    // Create Aurora PostgreSQL cluster with read replicas for staging/prod
    const aurora = new AuroraConstruct(this, 'Aurora', {
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnetIds,
      environmentName: envConfig.name,
      instanceCount: envConfig.rds.instanceCount,
      readReplicaCount: envConfig.rds.readReplicaCount,
      instanceClass: envConfig.rds.instanceClass,
      environmentSuffix,
      cidrBase: envConfig.cidrBase,
    });

    // Create ECS Fargate cluster with ALB
    const ecs = new EcsConstruct(this, 'Ecs', {
      vpcId: vpc.vpcId,
      publicSubnetIds: vpc.publicSubnetIds,
      privateSubnetIds: vpc.privateSubnetIds,
      ecrRepositoryUrl: ecr.repositoryUrl,
      environmentName: envConfig.name,
      desiredCount: envConfig.ecs.desiredCount,
      cpu: envConfig.ecs.cpu,
      memory: envConfig.ecs.memory,
      environmentSuffix,
      certificateArn: props?.certificateArn || envConfig.certificateArn, // Optional HTTPS certificate
    });

    // Create S3 bucket for static assets
    const s3 = new S3Construct(this, 'S3', {
      environmentName: envConfig.name,
      environmentSuffix,
    });

    // Create CloudWatch monitoring dashboard and alarms
    new MonitoringConstruct(this, 'Monitoring', {
      environmentName: envConfig.name,
      auroraClusterId: aurora.clusterId,
      ecsClusterName: ecs.clusterName,
      albArn: ecs.albArn,
      cpuThreshold: envConfig.alarms.cpuThreshold,
      memoryThreshold: envConfig.alarms.memoryThreshold,
      environmentSuffix,
    });

    // Stack Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpcId,
      description: `VPC ID for ${envConfig.name} environment`,
    });

    new TerraformOutput(this, 'aurora_cluster_endpoint', {
      value: aurora.clusterEndpoint,
      description: `Aurora cluster endpoint for ${envConfig.name}`,
    });

    new TerraformOutput(this, 'aurora_cluster_arn', {
      value: aurora.clusterArn,
      description: `Aurora cluster ARN for ${envConfig.name}`,
    });

    new TerraformOutput(this, 'alb_dns_name', {
      value: ecs.albDnsName,
      description: `ALB DNS name for ${envConfig.name}`,
    });

    new TerraformOutput(this, 'alb_arn', {
      value: ecs.albArn,
      description: `ALB ARN for ${envConfig.name}`,
    });

    new TerraformOutput(this, 'ecs_cluster_name', {
      value: ecs.clusterName,
      description: `ECS cluster name for ${envConfig.name}`,
    });

    new TerraformOutput(this, 'ecs_cluster_arn', {
      value: ecs.clusterArn,
      description: `ECS cluster ARN for ${envConfig.name}`,
    });

    new TerraformOutput(this, 'ecr_repository_url', {
      value: ecr.repositoryUrl,
      description: `ECR repository URL for ${envConfig.name}`,
    });

    new TerraformOutput(this, 's3_bucket_name', {
      value: s3.bucketName,
      description: `S3 bucket name for ${envConfig.name}`,
    });

    new TerraformOutput(this, 's3_bucket_arn', {
      value: s3.bucketArn,
      description: `S3 bucket ARN for ${envConfig.name}`,
    });

    new TerraformOutput(this, 'environment_name', {
      value: envConfig.name,
      description: 'Environment name',
    });

    new TerraformOutput(this, 'environment_suffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });
  }
}
