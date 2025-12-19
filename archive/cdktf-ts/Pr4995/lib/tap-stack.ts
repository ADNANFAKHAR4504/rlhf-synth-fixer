import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingModule } from './networking-module';
import { DataIngestionModule } from './data-ingestion-module';
import { DataProcessingModule } from './data-processing-module';
import { DataStorageModule } from './data-storage-module';
import { ApiGatewayModule } from './api-gateway-module';
import { SecurityModule } from './security-module';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'eu-west-2';
    const stateBucketRegion = props?.stateBucketRegion || 'eu-west-2';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Security Module - Create secrets and encryption keys first
    const securityModule = new SecurityModule(this, 'security', {
      environmentSuffix,
    });

    // Networking Module - Create VPC, subnets, and networking components
    const networkingModule = new NetworkingModule(this, 'networking', {
      environmentSuffix,
      vpcCidr: '10.0.0.0/16',
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
    });

    // Data Storage Module - Create S3, RDS Aurora, ElastiCache, and EFS
    const dataStorageModule = new DataStorageModule(this, 'data-storage', {
      environmentSuffix,
      vpcId: networkingModule.vpc.id,
      privateSubnetIds: networkingModule.privateSubnetIds,
      databaseSecurityGroupId: networkingModule.databaseSecurityGroupId,
      cacheSecurityGroupId: networkingModule.cacheSecurityGroupId,
      efsSecurityGroupId: networkingModule.efsSecurityGroupId,
      dbSecretArn: securityModule.dbSecretArn,
      kmsKeyId: securityModule.kmsKeyId,
      kmsKeyArn: securityModule.kmsKeyArn,
    });

    // Data Ingestion Module - Create Kinesis Data Streams
    const dataIngestionModule = new DataIngestionModule(
      this,
      'data-ingestion',
      {
        environmentSuffix,
        kmsKeyId: securityModule.kmsKeyArn,
      }
    );

    // Data Processing Module - Create ECS Fargate cluster and services
    const dataProcessingModule = new DataProcessingModule(
      this,
      'data-processing',
      {
        environmentSuffix,
        vpcId: networkingModule.vpc.id,
        privateSubnetIds: networkingModule.privateSubnetIds,
        ecsSecurityGroupId: networkingModule.ecsSecurityGroupId,
        kinesisStreamArn: dataIngestionModule.kinesisStreamArn,
        efsFileSystemId: dataStorageModule.efsFileSystemId,
        dbSecretArn: securityModule.dbSecretArn,
        apiSecretArn: securityModule.apiSecretArn,
      }
    );

    // API Gateway Module - Create REST API for external integrations
    new ApiGatewayModule(this, 'api-gateway', {
      environmentSuffix,
      ecsServiceArn: dataProcessingModule.ecsServiceArn,
      vpcLinkSubnetIds: networkingModule.privateSubnetIds,
      apiSecretArn: securityModule.apiSecretArn,
    });
  }
}
