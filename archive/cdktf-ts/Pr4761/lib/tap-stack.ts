import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './networking-construct';
import { KmsConstruct } from './kms-construct';
import { RdsConstruct } from './rds-construct';
import { ElastiCacheConstruct } from './elasticache-construct';
import { EcsConstruct } from './ecs-construct';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  vpcCidr?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will use props.awsRegion or default to 'us-east-1'.
// Set to empty string to disable override.

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    // Use AWS_REGION_OVERRIDE directly since it's always set for this deployment
    const awsRegion = AWS_REGION_OVERRIDE;
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend for state management
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Create networking infrastructure (VPC, subnets, NAT, etc.)
    const networking = new NetworkingConstruct(this, 'networking', {
      environmentSuffix,
      ...(props?.vpcCidr && { vpcCidr: props.vpcCidr }),
    });

    // Create KMS keys for encryption at rest
    const kms = new KmsConstruct(this, 'kms', {
      environmentSuffix,
    });

    // Create RDS PostgreSQL database with Multi-AZ
    const rds = new RdsConstruct(this, 'rds', {
      environmentSuffix,
      vpc: networking.vpc,
      privateSubnets: networking.privateSubnets,
      kmsKeyId: kms.rdsKey.arn,
      secretsManagerKmsKeyId: kms.secretsManagerKey.arn,
    });

    // Create ElastiCache Redis cluster with Multi-AZ
    const elasticache = new ElastiCacheConstruct(this, 'elasticache', {
      environmentSuffix,
      vpc: networking.vpc,
      privateSubnets: networking.privateSubnets,
      kmsKeyId: kms.elasticacheKey.arn,
    });

    // Create ECS cluster with Fargate tasks and ALB
    const ecs = new EcsConstruct(this, 'ecs', {
      environmentSuffix,
      vpc: networking.vpc,
      publicSubnets: networking.publicSubnets,
      privateSubnets: networking.privateSubnets,
      dbSecretArn: rds.dbSecret.arn,
      cacheEndpoint: elasticache.replicationGroup.primaryEndpointAddress,
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: networking.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS PostgreSQL endpoint',
    });

    new TerraformOutput(this, 'rds-secret-arn', {
      value: rds.dbSecret.arn,
      description: 'RDS credentials secret ARN',
    });

    new TerraformOutput(this, 'elasticache-endpoint', {
      value: elasticache.replicationGroup.primaryEndpointAddress,
      description: 'ElastiCache Redis primary endpoint',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecs.cluster.name,
      description: 'ECS cluster name',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: ecs.loadBalancer.dnsName,
      description: 'Application Load Balancer DNS name',
    });
  }
}
