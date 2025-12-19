import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ServerlessInfrastructureStack } from './serverless-infrastructure-stack';

// Import your stacks here
// import { MyStack } from './my-stack';

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

    // Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const serverlessStack = new ServerlessInfrastructureStack(
      this,
      `ServerlessInfrastructureStack-${environmentSuffix}`,
      {
        environmentSuffix,
        description: `Serverless Infrastructure Stack for ${environmentSuffix} environment`,
      }
    );

    // Re-export outputs from nested stack to parent stack
    // This ensures the outputs are accessible at the parent stack level
    // for the deployment script to collect them
    new cdk.CfnOutput(this, 'APIGatewayURL', {
      value: serverlessStack.apiUrl,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: serverlessStack.cloudFrontDomain,
      description: 'CloudFront Distribution Domain Name',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: serverlessStack.tableName,
      description: 'DynamoDB Table Name',
    });
  }
}
