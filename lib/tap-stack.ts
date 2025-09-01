import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureVpcStack } from './secure-vpc-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
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

    // Create the secure VPC stack
    new SecureVpcStack(this, 'SecureVpc', {
      environmentSuffix,
      vpcCidr: '10.0.0.0/16',
      allowedSshCidr: '10.0.0.0/8',
      companyTags: {
        Environment: 'Production',
        Project: 'SecureVPC',
        Owner: 'DevOps',
        CostCenter: 'IT-Infrastructure',
      },
    });
  }
}
