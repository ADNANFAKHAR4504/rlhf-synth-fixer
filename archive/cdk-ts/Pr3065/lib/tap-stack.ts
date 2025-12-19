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
    const pipelineStack = new ServerlessDataPipelineStack(
      this,
      `ServerlessDataPipelineStack${environmentSuffix}`,
      {
        environmentSuffix,
        notificationEmail: process.env.NOTIFICATION_EMAIL, // Optional email notifications
      }
    );

    // Apply production tags to the main stack
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Main stack outputs
    new cdk.CfnOutput(this, 'DeploymentSummary', {
      value: JSON.stringify({
        region: props?.env?.region || 'us-east-1',
        environmentSuffix: environmentSuffix,
        stacksDeployed: ['ServerlessDataPipeline'],
      }),
      description: 'Deployment summary information',
    });

    // Import all outputs from ServerlessDataPipelineStack for integration testing
    new cdk.CfnOutput(this, 'PipelineStackName', {
      value: pipelineStack.stackName,
      description: 'Pipeline stack name containing all resources',
      exportName: `PipelineStackName-${environmentSuffix}`,
    });

    // Integration testing outputs are provided by the pipeline stack directly
    // Use: aws cloudformation describe-stacks --stack-name ServerlessDataPipelineStack${environmentSuffix}
    new cdk.CfnOutput(this, 'IntegrationTestingNote', {
      value: `Get integration testing outputs from stack: ${pipelineStack.stackName}`,
      description: 'Instructions for accessing integration testing outputs',
      exportName: `IntegrationInstructions-${environmentSuffix}`,
    });
  }
}
