import { AwsProvider, AwsProviderDefaultTags } from '@cdktf/provider-aws/lib/provider';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { S3Stack } from './s3-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];


    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags
    });

    // Configure S3 Backend with native state locking
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride("terraform.backend.s3",
      {
        bucket: stateBucket,
        key: `${environmentSuffix}/${id}.tfstate`,
        region: stateBucketRegion,
        encrypt: true,
        use_lockfile: true,
      });

    // Instantiate the S3Stack
    const s3Stack = new S3Stack(this, 'S3Stack', {
      bucketPrefix: 'cdktf-ts-workflow-test',
      versioningEnabled: true,
    });

    // Get bucket information from the S3Stack
    const bucketInfo = s3Stack.getBucketInfo();

    // add outputs to the TapStack
    new TerraformOutput(this, 'bucket_name', {
      value: bucketInfo.bucketName,
      description: 'The name of the S3 bucket created for the CDKTF workflow test',
    });
    new TerraformOutput(this, 'bucket_arn', {
      value: bucketInfo.bucketArn,
      description: 'The ARN of the S3 bucket created for the CDKTF workflow test',
    });
    new TerraformOutput(this, 'bucket_versioning_status', {
      value: bucketInfo.bucketVersioningStatus,
      description: 'The versioning status of the S3 bucket created for the CDKTF workflow test',
    });
  }
}