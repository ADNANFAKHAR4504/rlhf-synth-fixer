import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { ServerlessDataPipelineStack } from './serverless-data-pipeline-stack';

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

    // Create the consolidated serverless data pipeline stack
    new ServerlessDataPipelineStack(
      scope,
      `ServerlessDataPipelineStack${environmentSuffix}`,
      {
        ...props,
        environmentSuffix,
        notificationEmail: process.env.NOTIFICATION_EMAIL, // Optional email notifications
      }
    );

    // Apply production tags to the main stack
    cdk.Tags.of(this).add('Environment', 'Production');

    // Main stack outputs
    new cdk.CfnOutput(this, 'DeploymentSummary', {
      value: JSON.stringify({
        region: props?.env?.region || 'us-east-1',
        environmentSuffix: environmentSuffix,
        stacksDeployed: ['ServerlessDataPipeline'],
      }),
      description: 'Deployment summary information',
    });
  }
}
