import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import security infrastructure stacks
import { NetworkingStack } from './networking-stack';
import { SecurityServicesStack } from './security-services-stack';
import { StorageStack } from './storage-stack';
import { ComputeStack } from './compute-stack';
import { MonitoringStack } from './monitoring-stack';
import { SecurityStack } from './security-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  stackName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create networking infrastructure first
    const networkingStack = new NetworkingStack(
      scope,
      `NetworkingStack${environmentSuffix}`,
      {
        env: props?.env,
        stackName: `NetworkingStack${environmentSuffix}`,
        description: `Networking infrastructure for ${environmentSuffix} environment`,
      }
    );

    // Create security services
    new SecurityServicesStack(
      scope,
      `SecurityServicesStack${environmentSuffix}`,
      {
        env: props?.env,
        stackName: `SecurityServicesStack${environmentSuffix}`,
        description: `Security services for ${environmentSuffix} environment`,
      }
    );

    // Create storage with encryption
    const storageStack = new StorageStack(
      scope,
      `StorageStack${environmentSuffix}`,
      {
        vpc: networkingStack.vpc,
        env: props?.env,
        stackName: `StorageStack${environmentSuffix}`,
        environmentSuffix: environmentSuffix,
        description: `Storage resources for ${environmentSuffix} environment`,
      }
    );

    // Create compute infrastructure
    const computeStack = new ComputeStack(
      scope,
      `ComputeStack${environmentSuffix}`,
      {
        vpc: networkingStack.vpc,
        kmsKey: storageStack.kmsKey,
        env: props?.env,
        stackName: `ComputeStack${environmentSuffix}`,
        environmentSuffix: environmentSuffix,
        description: `Compute resources for ${environmentSuffix} environment`,
      }
    );

    // Create monitoring and alerting
    const monitoringStack = new MonitoringStack(
      scope,
      `MonitoringStack${environmentSuffix}`,
      {
        kmsKey: storageStack.kmsKey,
        env: props?.env,
        stackName: `MonitoringStack${environmentSuffix}`,
        environmentSuffix: environmentSuffix,
        description: `Monitoring infrastructure for ${environmentSuffix} environment`,
      }
    );

    // Create security certificates
    new SecurityStack(scope, `SecurityStack${environmentSuffix}`, {
      env: props?.env,
      stackName: `SecurityStack${environmentSuffix}`,
      description: `Security certificates for ${environmentSuffix} environment`,
    });

    // Set up dependencies
    storageStack.addDependency(networkingStack);
    computeStack.addDependency(networkingStack);
    computeStack.addDependency(storageStack);
    monitoringStack.addDependency(storageStack);

    // Export stack outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: networkingStack.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VPCId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: storageStack.kmsKey.keyId,
      description: 'KMS Key ID for encryption',
      exportName: `KMSKeyId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for this deployment',
      exportName: `EnvironmentSuffix-${environmentSuffix}`,
    });
  }
}
