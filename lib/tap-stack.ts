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
  public readonly apiUrl: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly dashboardUrl: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

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

    // Expose key outputs
    this.apiUrl = apiGatewayStack.apiUrl;
    this.auditBucketName = storageStack.auditBucket.bucket;
    this.dynamoTableName = storageStack.dynamoTable.name;
    this.dashboardUrl = monitoringStack.dashboardUrl;

    // Register the outputs of this component
    this.registerOutputs({
      apiUrl: this.apiUrl,
      auditBucketName: this.auditBucketName,
      dynamoTableName: this.dynamoTableName,
      dashboardUrl: this.dashboardUrl,
      vpcId: networkStack.vpc.id,
      snsTopicArn: notificationStack.snsTopic.arn,
    });
  }
}
