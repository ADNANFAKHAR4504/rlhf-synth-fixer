/**
 * tap-stack.ts
 *
 * Main Pulumi ComponentResource orchestrating multi-environment deployment
 * with drift detection and configuration validation.
 *
 * Enhanced with: DynamoDB, SQS, EventBridge, API Gateway, WAF, X-Ray
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { DatabaseComponent } from './components/database';
import { LambdaComponent } from './components/lambda';
import { SecretsComponent } from './components/secrets';
import { MonitoringComponent } from './components/monitoring';
import { NetworkingStack } from './components/networking';
import { DynamoDBComponent } from './components/dynamodb';
import { MessagingComponent } from './components/messaging';
import { APIComponent } from './components/api';
import { XRayComponent } from './components/xray';
import { ConfigManifest, generateManifest } from './utils/manifest';
import { validateEnvironmentConfig } from './utils/validation';

/**
 * Environment-specific configuration interface
 */
export interface EnvironmentConfig {
  environment: 'dev' | 'staging' | 'prod';
  region: string;
  lambda: {
    memory: number;
    cpu: number;
  };
  database: {
    instanceClass: string;
  };
  monitoring: {
    errorThreshold: number;
    latencyThreshold: number;
  };
}

/**
 * TapStackArgs defines the input arguments for the TapStack component.
 */
export interface TapStackArgs {
  environmentSuffix: string;
  config: EnvironmentConfig;
  dockerImageUri: string;
  networkingStackRef: string;
  /**
   * If true, create standalone networking resources instead of using stack reference.
   * Useful for CI/CD testing when the referenced stack doesn't exist.
   */
  createStandaloneNetworking?: boolean;
  /**
   * If true, use zip deployment for Lambda instead of container image.
   * Useful for CI/CD testing when the Docker image doesn't exist.
   */
  useZipDeployment?: boolean;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Main Pulumi component for multi-environment infrastructure
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly lambdaFunctionArn: pulumi.Output<string>;
  public readonly secretArn: pulumi.Output<string>;
  public readonly transactionTableName: pulumi.Output<string>;
  public readonly auditTableName: pulumi.Output<string>;
  public readonly paymentQueueUrl: pulumi.Output<string>;
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly wafAclArn: pulumi.Output<string>;
  public readonly configManifest: pulumi.Output<ConfigManifest>;
  public readonly configHash: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const {
      environmentSuffix,
      config,
      dockerImageUri,
      networkingStackRef,
      createStandaloneNetworking,
      useZipDeployment,
      tags,
    } = args;

    // Validate environment configuration
    validateEnvironmentConfig(config);

    // Get networking stack reference for VPC and subnets
    // Use standalone networking in CI/CD environments when the referenced stack doesn't exist
    const networkingStack = new NetworkingStack(
      'networking',
      {
        stackReference: networkingStackRef,
        createStandalone: createStandaloneNetworking,
      },
      { parent: this }
    );

    // Create KMS key for database encryption
    const kmsKey = new aws.kms.Key(
      `db-key-${environmentSuffix}`,
      {
        description: `Database encryption key for ${config.environment}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // Create Secrets Manager component for database credentials
    const secrets = new SecretsComponent(
      `secrets-${environmentSuffix}`,
      {
        environmentSuffix,
        environment: config.environment,
        rotationDays: 30,
        tags: tags,
      },
      { parent: this }
    );

    // Create Aurora PostgreSQL database component
    const database = new DatabaseComponent(
      `database-${environmentSuffix}`,
      {
        environmentSuffix,
        environment: config.environment,
        instanceClass: config.database.instanceClass,
        engineVersion: '15.8',
        kmsKeyId: kmsKey.arn,
        masterSecretArn: secrets.masterSecretArn,
        subnetIds: networkingStack.privateSubnetIds,
        vpcId: networkingStack.vpcId,
        availabilityZones: networkingStack.availabilityZones,
        backupRetentionDays: 7,
        tags: tags,
      },
      { parent: this }
    );

    // Create Lambda function component
    const lambda = new LambdaComponent(
      `lambda-${environmentSuffix}`,
      {
        environmentSuffix,
        environment: config.environment,
        dockerImageUri,
        memory: config.lambda.memory,
        cpu: config.lambda.cpu,
        subnetIds: networkingStack.privateSubnetIds,
        vpcId: networkingStack.vpcId,
        databaseEndpoint: database.endpoint,
        databaseSecretArn: secrets.databaseSecretArn,
        environmentVariables: {
          ENVIRONMENT_NAME: config.environment,
          DB_ENDPOINT: database.endpoint,
          DB_SECRET_ARN: secrets.databaseSecretArn,
        },
        tags: tags,
        useZipDeployment: useZipDeployment,
      },
      { parent: this }
    );

    // Create DynamoDB tables for transaction logging and audit
    const dynamodb = new DynamoDBComponent(
      `dynamodb-${environmentSuffix}`,
      {
        environmentSuffix,
        environment: config.environment,
        kmsKeyId: kmsKey.arn,
        tags: tags,
      },
      { parent: this }
    );

    // Create messaging infrastructure (SQS + EventBridge)
    const messaging = new MessagingComponent(
      `messaging-${environmentSuffix}`,
      {
        environmentSuffix,
        environment: config.environment,
        kmsKeyId: kmsKey.arn,
        lambdaFunctionArn: lambda.functionArn,
        tags: tags,
      },
      { parent: this }
    );

    // Create X-Ray tracing for distributed observability
    new XRayComponent(
      `xray-${environmentSuffix}`,
      {
        environmentSuffix,
        environment: config.environment,
        tags: tags,
      },
      { parent: this }
    );

    // Create API Gateway with WAF protection
    const api = new APIComponent(
      `api-${environmentSuffix}`,
      {
        environmentSuffix,
        environment: config.environment,
        lambdaFunctionArn: lambda.functionArn,
        lambdaFunctionName: lambda.functionName,
        tags: tags,
      },
      { parent: this }
    );

    // Create CloudWatch monitoring component
    new MonitoringComponent(
      `monitoring-${environmentSuffix}`,
      {
        environmentSuffix,
        environment: config.environment,
        lambdaFunctionName: lambda.functionName,
        databaseClusterName: database.clusterIdentifier,
        errorThreshold: config.monitoring.errorThreshold,
        latencyThreshold: config.monitoring.latencyThreshold,
        logRetentionDays: 30,
        tags: tags,
      },
      { parent: this }
    );

    // Generate configuration manifest for drift detection
    const manifest = generateManifest({
      environment: config.environment,
      lambdaMemory: config.lambda.memory,
      lambdaCpu: config.lambda.cpu,
      databaseInstanceClass: config.database.instanceClass,
      databaseEngineVersion: '15.8',
      secretRotationDays: 30,
      backupRetentionDays: 7,
      logRetentionDays: 30,
      kmsKeyEnabled: true,
      dockerImageUri,
    });

    // Export outputs
    this.databaseEndpoint = database.endpoint;
    this.lambdaFunctionArn = lambda.functionArn;
    this.secretArn = secrets.databaseSecretArn;
    this.transactionTableName = dynamodb.transactionTableName;
    this.auditTableName = dynamodb.auditTableName;
    this.paymentQueueUrl = messaging.paymentQueueUrl;
    this.apiEndpoint = api.apiEndpoint;
    this.wafAclArn = api.wafAclArn;
    this.configManifest = pulumi.output(manifest);
    this.configHash = pulumi.output(manifest.configHash);

    this.registerOutputs({
      databaseEndpoint: this.databaseEndpoint,
      lambdaFunctionArn: this.lambdaFunctionArn,
      secretArn: this.secretArn,
      transactionTableName: this.transactionTableName,
      auditTableName: this.auditTableName,
      paymentQueueUrl: this.paymentQueueUrl,
      apiEndpoint: this.apiEndpoint,
      wafAclArn: this.wafAclArn,
      configManifest: this.configManifest,
      configHash: this.configHash,
    });
  }
}
