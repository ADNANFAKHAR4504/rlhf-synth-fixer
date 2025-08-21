import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ProductionWebAppStack } from './production-web-app-stack';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  approvedSshCidr?: string;
  alarmEmail?: string;
  certificateArn?: string;
}

export class TapStack extends cdk.Stack {
  public readonly productionWebAppStack?: ProductionWebAppStack;

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

    // Create the production web application stack if we have the required props
    if (props?.approvedSshCidr && props?.alarmEmail) {
      this.productionWebAppStack = new ProductionWebAppStack(
        scope,
        `ProductionWebApp${environmentSuffix}`,
        {
          approvedSshCidr: props.approvedSshCidr,
          alarmEmail: props.alarmEmail,
          certificateArn: props.certificateArn,
          testing: environmentSuffix === 'test' || environmentSuffix === 'dev',
        }
      );
    }
  }
}
