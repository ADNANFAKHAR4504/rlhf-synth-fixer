import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IaCNovaStack } from './iac-nova-stack';

interface TapStackProps extends cdk.StackProps {
  /**
   * Optional suffix used when generating child stack identifiers.
   */
  environmentSuffix?: string;

  /**
   * Explicit identifier for the IaC stack created within this stage.
   */
  stackId?: string;

  /**
   * Human-readable description for the IaC stack.
   */
  stackDescription?: string;

  /**
   * Explicit string suffix to pass into the nested infrastructure stack.
   */
  stringSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly emailInfrastructure: IaCNovaStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ??
      this.node.tryGetContext('environmentSuffix') ??
      'dev';

    const contextStackId = this.node.tryGetContext('stackId') as
      | string
      | undefined;
    const stackId =
      props?.stackId ??
      contextStackId ??
      `IaCNovaEmailNotification-${environmentSuffix}`;

    const contextDescription = this.node.tryGetContext('stackDescription') as
      | string
      | undefined;
    const stackDescription =
      props?.stackDescription ??
      contextDescription ??
      'Email notification infrastructure (IAC-349955) synthesized by TapStack.';

    const resolvedStringSuffix =
      props?.stringSuffix ??
      (this.node.tryGetContext('stringSuffix') as string | undefined) ??
      process.env.STRING_SUFFIX ??
      environmentSuffix;

    this.emailInfrastructure = new IaCNovaStack(this, stackId, {
      description: stackDescription,
      initialEnvironmentId: environmentSuffix,
      initialStringSuffix: resolvedStringSuffix,
    });
  }
}
