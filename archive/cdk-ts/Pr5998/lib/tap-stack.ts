import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingConstruct } from './constructs/networking-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { ComputeConstruct } from './constructs/compute-construct';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { StorageConstruct } from './constructs/storage-construct';
import { MessagingConstruct } from './constructs/messaging-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

interface EnvironmentConfig {
  vpcCidr: string;
  dbInstanceType: string;
  dbBackupRetention: number;
  s3RetentionDays: number;
  sqsVisibilityTimeout: number;
  sqsMessageRetention: number;
  lambdaMemory: number;
  customDomain: string;
  alarmThresholds: {
    lambdaErrorRate: number;
    apiLatency: number;
    queueAgeSeconds: number;
  };
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Get environment-specific configurations from CDK context
    const envConfig = this.getEnvironmentConfig(environmentSuffix);

    // 1. Networking Layer
    const networking = new NetworkingConstruct(this, 'Networking', {
      environmentSuffix,
      vpcCidr: envConfig.vpcCidr,
    });

    // 2. Database Layer
    const database = new DatabaseConstruct(this, 'Database', {
      environmentSuffix,
      vpc: networking.vpc,
      instanceType: envConfig.dbInstanceType,
      backupRetentionDays: envConfig.dbBackupRetention,
    });

    // 3. Storage Layer - S3 with Intelligent-Tiering for all retention periods
    const storage = new StorageConstruct(this, 'Storage', {
      environmentSuffix,
      retentionDays: envConfig.s3RetentionDays,
    });

    // 4. Messaging Layer
    const messaging = new MessagingConstruct(this, 'Messaging', {
      environmentSuffix,
      visibilityTimeout: envConfig.sqsVisibilityTimeout,
      messageRetentionPeriod: envConfig.sqsMessageRetention,
    });

    // 5. Compute Layer
    const compute = new ComputeConstruct(this, 'Compute', {
      environmentSuffix,
      vpc: networking.vpc,
      database: database.cluster,
      databaseSecret: database.secret,
      transactionBucket: storage.transactionBucket,
      paymentQueue: messaging.paymentQueue,
      memorySize: envConfig.lambdaMemory,
    });

    // 6. API Gateway Layer
    const apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
      environmentSuffix,
      paymentValidationFunction: compute.paymentValidationFunction,
      customDomain: envConfig.customDomain,
    });

    // 7. Monitoring Layer
    new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      vpc: networking.vpc,
      database: database.cluster,
      lambda: compute.paymentValidationFunction,
      apiGateway: apiGateway.api,
      bucket: storage.transactionBucket,
      queue: messaging.paymentQueue,
      alarmThresholds: envConfig.alarmThresholds,
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: networking.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.cluster.clusterEndpoint.hostname,
      description: 'Database cluster endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret.secretArn,
      description: 'Database secret ARN',
    });

    new cdk.CfnOutput(this, 'TransactionBucketName', {
      value: storage.transactionBucket.bucketName,
      description: 'Transaction logs S3 bucket',
    });

    new cdk.CfnOutput(this, 'PaymentQueueUrl', {
      value: messaging.paymentQueue.queueUrl,
      description: 'Payment processing queue URL',
    });

    new cdk.CfnOutput(this, 'PaymentValidationFunctionArn', {
      value: compute.paymentValidationFunction.functionArn,
      description: 'Payment validation Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiGateway.api.url,
      description: 'API Gateway endpoint URL',
    });
  }

  private getEnvironmentConfig(environmentSuffix: string): EnvironmentConfig {
    // Default configurations for different environments
    const configs: Record<string, EnvironmentConfig> = {
      dev: {
        vpcCidr: '10.0.0.0/16',
        dbInstanceType: 't3.medium',
        dbBackupRetention: 1,
        s3RetentionDays: 7,
        sqsVisibilityTimeout: 30,
        sqsMessageRetention: 345600, // 4 days
        lambdaMemory: 512,
        customDomain: 'api-dev.payments.company.com',
        alarmThresholds: {
          lambdaErrorRate: 5,
          apiLatency: 2000,
          queueAgeSeconds: 300,
        },
      },
      staging: {
        vpcCidr: '10.1.0.0/16',
        dbInstanceType: 't3.large',
        dbBackupRetention: 7,
        s3RetentionDays: 30,
        sqsVisibilityTimeout: 60,
        sqsMessageRetention: 1209600, // 14 days
        lambdaMemory: 1024,
        customDomain: 'api-staging.payments.company.com',
        alarmThresholds: {
          lambdaErrorRate: 3,
          apiLatency: 1500,
          queueAgeSeconds: 180,
        },
      },
      prod: {
        vpcCidr: '10.2.0.0/16',
        dbInstanceType: 'r5.large',
        dbBackupRetention: 30,
        s3RetentionDays: 90,
        sqsVisibilityTimeout: 120,
        sqsMessageRetention: 1209600, // 14 days
        lambdaMemory: 2048,
        customDomain: 'api-prod.payments.company.com',
        alarmThresholds: {
          lambdaErrorRate: 1,
          apiLatency: 1000,
          queueAgeSeconds: 120,
        },
      },
    };

    // Extract base environment name (remove numeric suffix if present)
    const baseEnv = environmentSuffix.replace(/[0-9]+$/, '');

    // Return config for matching environment, or dev as default
    return configs[baseEnv] || configs['dev'];
  }
}
