import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RecommendationEngineStack } from './recommendation-engine-stack';

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

    new RecommendationEngineStack(this, 'RecommendationEngine', {
      environmentSuffix,
    });
  }
}
