import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AmlPipelineStack } from './aml-pipeline-stack';

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

    // Instantiate the AML Pipeline Stack as a nested stack
    new AmlPipelineStack(this, `AmlPipeline-${environmentSuffix}`, {
      sagemakerEndpointName: 'aml-anomaly-detection-endpoint',
      verifiedPermissionsPolicyStoreId: 'ps-12345678',
      dataBucketName: 'aml-transaction-data-lake',
      environmentSuffix: environmentSuffix,
    });
  }
}
