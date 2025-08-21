import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import security infrastructure stacks
import { ComputeStack } from './compute-stack';
import { MonitoringStack } from './monitoring-stack';
import { NetworkingStack } from './networking-stack';
import { SecurityServicesStack } from './security-services-stack';
import { SecurityStack } from './security-stack';
import { StorageStack } from './storage-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  stackName?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this as any).node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create networking infrastructure first
    const networkingStack = new NetworkingStack(
      this,
      `NetworkingStack${environmentSuffix}`,
      {
        env: props?.env,
        stackName: `NetworkingStack${environmentSuffix}`,
        description: `Networking infrastructure for ${environmentSuffix} environment`,
      }
    );

    // Create security services
    new SecurityServicesStack(
      this,
      `SecurityServicesStack${environmentSuffix}`,
      {
        env: props?.env,
        stackName: `SecurityServicesStack${environmentSuffix}`,
        description: `Security services for ${environmentSuffix} environment`,
      }
    );

    // Create storage with encryption
    const storageStack = new StorageStack(
      this,
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
      this,
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
      this,
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
    new SecurityStack(this, `SecurityStack${environmentSuffix}`, {
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
