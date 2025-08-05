import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { IamStack } from './iam-stack';
import { AutoScalingStack } from './autoscaling-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC Stack
    const vpcStack = new VpcStack(this, `VpcStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
    });

    // Create IAM Stack
    const iamStack = new IamStack(this, `IamStack${environmentSuffix}`, {
      environmentSuffix,
      env: props?.env,
    });

    // Create Auto Scaling Stack
    const autoScalingStack = new AutoScalingStack(
      this,
      `AutoScalingStack${environmentSuffix}`,
      {
        vpc: vpcStack.vpc,
        privateSubnets: vpcStack.privateSubnets,
        ec2Role: iamStack.ec2Role,
        environmentSuffix,
        env: props?.env,
      }
    );

    // Add dependencies
    iamStack.addDependency(vpcStack);
    autoScalingStack.addDependency(vpcStack);
    autoScalingStack.addDependency(iamStack);
  }
}
