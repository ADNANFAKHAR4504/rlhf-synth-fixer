import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import {
  createEc2S3StateRole,
  createHighAvailabilityVpc,
  createStateBucket,
} from './modules';

// ? Import your stacks here
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    const vpc = createHighAvailabilityVpc(this, 'tap', {
      cidr: '10.10.0.0/16',
      azCount: 2,
      namePrefix: 'tap',
    });

    // Define state object for bucketArn and bucketName
    const state = createStateBucket(this, 'tap-state-bucket', {
      namePrefix: stateBucket,
      region: awsRegion, // or your preferred region variable
    });

    // Create EC2 IAM role with access to the state bucket
    const ec2Role = createEc2S3StateRole(this, 'tap', {
      roleNamePrefix: 'tap',
      bucketArn: state.bucketArn,
      bucketName: state.bucketName,
    });

    // Outputs for integration tests
    new TerraformOutput(this, 'vpc_id', { value: vpc.vpcId });
    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnetIds,
    });
    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnetIds,
    });
    new TerraformOutput(this, 'state_bucket_name', { value: state.bucketName });
    new TerraformOutput(this, 'state_bucket_arn', { value: state.bucketArn });
    new TerraformOutput(this, 'ec2_role_name', { value: ec2Role.name });
  }
}
