# Payment Processing Infrastructure - Multi-Environment CDK Solution

This implementation provides a multi-environment payment processing infrastructure using AWS CDK with TypeScript.

## File: lib/payment-config.ts

```typescript
export interface EnvironmentConfig {
  vpcCidr: string;
  dbInstanceType: string;
  messageRetentionDays: number;
  s3LifecycleDays: number;
  environment: string;
}

export const ENV_CONFIGS: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: '10.0.0.0/16',
    dbInstanceType: 'db.t3.medium',
    messageRetentionDays: 1,
    s3LifecycleDays: 7,
    environment: 'dev',
  },
  staging: {
    vpcCidr: '10.1.0.0/16',
    dbInstanceType: 'db.r5.large',
    messageRetentionDays: 7,
    s3LifecycleDays: 30,
    environment: 'staging',
  },
  prod: {
    vpcCidr: '10.2.0.0/16',
    dbInstanceType: 'db.r5.xlarge',
    messageRetentionDays: 14,
    s3LifecycleDays: 90,
    environment: 'prod',
  },
};
```

## File: lib/base-payment-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './payment-config';

export abstract class BasePaymentStack extends cdk.Stack {
  protected vpc: ec2.Vpc;
  protected database: rds.DatabaseCluster;
  protected paymentQueue: sqs.Queue;
  protected storageBucket: s3.Bucket;
  protected api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }

  protected abstract getEnvironmentConfig(): EnvironmentConfig;

  protected createVpc() {
    const config = this.getEnvironmentConfig();

    this.vpc = new ec2.Vpc(this, 'PaymentVpc', {
      cidr: config.vpcCidr,
      maxAzs: 2,
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
      ],
    });
  }

  protected createDatabase() {
    const config = this.getEnvironmentConfig();

    // Missing: Database credentials management
    this.database = new rds.DatabaseCluster(this, 'PaymentDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_7,
      }),
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: new ec2.InstanceType(config.dbInstanceType),
      }),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      // Issue: Missing removalPolicy - will default to SNAPSHOT
      // Issue: No backupRetention specified
    });
  }

  protected createLambdaFunction() {
    const config = this.getEnvironmentConfig();

    const paymentHandler = new lambda.Function(this, 'PaymentHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          // Issue: Hardcoded config path instead of using environment variable
          const AWS = require('aws-sdk');
          const ssm = new AWS.SSM();

          const config = await ssm.getParameter({
            Name: '/dev/payment-service/config/settings'
          }).promise();

          return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Payment processed' })
          };
        };
      `),
      vpc: this.vpc,
      // Issue: Missing environment variables for SSM path
      // Issue: No timeout configuration
    });

    return paymentHandler;
  }

  protected createQueue() {
    const config = this.getEnvironmentConfig();

    this.paymentQueue = new sqs.Queue(this, 'PaymentQueue', {
      // Issue: Queue name doesn't include suffix for uniqueness
      queueName: 'payment-processing-queue',
      retentionPeriod: cdk.Duration.days(config.messageRetentionDays),
      // Issue: No dead letter queue
    });
  }

  protected createStorageBucket() {
    const config = this.getEnvironmentConfig();

    this.storageBucket = new s3.Bucket(this, 'PaymentBucket', {
      // Issue: Bucket name doesn't include suffix
      bucketName: 'payment-storage-bucket',
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(config.s3LifecycleDays),
        },
      ],
      // Issue: Missing removalPolicy - won't be destroyable
      encryption: s3.BucketEncryption.S3_MANAGED,
    });
  }

  protected createApi() {
    this.api = new apigateway.RestApi(this, 'PaymentApi', {
      restApiName: 'Payment Processing API',
      // Issue: No WAF association
      // Issue: Missing custom domain configuration
    });

    const payments = this.api.root.addResource('payments');
    payments.addMethod('POST');
  }

  protected createOutputs() {
    const config = this.getEnvironmentConfig();

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: `payment-vpc-${config.environment}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.clusterEndpoint.hostname,
      exportName: `payment-db-${config.environment}`,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      exportName: `payment-api-${config.environment}`,
    });

    // Issue: Missing environment tags on outputs
  }
}
```

## File: lib/dev-payment-stack.ts

```typescript
import { BasePaymentStack } from './base-payment-stack';
import { ENV_CONFIGS, EnvironmentConfig } from './payment-config';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class DevPaymentStack extends BasePaymentStack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.createVpc();
    this.createDatabase();
    this.createLambdaFunction();
    this.createQueue();
    this.createStorageBucket();
    this.createApi();
    this.createOutputs();
  }

  protected getEnvironmentConfig(): EnvironmentConfig {
    return ENV_CONFIGS.dev;
  }
}
```

## File: lib/staging-payment-stack.ts

```typescript
import { BasePaymentStack } from './base-payment-stack';
import { ENV_CONFIGS, EnvironmentConfig } from './payment-config';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class StagingPaymentStack extends BasePaymentStack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.createVpc();
    this.createDatabase();
    this.createLambdaFunction();
    this.createQueue();
    this.createStorageBucket();
    this.createApi();
    this.createOutputs();
  }

  protected getEnvironmentConfig(): EnvironmentConfig {
    return ENV_CONFIGS.staging;
  }
}
```

## File: lib/prod-payment-stack.ts

```typescript
import { BasePaymentStack } from './base-payment-stack';
import { ENV_CONFIGS, EnvironmentConfig } from './payment-config';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ProdPaymentStack extends BasePaymentStack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.createVpc();
    this.createDatabase();
    this.createLambdaFunction();
    this.createQueue();
    this.createStorageBucket();
    this.createApi();
    this.createOutputs();
  }

  protected getEnvironmentConfig(): EnvironmentConfig {
    return ENV_CONFIGS.prod;
  }
}
```

## Deployment Instructions

Deploy to different environments:

```bash
# Deploy dev environment
cdk deploy DevPaymentStack

# Deploy staging environment
cdk deploy StagingPaymentStack

# Deploy production environment
cdk deploy ProdPaymentStack
```

## Configuration

Before deployment, set up SSM parameters:
```bash
aws ssm put-parameter --name "/dev/payment-service/config/settings" --value '{"key":"value"}' --type String
aws ssm put-parameter --name "/staging/payment-service/config/settings" --value '{"key":"value"}' --type String
aws ssm put-parameter --name "/prod/payment-service/config/settings" --value '{"key":"value"}' --type String
```
