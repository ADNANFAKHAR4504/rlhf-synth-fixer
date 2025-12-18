import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly serverlessStack: ServerlessStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Default allowed IP CIDRs - can be overridden via context
    const allowedIpCidrs = this.node.tryGetContext('allowedIpCidrs') || [
      '0.0.0.0/0',
    ];

    // Create the serverless stack for user data processing
    this.serverlessStack = new ServerlessStack(this, 'ServerlessStack', {
      environmentSuffix,
      allowedIpCidrs,
      env: {
        account: this.account,
        region: 'us-east-1', // Fixed region as per requirements
      },
    });

    // Export outputs from nested stack
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.serverlessStack.bucket.bucketName,
      description: 'Name of the S3 bucket for user data',
      exportName: `TapStack-BucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.serverlessStack.lambda.functionName,
      description: 'Name of the Lambda function',
      exportName: `TapStack-LambdaFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.serverlessStack.api.url,
      description: 'URL of the API Gateway',
      exportName: `TapStack-ApiGatewayUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.serverlessStack.api.restApiId,
      description: 'ID of the API Gateway',
      exportName: `TapStack-ApiGatewayId-${environmentSuffix}`,
    });
  }
}
