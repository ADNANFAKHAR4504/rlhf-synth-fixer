import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment-config';
import { VpcStack } from './vpc-stack';
import { DynamoDbStack } from './dynamodb-stack';
import { S3Stack } from './s3-stack';
import { SqsStack } from './sqs-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TradingPlatformStageProps extends cdk.StageProps {
  environmentConfig: EnvironmentConfig;
  environmentSuffix?: string;
}

export class TradingPlatformStage extends cdk.Stage {
  public readonly apiEndpoint: cdk.CfnOutput;

  constructor(scope: Construct, id: string, props: TradingPlatformStageProps) {
    super(scope, id, props);

    const envConfig = props.environmentConfig;
    const environmentSuffix = props.environmentSuffix || envConfig.name;

    // Create VPC stack
    const vpcStack = new VpcStack(this, 'VpcStack', {
      environmentConfig: envConfig,
      stackName: `trading-vpc-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
    });

    // Create DynamoDB stack
    new DynamoDbStack(this, 'DynamoDbStack', {
      environmentConfig: envConfig,
      stackName: `trading-dynamodb-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
    });

    // Create S3 stack
    new S3Stack(this, 'S3Stack', {
      environmentConfig: envConfig,
      stackName: `trading-s3-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
    });

    // Create SQS stack
    new SqsStack(this, 'SqsStack', {
      environmentConfig: envConfig,
      stackName: `trading-sqs-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
    });

    // Create Lambda stack
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      environmentConfig: envConfig,
      vpc: vpcStack.vpc,
      stackName: `trading-lambda-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
    });

    // Create API Gateway stack
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', {
      environmentConfig: envConfig,
      orderProcessingFunction: lambdaStack.orderProcessingFunction,
      stackName: `trading-api-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
    });

    // Create Monitoring stack
    new MonitoringStack(this, 'MonitoringStack', {
      environmentConfig: envConfig,
      stackName: `trading-monitoring-${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
    });

    // Stack dependencies
    lambdaStack.addDependency(vpcStack);
    apiGatewayStack.addDependency(lambdaStack);

    // Export API endpoint
    this.apiEndpoint = new cdk.CfnOutput(apiGatewayStack, 'ApiEndpoint', {
      value: apiGatewayStack.api.url,
      description: 'API Gateway endpoint URL',
      exportName: `trading-api-endpoint-${environmentSuffix}`,
    });
  }

  public stackOutput(_outputName: string): cdk.CfnOutput {
    return this.apiEndpoint;
  }
}
