import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './api-stack';
import { CacheStack } from './cache-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { NetworkingStack } from './networking-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Networking infrastructure
    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
    });

    // Database infrastructure
    const databaseStack = new DatabaseStack(this, 'DatabaseStack', {
      vpc: networkingStack.vpc,
      databaseSecurityGroup: networkingStack.databaseSecurityGroup,
      environmentSuffix,
    });

    // Cache infrastructure
    const cacheStack = new CacheStack(this, 'CacheStack', {
      vpc: networkingStack.vpc,
      cacheSecurityGroup: networkingStack.cacheSecurityGroup,
      environmentSuffix,
    });

    // Compute infrastructure
    const computeStack = new ComputeStack(this, 'ComputeStack', {
      vpc: networkingStack.vpc,
      ecsSecurityGroup: networkingStack.ecsSecurityGroup,
      albSecurityGroup: networkingStack.albSecurityGroup,
      databaseSecret: databaseStack.databaseSecret,
      redisEndpoint: cacheStack.redisEndpoint,
      environmentSuffix,
    });

    // API Gateway infrastructure
    new ApiStack(this, 'ApiStack', {
      loadBalancer: computeStack.loadBalancer,
      environmentSuffix,
    });
  }
}
