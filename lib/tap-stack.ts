import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

// Note: Module imports commented out as they don't exist yet
// import {
//   VPCModule,
//   EC2Module,
//   RDSModule,
//   S3Module,
//   LambdaModule,
//   MonitoringModule,
//   Route53Module,
// } from './modules';

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

    // Create a simple S3 bucket as example resource
    const exampleBucket = new S3Bucket(this, 'example-bucket', {
      bucket: `tap-project-${environmentSuffix}-example`,
      tags: {
        Name: `tap-project-${environmentSuffix}-example`,
        Environment: environmentSuffix,
      },
    });

    // Terraform Output
    new TerraformOutput(this, 'bucket-name', {
      value: exampleBucket.bucket,
      description: 'Example S3 bucket name',
    });

    new TerraformOutput(this, 'environment', {
      value: environmentSuffix,
      description: 'Environment suffix',
    });

    new TerraformOutput(this, 'region', {
      value: awsRegion,
      description: 'AWS Region',
    });
  }
}
