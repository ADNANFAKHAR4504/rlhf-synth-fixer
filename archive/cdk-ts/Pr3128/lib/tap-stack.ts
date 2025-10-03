import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { StaticWebsiteStack } from './static-website-stack';

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

    // Create the static website stack as a nested stack
    new StaticWebsiteStack(this, 'StaticWebsiteStack', {
      environmentSuffix: environmentSuffix,
      // Uncomment and set your domain name if you have one
      // domainName: 'example.com',
    });

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('Project', 'MarketingCampaign');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Marketing');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
  }
}
