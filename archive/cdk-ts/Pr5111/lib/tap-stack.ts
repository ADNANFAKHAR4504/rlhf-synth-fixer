import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityEventStack } from './security_event';

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

    // Instantiate the Security Event Stack
    new SecurityEventStack(this, 'SecurityEventStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
      description:
        'HIPAA Compliance and Remediation Engine for PHI Data Access',
    });
  }
}
