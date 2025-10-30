import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComplianceConstruct } from './compliance-stack';

// ? Import your stacks here
// import { MyStack } from './my-stack';

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

    // Tag all resources created by stacks instantiated here with the required tag
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Instantiate the ComplianceConstruct inside this TapStack so all resources
    // are created in the single top-level stack (no nested CloudFormation stack).
    new ComplianceConstruct(this, `ComplianceConstruct-${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
    });
  }
}
