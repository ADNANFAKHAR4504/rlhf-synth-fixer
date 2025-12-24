import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CiCdPipelineStack } from './cicd-pipeline-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

// Re-export CiCdPipelineStack as TapStack for backward compatibility
export class TapStack extends CiCdPipelineStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    const environmentSuffix = props?.environmentSuffix || 'dev';

    super(scope, id, {
      ...props,
      environmentSuffix,
    });
  }
}
