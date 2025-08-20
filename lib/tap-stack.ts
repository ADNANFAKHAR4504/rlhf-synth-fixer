import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { SecureModules } from './modules';

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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'MyApp',
            ManagedBy: 'CDKTF',
            Environment: environmentSuffix,
          },
        },
      ],
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
    // Deploy secure modules - NO CONFIG NEEDED NOW
    const secureInfra = new SecureModules(this, 'secure-infrastructure');

    // Simple outputs
    new TerraformOutput(this, 'vpc_id', {
      value: secureInfra.vpc.id,
      description: 'VPC ID for the secure infrastructure',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: [secureInfra.publicSubnets[0].id, secureInfra.publicSubnets[1].id],
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: [
        secureInfra.privateSubnets[0].id,
        secureInfra.privateSubnets[1].id,
      ],
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'kms_key_id', {
      value: secureInfra.kmsKey.keyId,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 's3_bucket_name', {
      value: secureInfra.s3Bucket.id,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 'lambda_function_name', {
      value: secureInfra.lambdaFunction.functionName,
      description: 'Lambda function name',
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: secureInfra.rdsInstance.endpoint,
      description: 'RDS endpoint',
      sensitive: true,
    });

    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
