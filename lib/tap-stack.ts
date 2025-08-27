import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ComputeStack } from './stacks/compute-stack';
import { DatabaseStack } from './stacks/database-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { NetworkingStack } from './stacks/networking-stack';
import { SecurityStack } from './stacks/security-stack';
import { StorageStack } from './stacks/storage-stack';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);
    const commonTags = {
      Environment: 'production',
      Owner: 'infrastructure-team',
    };
    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Trusted IP ranges for security groups
    const trustedIpRanges = ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'];
    const env = props?.env;

    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      env,
      tags: commonTags,
    });

    const securityStack = new SecurityStack(this, 'SecurityStack', {
      env,
      tags: commonTags,
      vpc: networkingStack.vpc,
      trustedIpRanges,
    });

    new StorageStack(this, 'StorageStack', {
      env,
      tags: commonTags,
    });

    new DatabaseStack(this, 'DatabaseStack', {
      env,
      tags: commonTags,
      vpc: networkingStack.vpc,
      securityGroup: securityStack.rdsSecurityGroup,
    });

    const computeStack = new ComputeStack(this, 'ComputeStack', {
      env,
      tags: commonTags,
      vpc: networkingStack.vpc,
      securityGroup: securityStack.ec2SecurityGroup,
      lambdaSecurityGroup: securityStack.lambdaSecurityGroup,
    });

    new MonitoringStack(this, 'MonitoringStack', {
      env,
      tags: commonTags,
      ec2Instances: computeStack.ec2Instances,
    });
  }
}
