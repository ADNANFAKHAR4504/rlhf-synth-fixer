import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessStack } from './serverless-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create the serverless infrastructure stack
    const serverlessStack = new ServerlessStack(
      this,
      'ServerlessInfrastructure',
      {
        environmentSuffix: environmentSuffix,
        env: props?.env,
      }
    );

    // Export the outputs from the nested stack to the parent stack
    // This ensures they are available in cfn-outputs when deployed
    new cdk.CfnOutput(this, 'BucketName', {
      value: serverlessStack.bucket.bucketName,
      description: 'Name of the S3 bucket',
      exportName: `${this.stackName}-BucketName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: serverlessStack.lambdaFunction.functionName,
      description: 'Name of the Lambda function',
      exportName: `${this.stackName}-LambdaFunctionName`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: serverlessStack.api.url,
      description: 'URL of the API Gateway',
      exportName: `${this.stackName}-ApiGatewayUrl`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayId', {
      value: serverlessStack.api.restApiId,
      description: 'ID of the API Gateway',
      exportName: `${this.stackName}-ApiGatewayId`,
    });
  }
}
