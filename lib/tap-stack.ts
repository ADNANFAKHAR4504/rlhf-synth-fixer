import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';
import { VpcStack } from './vpc-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  stateBucket?: string; // currently unused (CDKTF concept) but accepted to satisfy caller
  stateBucketRegion?: string; // unused placeholder
  awsRegion?: string; // unused placeholder (region usually comes from env in aws-cdk)
  defaultTags?: { tags: Record<string, string> }; // mimic previously used structure
}

export class TapStack extends cdk.Stack {
  public readonly vpcStack: VpcStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply provided default tags (if any) at the stack scope
    if (props?.defaultTags?.tags) {
      Object.entries(props.defaultTags.tags).forEach(([k, v]) => {
        if (v != null) cdk.Tags.of(this).add(k, v);
      });
    }

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    // Create VPC Stack as a child stack (using 'this' instead of 'scope')
    this.vpcStack = new VpcStack(this, 'VpcStack', {
      environmentSuffix: environmentSuffix,
      env: props?.env,
    });
  }
}