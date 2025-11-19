import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { ComputeStack } from './compute-stack';
import { ApiStack } from './api-stack';
import { MonitoringStack } from './monitoring-stack';
import { ComplianceStack } from './compliance-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply standard tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'FinancialServices');
    cdk.Tags.of(this).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(this).add('DataClassification', 'Confidential');

    // Networking layer
    const networking = new NetworkingStack(this, 'Networking', {
      environmentSuffix,
    });

    // Security and encryption
    const kmsKeys = {
      database: new cdk.aws_kms.Key(this, 'DatabaseKey', {
        description: `Database encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      s3: new cdk.aws_kms.Key(this, 'S3Key', {
        description: `S3 encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
      lambda: new cdk.aws_kms.Key(this, 'LambdaKey', {
        description: `Lambda environment variables encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }),
    };

    // Database layer
    const database = new DatabaseStack(this, 'Database', {
      vpc: networking.vpc,
      kmsKey: kmsKeys.database,
      environmentSuffix,
    });

    // Storage layer
    const storage = new StorageStack(this, 'Storage', {
      kmsKey: kmsKeys.s3,
      environmentSuffix,
    });

    // Compute layer
    const compute = new ComputeStack(this, 'Compute', {
      vpc: networking.vpc,
      kmsKey: kmsKeys.lambda,
      rawDataBucket: storage.rawDataBucket,
      processedDataBucket: storage.processedDataBucket,
      environmentSuffix,
    });

    // API layer
    const api = new ApiStack(this, 'Api', {
      dataProcessorFunction: compute.dataProcessorFunction,
      environmentSuffix,
    });

    // Monitoring layer
    new MonitoringStack(this, 'Monitoring', {
      vpc: networking.vpc,
      database: database.cluster,
      buckets: [
        storage.rawDataBucket,
        storage.processedDataBucket,
        storage.archiveBucket,
      ],
      lambdaFunctions: [compute.dataProcessorFunction],
      apiGateway: api.restApi,
      environmentSuffix,
    });

    // Compliance layer
    new ComplianceStack(this, 'Compliance', {
      environmentSuffix,
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID for the trading analytics platform',
      exportName: `TradingPlatform-VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.cluster.clusterEndpoint.hostname,
      description: 'Aurora Serverless v2 PostgreSQL cluster endpoint',
      exportName: `TradingPlatform-DbEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.restApi.url,
      description: 'API Gateway URL for client access',
      exportName: `TradingPlatform-ApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RawDataBucketName', {
      value: storage.rawDataBucket.bucketName,
      description: 'S3 bucket for raw data ingestion',
      exportName: `TradingPlatform-RawBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ProcessedDataBucketName', {
      value: storage.processedDataBucket.bucketName,
      description: 'S3 bucket for processed analytics',
      exportName: `TradingPlatform-ProcessedBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArchiveBucketName', {
      value: storage.archiveBucket.bucketName,
      description: 'S3 bucket for long-term archival',
      exportName: `TradingPlatform-ArchiveBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'UserSessionsTableName', {
      value: database.userSessionsTable.tableName,
      description: 'DynamoDB table for user sessions',
      exportName: `TradingPlatform-UserSessionsTable-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiKeysTableName', {
      value: database.apiKeysTable.tableName,
      description: 'DynamoDB table for API keys',
      exportName: `TradingPlatform-ApiKeysTable-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionArn', {
      value: compute.dataProcessorFunction.functionArn,
      description: 'Lambda function ARN for data processing',
      exportName: `TradingPlatform-DataProcessorArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionName', {
      value: compute.dataProcessorFunction.functionName,
      description: 'Lambda function name for data processing',
      exportName: `TradingPlatform-DataProcessorName-${environmentSuffix}`,
    });
  }
}
