import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';

// Props extended to align with usage in bin/tap.ts
interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  stateBucket?: string; // Terraform state bucket (currently unused in CDK code)
  stateBucketRegion?: string; // Region for the state bucket
  awsRegion?: string; // Region passed from CLI/env
  defaultTags?: { tags: Record<string, string> }; // Tag structure coming from bin/tap.ts
}

export class TapStack extends cdk.Stack {
  public readonly vpcStack: VpcStack;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Determine environment suffix
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Apply default tags if provided
    if (props?.defaultTags?.tags) {
      Object.entries(props.defaultTags.tags).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          cdk.Tags.of(this).add(k, v);
        }
      });
    }

    // Optionally set region if provided via awsRegion (fallback handled by CDK env normally)
    const region = props?.awsRegion || process.env.AWS_REGION;
    const finalEnv = props?.env || (region ? { region } : undefined);

    // Child VPC stack
    this.vpcStack = new VpcStack(this, 'VpcStack', {
      environmentSuffix,
      env: finalEnv,
    });
  }
}
