import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGatewayConstruct } from './constructs/api-gateway-construct';
import { DynamoDBConstruct } from './constructs/dynamodb-construct';
import { KmsConstruct } from './constructs/kms-construct';
import { LambdaConstruct } from './constructs/lambda-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';

// ? Import your stacks here
// import { MyStack } from './my-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  lambdaMemorySize?: number;
  lambdaTimeout?: number;
  dynamoReadCapacity?: number;
  dynamoWriteCapacity?: number;
  corsOrigin?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const isProduction = environmentSuffix.toLowerCase().includes('prod');
    const removalPolicy = isProduction
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Create KMS key for encryption
    const kmsKey = new KmsConstruct(this, 'KmsKey', {
      environmentSuffix,
      removalPolicy,
    });

    // Create DynamoDB table
    const dynamoDb = new DynamoDBConstruct(this, 'DynamoDB', {
      environmentSuffix,
      readCapacity: props.dynamoReadCapacity || 5,
      writeCapacity: props.dynamoWriteCapacity || 5,
      removalPolicy,
      kmsKey,
    });

    // Create Lambda function
    const lambda = new LambdaConstruct(this, 'Lambda', {
      environmentSuffix,
      memorySize: props.lambdaMemorySize || 256,
      timeout: props.lambdaTimeout || 10,
      dynamoTable: dynamoDb.table,
      removalPolicy,
      kmsKey,
    });

    // Create API Gateway
    const apiGateway = new ApiGatewayConstruct(this, 'ApiGateway', {
      environmentSuffix,
      lambdaFunction: lambda.function,
      corsOrigin: props.corsOrigin || 'https://example.com',
      removalPolicy,
      kmsKey,
    });

    // Create monitoring resources
    new MonitoringConstruct(this, 'Monitoring', {
      environmentSuffix,
      lambdaFunction: lambda.function,
      apiGateway: apiGateway.restApi,
      deadLetterQueue: lambda.deadLetterQueue,
      kmsKey,
    });

    // Output important values
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: apiGateway.restApi.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: dynamoDb.table.tableName,
      description: 'DynamoDB table name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambda.function.functionName,
      description: 'Lambda function name',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.key.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'KmsKeyAlias', {
      value: kmsKey.alias.aliasName,
      description: 'KMS Key Alias for encryption',
    });
  }
}
