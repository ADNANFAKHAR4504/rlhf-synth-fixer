import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ElasticBeanstalkStack } from './elastic-beanstalk-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create Elastic Beanstalk stack as a nested stack
    // Using 'this' ensures the stack is named TapStack{ENVIRONMENT_SUFFIX}ElasticBeanstalkStack
    new ElasticBeanstalkStack(this, 'ElasticBeanstalkStack', {
      environmentSuffix: environmentSuffix,
      instanceType: this.node.tryGetContext('instanceType') || 't3.micro',
      keyPairName: this.node.tryGetContext('keyPairName') || '',
      domainName: this.node.tryGetContext('domainName'),
      certificateArn: this.node.tryGetContext('certificateArn'),
    });
  }
}
