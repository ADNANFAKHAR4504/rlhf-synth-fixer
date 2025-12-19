import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
import { MetadataProcessingStack } from './metadata-stack';

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

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    const metadataStack = new MetadataProcessingStack(
      this,
      'MetadataProcessingStack',
      {
        environmentSuffix,
      }
    );

    // Reference the nested stack outputs using GetAtt
    const nestedStackOutputs = metadataStack.nestedStackResource;

    if (nestedStackOutputs) {
      new cdk.CfnOutput(this, 'MetadataBucketName', {
        value: nestedStackOutputs
          .getAtt('Outputs.MetadataBucketName')
          .toString(),
        description: 'S3 bucket for metadata.json files',
      });

      new cdk.CfnOutput(this, 'OpenSearchDomainName', {
        value: nestedStackOutputs
          .getAtt('Outputs.OpenSearchDomainName')
          .toString(),
        description: 'OpenSearch domain name',
      });

      new cdk.CfnOutput(this, 'OpenSearchDomainEndpoint', {
        value: nestedStackOutputs
          .getAtt('Outputs.OpenSearchDomainEndpoint')
          .toString(),
        description: 'OpenSearch domain endpoint',
      });

      new cdk.CfnOutput(this, 'FailureTableName', {
        value: nestedStackOutputs.getAtt('Outputs.FailureTableName').toString(),
        description: 'DynamoDB table for failure tracking',
      });

      new cdk.CfnOutput(this, 'MetadataProcessingWorkflowArn', {
        value: nestedStackOutputs
          .getAtt('Outputs.MetadataProcessingWorkflowArn')
          .toString(),
        description: 'Step Functions state machine ARN',
      });
    }
  }
}
