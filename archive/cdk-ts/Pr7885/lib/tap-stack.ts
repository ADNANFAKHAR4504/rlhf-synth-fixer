import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CicdPipelineStack } from './cicd-pipeline-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly cicdPipeline: CicdPipelineStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Get team and cost center from environment or use defaults
    const team = process.env.TEAM || 'DevOps';
    const costCenter = process.env.COST_CENTER || 'Engineering';

    // Create CI/CD Pipeline Stack
    this.cicdPipeline = new CicdPipelineStack(
      scope,
      `CicdPipelineStack${environmentSuffix}`,
      {
        environmentSuffix,
        team,
        costCenter,
        env: props?.env,
      }
    );
  }
}
