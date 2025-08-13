import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CiCdPipelineStack } from './ci-cd-pipeline-stack';

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

    // Create CI/CD Pipeline Stack - using 'this' ensures proper naming
    new CiCdPipelineStack(this, 'CiCdPipelineStack', {
      environmentSuffix,
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: 'us-east-1',
      },
    });

    // Apply global tags
    cdk.Tags.of(this).add(
      'Environment',
      environmentSuffix === 'prod' ? 'Production' : 'Development'
    );
    cdk.Tags.of(this).add('Project', 'CI_CD_Pipeline');
    cdk.Tags.of(this).add('ManagedBy', 'AWS-CDK');
  }
}
