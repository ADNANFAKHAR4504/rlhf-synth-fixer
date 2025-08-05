import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket'; // S3Bucket import is now needed here

/**
 * Props for MyStack.
 * @interface MyStackProps
 * @property {string} bucketName - The name for the S3 bucket.
 * @property {{ [key: string]: string }} tags - Tags to apply to the S3 bucket.
 */
interface MyStackProps {
  bucketName: string;
  tags: { [key: string]: string };
}

/**
 * MyStack is a modular TerraformStack that provisions a simple S3 bucket.
 * This serves as an example of a stack that TapStack can instantiate.
 * (Now defined within the same file as TapStack)
 */
class MyStack extends TerraformStack { // Note: Not exported as it's used internally by TapStack
  constructor(scope: Construct, id: string, props: MyStackProps) {
    super(scope, id);

    // Create an S3 bucket within this modular stack
    new S3Bucket(this, 'my_example_bucket', {
      bucket: props.bucketName,
      acl: 'private', // Access Control List set to private
      tags: props.tags, // Apply provided tags
      // forceDestroy is set to true for testing purposes, allowing non-empty buckets to be destroyed
      // In production, consider removing this or making it conditional.
      forceDestroy: true,
    });
  }
}

/**
 * Props for the TapStack.
 * @interface TapStackProps
 * @property {string} [environmentSuffix='dev'] - Suffix for environment-specific naming (e.g., 'dev', 'prod').
 * @property {string} [stateBucket='iac-rlhf-tf-states'] - S3 bucket name for Terraform state.
 * @property {string} [stateBucketRegion='us-east-1'] - AWS region for the S3 state bucket.
 * @property {string} [awsRegion='us-east-1'] - AWS region for provisioning resources.
 * @property {AwsProviderDefaultTags} [defaultTags] - Default tags to apply to all AWS resources.
 * @property {boolean} [createMyStack=false] - Flag to conditionally instantiate MyStack for testing purposes.
 */
interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  createMyStack?: boolean; // Prop to control MyStack instantiation for testing
}

// Optional: Override the AWS Region for the Terraform provider globally.
// If set, this will take precedence over `props?.awsRegion`.
const AWS_REGION_OVERRIDE = '';

/**
 * TapStack is the main CDKTF stack for provisioning AWS infrastructure.
 * It configures the AWS provider, S3 backend for state management,
 * and acts as a orchestrator for other modular stacks (like MyStack, now internal).
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Set default values for properties if not provided
    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    // Ensure defaultTags are correctly formatted for the AwsProvider
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags, // Apply default tags to all resources created by this provider
    });

    // Configure S3 Backend for Terraform state management
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`, // Unique state key per environment and stack ID
      region: stateBucketRegion,
      encrypt: true, // Encrypt state file at rest
    });

    // Using an escape hatch to enable S3 state locking natively.
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Conditionally instantiate MyStack (now defined internally)
    if (props?.createMyStack) {
      new MyStack(this, 'MyModularStack', { // MyStack is now accessible directly
        bucketName: `${environmentSuffix}-my-example-bucket`, // Example bucket name
        tags: {
          Project: 'TestProject',
          Environment: environmentSuffix,
          ManagedBy: 'CDKTF',
        },
      });
    }
  }
}
