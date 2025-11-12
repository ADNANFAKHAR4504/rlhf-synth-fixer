/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the payment processing infrastructure.
 *
 * It orchestrates the instantiation of all resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { NetworkStack } from './network-stack';
import { KmsStack } from './kms-stack';
import { StorageStack } from './storage-stack';
import { NotificationStack } from './notification-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './apigateway-stack';
import { MonitoringStack } from './monitoring-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;

  /**
   * Optional email endpoint for SNS notifications.
   */
  notificationEmail?: string;
}

/**
 * Represents the main Pulumi component resource for the payment processing infrastructure.
 *
 * This component orchestrates the instantiation of all resource-specific components
 * including networking, storage, compute, API Gateway, and monitoring.
 */
export class TapStack extends pulumi.ComponentResource {
  // API Gateway outputs
  public readonly apiUrl: pulumi.Output<string>;
  public readonly apiId: pulumi.Output<string>;
  public readonly apiStage: pulumi.Output<string>;

  // Storage outputs
  public readonly auditBucketName: pulumi.Output<string>;
  public readonly auditBucketArn: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly dynamoTableArn: pulumi.Output<string>;

  // Lambda function outputs
  public readonly validatorFunctionName: pulumi.Output<string>;
  public readonly validatorFunctionArn: pulumi.Output<string>;
  public readonly processorFunctionName: pulumi.Output<string>;
  public readonly processorFunctionArn: pulumi.Output<string>;
  public readonly notifierFunctionName: pulumi.Output<string>;
  public readonly notifierFunctionArn: pulumi.Output<string>;

  // Network outputs
  public readonly vpcId: pulumi.Output<string>;
  public readonly vpcCidr: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly s3EndpointId: pulumi.Output<string>;
  public readonly dynamodbEndpointId: pulumi.Output<string>;

  // Security outputs
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly kmsKeyAlias: pulumi.Output<string>;

  // Notification outputs
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly snsTopicName: pulumi.Output<string>;

  // Monitoring outputs
  public readonly dashboardUrl: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  // Environment metadata
  public readonly environmentSuffix: string;
  public readonly region: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    this.environmentSuffix = environmentSuffix;
    const tags = args.tags || {};

    // Get current region for outputs
    this.region = pulumi.output('ap-southeast-1');

    // Enhance tags with required metadata
    const enhancedTags = pulumi.output(tags).apply(t => ({
      ...t,
      Environment: environmentSuffix,
      Project: 'PaymentProcessing',
      ManagedBy: 'Pulumi',
      EnvironmentSuffix: environmentSuffix,
    }));

    // Create Network Stack (VPC, Subnets, NAT Gateways, VPC Endpoints)
    const networkStack = new NetworkStack(
      'payment-network',
      {
        environmentSuffix,
        tags: enhancedTags,
      },
      { parent: this }
    );

    // Create KMS Stack (Customer-managed keys for encryption)
    const kmsStack = new KmsStack(
      'payment-kms',
      {
        environmentSuffix,
        tags: enhancedTags,
      },
      { parent: this }
    );

    // Create Storage Stack (DynamoDB, S3)
    const storageStack = new StorageStack(
      'payment-storage',
      {
        environmentSuffix,
        tags: enhancedTags,
        kmsKeyArn: kmsStack.kmsKey.arn,
      },
      { parent: this }
    );

    // Create Notification Stack (SNS)
    const notificationStack = new NotificationStack(
      'payment-notifications',
      {
        environmentSuffix,
        tags: enhancedTags,
        emailEndpoint: args.notificationEmail,
      },
      { parent: this }
    );

    // Create Lambda Stack (Payment processing functions)
    const lambdaStack = new LambdaStack(
      'payment-lambda',
      {
        environmentSuffix,
        tags: enhancedTags,
        vpcId: networkStack.vpc.id,
        privateSubnetIds: pulumi.all(
          networkStack.privateSubnets.map(s => s.id)
        ),
        dynamoTableName: storageStack.dynamoTable.name,
        dynamoTableArn: storageStack.dynamoTable.arn,
        auditBucketName: storageStack.auditBucket.bucket,
        auditBucketArn: storageStack.auditBucket.arn,
        snsTopicArn: notificationStack.snsTopic.arn,
      },
      { parent: this }
    );

    // Create API Gateway Stack (REST API with Lambda integration)
    const apiGatewayStack = new ApiGatewayStack(
      'payment-api',
      {
        environmentSuffix,
        tags: enhancedTags,
        validatorFunctionArn: lambdaStack.validatorFunction.arn,
        validatorFunctionName: lambdaStack.validatorFunction.name,
      },
      { parent: this }
    );

    // Create Monitoring Stack (CloudWatch Dashboard)
    const monitoringStack = new MonitoringStack(
      'payment-monitoring',
      {
        environmentSuffix,
        tags: enhancedTags,
        validatorFunctionName: lambdaStack.validatorFunction.name,
        processorFunctionName: lambdaStack.processorFunction.name,
        notifierFunctionName: lambdaStack.notifierFunction.name,
        dynamoTableName: storageStack.dynamoTable.name,
      },
      { parent: this }
    );

    // Assign API Gateway outputs
    this.apiUrl = apiGatewayStack.apiUrl;
    this.apiId = apiGatewayStack.apiGateway.id;
    this.apiStage = pulumi.output(environmentSuffix);

    // Assign Storage outputs
    this.auditBucketName = storageStack.auditBucket.bucket;
    this.auditBucketArn = storageStack.auditBucket.arn;
    this.dynamoTableName = storageStack.dynamoTable.name;
    this.dynamoTableArn = storageStack.dynamoTable.arn;

    // Assign Lambda function outputs
    this.validatorFunctionName = lambdaStack.validatorFunction.name;
    this.validatorFunctionArn = lambdaStack.validatorFunction.arn;
    this.processorFunctionName = lambdaStack.processorFunction.name;
    this.processorFunctionArn = lambdaStack.processorFunction.arn;
    this.notifierFunctionName = lambdaStack.notifierFunction.name;
    this.notifierFunctionArn = lambdaStack.notifierFunction.arn;

    // Assign Network outputs
    this.vpcId = networkStack.vpc.id;
    this.vpcCidr = networkStack.vpc.cidrBlock;
    this.publicSubnetIds = pulumi.all(networkStack.publicSubnets.map(s => s.id));
    this.privateSubnetIds = pulumi.all(networkStack.privateSubnets.map(s => s.id));
    this.s3EndpointId = networkStack.s3Endpoint.id;
    this.dynamodbEndpointId = networkStack.dynamodbEndpoint.id;

    // Assign Security outputs
    this.kmsKeyId = kmsStack.kmsKey.id;
    this.kmsKeyArn = kmsStack.kmsKey.arn;
    this.kmsKeyAlias = kmsStack.kmsKeyAlias.name;

    // Assign Notification outputs
    this.snsTopicArn = notificationStack.snsTopic.arn;
    this.snsTopicName = notificationStack.snsTopic.name;

    // Assign Monitoring outputs
    this.dashboardUrl = monitoringStack.dashboardUrl;
    this.dashboardName = monitoringStack.dashboard.dashboardName;

    // Register comprehensive outputs for integration testing
    this.registerOutputs({
      // API Gateway
      apiUrl: this.apiUrl,
      apiId: this.apiId,
      apiStage: this.apiStage,

      // Storage
      auditBucketName: this.auditBucketName,
      auditBucketArn: this.auditBucketArn,
      dynamoTableName: this.dynamoTableName,
      dynamoTableArn: this.dynamoTableArn,

      // Lambda Functions
      validatorFunctionName: this.validatorFunctionName,
      validatorFunctionArn: this.validatorFunctionArn,
      processorFunctionName: this.processorFunctionName,
      processorFunctionArn: this.processorFunctionArn,
      notifierFunctionName: this.notifierFunctionName,
      notifierFunctionArn: this.notifierFunctionArn,

      // Network
      vpcId: this.vpcId,
      vpcCidr: this.vpcCidr,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      s3EndpointId: this.s3EndpointId,
      dynamodbEndpointId: this.dynamodbEndpointId,

      // Security
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      kmsKeyAlias: this.kmsKeyAlias,

      // Notifications
      snsTopicArn: this.snsTopicArn,
      snsTopicName: this.snsTopicName,

      // Monitoring
      dashboardUrl: this.dashboardUrl,
      dashboardName: this.dashboardName,

      // Metadata
      environmentSuffix: environmentSuffix,
      region: this.region,
    });
  }
}
