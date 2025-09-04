import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from './network-stack.mjs';
import { StorageStack } from './storage-stack.mjs';
import { DatabaseStack } from './database-stack.mjs';
import { SecurityStack } from './security-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create network infrastructure as nested stack
    const networkStack = new NetworkStack(this, 'Network', {
      ...props,
      stackName: `${this.stackName}-Network`,
      environmentSuffix: environmentSuffix
    });

    // Create security resources as nested stack
    const securityStack = new SecurityStack(this, 'Security', {
      ...props,
      stackName: `${this.stackName}-Security`,
      environmentSuffix: environmentSuffix,
      vpc: networkStack.vpc
    });

    // Create storage resources as nested stack
    const storageStack = new StorageStack(this, 'Storage', {
      ...props,
      stackName: `${this.stackName}-Storage`,
      environmentSuffix: environmentSuffix,
      ec2Role: securityStack.ec2Role
    });

    // Create database resources as nested stack
    const databaseStack = new DatabaseStack(this, 'Database', {
      ...props,
      stackName: `${this.stackName}-Database`,
      environmentSuffix: environmentSuffix,
      vpc: networkStack.vpc,
      dbSecurityGroup: securityStack.rdsSecurityGroup
    });
  }
}

export { TapStack };
