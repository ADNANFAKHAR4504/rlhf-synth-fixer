import { Environment } from 'aws-cdk-lib';

export interface EnvironmentConfig {
  name: string;
  env: Environment;
  vpcConfig: VpcConfig;
  lambdaConfig: LambdaConfig;
  dynamoConfig: DynamoConfig;
  apiGatewayConfig: ApiGatewayConfig;
  s3Config: S3Config;
  sqsConfig: SqsConfig;
  tags: { [key: string]: string };
}

export interface VpcConfig {
  cidr: string;
  maxAzs: number;
  natGateways: number;
}

export interface LambdaConfig {
  memorySize: number;
  reservedConcurrentExecutions: number;
  timeout: number;
}

export interface DynamoConfig {
  readCapacity: number;
  writeCapacity: number;
  pointInTimeRecovery: boolean;
}

export interface ApiGatewayConfig {
  throttleRateLimit: number;
  throttleBurstLimit: number;
}

export interface S3Config {
  lifecycleDays: number | undefined; // undefined means indefinite
  versioning: boolean;
}

export interface SqsConfig {
  messageRetentionSeconds: number;
  visibilityTimeoutSeconds: number;
  maxReceiveCount: number;
}

export class EnvironmentConfigurations {
  static readonly DEV: EnvironmentConfig = {
    name: 'dev',
    env: {
      account: process.env.CDK_DEV_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    vpcConfig: {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      natGateways: 0,
    },
    lambdaConfig: {
      memorySize: 512,
      reservedConcurrentExecutions: 10,
      timeout: 30,
    },
    dynamoConfig: {
      readCapacity: 5,
      writeCapacity: 5,
      pointInTimeRecovery: false,
    },
    apiGatewayConfig: {
      throttleRateLimit: 100,
      throttleBurstLimit: 200,
    },
    s3Config: {
      lifecycleDays: 30,
      versioning: false,
    },
    sqsConfig: {
      messageRetentionSeconds: 345600, // 4 days
      visibilityTimeoutSeconds: 30,
      maxReceiveCount: 3,
    },
    tags: {
      Environment: 'dev',
      CostCenter: 'engineering',
      ManagedBy: 'cdk',
    },
  };

  static readonly STAGING: EnvironmentConfig = {
    name: 'staging',
    env: {
      account:
        process.env.CDK_STAGING_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-2',
    },
    vpcConfig: {
      cidr: '10.1.0.0/16',
      maxAzs: 3,
      natGateways: 2,
    },
    lambdaConfig: {
      memorySize: 1024,
      reservedConcurrentExecutions: 50,
      timeout: 60,
    },
    dynamoConfig: {
      readCapacity: 10,
      writeCapacity: 10,
      pointInTimeRecovery: false,
    },
    apiGatewayConfig: {
      throttleRateLimit: 500,
      throttleBurstLimit: 1000,
    },
    s3Config: {
      lifecycleDays: 90,
      versioning: true,
    },
    sqsConfig: {
      messageRetentionSeconds: 864000, // 10 days
      visibilityTimeoutSeconds: 60,
      maxReceiveCount: 5,
    },
    tags: {
      Environment: 'staging',
      CostCenter: 'engineering',
      ManagedBy: 'cdk',
    },
  };

  static readonly PROD: EnvironmentConfig = {
    name: 'prod',
    env: {
      account: process.env.CDK_PROD_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-east-1',
    },
    vpcConfig: {
      cidr: '10.2.0.0/16',
      maxAzs: 3,
      natGateways: 3,
    },
    lambdaConfig: {
      memorySize: 2048,
      reservedConcurrentExecutions: 200,
      timeout: 90,
    },
    dynamoConfig: {
      readCapacity: 25,
      writeCapacity: 25,
      pointInTimeRecovery: true,
    },
    apiGatewayConfig: {
      throttleRateLimit: 2000,
      throttleBurstLimit: 4000,
    },
    s3Config: {
      lifecycleDays: undefined, // Indefinite retention
      versioning: true,
    },
    sqsConfig: {
      messageRetentionSeconds: 1209600, // 14 days (max)
      visibilityTimeoutSeconds: 90,
      maxReceiveCount: 10,
    },
    tags: {
      Environment: 'prod',
      CostCenter: 'operations',
      ManagedBy: 'cdk',
    },
  };

  static getAll(): EnvironmentConfig[] {
    return [this.DEV, this.STAGING, this.PROD];
  }

  static getByName(name: string): EnvironmentConfig {
    const configs = { dev: this.DEV, staging: this.STAGING, prod: this.PROD };
    const config = configs[name as keyof typeof configs];
    if (!config) {
      throw new Error(`Unknown environment: ${name}`);
    }
    return config;
  }
}
