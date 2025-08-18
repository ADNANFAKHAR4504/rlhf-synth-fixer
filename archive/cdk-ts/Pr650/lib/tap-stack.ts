import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureEnvironmentStack } from './secure-environment-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends SecureEnvironmentStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      environmentSuffix:
        props?.environmentSuffix ||
        scope.node.tryGetContext('environmentSuffix') ||
        'dev',
    });
  }
}
