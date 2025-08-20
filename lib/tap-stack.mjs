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

    // Get region from AWS_REGION environment variable set by CICD or use us-west-2 as default
    const region = process.env.AWS_REGION || 'us-west-2';
    const stackSuffix = `${environmentSuffix}-${region}`;

    // Create KMS Stack first (other stacks depend on encryption keys)
    const kmsStack = new SecurityKmsStack(scope, `SecurityKmsStack${stackSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityKmsStack${stackSuffix}`,
    });

    // Create IAM Stack (depends on KMS keys)
    const iamStack = new SecurityIamStack(scope, `SecurityIamStack${stackSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityIamStack${stackSuffix}`,
      encryptionKeyArn: kmsStack.encryptionKey.keyArn,
    });

    // Create Config Stack (depends on KMS keys and IAM roles)
    const configStack = new SecurityConfigStack(scope, `SecurityConfigStack${stackSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityConfigStack${stackSuffix}`,
      encryptionKeyArn: kmsStack.encryptionKey.keyArn,
      serviceRoleArn: iamStack.securityAuditRole.roleArn,
    });

    // Create Monitoring Stack (depends on KMS keys)
    const monitoringStack = new SecurityMonitoringStack(scope, `SecurityMonitoringStack${stackSuffix}`, {
      ...props,
      environmentSuffix,
      stackName: `SecurityMonitoringStack${stackSuffix}`,
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
    new cdk.CfnOutput(this, `SecurityDeploymentComplete${stackSuffix}`, {
      value: 'SUCCESS',
      description: 'Indicates successful deployment of all security stacks',
    });

    // Export key outputs from nested stacks for integration testing (no export names to avoid conflicts)
    new cdk.CfnOutput(this, `EncryptionKeyId${stackSuffix}`, {
      value: kmsStack.encryptionKey.keyId,
      description: 'KMS Encryption Key ID',
    });

    new cdk.CfnOutput(this, `EncryptionKeyArn${stackSuffix}`, {
      value: kmsStack.encryptionKey.keyArn,
      description: 'KMS Encryption Key ARN',
    });

    new cdk.CfnOutput(this, `SigningKeyId${stackSuffix}`, {
      value: kmsStack.signingKey.keyId,
      description: 'KMS Signing Key ID',
    });

    new cdk.CfnOutput(this, `SecurityAuditRoleArn${stackSuffix}`, {
      value: iamStack.securityAuditRole.roleArn,
      description: 'Security Audit Role ARN',
    });

    new cdk.CfnOutput(this, `SecurityMonitoringRoleArn${stackSuffix}`, {
      value: iamStack.securityMonitoringRole.roleArn,
      description: 'Security Monitoring Role ARN',
    });
  }
}

export { TapStack };
