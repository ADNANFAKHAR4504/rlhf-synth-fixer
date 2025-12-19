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
    // Note: ServerlessStack is created as a nested stack to allow
    // direct resource references in the parent stack outputs
    this.serverlessStack = new ServerlessStack(this, 'ServerlessStack', {
      environmentSuffix,
      allowedIpCidrs,
      // Nested stacks automatically inherit env from parent stack
    });

    // Outputs - reference the nested stack outputs
    // These are required for CI/CD pipeline validation
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.serverlessStack.bucket.bucketName,
      description: 'Name of the S3 bucket for user data',
      exportName: `BucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: this.serverlessStack.lambda.functionName,
      description: 'Name of the Lambda function',
      exportName: `LambdaFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.serverlessStack.api.url,
      description: 'URL of the API Gateway',
      exportName: `ApiGatewayUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: this.serverlessStack.api.restApiId,
      description: 'ID of the API Gateway',
      exportName: `ApiGatewayId-${environmentSuffix}`,
    });
  }
}
