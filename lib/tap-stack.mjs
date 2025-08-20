import * as cdk from 'aws-cdk-lib';
import { SecurityKmsStack } from './security-kms-stack.mjs';
import { SecurityIamStack } from './security-iam-stack.mjs';
import { SecurityConfigStack } from './security-config-stack.mjs';
import { SecurityMonitoringStack } from './security-monitoring-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create KMS Stack first (other stacks depend on encryption keys)
    const kmsStack = new SecurityKmsStack(scope, `SecurityKmsStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityKmsStack${environmentSuffix}`,
    });

    // Create IAM Stack (depends on KMS keys)
    const iamStack = new SecurityIamStack(scope, `SecurityIamStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityIamStack${environmentSuffix}`,
      encryptionKeyArn: kmsStack.encryptionKey.keyArn,
    });

    // Create Config Stack (depends on KMS keys and IAM roles)
    const configStack = new SecurityConfigStack(scope, `SecurityConfigStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityConfigStack${environmentSuffix}`,
      encryptionKeyArn: kmsStack.encryptionKey.keyArn,
      serviceRoleArn: iamStack.securityAuditRole.roleArn,
    });

    // Create Monitoring Stack (depends on KMS keys)
    const monitoringStack = new SecurityMonitoringStack(scope, `SecurityMonitoringStack${environmentSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityMonitoringStack${environmentSuffix}`,
      encryptionKeyArn: kmsStack.encryptionKey.keyArn,
    });

    // Establish stack dependencies
    iamStack.addDependency(kmsStack);
    configStack.addDependency(kmsStack);
    configStack.addDependency(iamStack);
    monitoringStack.addDependency(kmsStack);

    // Apply global tags to all stacks including the main stack
    const stacks = [this, kmsStack, iamStack, configStack, monitoringStack];
    stacks.forEach(stack => {
      cdk.Tags.of(stack).add('Owner', 'SecurityTeam');
      cdk.Tags.of(stack).add('Purpose', 'SecurityConfiguration');
      cdk.Tags.of(stack).add('Environment', environmentSuffix);
      cdk.Tags.of(stack).add('CostCenter', 'Security');
      cdk.Tags.of(stack).add('Compliance', 'Required');
      cdk.Tags.of(stack).add('Project', 'SecurityAsCode');
    });

    // Master outputs
    new cdk.CfnOutput(this, `SecurityDeploymentComplete${environmentSuffix}`, {
      value: 'SUCCESS',
      description: 'Indicates successful deployment of all security stacks',
    });
  }
}

export { TapStack };
