import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IaCNovaStack } from './iac-nova-stack';

interface TapStackProps extends cdk.StageProps {
  /**
   * Optional suffix used when generating child stack identifiers.
   */
  environmentSuffix?: string;

  /**
   * Optional inherited stackName value forwarded by existing tooling.
   * It is ignored because child stacks manage their own names, but we accept it
   * to remain compatible with the default TAP bootstrap script.
   */
  stackName?: string;

  /**
   * Explicit identifier for the IaC stack created within this stage.
   */
  stackId?: string;

  /**
   * Human-readable description for the IaC stack.
   */
  stackDescription?: string;
}

export class TapStack extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ?? this.node.tryGetContext('environmentSuffix') ?? 'dev';

    const stackId =
      props?.stackId ??
      `IaCNovaEmailNotification-${environmentSuffix}`;

    const stackDescription =
      props?.stackDescription ??
      'Email notification infrastructure (IAC-349955) composed via TAP stage.';

    new IaCNovaStack(this, stackId, {
      env: props?.env,
      description: stackDescription,
    });
  }
}
