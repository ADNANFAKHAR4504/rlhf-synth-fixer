import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComplianceStack } from './compliance-stack';

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

    // Create the compliance auditing infrastructure
    new ComplianceStack(this, 'ComplianceStack', {
      environmentSuffix,
    });
  }
}
