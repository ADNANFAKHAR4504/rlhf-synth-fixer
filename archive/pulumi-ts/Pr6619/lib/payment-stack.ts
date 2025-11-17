import * as pulumi from '@pulumi/pulumi';
import { getEnvironmentConfig } from './config';
import { TagsConfig } from './types';
import { VpcComponent } from './components/vpc';
import { DatabaseComponent } from './components/database';
import { DynamoDbComponent } from './components/dynamodb';
import { S3Component } from './components/s3';
import { LambdaComponent } from './components/lambda';
import { ApiGatewayComponent } from './components/api-gateway';
import { MonitoringComponent } from './components/monitoring';

export interface PaymentStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * PaymentStack - Reusable component for multi-environment payment processing infrastructure
 *
 * This component orchestrates all AWS resources required for a payment processing system
 * across dev, staging, and prod environments with environment-specific configurations.
 */
export class PaymentStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly dbArn: pulumi.Output<string>;
  public readonly lambdaArn: pulumi.Output<string>;
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly apiArn: pulumi.Output<string>;
  public readonly dynamoTableName: pulumi.Output<string>;
  public readonly dynamoTableArn: pulumi.Output<string>;
  public readonly auditBucketName: pulumi.Output<string>;
  public readonly auditBucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: PaymentStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:payment:PaymentStack', name, args, opts);

    const environmentSuffix =
      args.environmentSuffix || process.env.ENVIRONMENT_SUFFIX || 'dev';
    const envConfig = getEnvironmentConfig();

    // Create standardized tags
    const tags: TagsConfig = {
      Environment: envConfig.environment,
      EnvironmentSuffix: environmentSuffix,
      ManagedBy: 'Pulumi',
      Project: 'PaymentProcessing',
      ...(args.tags as Record<string, string>),
    };

    // 1. Create VPC with 3 private subnets
    const vpcComponent = new VpcComponent(
      'payment-vpc',
      {
        environmentSuffix,
        tags,
      },
      { parent: this }
    );

    // 2. Create RDS PostgreSQL with environment-specific KMS encryption
    const databaseComponent = new DatabaseComponent(
      'payment-database',
      {
        environmentSuffix,
        envConfig,
        tags,
        vpcId: vpcComponent.vpcId,
        privateSubnetIds: vpcComponent.privateSubnetIds,
      },
      { parent: this }
    );

    // 3. Create DynamoDB table with PITR and on-demand billing
    const dynamoComponent = new DynamoDbComponent(
      'payment-dynamodb',
      {
        environmentSuffix,
        envConfig,
        tags,
      },
      { parent: this }
    );

    // 4. Create S3 bucket with versioning and lifecycle policies
    const s3Component = new S3Component(
      'payment-s3',
      {
        environmentSuffix,
        envConfig,
        tags,
      },
      { parent: this }
    );

    // 5. Create Lambda with 512MB memory and environment-based concurrency
    const lambdaComponent = new LambdaComponent(
      'payment-lambda',
      {
        environmentSuffix,
        envConfig,
        tags,
        vpcId: vpcComponent.vpcId,
        privateSubnetIds: vpcComponent.privateSubnetIds,
        dbEndpoint: databaseComponent.dbEndpoint,
        dynamoTableName: dynamoComponent.tableName,
        dynamoTableArn: dynamoComponent.tableArn,
      },
      { parent: this }
    );

    // 6. Create API Gateway with custom domain and WAF (prod only)
    const apiGatewayComponent = new ApiGatewayComponent(
      'payment-api',
      {
        environmentSuffix,
        envConfig,
        tags,
        lambdaFunctionArn: lambdaComponent.functionArn,
        lambdaFunctionName: lambdaComponent.functionName,
      },
      { parent: this }
    );

    // 7. Create CloudWatch monitoring and alarms
    new MonitoringComponent(
      'payment-monitoring',
      {
        environmentSuffix,
        envConfig,
        tags,
        dbInstanceId: databaseComponent.dbInstance.id,
        lambdaFunctionName: lambdaComponent.functionName,
        dynamoTableName: dynamoComponent.tableName,
        apiId: apiGatewayComponent.api.id,
      },
      { parent: this }
    );

    // Export all resource ARNs and endpoints as stack outputs
    this.vpcId = vpcComponent.vpcId;
    this.dbEndpoint = databaseComponent.dbEndpoint;
    this.dbArn = databaseComponent.dbArn;
    this.lambdaArn = lambdaComponent.functionArn;
    this.apiEndpoint = apiGatewayComponent.apiEndpoint;
    this.apiArn = apiGatewayComponent.apiArn;
    this.dynamoTableName = dynamoComponent.tableName;
    this.dynamoTableArn = dynamoComponent.tableArn;
    this.auditBucketName = s3Component.bucketName;
    this.auditBucketArn = s3Component.bucketArn;

    this.registerOutputs({
      vpcId: this.vpcId,
      dbEndpoint: this.dbEndpoint,
      dbArn: this.dbArn,
      kmsKeyId: databaseComponent.kmsKey.id,
      lambdaArn: this.lambdaArn,
      lambdaName: lambdaComponent.functionName,
      apiEndpoint: this.apiEndpoint,
      apiArn: this.apiArn,
      dynamoTableName: this.dynamoTableName,
      dynamoTableArn: this.dynamoTableArn,
      auditBucketName: this.auditBucketName,
      auditBucketArn: this.auditBucketArn,
    });
  }
}
