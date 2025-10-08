import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';
import { SageMakerStack } from './sagemaker-stack';
import { StorageStack } from './storage-stack';
import { BatchStack } from './batch-stack';
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

    const networkingStack = new NetworkingStack(this, 'NetworkingStack', {
      environmentSuffix,
    });

    const storageStack = new StorageStack(this, 'StorageStack', {
      environmentSuffix,
    });

    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environmentSuffix,
    });

    new SageMakerStack(this, 'SageMakerStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      datasetBucket: storageStack.datasetBucket,
      modelBucket: storageStack.modelBucket,
      ecrRepository: storageStack.ecrRepository,
      logGroup: monitoringStack.logGroup,
    });

    new BatchStack(this, 'BatchStack', {
      environmentSuffix,
      vpc: networkingStack.vpc,
      modelBucket: storageStack.modelBucket,
      ecrRepository: storageStack.ecrRepository,
    });

    // Main stack outputs
    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: this.region,
      description: 'AWS region where stack is deployed',
    });
  }
}
