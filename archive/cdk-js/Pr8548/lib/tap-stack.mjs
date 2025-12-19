import * as cdk from 'aws-cdk-lib';
import { NetworkingStack } from './networking-stack.mjs';
import { SecurityStack } from './security-stack.mjs';
import { DataIngestionStack } from './data-ingestion-stack.mjs';
import { DatabaseStack } from './database-stack.mjs';
import { StorageStack } from './storage-stack.mjs';
import { CacheStack } from './cache-stack.mjs';
import { ComputeStack } from './compute-stack.mjs';
import { ApiStack } from './api-stack.mjs';
import { PipelineStack } from './pipeline-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create networking infrastructure
    const networking = new NetworkingStack(this, 'Networking', {
      environmentSuffix,
    });

    // Create security resources (KMS keys, secrets)
    const security = new SecurityStack(this, 'Security', {
      environmentSuffix,
    });

    // Create data ingestion (Kinesis)
    const dataIngestion = new DataIngestionStack(this, 'DataIngestion', {
      environmentSuffix,
      encryptionKey: security.kinesisEncryptionKey,
    });

    // Create database infrastructure
    const database = new DatabaseStack(this, 'Database', {
      environmentSuffix,
      vpc: networking.vpc,
      securityGroup: networking.dbSecurityGroup,
      encryptionKey: security.rdsEncryptionKey,
      dbCredentials: security.dbCredentials,
    });

    // Create storage (EFS)
    const storage = new StorageStack(this, 'Storage', {
      environmentSuffix,
      vpc: networking.vpc,
      securityGroup: networking.efsSecurityGroup,
      encryptionKey: security.encryptionKey,
    });

    // Create cache (ElastiCache Redis)
    const cache = new CacheStack(this, 'Cache', {
      environmentSuffix,
      vpc: networking.vpc,
      securityGroup: networking.cacheSecurityGroup,
    });

    // Create compute resources (ECS Fargate)
    const compute = new ComputeStack(this, 'Compute', {
      environmentSuffix,
      vpc: networking.vpc,
      securityGroup: networking.ecsSecurityGroup,
      dataStream: dataIngestion.dataStream,
      fileSystem: storage.fileSystem,
      accessPoint: storage.accessPoint,
    });

    // Create API Gateway
    const api = new ApiStack(this, 'Api', {
      environmentSuffix,
      dataStream: dataIngestion.dataStream,
    });

    // Create CodePipeline for DR testing
    const pipeline = new PipelineStack(this, 'Pipeline', {
      environmentSuffix,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'CloudFormation stack name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'Deployment region',
    });
  }
}

export { TapStack };
