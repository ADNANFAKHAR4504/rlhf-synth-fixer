import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';
import { NetworkStack } from './network-stack';
import { ComputeStack } from './compute-stack';
import { DataStack } from './data-stack';
import { MonitoringStack } from './monitoring-stack';

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

    // Network infrastructure with security groups
    const networkStack = new NetworkStack(
      this,
      `NetworkStack-${environmentSuffix}`,
      {
        environmentSuffix,
      }
    );

    // Security services and IAM roles
    const securityStack = new SecurityStack(
      this,
      `SecurityStack-${environmentSuffix}`,
      {
        environmentSuffix,
        vpc: networkStack.vpc,
      }
    );

    // Compute resources with security configurations
    new ComputeStack(this, `ComputeStack-${environmentSuffix}`, {
      environmentSuffix,
      vpc: networkStack.vpc,
      securityGroup: networkStack.ec2SecurityGroup,
      instanceRole: securityStack.ec2Role,
      kmsKey: securityStack.kmsKey,
    });

    // Data storage with encryption
    new DataStack(this, `DataStack-${environmentSuffix}`, {
      environmentSuffix,
      vpc: networkStack.vpc,
      kmsKey: securityStack.kmsKey,
      cloudTrailBucket: securityStack.cloudTrailBucket,
    });

    // Monitoring and alerting
    new MonitoringStack(this, `MonitoringStack-${environmentSuffix}`, {
      environmentSuffix,
      snsTopicArn: securityStack.securityAlertsTopic.topicArn,
    });
  }
}
