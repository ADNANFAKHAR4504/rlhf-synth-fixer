import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CicdPipelineConstruct } from './cicd-pipeline-construct';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create CI/CD Pipeline infrastructure
    new CicdPipelineConstruct(this, 'CicdPipeline', {
      environmentSuffix,
    });
  }
}
